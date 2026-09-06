<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request , Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['success' => false, 'message' => 'Booking belum selesai'], 422);
        }

        if ($booking->review()->exists()) {
            return response()->json(['success' => false, 'message' => 'Booking ini sudah pernah review'], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = $booking->review()->create([
            'customer_id' => $request->user()->id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review berhasil dibuat',
            'data' => $review,
        ], 201);
    }
}
