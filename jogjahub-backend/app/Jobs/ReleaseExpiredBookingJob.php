<?php

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Job yang dijalankan 1 jam setelah booking dibuat.
 *
 * Tugasnya: cek apakah pembayaran sudah dilakukan.
 * - Jika SUDAH bayar   → tidak lakukan apa-apa (webhook Xendit sudah handle)
 * - Jika BELUM bayar   → lepas slot + batalkan booking
 *
 * Mendukung dua mode booking:
 *  - Single-slot (salon/barbershop): release slot via booking_slots pivot atau fallback slot_id
 *  - Multi-slot hotel: release semua slot dari pivot booking_slots
 *
 * Ini adalah safety net: pastikan slot tidak terkunci selamanya
 * karena user abandon di halaman pembayaran.
 */
class ReleaseExpiredBookingJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    /**
     * Coba ulang maksimal 3 kali jika job gagal (misal DB timeout).
     */
    public int $tries = 3;

    public function __construct(
        private readonly int $bookingId
    ) {}

    public function handle(BookingService $bookingService): void
    {
        DB::transaction(function () use ($bookingService) {
            // Lock booking row supaya tidak ada race condition
            // dengan webhook Xendit yang mungkin tiba bersamaan
            $booking = Booking::where('id', $this->bookingId)
                ->lockForUpdate()
                ->first();

            if (!$booking) {
                Log::warning("ReleaseExpiredBookingJob: booking #{$this->bookingId} tidak ditemukan.");
                return;
            }

            // Kalau sudah confirmed (sudah bayar) atau sudah cancelled → tidak perlu apa-apa
            if ($booking->status !== BookingStatus::PENDING->value) {
                Log::info("ReleaseExpiredBookingJob: booking #{$this->bookingId} sudah {$booking->status}, skip.");
                return;
            }

            // Double-check payment status — kalau Xendit sudah kirim paid tapi booking
            // belum diupdate karena race condition, jangan batalkan!
            $payment = $booking->payment()->lockForUpdate()->first();
            if ($payment && $payment->status === 'paid') {
                Log::warning("ReleaseExpiredBookingJob: payment sudah paid tapi booking masih pending. Fix booking.");
                $booking->update(['status' => BookingStatus::CONFIRMED->value]);
                return;
            }

            // Update payment menjadi expired
            $payment?->update(['status' => 'expired']);

            // Kembalikan kuota slot (single-slot maupun multi-slot hotel)
            // Menggunakan BookingService::releaseBookingSlots() supaya logika release
            // tidak duplikat antara Job dan cancelBooking().
            $bookingService->releaseBookingSlots($booking);

            Log::info("ReleaseExpiredBookingJob: slot booking #{$this->bookingId} dilepas.");

            // Batalkan booking
            $booking->update(['status' => BookingStatus::CANCELLED->value]);

            Log::info("ReleaseExpiredBookingJob: booking #{$this->bookingId} expired dan dibatalkan.");
        });
    }
}
