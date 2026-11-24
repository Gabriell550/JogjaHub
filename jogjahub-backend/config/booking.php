<?php

return [
    'checkout' => env('BOOKING_CHECKOUT', 'whatsapp'),
    'completion_reminder_hours' => (int) env('BOOKING_COMPLETION_REMINDER_HOURS', 24),
];
