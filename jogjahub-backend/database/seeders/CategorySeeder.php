<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Subcategory;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Penginapan' => [
                'Kamar' => false
            ],
            'Beauty & Style' => [
                'Salon' => true,
                'Butik' => false
            ],
            'Gifting' => [
                'Selempang' => false,
                'Akrilik' => false,
                'Florist' => false,
                'Plakat' => false
            ],
            'Dokumentasi' => [
                'Fotografer' => true,
                'Videografer' => true
            ],
        ];

        foreach ($data as $categoryName => $subcategories) {
            $category = Category::firstOrCreate(['name' => $categoryName]);

            foreach ($subcategories as $subName) {
                Subcategory::firstOrCreate([
                    'category_id' => $category->id,
                    'name' => $subName,
                ]);
            }
        }
    }
}
