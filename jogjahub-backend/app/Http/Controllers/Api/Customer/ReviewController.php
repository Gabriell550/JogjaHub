<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        $review = DB::transaction(function () use ($booking, $request) {
            $order = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            abort_unless($order->status === BookingStatus::COMPLETED->value, 422, 'Booking belum selesai');
            abort_if($order->review()->exists(), 422, 'Booking ini sudah pernah review');

            return $order->review()->create([
                'customer_id' => $request->user()->id,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Review berhasil dibuat',
            'data'    => $review,
        ], 201);
    }
}
