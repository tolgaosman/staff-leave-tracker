<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\LeaveTypeController;
use App\Http\Controllers\Api\PersonnelController;
use Illuminate\Support\Facades\Route;

// Giriş rotası (Herkese açık, dakikada en fazla 5 deneme - brute-force koruması)
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login');

// NOT: Herkese açık /register rotası bilinçli olarak KALDIRILDI. Bu bir kurum içi
// İK uygulamasıdır; internetteki herkesin kendine hesap açabilmesi istenmez.
// Hesaplar İK/Sistem Yöneticisi tarafından POST /personnel ile açılır (rastgele
// şifreyle bir User kaydı da oluşturulur), kullanıcı şifresini
// /forgot-password akışıyla belirler.
Route::post('/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLinkEmail'])->middleware('throttle:5,1')->name('password.email');
Route::post('/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset'])->name('password.update');

// Korumalı rotalar (Sadece giriş yapmış, geçerli token'ı olan kullanıcılar erişebilir)
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']); // Profil güncelleme (/profile ekranı)

    // İzin Talebi oluşturma/görüntüleme: her giriş yapmış kullanıcı erişebilir.
    // store() içinde admin olmayanlar için personnel_id kendi kaydına sabitlenir
    // ve bakiye/belge/çakışma kuralları uygulanır (bkz. LeaveRequestController).
    Route::get('/leave-requests/{leave_request}', [LeaveRequestController::class, 'show']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::put('/leave-requests/{leave_request}', [LeaveRequestController::class, 'update']);
    // Kendi BEKLEYEN talebini iptal etme. Bilerek admin grubunun DIŞINDA:
    // sahiplik ve "pending" kontrolü cancel() içinde yapılır.
    Route::delete('/leave-requests/{leave_request}/cancel', [LeaveRequestController::class, 'cancel']);

    // Referans listeleri (formlardaki açılır menüler için, salt-okunur)
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/leave-types', [LeaveTypeController::class, 'index']);

    // Duyurular — okuma tüm giriş yapmış kullanıcılara açık
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    // İzin yönetimi, Dashboard ve Personel Listesi (Super Admin, İK ve Departman Yöneticisi)
    Route::middleware('role:super_admin,hr_admin,manager')->group(function () {
        Route::apiResource('personnel', PersonnelController::class);

        // İzin Talebi: listeleme (şirket geneli) ve güncelleme/silme/onay/red
        Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
        Route::delete('/leave-requests/{leave_request}', [LeaveRequestController::class, 'destroy']);
        Route::patch('/leave-requests/{leave_request}/approve', [LeaveRequestController::class, 'approve']);
        Route::patch('/leave-requests/{leave_request}/reject', [LeaveRequestController::class, 'reject']);
        Route::patch('/leave-requests/{leave_request}/pending', [LeaveRequestController::class, 'pending']);
        Route::get('/leave-requests/{leave_request}/conflicts', [LeaveRequestController::class, 'conflicts']);

        // Duyurular — yazma/silme yalnızca admin
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy']);

        // Dashboard İstatistik Rotası
        Route::get('/dashboard', [DashboardController::class, 'stats']);
    });
});
