<?php

namespace App\Enums;

enum UserRole: string
{
    case CUSTOMER = 'customer';
    case TENANT = 'tenant';
    case ADMIN = 'admin';
}
