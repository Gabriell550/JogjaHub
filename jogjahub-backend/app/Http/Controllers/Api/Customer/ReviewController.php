<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Booking;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== BookingStatus::CONFIRMED->value) {
            return response()->json(['success' => false, 'message' => 'Booking belum selesai'], 422);
        }

        if ($booking->review()->exists()) {
            return response()->json(['success' => false, 'message' => 'Booking ini sudah pernah review'], 422);
        }

        $review = $booking->review()->create([
            'customer_id' => $request->user()->id,
            'rating'      => $request->rating,
            'comment'     => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review berhasil dibuat',
            'data'    => $review,
        ], 201);
    }
}
