<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_additional_entry_audit', function (Blueprint $table) {
            $table->id();
            $table->string('field', 64)->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('updated_at')->useCurrent();
            $table->text('remarks')->nullable();
            $table->string('location', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_additional_entry_audit');
    }
};