<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource untuk satu conversation (tampil di daftar inbox).
 *
 * Response shape:
 * {
 *   "id": 3,
 *   "customer": { "id": 12, "name": "Budi" },
 *   "tenant":   { "id": 5,  "name": "Salon Cantik" },
 *   "latest_message": {
 *     "body": "Baik, terima kasih!",
 *     "created_at": "2026-11-10T10:05:00.000000Z"
 *   },
 *   "unread_count": 2,   ← jumlah pesan belum dibaca oleh user yang login
 *   "updated_at": "2026-11-10T10:05:00.000000Z"
 * }
 */
class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $authUserId = $request->user()?->id;

        return [
            'id'       => $this->id,

            // Info lawan bicara — tampil nama dan avatar saja (tidak perlu data lengkap)
            'customer' => [
                'id'         => $this->customer->id,
                'name'       => $this->customer->name,
                'avatar_url' => $this->customer->avatar_url
                    ? asset('storage/' . $this->customer->avatar_url)
                    : null,
            ],
            'tenant' => [
                'id'         => $this->tenant->id,
                'name'       => $this->tenant->name,
                'avatar_url' => $this->tenant->avatar_url
                    ? asset('storage/' . $this->tenant->avatar_url)
                    : null,
            ],

            // Preview pesan terakhir (seperti daftar chat WhatsApp)
            'latest_message' => $this->whenLoaded('latestMessage', function () {
                return $this->latestMessage ? [
                    'body'       => $this->latestMessage->body,
                    'created_at' => $this->latestMessage->created_at,
                ] : null;
            }),

            // Jumlah pesan yang belum dibaca oleh user yang sedang login
            'unread_count' => $authUserId
                ? $this->unreadCountFor($authUserId)
                : 0,

            'updated_at' => $this->updated_at,
        ];
    }
}
