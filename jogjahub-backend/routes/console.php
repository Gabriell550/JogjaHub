<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Booking;
use App\Enums\BookingStatus;
use App\Services\DemoEscrowService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('bookings:remind-completion', function () {
    $now = now();
    Booking::where('status', BookingStatus::AWAITING_COMPLETION->value)
        ->where('fulfilled_at', '<=', $now->copy()->subHours(max(1, (int) config('booking.completion_reminder_hours'))))
        ->where(fn ($query) => $query->whereNull('issue_reported_at')->orWhereNotNull('issue_resolved_at'))
        ->whereNull('completion_reminded_at')
        ->update(['completion_reminded_at' => $now]);
})->purpose('Add a single completion reminder to customer order activity');

Schedule::command('bookings:remind-completion')->hourly();

Artisan::command('bookings:advance-demo-payouts', function () {
    app(DemoEscrowService::class)->reconcile();
})->purpose('Advance eligible demo payouts');

Schedule::command('bookings:advance-demo-payouts')->everyMinute();
