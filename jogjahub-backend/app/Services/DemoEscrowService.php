<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\DemoFundStatus;
use App\Models\Booking;
use App\Models\TenantProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class DemoEscrowService
{
    // Dipanggil saat baris booking dikunci. Satu payment unik per booking menyimpan satu pencairan.
    public function advance(Booking $booking, bool $retry = false): void
    {
        $payment = $booking->payment;
        if (!$payment?->fund_status || !$payment->isPaid()
            || $booking->status !== BookingStatus::COMPLETED->value || !$booking->completed_at
            || $booking->hasOpenCompletionIssue()) {
            return;
        }

        if ($payment->fund_status === DemoFundStatus::PROCESSING) {
            if ($payment->payout_due_at?->lte(now())) {
                $payment->update([
                    'fund_status' => $payment->payout_destination ? DemoFundStatus::SIMULATED : DemoFundStatus::FAILED,
                    'payout_completed_at' => $payment->payout_destination ? now() : null,
                    'payout_due_at' => null,
                ]);
            }
            return;
        }

        if ($payment->fund_status !== DemoFundStatus::HELD && !($retry && $payment->fund_status === DemoFundStatus::FAILED)) {
            return;
        }

        $tenant = TenantProfile::query()->lockForUpdate()->find($booking->service?->tenant_id);
        $destination = $tenant?->demo_payout_destination;
        if (!$destination) {
            return;
        }

        $payment->update([
            'fund_status' => DemoFundStatus::PROCESSING,
            'payout_destination' => $destination['provider'] . ' •••• ' . substr($destination['number'], -4),
            'payout_due_at' => now()->addSeconds(3),
        ]);
    }

    public function reconcile(?Builder $scope = null): void
    {
        ($scope ?? Booking::query())
            ->where('status', BookingStatus::COMPLETED->value)
            ->whereHas('payment', fn (Builder $payment) => $payment
                ->where(fn (Builder $eligible) => $eligible
                    ->where('fund_status', DemoFundStatus::HELD->value)
                    ->orWhere(fn (Builder $processing) => $processing
                        ->where('fund_status', DemoFundStatus::PROCESSING->value)
                        ->where('payout_due_at', '<=', now()))))
            ->eachById(function (Booking $booking) {
                DB::transaction(function () use ($booking) {
                    $locked = Booking::query()->lockForUpdate()->find($booking->id);
                    if ($locked) {
                        $this->advance($locked);
                    }
                }, 3);
            });
    }
}
