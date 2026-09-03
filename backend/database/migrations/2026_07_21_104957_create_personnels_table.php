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
        Schema::create('personnels', function (Blueprint $table) {
            $table->id();

            // user_id kolonu: users tablosuna bağlanır. null (boş) kalabilir.
            // Kullanıcı silinirse bu personel silinmez, sadece user_id kısmı null olur.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // department_id kolonu: departments tablosuna bağlanır. Zorunludur.
            $table->foreignId('department_id')->constrained();

            $table->string('name'); // Ad Soyad
            $table->string('phone')->nullable(); // Telefon (Zorunlu değil)

            // Durum kolonu (Sadece belirli 4 değeri alabilir, varsayılan olarak 'active' başlar)
            $table->enum('status', ['active', 'on-leave', 'inactive', 'resigned'])->default('active');

            $table->date('start_date')->nullable(); // İşe başlama tarihi
            $table->string('avatar_url')->nullable(); // Profil resminin adresi

            $table->timestamps(); // created_at ve updated_at kolonları
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personnels');
    }
};
