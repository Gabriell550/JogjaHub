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
            'Penginapan' => [],
            'Beauty & Style' => ['Salon', 'Butik'],
            'Gifting' => ['Selempang', 'Akrilik', 'Florist', 'Plakat'],
            'Dokumentasi' => ['Fotografer', 'Videografer'],
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
