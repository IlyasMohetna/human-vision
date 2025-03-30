<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CitiesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('cities')->delete();
        
        \DB::table('cities')->insert(array (
            0 => 
            array (
                'id' => 1,
                'name' => 'Frankfurt',
                'latitude' => '50.11064400',
                'longitude' => '8.68209200',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            1 => 
            array (
                'id' => 2,
                'name' => 'Lindau',
                'latitude' => '47.55075300',
                'longitude' => '9.69266200',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
            2 => 
            array (
                'id' => 3,
                'name' => 'Munster',
                'latitude' => '51.96251000',
                'longitude' => '7.62518800',
                'created_at' => NULL,
                'updated_at' => NULL,
            ),
        ));
        
        
    }
}