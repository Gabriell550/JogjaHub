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
        $profile     = $this->user()->tenantProfile;
        $isFirstTime = !$profile || !$profile->ktp_url;

        // Skenario B: maps_embed_url wajib HANYA untuk pendaftaran pertama kali
        // (profil belum ada sama sekali di database). Kalau profil sudah ada
        // — meski maps_embed_url-nya masih null — dianggap tenant lama,
        // tidak perlu paksa isi maps supaya tidak merusak update profil yang sudah ada.
        $mapsRequired = !$profile;

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

            // Wajib untuk tenant baru, opsional untuk update tenant lama yang sudah punya maps
            'maps_embed_url'      => $mapsRequired
                ? ['required', 'string', new \App\Rules\GoogleMapsEmbed]
                : ['sometimes', 'nullable', 'string', new \App\Rules\GoogleMapsEmbed],

            // Wajib saat pertama kali, opsional saat update
            'ktp'       => $isFirstTime ? 'required|file|mimes:jpg,jpeg,png,pdf|max:2048' : 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'nib'       => $isFirstTime ? 'required_without:portfolio|file|mimes:jpg,jpeg,png,pdf|max:2048' : 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'portfolio' => $isFirstTime ? 'required_without:nib|file|mimes:jpg,jpeg,png,pdf|max:5020' : 'sometimes|file|mimes:jpg,jpeg,png,pdf|max:5020',
        ];
    }
}
