<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\DemoFundStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Http\Resources\BookingResource;
use App\Services\DemoEscrowService;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function escrowCases(DemoEscrowService $escrow)
    {
        $escrow->reconcile();
        $cases = Booking::query()
            ->whereHas('payment', fn ($payment) => $payment->whereNotNull('fund_status'))
            ->where(fn ($orders) => $orders
                ->where(fn ($reported) => $reported->whereNotNull('issue_reported_at')->whereNull('issue_resolved_at'))
                ->orWhereHas('payment', fn ($failed) => $failed->where('fund_status', DemoFundStatus::FAILED->value))
                ->orWhere(fn ($waiting) => $waiting->whereNotNull('completed_at')
                    ->whereHas('payment', fn ($held) => $held->where('fund_status', DemoFundStatus::HELD->value))))
            ->with(['customer:id,name,email', 'service.tenant', 'payment'])
            ->latest('id')
            ->paginate(15);

        return BookingResource::collection($cases);
    }

    public function index(Request $request)
    {
        $bookings = Booking::with(['customer:id,name,email', 'service.tenant:id,business_name'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate(20);

        return BookingResource::collection($bookings)->additional(['success' => true]);
    }
}
