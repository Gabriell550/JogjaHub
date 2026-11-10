<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event yang di-broadcast setiap kali ada pesan baru dikirim.
 *
 * Channel: private-conversation.{conversation_id}
 *   → Private channel agar hanya customer dan tenant yang bersangkutan
 *     yang bisa subscribe (tidak bocor ke user lain).
 *
 * Frontend (Laravel Echo) subscribe seperti ini:
 *   Echo.private(`conversation.${conversationId}`)
 *       .listen('MessageSent', (e) => {
 *           console.log(e.message); // data pesan baru
 *       });
 *
 * ShouldBroadcast (bukan ShouldBroadcastNow) agar dikirim via queue,
 * sehingga HTTP response tidak terhambat oleh proses broadcast.
 */
class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Message $message)
    {
    }

    /**
     * Channel tujuan broadcast.
     * Menggunakan PrivateChannel agar hanya user yang terautentikasi
     * dan diotorisasi yang bisa menerima event ini.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    /**
     * Nama event yang dikirim ke frontend.
     * Default: nama class (MessageSent). Di-override agar eksplisit.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Data yang dikirim bersama event ke frontend.
     * Menggunakan MessageResource supaya format konsisten dengan REST API.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => (new MessageResource($this->message->load('sender')))->resolve(),
        ];
    }
}
