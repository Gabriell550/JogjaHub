<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => 'required|exists:services,id',

            // --- Single-slot booking (salon, barbershop, dll) ---
            // slot_id diisi jika subcategory->requires_time_slot = true DAN bukan hotel multi-slot.
            'slot_id'    => 'nullable|exists:time_slots,id',

            // --- Multi-slot booking (hotel) ---
            // check_in_date & check_out_date diisi sebagai pengganti slot_id.
            // Backend akan mencari semua slot antara check_in_date s.d. (check_out_date - 1 hari).
            'check_in_date'  => 'nullable|date|after_or_equal:today',
            'check_out_date' => 'nullable|date|after:check_in_date',

            'details'    => 'nullable|array',

            // payment_method & payment_proof_url dihapus:
            // metode bayar dipilih user di halaman Xendit (bukan di form booking),
            // dan proof tidak diperlukan karena Xendit otomatis konfirmasi via webhook.
        ];
    }

    /**
     * Pesan validasi kustom untuk check-in / check-out.
     */
    public function messages(): array
    {
        return [
            'check_in_date.after_or_equal'  => 'Tanggal check-in tidak boleh di masa lalu.',
            'check_out_date.after'           => 'Tanggal check-out harus setelah tanggal check-in.',
        ];
    }

    /**
     * Validasi tambahan: jika salah satu dari check_in_date / check_out_date diisi,
     * keduanya harus diisi; dan tidak boleh bersamaan dengan slot_id.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $hasCheckIn  = !empty($this->check_in_date);
            $hasCheckOut = !empty($this->check_out_date);
            $hasSlotId   = !empty($this->slot_id);

            // Jika pakai mode hotel, check_in dan check_out harus lengkap
            if ($hasCheckIn && !$hasCheckOut) {
                $v->errors()->add('check_out_date', 'check_out_date wajib diisi jika check_in_date diisi.');
            }
            if ($hasCheckOut && !$hasCheckIn) {
                $v->errors()->add('check_in_date', 'check_in_date wajib diisi jika check_out_date diisi.');
            }

            // Tidak boleh kirim slot_id sekaligus check_in/check_out (dua mode bersamaan)
            if ($hasSlotId && ($hasCheckIn || $hasCheckOut)) {
                $v->errors()->add('slot_id', 'Tidak boleh mengisi slot_id dan check_in_date/check_out_date sekaligus.');
            }
        });
    }
}
