<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // ── Ekstrak info check-in/out dari kolom details (hotel multi-slot) ──
        // Untuk single-slot, details tidak mengandung key ini → null
        $checkInDate  = $this->details['check_in_date']  ?? null;
        $checkOutDate = $this->details['check_out_date'] ?? null;
        $nights       = $this->details['nights']         ?? null;

        // ── Kalkulasi total_amount ─────────────────────────────────────────────
        // Diambil dari relasi payment jika sudah di-load, bukan dihitung ulang.
        // Ini memastikan angka yang tampil adalah angka yang benar-benar dikirim ke Xendit.
        $totalAmount = $this->whenLoaded('payment', fn () => $this->payment?->amount);

        return [
            'id'         => $this->id,
            'uuid'       => $this->uuid,
            'status'     => $this->status,
            'details'    => $this->details,
            'created_at' => $this->created_at,

            // ── Info harga ──────────────────────────────────────────────────────
            // total_amount: total yang harus/sudah dibayar user
            // Untuk hotel per_night: price × nights. Untuk per_session: price flat.
            'total_amount' => $totalAmount,

            // ── Info check-in / check-out (hanya terisi untuk booking hotel) ───
            'check_in_date'  => $checkInDate,
            'check_out_date' => $checkOutDate,
            'nights'         => $nights,

            // ── Relasi ──────────────────────────────────────────────────────────
            'service'  => new ServiceResource($this->whenLoaded('service')),

            // slot: untuk single-slot booking (salon/barbershop dll)
            'slot'     => new TimeSlotResource($this->whenLoaded('slot')),

            // slots: untuk multi-slot hotel — daftar semua malam yang dikunci
            // Disortir berdasarkan slot_date agar tampil berurutan
            'slots'    => $this->whenLoaded('slots', function () {
                return TimeSlotResource::collection(
                    $this->slots->sortBy('slot_date')->values()
                );
            }),

            'review'   => new ReviewResource($this->whenLoaded('review')),
            'customer' => new UserResource($this->whenLoaded('customer')),

            // payment: info pembayaran (amount, status, url, expired_at)
            'payment'  => $this->whenLoaded('payment', fn () => [
                'amount'      => $this->payment?->amount,
                'currency'    => $this->payment?->currency,
                'status'      => $this->payment?->status,
                'payment_url' => $this->payment?->payment_url,
                'expires_at'  => $this->payment?->expires_at,
                'paid_at'     => $this->payment?->paid_at,
            ]),
        ];
    }
}
