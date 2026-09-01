<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Service;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function createBooking(int $customerId, array $data): Booking
    {
        $service = Service::with('subcategory')->findOrFail($data['service_id']);
        $requiresSlot = $service->subcategory->requires_time_slot;

        // Validasi: kalau kategori ini butuh slot, slot_id wajib ada
        if ($requiresSlot && empty($data['slot_id'])) {
            throw ValidationException::withMessages([
                'slot_id' => ['Slot waktu wajib dipilih untuk layanan ini.'],
            ]);
        }

        // Kalau kategori ini TIDAK butuh slot, slot_id harus kosong (nggak boleh nyasar)
        if (!$requiresSlot) {
            $data['slot_id'] = null;
        }

        return DB::transaction(function () use ($customerId, $data, $requiresSlot) {
            if ($requiresSlot) {
                // Lock row slot supaya aman dari race condition
                $slot = TimeSlot::where('id', $data['slot_id'])->lockForUpdate()->first();

                if (!$slot) {
                    throw ValidationException::withMessages([
                        'slot_id' => ['Slot tidak ditemukan.'],
                    ]);
                }

                if ($slot->booked_count >= $slot->quota) {
                    throw ValidationException::withMessages([
                        'slot_id' => ['Slot sudah penuh, silakan pilih slot lain.'],
                    ]);
                }

                $slot->increment('booked_count');
            }

            return Booking::create([
                'customer_id' => $customerId,
                'service_id' => $data['service_id'],
                'slot_id' => $data['slot_id'] ?? null,
                'status' => BookingStatus::PENDING->value,
                'payment_method' => $data['payment_method'],
                'payment_proof_url' => $data['payment_proof_url'] ?? null,
                'details' => $data['details'] ?? null,
            ]);
        });
    }

    public function cancelBooking(Booking $booking): void
    {
        DB::transaction(function () use ($booking) {
            // kalau booking ini pakai slot, kembalikan kuotanya
            if ($booking->slot_id) {
                $slot = TimeSlot::where('id', $booking->slot_id)->lockForUpdate()->first();
                if ($slot && $slot->booked_count > 0) {
                    $slot->decrement('booked_count');
                }
            }

            $booking->update(['status' => BookingStatus::CANCELLED->value]);
        });
    }
}
