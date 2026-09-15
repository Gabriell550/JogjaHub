<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business_name'       => 'required|string|max:255',
            'description'         => 'nullable|string',
            'address.street'      => 'required|string',
            'address.city'        => 'required|string',
            'address.province'    => ['required', 'string', Rule::in(['DI Yogyakarta', 'Daerah Istimewa Yogyakarta'])],
            'address.postal_code' => 'nullable|string',
            'latitude'            => 'required|numeric|between:-8.5,-7.5',
            'longitude'           => 'required|numeric|between:110.0,110.8',
            'whatsapp_number'     => 'required|string|max:20',
            'category_ids'        => 'required|array|min:1',
            'category_ids.*'      => 'exists:categories,id',
            'ktp'                 => 'required|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'nib'                 => 'required_without:portfolio|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'portfolio'           => 'required_without:nib|file|mimes:jpg,jpeg,png,pdf|max:5020',
        ];
    }
}

