<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PriceType;
use App\Jobs\ReleaseExpiredBookingJob;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Service;
use App\Models\TimeSlot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    // XenditService dipertahankan sebagai dependency untuk kemudahan reaktivasi di masa depan (Opsi A).
    // Saat ini tidak dipanggil — booking menggunakan alur transfer manual.
    public function __construct(
        private readonly XenditService $xendit
    ) {}

    /**
     * Buat booking baru dengan alur transfer manual:
     *  1. Validasi service & slot
     *  2. Kunci slot dalam DB transaction (booked_count++)
     *  3. Buat record Booking (status: pending)
     *  4. Buat record Payment (status: pending, amount dikalkulasi dari price_type)
     *  5. Jadwalkan job ReleaseExpiredBookingJob (jalan 10 menit lagi)
     *
     * Mendukung dua mode:
     *  - Single-slot (salon/barbershop/dll): kirim slot_id → amount = service.price
     *  - Multi-slot hotel: kirim check_in_date + check_out_date
     *    → amount = service.price × jumlah malam (jika price_type = per_night)
     *
<<<<<<< HEAD
     * Catatan: Xendit tidak digunakan untuk sementara (transfer manual).
     * Kode XenditService tetap ada untuk kemudahan reaktivasi di masa depan.
     *
     * @return array { booking: Booking, expires_at: Carbon }
=======
     * @return array { booking: Booking, payment_url: ?string, expires_at: ?Carbon }
>>>>>>> a80b74f1c1b63c9aaef6a717525ab36a91a8b882
     * @throws ValidationException
     */
    public function createBooking(int $customerId, array $data): array
    {
        $service = Service::with(['subcategory', 'tenant'])->findOrFail($data['service_id']);

        // Validasi: hanya layanan milik tenant yang sudah approved yang boleh dibooking
        if (!$service->is_active || !$service->tenant || $service->tenant->status !== 'approved') {
            throw ValidationException::withMessages([
                'service_id' => ['Layanan ini tidak tersedia untuk dipesan.'],
            ]);
        }

        $usesXendit = config('booking.checkout') === 'xendit';
        unset($data['details']['whatsapp_number']);
        if (!$usesXendit) {
            $number = preg_replace('/\D/', '', $service->tenant->whatsapp_number ?? '');
            if (str_starts_with($number, '0')) {
                $number = '62' . substr($number, 1);
            }
            if (strlen($number) < 8 || strlen($number) > 15) {
                throw ValidationException::withMessages([
                    'service_id' => ['Nomor WhatsApp tenant belum valid.'],
                ]);
            }
            unset($data['details']['check_in_date'], $data['details']['check_out_date'], $data['details']['nights']);
            $data['details']['whatsapp_number'] = $number;
        }

        $requiresSlot = $service->subcategory->requires_time_slot;

        // Deteksi mode booking: hotel (check_in/check_out) vs single-slot (slot_id)
        $isMultiSlot = !empty($data['check_in_date']) && !empty($data['check_out_date']);

        // Validasi: kalau kategori butuh slot, harus ada slot_id ATAU check_in/check_out
        if ($requiresSlot && !$isMultiSlot && empty($data['slot_id'])) {
            throw ValidationException::withMessages([
                'slot_id' => ['Slot waktu wajib dipilih untuk layanan ini.'],
            ]);
        }

        // Kalau kategori TIDAK butuh slot, slot_id harus kosong
        if (!$requiresSlot) {
            $data['slot_id'] = null;
        }

        // Batas waktu pembayaran transfer manual: 10 menit dari sekarang
        $expiresAt = now()->addMinutes(10);

        // ── Kunci slot + buat booking + buat payment dalam satu transaksi ────
<<<<<<< HEAD
        $booking = DB::transaction(function () use ($customerId, $data, $requiresSlot, $service, $isMultiSlot, $expiresAt) {
=======
        // Transaksi harus selesai sebelum memanggil Xendit API,
        // supaya kalau Xendit gagal, slot tidak terkunci selamanya.
        $booking = DB::transaction(function () use ($customerId, $data, $requiresSlot, $service, $isMultiSlot, $usesXendit) {
>>>>>>> a80b74f1c1b63c9aaef6a717525ab36a91a8b882

            if ($isMultiSlot) {
                // ── Mode hotel: kunci semua slot dalam rentang check_in s.d. (check_out - 1 hari) ──
                $booking = $this->createMultiSlotBooking($customerId, $data, $service);
            } else {
                // ── Mode single-slot: salon, barbershop, dll ──
                $booking = $this->createSingleSlotBooking($customerId, $data, $requiresSlot, $service);
            }

            // ── Kalkulasi total harga berdasarkan price_type service ──────────
            // - per_session (default): harga tetap = service.price
            // - per_night (hotel)    : harga = service.price × jumlah malam
            $nights = $booking->details['nights'] ?? 1;
            $amount = $service->price_type === PriceType::PER_NIGHT
                ? (int) $service->price * $nights
                : (int) $service->price;

            // Buat record payment — Xendit fields dikosongkan (transfer manual)
            Payment::create([
<<<<<<< HEAD
                'booking_id' => $booking->id,
                'amount'     => $amount,
                'currency'   => 'IDR',
                'status'     => 'pending',
                'expires_at' => $expiresAt,
=======
                'booking_id'  => $booking->id,
                'amount'      => $amount,
                'currency'    => 'IDR',
                'status'      => 'pending',
                'payment_method' => $usesXendit ? null : 'WHATSAPP',
                'expires_at'  => $usesXendit ? now()->addHour() : null,
>>>>>>> a80b74f1c1b63c9aaef6a717525ab36a91a8b882
            ]);

            return $booking;
        });

<<<<<<< HEAD
        // Jadwalkan release otomatis jika tidak ada konfirmasi bayar dalam 10 menit
=======
        // ── Panggil Xendit API di luar transaksi ─────────────────────────────
        if (!$usesXendit) {
            return [
                'booking' => $booking->load(['service', 'slot', 'slots', 'payment']),
                'payment_url' => null,
                'expires_at' => null,
            ];
        }

        $booking->load(['service', 'customer', 'payment']);

        try {
            $invoiceData = $this->xendit->createInvoice($booking);
        } catch (\Throwable $exception) {
            $this->cancelBooking($booking);

            throw $exception;
        }

        // Update payment dengan data dari Xendit
        $booking->payment->update([
            'xendit_invoice_id'  => $invoiceData['xendit_invoice_id'],
            'xendit_external_id' => $invoiceData['xendit_external_id'],
            'payment_url'        => $invoiceData['payment_url'],
            'expires_at'         => $invoiceData['expires_at'],
        ]);

        // Jadwalkan release otomatis jika tidak bayar dalam 1 jam
>>>>>>> a80b74f1c1b63c9aaef6a717525ab36a91a8b882
        ReleaseExpiredBookingJob::dispatch($booking->id)
            ->delay($expiresAt);

        return [
            'booking'    => $booking->fresh(['service', 'slot', 'slots', 'payment']),
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * Proses single-slot booking (salon, barbershop, dll).
     *
     * - Validasi slot milik service yang dipilih
     * - Cek slot tidak expired dan tidak penuh
     * - Increment booked_count
     * - Attach ke pivot booking_slots untuk konsistensi release saat cancel/expired
     *
     * Dipanggil dari dalam DB::transaction di createBooking().
     */
    private function createSingleSlotBooking(int $customerId, array $data, bool $requiresSlot, Service $service): Booking
    {
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

        // Attach ke pivot booking_slots untuk konsistensi:
        // cancelBooking() dan ReleaseExpiredBookingJob menggunakan pivot ini
        // untuk release slot, sehingga single-slot pun harus ada recordnya di sini.
        if (!empty($data['slot_id'])) {
            $booking->slots()->attach($data['slot_id']);
        }

        return $booking;
    }

    /**
     * Proses multi-slot booking khusus hotel.
     *
     * Alur:
     *  1. Hitung semua tanggal "malam" antara check_in s.d. (check_out - 1 hari)
     *     misal: check_in=10 Jan, check_out=12 Jan → lock malam 10 Jan & 11 Jan (2 malam)
     *  2. Cari semua TimeSlot dari service ini yang slot_date-nya ada di rentang tersebut
     *  3. Validasi: jumlah slot yang ditemukan harus sama dengan jumlah malam
     *  4. Lock semua slot dengan lockForUpdate() dalam transaksi
     *  5. Validasi semua slot tidak penuh dan tidak expired
     *  6. Increment booked_count semua slot
     *  7. Buat Booking (slot_id = null, pakai pivot booking_slots)
     *  8. Attach semua slot ke pivot booking_slots
     *
     * Dipanggil dari dalam DB::transaction di createBooking().
     */
    private function createMultiSlotBooking(int $customerId, array $data, Service $service): Booking
    {
        $checkIn  = Carbon::parse($data['check_in_date']);
        $checkOut = Carbon::parse($data['check_out_date']);

        // Hitung semua tanggal yang perlu dikunci:
        // Check-in sampai hari sebelum check-out (= jumlah malam)
        $nights = [];
        $current = $checkIn->copy();
        while ($current->lt($checkOut)) {
            $nights[] = $current->toDateString();
            $current->addDay();
        }

        if (empty($nights)) {
            throw ValidationException::withMessages([
                'check_out_date' => ['Minimal 1 malam diperlukan untuk booking hotel.'],
            ]);
        }

        // Ambil dan lock semua slot yang cocok dengan tanggal-tanggal tersebut
        $slots = TimeSlot::where('service_id', $service->id)
            ->whereIn('slot_date', $nights)
            ->lockForUpdate()
            ->get();

        // Validasi: semua tanggal harus punya slot (tidak boleh ada hari yang slot-nya belum dibuat)
        $foundDates = $slots->pluck('slot_date')->sort()->values()->toArray();
        $missingDates = array_diff($nights, $foundDates);

        if (!empty($missingDates)) {
            throw ValidationException::withMessages([
                'check_in_date' => [
                    'Slot tidak tersedia untuk tanggal: ' . implode(', ', $missingDates) . '. '
                    . 'Silakan pilih rentang tanggal lain.',
                ],
            ]);
        }

        // Validasi semua slot: tidak expired dan tidak penuh
        $today = now()->toDateString();
        foreach ($slots as $slot) {
            if ($slot->slot_date < $today) {
                throw ValidationException::withMessages([
                    'check_in_date' => ['Rentang tanggal yang dipilih mengandung hari yang sudah terlewat.'],
                ]);
            }

            if ($slot->booked_count >= $slot->quota) {
                throw ValidationException::withMessages([
                    'check_in_date' => [
                        'Kamar tidak tersedia pada tanggal ' . $slot->slot_date . '. '
                        . 'Silakan pilih rentang tanggal lain.',
                    ],
                ]);
            }
        }

        // Kunci semua slot sekaligus — dikembalikan kalau payment tidak selesai
        foreach ($slots as $slot) {
            $slot->increment('booked_count');
        }

        // Buat booking — slot_id null karena slot dikelola via pivot booking_slots
        $booking = Booking::create([
            'customer_id' => $customerId,
            'service_id'  => $data['service_id'],
            'slot_id'     => null, // multi-slot: tidak pakai kolom slot_id
            'status'      => BookingStatus::PENDING->value,
            'details'     => array_merge($data['details'] ?? [], [
                // Simpan info check-in/out di kolom details supaya mudah ditampilkan
                'check_in_date'  => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'],
                'nights'         => count($nights),
            ]),
        ]);

        // Attach semua slot ke pivot booking_slots
        $booking->slots()->attach($slots->pluck('id')->toArray());

        return $booking;
    }

    /**
     * Batalkan booking (oleh user sendiri).
     * Hanya booking berstatus pending yang bisa dibatalkan.
     *
     * Handle kedua mode:
     *  - Single-slot: kembalikan kuota dari slot_id (backward compat) + via pivot
     *  - Multi-slot hotel: kembalikan kuota semua slot dari pivot booking_slots
     */
    public function cancelBooking(Booking $booking): void
    {
        DB::transaction(function () use ($booking) {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            if ($booking->status !== BookingStatus::PENDING->value) {
                throw ValidationException::withMessages(['status' => ['Pesanan tidak bisa dibatalkan.']]);
            }
            // Release semua slot yang dikunci booking ini via pivot booking_slots
            $this->releaseBookingSlots($booking);

            // Update payment jadi failed (user yang batalkan)
            $booking->payment?->update(['status' => 'failed']);

            $booking->update(['status' => BookingStatus::CANCELLED->value]);
        });
    }

    /**
     * Helper: kembalikan booked_count untuk semua slot yang terkait booking ini.
     *
     * Dipakai oleh cancelBooking() dan ReleaseExpiredBookingJob.
     *
     * Strategi release:
     *  - Gunakan pivot booking_slots sebagai sumber utama (multi-slot & single-slot konsisten)
     *  - Fallback ke slot_id jika pivot kosong (booking lama sebelum pivot diterapkan)
     *
     * Harus dipanggil di dalam DB::transaction agar aman dari race condition.
     */
    public function releaseBookingSlots(Booking $booking): void
    {
        // Ambil semua slot dari pivot dengan lock untuk cegah race condition
        $pivotSlots = $booking->slots()->lockForUpdate()->get();

        if ($pivotSlots->isNotEmpty()) {
            // Kembalikan kuota untuk setiap slot di pivot
            foreach ($pivotSlots as $slot) {
                if ($slot->booked_count > 0) {
                    $slot->decrement('booked_count');
                }
            }
        } elseif ($booking->slot_id) {
            // Fallback: booking lama (sebelum pivot) yang hanya pakai slot_id
            $slot = TimeSlot::where('id', $booking->slot_id)->lockForUpdate()->first();
            if ($slot && $slot->booked_count > 0) {
                $slot->decrement('booked_count');
            }
        }
    }
}
