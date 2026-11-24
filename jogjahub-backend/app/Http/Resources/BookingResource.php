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
            'whatsapp_url' => $this->whatsappUrl(),
            'details'    => $this->details,
            'created_at' => $this->created_at,
            'fulfilled_at' => $this->fulfilled_at,
            'completed_at' => $this->completed_at,
            'issue_reported_at' => $this->issue_reported_at,
            'completion_issue' => $this->completion_issue,
            'completion_reminded_at' => $this->completion_reminded_at,
            'completion_conversation_id' => $this->completion_conversation_id,
            'can_mark_fulfilled' => $this->status === 'confirmed' && $this->relationLoaded('slot') && $this->canMarkFulfilled(),

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

            // payment: info pembayaran (amount, status, bukti transfer, expired_at)
            'payment'  => $this->whenLoaded('payment', fn () => [
                'amount'            => $this->payment?->amount,
                'currency'          => $this->payment?->currency,
                'status'            => $this->payment?->status,
                // payment_proof_url: foto bukti transfer yang diupload customer (transfer manual)
                'payment_proof_url' => $this->payment?->payment_proof_url
                    ? asset('storage/' . $this->payment->payment_proof_url)
                    : null,
                'expires_at'        => $this->payment?->expires_at,
                'paid_at'           => $this->payment?->paid_at,
            ]),
        ];
    }
    private function whatsappUrl(): ?string
    {
        $number = $this->details['whatsapp_number'] ?? null;
        if (!is_string($number) || !preg_match('/^[1-9][0-9]{7,14}$/D', $number)
            || $this->status === 'cancelled' || $this->payment?->payment_method !== 'WHATSAPP') {
            return null;
        }

        $code = 'JH-' . str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
        $service = $this->service?->name ?? 'layanan JogjaHub';
        $message = "Halo, saya ingin melanjutkan pesanan {$service} di JogjaHub ({$code}).";

        if (isset($this->details['check_in_date'], $this->details['check_out_date'])) {
            $message .= " Check-in {$this->details['check_in_date']}, check-out {$this->details['check_out_date']}.";
        } elseif ($this->slot) {
            $message .= ' Jadwal ' . $this->slot->slot_date . ' ' . substr($this->slot->start_time, 0, 5) . ' WIB.';
        }

        return 'https://wa.me/' . $number . '?text=' . rawurlencode($message);
    }
}
