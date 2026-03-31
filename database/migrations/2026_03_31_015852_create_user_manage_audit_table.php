<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_manage_audit', function (Blueprint $table) {
            $table->id();
            $table->string('user_username', 64)->nullable();
            $table->unsignedBigInteger('action_by')->nullable();
            $table->timestamp('action_at')->useCurrent();
            $table->text('remarks')->nullable();
            $table->string('location', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_manage_audit');
    }
};