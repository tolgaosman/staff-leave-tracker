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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();

            // İlişkiler
            $table->foreignId('personnel_id')->constrained('personnels')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained();

            // İzin Tarihleri ve Süresi
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('total_days');
            $table->text('note')->nullable(); // Çalışanın notu

            // Onay Durumu
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            // Reddetme Gerekçesi (Frontend'de popup ile göstereceğimiz alan)
            $table->text('rejection_reason')->nullable();

            // Karar Veren Yönetici Bilgileri
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();

            // Ek Belge/Rapor. Frontend yüklenen dosyayı base64 "data:" URL'i olarak
            // gönderebildiği için, MySQL'de ~64KB ile sınırlı text yerine mediumText
            // (~16MB) kullanıyoruz; aksi halde büyük belgeler sessizce kesilir.
            $table->mediumText('attachment_url')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
