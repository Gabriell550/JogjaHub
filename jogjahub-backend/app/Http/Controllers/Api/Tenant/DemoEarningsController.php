<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\DemoEscrowService;
use Illuminate\Http\Request;

class DemoEarningsController extends Controller
{
    public function __construct(private readonly DemoEscrowService $escrow) {}

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenantProfile->id;
        $scope = Booking::whereHas('service', fn ($service) => $service->where('tenant_id', $tenantId));
        $this->escrow->reconcile(clone $scope);

        return BookingResource::collection($scope
            ->whereHas('payment', fn ($payment) => $payment->whereNotNull('fund_status'))
            ->with(['payment', 'service:id,name'])
            ->latest('id')
            ->paginate(15));
    }

    public function destination(Request $request)
    {
        return ['data' => $request->user()->tenantProfile->demo_payout_destination];
    }

    public function saveDestination(Request $request)
    {
        $destination = $request->validate([
            'type' => 'required|in:bank,gopay,dana',
            'provider' => 'required_if:type,bank|nullable|string|max:50',
            'number' => 'required|string|digits_between:6,24',
            'holder' => 'required|string|max:100',
        ]);
        $destination['provider'] = match ($destination['type']) {
            'gopay' => 'GoPay',
            'dana' => 'DANA',
            default => $destination['provider'],
        };
        $tenant = $request->user()->tenantProfile;
        $tenant->forceFill(['demo_payout_destination' => $destination])->save();
        $this->escrow->reconcile(Booking::whereHas('service', fn ($service) => $service->where('tenant_id', $tenant->id)));

        return ['data' => $destination];
    }
}
