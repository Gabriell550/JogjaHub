<?php

namespace App\Enums;

enum BookingStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case AWAITING_COMPLETION = 'awaiting_completion_confirmation';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public static function accepted(): array
    {
        return [self::CONFIRMED->value, self::AWAITING_COMPLETION->value, self::COMPLETED->value];
    }
}
