<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'firstname' => 'Ilyas',
            'lastname' => 'Mohetna',
            'email' => 'ilyas.mohetna@hotmail.com',
        ]);

        User::factory()->asAdmin()->create([
            'firstname' => 'James',
            'lastname' => 'Mqueen',
            'email' => 'admin@admin.com'
        ]);
    }
}
