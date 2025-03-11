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
        Schema::create('datasets__variants', function (Blueprint $table) {
            $table->id();
            $table->string('path');
            $table->foreignId('variant_type_id')->constrained('datasets__variant_types');
            $table->foreignId('dataset_id')->constrained('datasets');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('datasets__variants');
    }
};
