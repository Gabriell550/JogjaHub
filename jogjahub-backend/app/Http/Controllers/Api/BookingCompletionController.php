<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingCompletionController extends Controller
{
    public function mark(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->service?->tenant_id === (int) $request->user()->tenantProfile->id, 403);
        return $this->change($booking, function (Booking $order) {
            if ($order->fulfilled_at) {
                return;
            }
            abort_unless($order->status === BookingStatus::CONFIRMED->value, 422, 'Pesanan belum dikonfirmasi.');
            abort_unless($order->canMarkFulfilled(), 422, 'Jadwal layanan belum selesai.');
            $order->status = BookingStatus::AWAITING_COMPLETION->value;
            $order->fulfilled_at = now();
        });
    }

    public function confirm(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->customer_id === (int) $request->user()->id, 403);
        return $this->change($booking, function (Booking $order) {
            if ($order->status === BookingStatus::COMPLETED->value) {
                return;
            }
            $this->ensureAwaiting($order);
            $order->status = BookingStatus::COMPLETED->value;
            $order->completed_at = now();
        });
    }

    public function report(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->customer_id === (int) $request->user()->id, 403);
        $reason = $request->validate(['reason' => 'required|string|max:1000'])['reason'];

        return $this->change($booking, function (Booking $order) use ($reason) {
            if ($order->issue_reported_at) {
                return;
            }
            $this->ensureAwaiting($order);
            $order->issue_reported_at = now();
            $order->completion_issue = $reason;
            Conversation::firstOrCreate([
                'customer_id' => $order->customer_id,
                'tenant_id' => $order->service->tenant->user_id,
            ]);
        });
    }

    private function ensureAwaiting(Booking $order): void
    {
        abort_unless($order->status === BookingStatus::AWAITING_COMPLETION->value, 422, 'Pesanan belum menunggu konfirmasi selesai.');
    }

    private function change(Booking $booking, callable $update)
    {
        $order = DB::transaction(function () use ($booking, $update) {
            $order = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $update($order);
            if ($order->isDirty()) {
                $order->save();
            }
            return $order;
        }, 3);

        return new BookingResource($order->load(['service.tenant', 'slot', 'slots', 'payment', 'review']));
    }
}
