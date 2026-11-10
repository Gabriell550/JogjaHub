<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource untuk satu pesan chat.
 *
 * Response shape:
 * {
 *   "id": 1,
 *   "conversation_id": 3,
 *   "sender_id": 12,
 *   "body": "Halo, apakah kamar tersedia?",
 *   "read_at": "2026-11-10T10:00:00.000000Z",  ← null jika belum dibaca
 *   "is_mine": true,                             ← apakah pesan dari user yang sedang login
 *   "created_at": "2026-11-10T09:55:00.000000Z"
 * }
 */
class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id'       => $this->sender_id,
            'body'            => $this->body,
            'read_at'         => $this->read_at,
            // is_mine memudahkan frontend untuk render gelembung chat kanan/kiri
            'is_mine'         => $this->sender_id === $request->user()?->id,
            'created_at'      => $this->created_at,
        ];
    }
}
