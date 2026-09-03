<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * users tablosuna rol (is_admin) ve profil alanlarını ekler.
     * is_admin: yetkilendirmenin tek kaynağı (admin mi çalışan mı).
     * Diğerleri /profile ekranından düzenlenen kişisel bilgilerdir.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');

            $table->string('title')->nullable();
            $table->string('phone', 50)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('location')->nullable();
            $table->text('bio')->nullable();
            $table->text('avatar_url')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_relation')->nullable();
            $table->string('emergency_phone', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_admin',
                'title',
                'phone',
                'birth_date',
                'location',
                'bio',
                'avatar_url',
                'emergency_name',
                'emergency_relation',
                'emergency_phone',
            ]);
        });
    }
};
