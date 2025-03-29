<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('datasets__objects_rank', function (Blueprint $table) {
            $table->id();
            $table->string('mongo_object_id');
            $table->integer('rank');
            $table->foreignId('dataset_id')->constrained('datasets');
            $table->decimal('percentage', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('datasets__objects_rank');
    }
};
