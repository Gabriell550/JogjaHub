<?php

namespace App\Enums;

/**
 * Tipe harga untuk layanan (service).
 *
 * - per_session : harga untuk 1 sesi/kunjungan (salon, barbershop, kursus, dll)
 * - per_night   : harga per malam (hotel) → total pembayaran = price × jumlah malam
 */
enum PriceType: string
{
    case PER_SESSION = 'per_session';
    case PER_NIGHT   = 'per_night';

    /**
     * Label tampilan untuk frontend.
     */
    public function label(): string
    {
        return match($this) {
            self::PER_SESSION => 'Per Sesi',
            self::PER_NIGHT   => 'Per Malam',
        };
    }
}

