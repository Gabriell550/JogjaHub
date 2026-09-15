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
            'service_id'        => 'required|exists:services,id',
            'slot_id'           => 'nullable|exists:time_slots,id',
            'payment_method'    => 'required|in:transfer,cod',
            'payment_proof_url' => 'nullable|string',
            'details'           => 'nullable|array',
        ];
    }
}

