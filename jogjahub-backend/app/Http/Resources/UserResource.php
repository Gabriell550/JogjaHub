<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role'  => $this->role,
            // avatar_url: path disimpan relatif, full URL digenerate di sini
            // null jika customer belum upload foto profil
            'avatar_url' => $this->avatar_url
                ? asset('storage/' . $this->avatar_url)
                : null,
        ];
    }
}
