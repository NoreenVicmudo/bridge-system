<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_generate_report_audit', function (Blueprint $table) {
            $table->id();
            $table->string('batch', 64)->nullable();
            $table->unsignedBigInteger('generated_by')->nullable();
            $table->timestamp('generated_at')->useCurrent();
            $table->text('remarks')->nullable();
            $table->string('treatment', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_generate_report_audit');
    }
};