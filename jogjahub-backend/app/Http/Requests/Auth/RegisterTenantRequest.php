<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:8|confirmed',
            'address'        => 'nullable|string|max:1000',
            'phone'          => 'nullable|string|max:20',
            'categories'     => 'nullable|array|min:1',
            'categories.*'   => 'nullable|string',
        ];
    }
}

