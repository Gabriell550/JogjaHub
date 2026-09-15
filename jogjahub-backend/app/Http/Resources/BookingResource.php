<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'uuid'              => $this->uuid,
            'status'            => $this->status,
            'payment_method'    => $this->payment_method,
            'payment_proof_url' => $this->payment_proof_url,
            'details'           => $this->details,
            'created_at'        => $this->created_at,
            'service'           => new ServiceResource($this->whenLoaded('service')),
            'slot'              => new TimeSlotResource($this->whenLoaded('slot')),
            'review'            => new ReviewResource($this->whenLoaded('review')),
            'customer'          => new UserResource($this->whenLoaded('customer')),
        ];
    }
}

