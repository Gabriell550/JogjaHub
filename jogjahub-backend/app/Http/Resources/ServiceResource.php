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
            'is_active'   => $this->is_active ?? true,
            // price_type: cara harga dihitung saat booking
            // - per_session: harga flat 1 sesi (salon, barbershop, dll)
            // - per_night  : harga per malam × jumlah malam (hotel)
            'price_type'       => $this->price_type?->value,
            'price_type_label' => $this->price_type?->label(),
            'is_accommodation' => $this->when(
                $this->relationLoaded('subcategory') && $this->subcategory?->relationLoaded('category'),
                fn () => $this->price_type?->value === 'per_night'
                    || strtolower(trim($this->subcategory->category?->name ?? '')) === 'penginapan',
            ),
            'photos'      => collect($this->photos ?? [])->map(fn (array $photo) => [
                'url'        => $photo['url'],
                'full_url'   => asset('storage/' . ltrim($photo['url'], '/')),
                'is_primary' => $photo['is_primary'] ?? false,
                'sort_order' => $photo['sort_order'] ?? 0,
            ])->values(),
            'subcategory' => $this->whenLoaded('subcategory', fn() => [
                'id'   => $this->subcategory->id,
                'name' => $this->subcategory->name,
                'requires_time_slot' => (bool) $this->subcategory->requires_time_slot,
            ]),
            'tenant'      => new TenantProfileResource($this->whenLoaded('tenant')),
            // Field tambahan dari show()
            'bookings_count'      => $this->whenNotNull($this->confirmed_bookings_count ?? $this->bookings_count ?? null),
            'reviews_avg_rating'  => $this->whenNotNull($this->reviews_average_rating ?? $this->reviews_avg_rating ?? null),
            'reviews_count'       => $this->whenNotNull($this->reviews_count ?? null),
        ];
    }
}
