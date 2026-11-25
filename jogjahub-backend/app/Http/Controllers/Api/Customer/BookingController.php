<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Booking;
use App\Services\BookingService;
use App\Http\Resources\BookingResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\File;

class BookingController extends Controller
{
    public function __construct(protected BookingService $bookingService) {}

    public function index(Request $request)
    {
        $bookings = Booking::where('customer_id', $request->user()->id)
            // Load relasi slot (single-slot) DAN slots (multi-slot hotel) + payment untuk total_amount
            ->with(['service.tenant', 'service.subcategory', 'slot', 'slots', 'review', 'payment'])
            ->latest()
            ->orderByDesc('id')
            ->paginate(15);

        return BookingResource::collection($bookings)->additional(['success' => true]);
    }

    public function store(StoreBookingRequest $request)
    {
        $result = $this->bookingService->createBooking($request->user()->id, $request->validated());

        return response()->json([
            'success'    => true,
            // Pesan diubah: tidak lagi ada URL pembayaran Xendit
            // Customer perlu transfer manual lalu upload bukti
            'message'    => 'Booking berhasil dibuat. Silakan transfer dan upload bukti pembayaran dalam 10 menit.',
            'data'       => new BookingResource($result['booking']),
            'expires_at' => $result['expires_at'],  // batas waktu upload bukti (ISO 8601)
        ], 201);
    }

    public function show(Request $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        $booking->load(['service.tenant', 'slot', 'slots', 'review', 'payment']);

        return response()->json(['success' => true, 'data' => new BookingResource($booking)]);
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Booking tidak bisa dibatalkan'], 422);
        }

        // Syarat waktu (FR-11): kalau ada slot, minimal 6 jam sebelum jadwal
        if ($booking->slot_id) {
            $booking->load('slot');
            $slotDateTime   = \Carbon\Carbon::parse($booking->slot->slot_date . ' ' . $booking->slot->start_time);
            $cancelDeadline = $slotDateTime->copy()->subHours(6);

            if (now()->gt($cancelDeadline)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Waktu pembatalan sudah lewat. Pembatalan hanya bisa dilakukan sebelum ' . $cancelDeadline->format('d M Y H:i'),
                ], 422);
            }
        }

        $this->bookingService->cancelBooking($booking);

        return response()->json(['success' => true, 'message' => 'Booking berhasil dibatalkan']);
    }

    /**
     * Upload bukti transfer pembayaran oleh customer.
     *
     * Alur:
     *  - Customer booking → status: pending, batas waktu 10 menit
     *  - Customer transfer ke rekening tenant
     *  - Customer upload foto bukti transfer lewat endpoint ini
     *  - Tenant melihat bukti → konfirmasi manual via endpoint konfirmasi
     *
     * Validasi:
     *  - Booking harus milik customer yang login
     *  - Status booking harus masih pending
     *  - File harus berupa gambar, max 5MB
     */
    public function uploadPaymentProof(Request $request, Booking $booking)
    {
        // Pastikan booking milik customer yang sedang login
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        // Hanya booking pending yang bisa diupload buktinya
        if ($booking->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking berstatus pending yang bisa mengupload bukti pembayaran.',
            ], 422);
        }

        $request->validate([
            // Bukti transfer: wajib ada, harus gambar, max 5MB
            'payment_proof' => ['required', File::image()->max(5 * 1024)],
        ]);

        $payment = $booking->payment;

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Data pembayaran tidak ditemukan.'], 404);
        }

        // Simpan file baru di folder payment_proofs/ pada disk public
        $newPath = $request->file('payment_proof')->store('payment_proofs', 'public');

        // Hapus foto bukti lama jika ada (supaya tidak menumpuk di storage)
        if ($payment->payment_proof_url) {
            Storage::disk('public')->delete($payment->payment_proof_url);
        }

        $payment->update(['payment_proof_url' => $newPath]);

        return response()->json([
            'success'           => true,
            'message'           => 'Bukti pembayaran berhasil diupload. Menunggu konfirmasi tenant.',
            'payment_proof_url' => asset('storage/' . $newPath),
        ]);
    }
}
