<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'description' => $this->description,
            'price'       => $this->price,
            'photos'      => $this->photos,
            'subcategory' => $this->whenLoaded('subcategory', fn() => [
                'id'   => $this->subcategory->id,
                'name' => $this->subcategory->name,
            ]),
            'tenant'      => new TenantProfileResource($this->whenLoaded('tenant')),
            // Field tambahan dari show()
            'bookings_count'      => $this->whenNotNull($this->bookings_count ?? null),
            'reviews_avg_rating'  => $this->whenNotNull($this->reviews_avg_rating ?? null),
            'reviews_count'       => $this->whenNotNull($this->reviews_count ?? null),
        ];
    }
}

