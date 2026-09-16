<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreTimeSlotRequest;
use App\Models\Service;
use App\Models\TimeSlot;
use App\Http\Resources\TimeSlotResource;
use Illuminate\Http\Request;

class TimeSlotController extends Controller
{
    public function index(Request $request, Service $service)
    {
        if ($service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak diizinkan',
            ], 403);
        }

        $slots = $service->timeSlots()
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => TimeSlotResource::collection($slots),
        ]);
    }

    public function store(StoreTimeSlotRequest $request)
    {
        $service = Service::findOrFail($request->service_id);

        if ($service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        $slot = TimeSlot::create([
            'service_id' => $request->service_id,
            'slot_date'  => $request->slot_date,
            'start_time' => $request->start_time,
            'end_time'   => $request->end_time,
            'quota'      => $request->quota,
        ]);

        return response()->json(['success' => true, 'message' => 'Slot berhasil dibuat', 'data' => new TimeSlotResource($slot)], 201);
    }

    public function destroy(Request $request, TimeSlot $timeSlot)
    {
        if ($timeSlot->service->tenant_id !== $request->user()->tenantProfile->id) {
            return response()->json(['success' => false, 'message' => 'Tidak diizinkan'], 403);
        }

        if ($timeSlot->booked_count > 0) {
            return response()->json(['success' => false, 'message' => 'Slot tidak bisa dihapus karena sudah ada booking'], 422);
        }

        $timeSlot->delete();

        return response()->json(['success' => true, 'message' => 'Slot berhasil dihapus']);
    }
}
