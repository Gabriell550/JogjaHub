<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Booking;
use App\Enums\BookingStatus;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('bookings:remind-completion', function () {
    $now = now();
    Booking::where('status', BookingStatus::AWAITING_COMPLETION->value)
        ->where('fulfilled_at', '<=', $now->copy()->subHours(max(1, (int) config('booking.completion_reminder_hours'))))
        ->whereNull('issue_reported_at')
        ->whereNull('completion_reminded_at')
        ->update(['completion_reminded_at' => $now]);
})->purpose('Add a single completion reminder to customer order activity');

Schedule::command('bookings:remind-completion')->hourly();
