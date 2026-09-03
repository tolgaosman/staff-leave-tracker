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
        Schema::table('leave_requests', function (Blueprint $table) {
            // Yüklenen belgenin kullanıcıya gösterilecek özgün dosya adı
            // (ör. "doktor-raporu.pdf"). attachment_url'deki dosya adı
            // Laravel tarafından hash'lendiği için okunabilir değil.
            $table->string('attachment_name')->nullable()->after('attachment_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn('attachment_name');
        });
    }
};
