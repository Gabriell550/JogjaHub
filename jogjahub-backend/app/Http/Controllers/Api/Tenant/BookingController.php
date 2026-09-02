<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Services\BookingService;
use App\Enums\BookingStatus;
use App\Models\Booking;
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
            ->with(['customer:id,name,email', 'service:id,name', 'slot'])
            ->latest()
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function updateStatus(Request $request, Booking $booking)
    {

        $tenantId = $request->user()->tenantProfile->id;

        // booking ini emang buat service milik tenant yang login
        if ($booking->service->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        $request->validate([
            'status' => 'required|in:confirmed,cancelled',
        ]);

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
            $booking->update(['status' => BookingStatus::CONFIRMED->value]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status booking berhasil diubah',
            'data' => $booking->fresh(),
        ]);
    }
}
