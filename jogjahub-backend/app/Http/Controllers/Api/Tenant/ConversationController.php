<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use App\Events\MessageSent;
use Illuminate\Http\Request;

/**
 * Controller chat untuk Tenant.
 *
 * Endpoint:
 *   GET  /tenant/conversations                   → inbox semua percakapan masuk
 *   GET  /tenant/conversations/{id}/messages     → load pesan
 *   POST /tenant/conversations/{id}/messages     → balas pesan
 *   PATCH /tenant/conversations/{id}/read        → tandai pesan sudah dibaca
 */
class ConversationController extends Controller
{
    /**
     * Inbox tenant — daftar semua conversation yang masuk ke tenant yang login.
     * Diurutkan berdasarkan updated_at desc (percakapan terbaru di atas).
     */
    public function index(Request $request)
    {
        $conversations = $request->user()
            ->conversationsAsTenant()
            ->with(['customer', 'tenant', 'latestMessage'])
            ->latest('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ConversationResource::collection($conversations),
        ]);
    }

    /**
     * Load pesan dalam conversation (paginasi 30 per halaman).
     * Hanya conversation yang ditujukan ke tenant yang login yang boleh diakses.
     */
    public function messages(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        $messages = $conversation->messages()
            ->latest()
            ->paginate(30);

        return response()->json([
            'success' => true,
            'data'    => MessageResource::collection($messages),
        ]);
    }

    /**
     * Tenant membalas pesan customer.
     * Setelah simpan ke DB, broadcast event real-time ke customer.
     *
     * Body: { "body": "Tersedia, silakan booking sekarang!" }
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body'      => $validated['body'],
        ]);

        // Update updated_at conversation agar muncul di urutan teratas inbox
        $conversation->touch();

        // Broadcast pesan ke channel real-time
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'success' => true,
            'data'    => new MessageResource($message),
        ], 201);
    }

    /**
     * Tandai semua pesan dari customer sebagai sudah dibaca.
     * Dipanggil ketika tenant membuka halaman chat.
     */
    public function markAsRead(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        // Hanya tandai pesan dari customer (bukan dari tenant sendiri)
        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Pesan telah ditandai sebagai sudah dibaca.',
        ]);
    }

    /**
     * Pastikan conversation ini ditujukan ke tenant yang sedang login.
     */
    private function authorizeConversation(User $user, Conversation $conversation): void
    {
        if ($conversation->tenant_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }
    }
}
