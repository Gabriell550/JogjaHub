<?php

namespace App\Enums;

enum DemoFundStatus: string
{
    case HELD = 'held';
    case PROCESSING = 'processing';
    case SIMULATED = 'simulated';
    case FAILED = 'failed';
}
