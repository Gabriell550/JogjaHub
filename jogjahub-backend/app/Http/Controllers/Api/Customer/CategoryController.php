<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories =Category::with('subcategories')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}
