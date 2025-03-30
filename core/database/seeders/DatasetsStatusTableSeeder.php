<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatasetsStatusTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('datasets__status')->delete();
        
        \DB::table('datasets__status')->insert(array (
            0 => 
            array (
                'id' => 1,
                'name' => 'In progress',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            1 => 
            array (
                'id' => 2,
                'name' => 'Verified',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
        ));
        
        
    }
}