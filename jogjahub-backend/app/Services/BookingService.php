<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Jobs\ReleaseExpiredBookingJob;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Service;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        private readonly XenditService $xendit
    ) {}

    /**
     * Buat booking baru dengan alur cinema model:
     *  1. Validasi service & slot
     *  2. Kunci slot dalam DB transaction (booked_count++)
     *  3. Buat record Booking (status: pending)
     *  4. Buat record Payment (status: pending, amount dari service.price)
     *  5. Buat invoice di Xendit → dapat payment_url
     *  6. Jadwalkan job ReleaseExpiredBookingJob (jalan 1 jam lagi)
     *
     * @return array { booking: Booking, payment_url: string, expires_at: Carbon }
     * @throws ValidationException
     * @throws \RuntimeException jika Xendit API error
     */
    public function createBooking(int $customerId, array $data): array
    {
        $service = Service::with(['subcategory', 'tenant'])->findOrFail($data['service_id']);

        // Validasi: hanya layanan milik tenant yang sudah approved yang boleh dibooking
        if (!$service->tenant || $service->tenant->status !== 'approved') {
            throw ValidationException::withMessages([
                'service_id' => ['Layanan ini belum tersedia karena tenant belum disetujui.'],
            ]);
        }

        $requiresSlot = $service->subcategory->requires_time_slot;

        // Validasi: kalau kategori ini butuh slot, slot_id wajib ada
        if ($requiresSlot && empty($data['slot_id'])) {
            throw ValidationException::withMessages([
                'slot_id' => ['Slot waktu wajib dipilih untuk layanan ini.'],
            ]);
        }

        // Kalau kategori ini TIDAK butuh slot, slot_id harus kosong
        if (!$requiresSlot) {
            $data['slot_id'] = null;
        }

        // ── Kunci slot + buat booking + buat payment dalam satu transaksi ────
        // Transaksi harus selesai sebelum memanggil Xendit API,
        // supaya kalau Xendit gagal, slot tidak terkunci selamanya.
        $booking = DB::transaction(function () use ($customerId, $data, $requiresSlot, $service) {
            if ($requiresSlot) {
                // Lock row slot supaya aman dari race condition (dua user booking slot yang sama)
                $slot = TimeSlot::where('id', $data['slot_id'])
                    ->where('service_id', $service->id)
                    ->lockForUpdate()
                    ->first();

                if (!$slot) {
                    throw ValidationException::withMessages([
                        'slot_id' => ['Slot tidak ditemukan untuk layanan ini.'],
                    ]);
                }

                if ($slot->slot_date < now()->toDateString()) {
                    throw ValidationException::withMessages([
                        'slot_id' => ['Slot waktu sudah terlewat, silakan pilih jadwal lain.'],
                    ]);
                }

                if ($slot->booked_count >= $slot->quota) {
                    throw ValidationException::withMessages([
                        'slot_id' => ['Slot sudah penuh, silakan pilih slot lain.'],
                    ]);
                }

                // Kunci slot — dikembalikan kalau payment tidak selesai dalam 1 jam
                $slot->increment('booked_count');
            }

            $booking = Booking::create([
                'customer_id' => $customerId,
                'service_id'  => $data['service_id'],
                'slot_id'     => $data['slot_id'] ?? null,
                'status'      => BookingStatus::PENDING->value,
                'details'     => $data['details'] ?? null,
            ]);

            // Buat record payment — status pending, amount dari harga service
            Payment::create([
                'booking_id'  => $booking->id,
                'amount'      => (int) $service->price,
                'currency'    => 'IDR',
                'status'      => 'pending',
                'expires_at'  => now()->addHour(),
            ]);

            return $booking;
        });

        // ── Panggil Xendit API di luar transaksi ─────────────────────────────
        // Kalau Xendit gagal → booking & payment sudah tersimpan dengan status pending.
        // Job ReleaseExpiredBookingJob akan bersihkan otomatis setelah 1 jam.
        $booking->load(['service', 'customer', 'payment']);

        $invoiceData = $this->xendit->createInvoice($booking);

        // Update payment dengan data dari Xendit
        $booking->payment->update([
            'xendit_invoice_id'  => $invoiceData['xendit_invoice_id'],
            'xendit_external_id' => $invoiceData['xendit_external_id'],
            'payment_url'        => $invoiceData['payment_url'],
            'expires_at'         => $invoiceData['expires_at'],
        ]);

        // Jadwalkan release otomatis jika tidak bayar dalam 1 jam
        ReleaseExpiredBookingJob::dispatch($booking->id)
            ->delay(now()->addHour());

        return [
            'booking'     => $booking->fresh(['service', 'slot', 'payment']),
            'payment_url' => $invoiceData['payment_url'],
            'expires_at'  => $invoiceData['expires_at'],
        ];
    }

    /**
     * Batalkan booking (oleh user sendiri).
     * Hanya booking berstatus pending yang bisa dibatalkan.
     */
    public function cancelBooking(Booking $booking): void
    {
        DB::transaction(function () use ($booking) {
            // Kembalikan kuota slot jika booking ini pakai slot
            if ($booking->slot_id) {
                $slot = TimeSlot::where('id', $booking->slot_id)->lockForUpdate()->first();
                if ($slot && $slot->booked_count > 0) {
                    $slot->decrement('booked_count');
                }
            }

            // Update payment jadi failed (user yang batalkan)
            $booking->payment?->update(['status' => 'failed']);

            $booking->update(['status' => BookingStatus::CANCELLED->value]);
        });
    }
}
