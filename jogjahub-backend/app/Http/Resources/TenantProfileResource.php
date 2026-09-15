<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'uuid'             => $this->uuid,
            'business_name'    => $this->business_name,
            'description'      => $this->description,
            'address'          => $this->address,
            'location'         => $this->location, // computed: {latitude, longitude}
            'whatsapp_number'  => $this->whatsapp_number,
            'status'           => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'ktp_url'          => $this->ktp_url,
            'nib_url'          => $this->nib_url,
            'portfolio_url'    => $this->portfolio_url,
            'categories'       => CategoryResource::collection($this->whenLoaded('categories')),
            'user'             => new UserResource($this->whenLoaded('user')),
        ];
    }
}

