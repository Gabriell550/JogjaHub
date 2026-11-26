<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use App\Services\DemoEscrowService;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Conversation;
use App\Http\Resources\BookingResource;
use App\Http\Requests\Tenant\UpdateBookingStatusRequest;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(protected BookingService $bookingService)
    {
    }

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenantProfile->id;

        $bookings = Booking::whereHas('service', fn($q) => $q->where('tenant_id', $tenantId))
            // Load slot (single-slot) DAN slots (multi-slot hotel) + payment untuk total_amount
            ->with(['customer:id,name,email', 'service:id,name', 'slot', 'slots', 'review', 'payment'])
            ->latest()
            ->orderByDesc('id')
            ->paginate(15);

        return BookingResource::collection($bookings)->additional(['success' => true]);
    }

    public function show(Request $request, Booking $booking, DemoEscrowService $escrow)
    {
        $tenantId = $request->user()->tenantProfile->id;

        if ($booking->service->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        $escrow->reconcile(Booking::whereKey($booking->id));
        $booking->load(['customer:id,name,email,phone', 'service:id,name', 'slot', 'slots', 'review', 'payment']);

        if ($booking->issue_reported_at && !$booking->payment?->fund_status) {
            $booking->completion_conversation_id = Conversation::where('customer_id', $booking->customer_id)
                ->where('tenant_id', $request->user()->id)->value('id');
        }

        return response()->json(['success' => true, 'data' => new BookingResource($booking)]);
    }

    public function updateStatus(UpdateBookingStatusRequest $request, Booking $booking)
    {

        $tenantId = $request->user()->tenantProfile->id;

        // booking ini emang buat service milik tenant yang login
        if ($booking->service->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== BookingStatus::PENDING->value) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking berstatus pending yang bisa diubah',
            ], 422);
        }

        if ($request->status === 'cancelled') {
            // pakai method yang sama dengan customer, biar kuota slot ikut dikembalikan
            $this->bookingService->cancelBooking($booking);
        } else {
            $changed = Booking::whereKey($booking->id)->where('status', BookingStatus::PENDING->value)
                ->update(['status' => BookingStatus::CONFIRMED->value]);
            abort_unless($changed, 422, 'Hanya booking berstatus pending yang bisa diubah');
        }

        return response()->json([
            'success' => true,
            'message' => 'Status booking berhasil diubah',
            'data' => new BookingResource($booking->fresh()),
        ]);
    }

    /**
     * Konfirmasi pembayaran transfer manual oleh tenant.
     *
     * Alur:
     *  - Customer sudah upload bukti transfer
     *  - Tenant memeriksa bukti via GET /tenant/bookings/{id}
     *  - Tenant konfirmasi → booking status: confirmed, payment status: paid
     *
     * Validasi:
     *  - Booking harus milik layanan tenant yang login
     *  - Status booking harus pending
     *  - Customer sudah upload bukti (payment_proof_url tidak null)
     */
    public function confirmPayment(Request $request, Booking $booking)
    {
        $tenantId = $request->user()->tenantProfile->id;

        if ($booking->service->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== BookingStatus::PENDING->value) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking berstatus pending yang bisa dikonfirmasi.',
            ], 422);
        }

        $payment = $booking->payment;

        // Pastikan customer sudah upload bukti transfer sebelum tenant konfirmasi
        if (!$payment || !$payment->payment_proof_url) {
            return response()->json([
                'success' => false,
                'message' => 'Customer belum mengupload bukti transfer. Mohon tunggu.',
            ], 422);
        }

        // Konfirmasi: update payment → paid, booking → confirmed
        $payment->update([
            'status'  => 'paid',
            'paid_at' => now(),
        ]);

        $booking->update(['status' => BookingStatus::CONFIRMED->value]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil dikonfirmasi. Booking telah terkonfirmasi.',
            'data'    => new BookingResource($booking->fresh(['service', 'slot', 'slots', 'payment'])),
        ]);
    }
}
