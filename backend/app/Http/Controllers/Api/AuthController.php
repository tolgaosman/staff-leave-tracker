<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // 1. Giriş Yapma (Login) Fonksiyonu
    public function login(Request $request)
    {
        // Gelen verileri doğrula (e-posta ve şifre zorunlu)
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Veritabanında böyle bir kullanıcı var mı kontrol et
        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Hatalı e-posta veya şifre.',
            ], 401); // 401 Yetkisiz hatası döndür
        }

        // Kullanıcıyı al ve onun için yeni bir API Token üret
        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        // Token ve kullanıcı bilgilerini JSON olarak döndür
        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    // 2. Çıkış Yapma (Logout) Fonksiyonu
    public function logout(Request $request)
    {
        // Kullanıcının o an kullandığı aktif token'ı veritabanından sil (iptal et)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Çıkış yapıldı.',
        ]);
    }

    // 3. Profil Bilgilerini Getirme (Me) Fonksiyonu
    public function me(Request $request)
    {
        // Bağlı personel kaydı, departmanı ve izin geçmişiyle birlikte döner
        $user = $request->user()->load(['personnel.department', 'personnel.leaveRequests.leaveType', 'personnel.leaveRequests.decidedBy']);

        return response()->json($user);
    }

    // 4. Profil Güncelleme (Update Me) Fonksiyonu
    // Frontend'deki /profile ekranı bu uca yazar. Tüm alanlar opsiyoneldir;
    // e-posta değişikliğinde kullanıcının kendi kaydı hariç benzersizlik aranır.
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // Not: 'is_admin' bilinçli olarak dışarıda — kullanıcı kendini profilden admin yapamaz.
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'title' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'birth_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'avatar_url' => 'nullable|string',
            'emergency_name' => 'nullable|string|max:255',
            'emergency_relation' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
        ]);
        $user->update($data);

        // Sync relevant fields to the linked personnel record (if exists) so they appear in admin views
        if ($user->personnel) {
            $personnelUpdate = [];
            if (array_key_exists('phone', $data)) {
                $personnelUpdate['phone'] = $data['phone'];
            }
            if (array_key_exists('avatar_url', $data)) {
                $personnelUpdate['avatar_url'] = $data['avatar_url'];
            }
            if (array_key_exists('name', $data)) {
                $personnelUpdate['name'] = $data['name'];
            }
            
            if (!empty($personnelUpdate)) {
                $user->personnel->update($personnelUpdate);
            }
        }

        return response()->json($user);
    }
}
