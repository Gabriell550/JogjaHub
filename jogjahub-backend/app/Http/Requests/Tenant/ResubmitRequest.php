<?php

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class ResubmitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Semua dokumen opsional per-item, tapi minimal SATU wajib diunggah
            // saat tenant mengajukan ulang (dicek di withValidator di bawah).
            'ktp'       => 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'nib'       => 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'portfolio' => 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:5020',
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($validator) {
            $hasFile = $this->hasFile('ktp')
                || $this->hasFile('nib')
                || $this->hasFile('portfolio');

            if (!$hasFile) {
                $validator->errors()->add(
                    'documents',
                    'Minimal satu dokumen wajib diunggah untuk mengajukan ulang pendaftaran.'
                );
            }
        });
    }
}
