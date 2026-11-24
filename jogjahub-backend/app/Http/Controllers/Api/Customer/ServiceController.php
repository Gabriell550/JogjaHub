<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Http\Resources\ServiceResource;
use App\Http\Resources\TimeSlotResource;
use App\Http\Resources\ReviewResource;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::with(['tenant', 'subcategory.category'])
            ->where('is_active', true)
            ->whereHas('tenant', fn($q) => $q->where('status', 'approved')) // cuma tampilin tenant yang udah approved
            ->when($request->subcategory_id, fn($q) => $q->where('subcategory_id', $request->subcategory_id))
            ->when($request->category_id, function ($q) use ($request) {
                $q->whereHas('subcategory', fn($sq) => $sq->where('category_id', $request->category_id));
            })
            ->when($request->q, function ($q) use ($request) {
                $keyword = $request->q;
                $q->where(function ($sub) use ($keyword) {
                    $sub->where('name', 'like', "%{$keyword}%")
                        ->orWhere('description', 'like', "%{$keyword}%")
                        ->orWhereHas('tenant', fn($t) => $t->where('business_name', 'like', "%{$keyword}%"));
                });
            })
            ->when($request->price_type, fn($q) => $q->where('price_type', $request->price_type))
            ->when($request->boolean('accommodation'), function ($query) {
                $query->where(function ($query) {
                    $query->where('price_type', 'per_night')
                        ->orWhereHas('subcategory.category', fn ($category) => $category->whereRaw('LOWER(TRIM(name)) = ?', ['penginapan']));
                });
            })
            ->orderBy('id')
            ->paginate(15);

        return ServiceResource::collection($services)->additional(['success' => true]);
    }

    public function slots(Service $service)
    {
        $this->ensureServiceIsPublic($service);

        $slots = $service->timeSlots()
            ->where('slot_date', '>=', now()->toDateString())
            ->whereColumn('quota', '>', 'booked_count')
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => TimeSlotResource::collection($slots),
        ]);
    }

    public function show(Service $service)
    {
        $this->ensureServiceIsPublic($service);

        $service->load(['tenant', 'subcategory.category']);

        $service->loadCount([
            'bookings as confirmed_bookings_count' => fn($q) => $q->where('status', 'confirmed'),
        ]);

        $reviews = $service->bookings()
            ->whereHas('review')
            ->with('review')
            ->get()
            ->pluck('review');

        $service->reviews_count = $reviews->count();
        $service->reviews_average_rating = $reviews->count() > 0 ? round($reviews->avg('rating'), 1) : null;

        return response()->json([
            'success' => true,
            'data' => new ServiceResource($service),
        ]);
    }

    public function reviews(Service $service)
    {
        $this->ensureServiceIsPublic($service);

        $reviews = $service->bookings()
            ->whereHas('review')
            ->with('review.customer:id,name')
            ->get()
            ->pluck('review');

        return response()->json([
            'success' => true,
            'data' => ReviewResource::collection($reviews),
        ]);
    }

    private function ensureServiceIsPublic(Service $service): void
    {
        abort_unless($service->is_active && $service->tenant?->status === 'approved', 404);
    }
}
