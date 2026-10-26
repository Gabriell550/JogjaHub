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
            'slot_id'    => 'nullable|exists:time_slots,id',
            'details'    => 'nullable|array',
            // payment_method & payment_proof_url dihapus:
            // metode bayar dipilih user di halaman Xendit (bukan di form booking),
            // dan proof tidak diperlukan karena Xendit otomatis konfirmasi via webhook.
        ];
    }
}
