<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subcategory_id' => 'sometimes|exists:subcategories,id',
            'name'           => 'sometimes|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'photos'         => 'nullable|array|max:10',
            'photos.*'       => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_photos'  => 'nullable|array',
            'remove_photos.*' => 'string',
        ];
    }
}
