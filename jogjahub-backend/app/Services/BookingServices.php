<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\DB;

class BookingService
{
    /**
     * Buat booking baru dengan slot capacity check yang aman dari race condition.
     * Dipanggil dari Api\Customer\BookingController, bukan logic langsung di controller
     * (lihat backend guideline poin 2 & 7).
     */
    public function createBooking(int $customerId, int $serviceId, int $slotId, array $paymentData): Booking
    {
        return DB::transaction(function () use ($customerId, $serviceId, $slotId, $paymentData) {
            $slot = TimeSlot::where('id', $slotId)->lockForUpdate()->first();

            if (!$slot || $slot->booked_count >= $slot->quota) {
                throw new \RuntimeException('Slot sudah penuh, silakan pilih slot lain.');
            }

            $slot->increment('booked_count');

            return Booking::create([
                'customer_id' => $customerId,
                'service_id' => $serviceId,
                'slot_id' => $slotId,
                'status' => BookingStatus::PENDING->value,
                'payment_proof_url' => $paymentData['payment_proof_url'] ?? null,
                'payment_method' => $paymentData['payment_method'],
            ]);
        });
    }
}
