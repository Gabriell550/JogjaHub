<?php

namespace App\Http\Controllers\Api;

use App\Enums\BookingStatus;
use App\Enums\DemoFundStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Conversation;
use App\Services\DemoEscrowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingCompletionController extends Controller
{
    public function __construct(private readonly DemoEscrowService $escrow) {}

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
            abort_if($order->payment?->fund_status && $order->hasOpenCompletionIssue(), 422, 'Tunggu sampai admin menyelesaikan kendala.');
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
            $demo = $order->payment?->fund_status !== null;
            if (!$demo || $order->status !== BookingStatus::CONFIRMED->value) {
                $this->ensureAwaiting($order);
            }
            $order->issue_reported_at = now();
            $order->completion_issue = $reason;
            if (!$demo) {
                Conversation::firstOrCreate([
                    'customer_id' => $order->customer_id,
                    'tenant_id' => $order->service->tenant->user_id,
                ]);
            }
        });
    }

    public function resolve(Request $request, Booking $booking)
    {
        $resolution = $request->validate(['resolution' => 'required|string|max:1000'])['resolution'];

        return $this->change($booking, function (Booking $order) use ($request, $resolution) {
            abort_unless($order->payment?->fund_status && $order->issue_reported_at, 422, 'Komplain pembayaran demo tidak ditemukan.');
            if ($order->hasOpenCompletionIssue()) {
                $order->issue_resolved_at = now();
                $order->issue_resolved_by = $request->user()->id;
                $order->issue_resolution = $resolution;
            }
        });
    }

    public function retryPayout(Booking $booking)
    {
        return $this->change($booking, function (Booking $order) {
            abort_unless($order->payment?->fund_status && $order->completed_at, 422, 'Pesanan belum dapat dicairkan.');
            abort_if($order->hasOpenCompletionIssue(), 422, 'Selesaikan komplain sebelum melanjutkan pencairan.');
            if ($order->payment->fund_status === DemoFundStatus::FAILED) {
                $this->escrow->advance($order, retry: true);
                abort_if($order->payment->fund_status === DemoFundStatus::FAILED, 422, 'Tenant perlu menyimpan tujuan pencairan sebelum simulasi dapat diulang.');
            }
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
            $this->escrow->advance($order);
            return $order;
        }, 3);

        return new BookingResource($order->load(['service.tenant', 'slot', 'slots', 'payment', 'review']));
    }
}
