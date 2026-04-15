<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('socioeconomic_status', function (Blueprint $table) {
            $table->string('status', 20)->primary();
            $table->integer('minimum')->nullable();
            $table->integer('maximum')->nullable();
            $table->timestamp('date_created')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('socioeconomic_status');
    }
};