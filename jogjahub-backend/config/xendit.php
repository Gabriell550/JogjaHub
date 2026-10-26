<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Xendit Secret Key
    |--------------------------------------------------------------------------
    | Didapat dari Xendit Dashboard → Settings → API Keys.
    | Format test:  xnd_development_...
    | Format live:  xnd_production_...
    |
    */
    'secret_key' => env('XENDIT_SECRET_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Verification Token
    |--------------------------------------------------------------------------
    | Didapat dari Xendit Dashboard → Settings → Webhooks → Verification Token.
    | Dipakai untuk memverifikasi bahwa webhook benar-benar dari Xendit
    | (bukan request palsu dari pihak luar).
    |
    */
    'webhook_token' => env('XENDIT_WEBHOOK_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Redirect URLs setelah pembayaran
    |--------------------------------------------------------------------------
    | URL frontend yang akan dibuka Xendit setelah user selesai/gagal bayar.
    | Untuk development bisa pakai localhost atau ngrok URL.
    |
    */
    'success_redirect_url' => env('XENDIT_SUCCESS_REDIRECT_URL', 'http://localhost:3000/payment/success'),
    'failure_redirect_url' => env('XENDIT_FAILURE_REDIRECT_URL', 'http://localhost:3000/payment/failed'),

];

