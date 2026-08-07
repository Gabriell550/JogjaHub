<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — JogjaHub
|--------------------------------------------------------------------------
| Semua route diprefix /api/v1 dan dikelompokkan per role sesuai
| backend guideline. Controller sebenarnya diisi bertahap per sprint
| roadmap (Bulan 1-4).
*/

Route::prefix('v1')->group(function () {

    // ===== Public (belum login) =====
    Route::post('/auth/register/customer', [\App\Http\Controllers\Api\Customer\AuthController::class, 'register']);
    Route::post('/auth/register/vendor', [\App\Http\Controllers\Api\Vendor\AuthController::class, 'register']);
    Route::post('/auth/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

    Route::get('/categories', [\App\Http\Controllers\Api\Customer\CategoryController::class, 'index']);
    Route::get('/services', [\App\Http\Controllers\Api\Customer\ServiceController::class, 'index']);
    Route::post('/chatbot/ask', [\App\Http\Controllers\Api\ChatbotController::class, 'ask']);

    // ===== Customer (butuh login) =====
    Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
        Route::apiResource('bookings', \App\Http\Controllers\Api\Customer\BookingController::class);
        Route::post('bookings/{booking}/cancel', [\App\Http\Controllers\Api\Customer\BookingController::class, 'cancel']);
        Route::post('bookings/{booking}/review', [\App\Http\Controllers\Api\Customer\ReviewController::class, 'store']);
    });

    // ===== Vendor (butuh login + approved) =====
    Route::middleware(['auth:sanctum', 'role:vendor'])->prefix('vendor')->group(function () {
        Route::put('profile', [\App\Http\Controllers\Api\Vendor\ProfileController::class, 'update']);
        Route::apiResource('services', \App\Http\Controllers\Api\Vendor\ServiceController::class);
        Route::apiResource('time-slots', \App\Http\Controllers\Api\Vendor\TimeSlotController::class);
        Route::get('bookings', [\App\Http\Controllers\Api\Vendor\BookingController::class, 'index']);
        Route::patch('bookings/{booking}/status', [\App\Http\Controllers\Api\Vendor\BookingController::class, 'updateStatus']);
    });

    // ===== Admin =====
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('vendors/pending', [\App\Http\Controllers\Api\Admin\VendorController::class, 'pending']);
        Route::patch('vendors/{vendor}/approve', [\App\Http\Controllers\Api\Admin\VendorController::class, 'approve']);
        Route::patch('vendors/{vendor}/reject', [\App\Http\Controllers\Api\Admin\VendorController::class, 'reject']);
        Route::get('bookings', [\App\Http\Controllers\Api\Admin\BookingController::class, 'index']);
        Route::get('dashboard/summary', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'summary']);
    });
});
