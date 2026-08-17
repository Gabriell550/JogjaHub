<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $services = Service::with(['tenant', 'subcategory'])
            ->whereHas('tenant', fn($q) => $q->where('status', 'approved')) // cuma tampilin tenant yang udah approved
            ->when($request->subcategory_id, fn($q) => $q->where('subcategory_id', $request->subcategory_id))
            ->when($request->category_id, function ($q) use ($request) {
                $q->whereHas('subcategory', fn($sq) => $sq->where('category_id', $request->category_id));
            })
            ->paginate(15);

        return response()->json(['success' => true, 'data' => $services]);
    }
}
