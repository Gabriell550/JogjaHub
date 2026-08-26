<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — JogjaHub
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ===== Public (belum login) =====
    Route::post('/auth/register/customer', [\App\Http\Controllers\Api\Customer\AuthController::class, 'register']);
    Route::post('/auth/register/tenant', [\App\Http\Controllers\Api\Tenant\AuthController::class, 'register']);
    Route::post('/auth/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

    Route::get('/categories', [\App\Http\Controllers\Api\Customer\CategoryController::class, 'index']);
    Route::get('/tenants/map', [\App\Http\Controllers\Api\Customer\TenantController::class, 'map']);
    Route::get('/services', [\App\Http\Controllers\Api\Customer\ServiceController::class, 'index']);
    Route::get('/services/{service}/slots', [\App\Http\Controllers\Api\Customer\ServiceController::class, 'slots']);

    // ===== Authenticated, semua role (logout dipisah, bukan punya 1 role spesifik) =====
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    });

    // ===== Customer =====
    Route::middleware(['auth:sanctum', 'role:customer'])->prefix('customer')->group(function () {
        Route::apiResource('bookings', \App\Http\Controllers\Api\Customer\BookingController::class);
        Route::post('bookings/{booking}/cancel', [\App\Http\Controllers\Api\Customer\BookingController::class, 'cancel']);
        Route::post('bookings/{booking}/review', [\App\Http\Controllers\Api\Customer\ReviewController::class, 'store']);
    });

    // ===== Tenant (butuh login + approved) =====
    Route::middleware(['auth:sanctum', 'role:tenant'])->prefix('tenant')->group(function () {
        Route::put('profile', [\App\Http\Controllers\Api\Tenant\ProfileController::class, 'update']);
        Route::apiResource('services', \App\Http\Controllers\Api\Tenant\ServiceController::class);
        Route::apiResource('time-slots', \App\Http\Controllers\Api\Tenant\TimeSlotController::class);
        Route::get('bookings', [\App\Http\Controllers\Api\Tenant\BookingController::class, 'index']);
        Route::get('services/{service}/time-slots', [\App\Http\Controllers\Api\Tenant\TimeSlotController::class, 'index']);
        Route::post('time-slots', [\App\Http\Controllers\Api\Tenant\TimeSlotController::class, 'store']);
        Route::patch('bookings/{booking}/status', [\App\Http\Controllers\Api\Tenant\BookingController::class, 'updateStatus']);
        Route::delete('time-slots/{timeSlot}', [\App\Http\Controllers\Api\Tenant\TimeSlotController::class, 'destroy']);
    });

    // ===== Admin =====
    Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('tenants/pending', [\App\Http\Controllers\Api\Admin\TenantController::class, 'pending']);
        Route::patch('tenants/{tenant}/approve', [\App\Http\Controllers\Api\Admin\TenantController::class, 'approve']);
        Route::patch('tenants/{tenant}/reject', [\App\Http\Controllers\Api\Admin\TenantController::class, 'reject']);
        Route::get('bookings', [\App\Http\Controllers\Api\Admin\BookingController::class, 'index']);
        Route::get('dashboard/summary', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'summary']);
    });
});
