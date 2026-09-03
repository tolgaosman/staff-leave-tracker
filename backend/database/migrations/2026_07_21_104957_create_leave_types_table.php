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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // İzin Türü Adı (Yıllık İzin, Hastalık İzni vb.)
            $table->string('slug'); // Kod Adı (annual, sick vb.)
            $table->integer('max_days')->nullable(); // Maksimum gün sayısı (Zorunlu değil)
            $table->boolean('requires_document')->default(false); // Belge/Rapor gerekir mi? (Varsayılan: false)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
