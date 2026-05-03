<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_info', function (Blueprint $table) {
            $table->decimal('student_socioeconomic', 12, 2)->change();
        });
    }

    public function down()
    {
        Schema::table('student_info', function (Blueprint $table) {
            $table->string('student_socioeconomic')->change();
        });
    }
};