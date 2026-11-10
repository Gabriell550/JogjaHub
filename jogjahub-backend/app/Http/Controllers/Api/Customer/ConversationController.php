<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\User;
use App\Events\MessageSent;
use Illuminate\Http\Request;

/**
 * Controller chat untuk Customer.
 *
 * Endpoint:
 *   GET  /customer/conversations                   → daftar inbox
 *   POST /customer/conversations                   → mulai conversation baru (atau lanjut yang ada)
 *   GET  /customer/conversations/{id}/messages     → load pesan (paginasi)
 *   POST /customer/conversations/{id}/messages     → kirim pesan
 *   PATCH /customer/conversations/{id}/read        → tandai semua pesan sebagai sudah dibaca
 */
class ConversationController extends Controller
{
    /**
     * Daftar semua conversation milik customer yang sedang login.
     * Diurutkan berdasarkan pesan terbaru (updated_at desc).
     */
    public function index(Request $request)
    {
        $conversations = $request->user()
            ->conversationsAsCustomer()
            ->with(['customer', 'tenant', 'latestMessage'])
            ->latest('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ConversationResource::collection($conversations),
        ]);
    }

    /**
     * Mulai conversation baru dengan tenant, atau kembalikan yang sudah ada.
     * Menggunakan firstOrCreate agar tidak duplikat thread.
     *
     * Body: { "tenant_id": 5 }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|integer|exists:users,id',
        ]);

        // Pastikan tenant_id benar-benar user dengan role tenant
        $tenant = User::where('id', $validated['tenant_id'])
            ->where('role', 'tenant')
            ->firstOrFail();

        // Cegah customer chat dengan dirinya sendiri
        if ($tenant->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat membuka percakapan dengan diri sendiri.',
            ], 422);
        }

        // Buat conversation baru atau ambil yang sudah ada
        $conversation = Conversation::firstOrCreate([
            'customer_id' => $request->user()->id,
            'tenant_id'   => $tenant->id,
        ]);

        // Tandai updated_at di tabel conversations agar inbox terurut
        $conversation->touch();

        return response()->json([
            'success' => true,
            'data'    => new ConversationResource(
                $conversation->load(['customer', 'tenant', 'latestMessage'])
            ),
        ], 201);
    }

    /**
     * Load semua pesan dalam conversation (paginasi 30 pesan per halaman).
     * Hanya conversation milik customer yang login yang boleh diakses.
     */
    public function messages(Request $request, Conversation $conversation)
    {
        // Pastikan conversation ini milik customer yang sedang login
        $this->authorizeConversation($request->user(), $conversation);

        $messages = $conversation->messages()
            ->latest() // urut terbaru dulu agar cursor pagination lebih mudah di frontend
            ->paginate(30);

        return response()->json([
            'success' => true,
            'data'    => MessageResource::collection($messages),
        ]);
    }

    /**
     * Kirim pesan baru ke dalam conversation.
     * Setelah simpan ke DB, broadcast event real-time ke penerima.
     *
     * Body: { "body": "Halo, apakah kamar tersedia?" }
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

        // Broadcast pesan ke channel real-time (Laravel Reverb)
        // Penerima yang subscribe ke channel ini akan langsung menerima pesan
        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'success' => true,
            'data'    => new MessageResource($message),
        ], 201);
    }

    /**
     * Tandai semua pesan dari lawan bicara sebagai sudah dibaca.
     * Dipanggil ketika customer membuka halaman chat.
     */
    public function markAsRead(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        // Hanya tandai pesan dari tenant (bukan dari customer sendiri)
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
     * Cek apakah conversation ini boleh diakses oleh user yang login.
     * Customer hanya boleh akses conversation miliknya sendiri.
     */
    private function authorizeConversation(User $user, Conversation $conversation): void
    {
        if ($conversation->customer_id !== $user->id) {
            abort(403, 'Akses ditolak.');
        }
    }
}
