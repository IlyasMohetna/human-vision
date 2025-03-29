<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatasetsVariantTypesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('datasets__variant_types')->delete();
        
        \DB::table('datasets__variant_types')->insert(array (
            0 => 
            array (
                'id' => 1,
                'name' => 'Original Image',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            1 => 
            array (
                'id' => 2,
                'name' => 'Color Mask',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            2 => 
            array (
                'id' => 3,
                'name' => 'Instance Mask',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            3 => 
            array (
                'id' => 4,
                'name' => 'Label ID Map',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
        ));
        
        
    }
}