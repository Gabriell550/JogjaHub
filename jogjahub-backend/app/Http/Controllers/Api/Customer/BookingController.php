<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(protected BookingService $bookingService)
    {
    }

    public function index(Request $request)
    {
        $bookings = Booking::where('customer_id', $request->user()->id)
            ->with(['service.tenant', 'slot'])
            ->latest()
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $bookings]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'slot_id' => 'nullable|exists:time_slots,id',
            'payment_method' => 'required|in:transfer,cod',
            'payment_proof_url' => 'nullable|string',
            'details' => 'nullable|array',
        ]);

        $booking = $this->bookingService->createBooking($request->user()->id, $request->all());

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil dibuat',
            'data' => $booking,
        ], 201);
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Booking tidak bisa dibatalkan'], 422);
        }

        $this->bookingService->cancelBooking($booking);

        return response()->json(['success' => true, 'message' => 'Booking berhasil dibatalkan']);
    }
}
