<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subcategory_id' => 'required|exists:subcategories,id',
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'photos'         => 'nullable|array|max:10',
            'photos.*'       => 'image|mimes:jpeg,png,jpg,webp|max:5120',
        ];
    }
}
