<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Data sensitif (dokumen KTP/NIB, alasan penolakan) hanya boleh dilihat
        // oleh pemilik profil atau admin — jangan bocor ke endpoint publik.
        $viewer = $request->user();
        $canSeePrivate = $viewer
            && ($viewer->role === 'admin' || $viewer->id === $this->user_id);

        return [
            'id'               => $this->id,
            'uuid'             => $this->uuid,
            'business_name'    => $this->business_name,
            'description'      => $this->description,
            'address'          => $this->address,
            'location'         => $this->location, // computed: {latitude, longitude}
            'whatsapp_number'  => $this->whatsapp_number,
            'status'           => $this->status,
            'rejection_reason' => $this->when($canSeePrivate, $this->rejection_reason),
            'ktp_url'          => $this->when($canSeePrivate, $this->ktp_url),
            'nib_url'          => $this->when($canSeePrivate, $this->nib_url),
            'portfolio_url'    => $this->when($canSeePrivate, $this->portfolio_url),
            'categories'       => CategoryResource::collection($this->whenLoaded('categories')),
            'user'             => new UserResource($this->whenLoaded('user')),
        ];
    }
}

