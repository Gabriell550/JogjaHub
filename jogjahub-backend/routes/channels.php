<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — JogjaHub
|--------------------------------------------------------------------------
|
| Di sini didaftarkan otorisasi untuk setiap private channel.
| Laravel akan memanggil closure ini saat frontend mencoba subscribe
| ke channel tertentu. Return true = boleh, false/null = tolak.
|
*/

/**
 * Channel: private-conversation.{conversationId}
 *
 * Hanya customer dan tenant yang terlibat dalam conversation tersebut
 * yang boleh subscribe. User lain akan mendapat 403.
 */
Broadcast::channel('conversation.{conversationId}', function ($user, int $conversationId) {
    $conversation = Conversation::find($conversationId);

    if (!$conversation) {
        return false;
    }

    // Izinkan jika user adalah customer atau tenant dalam conversation ini
    return $user->id === $conversation->customer_id
        || $user->id === $conversation->tenant_id;
});
