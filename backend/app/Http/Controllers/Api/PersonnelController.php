<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personnel;
use App\Models\User;
use App\Support\DataUriUpload;
use App\Support\ManagerScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PersonnelController extends Controller
{
    /**
     * Avatar olarak yüklenmesine izin verilen gerçek MIME türleri => dosya uzantısı.
     */
    private const ALLOWED_AVATAR_MIME_EXTENSIONS = [
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
    ];

    /**
     * Yeni bir login hesabı açıldığında, çalışanın kendi şifresini belirleyebilmesi için
     * rastgele bir geçici şifre üretilir ve hesaba bir şifre sıfırlama bağlantısı gönderilir
     * (bkz. sendPasswordSetupLink). Sabit/öngörülebilir bir varsayılan şifre kullanılmaz.
     */
    private function generateRandomPassword(): string
    {
        return Str::password(32);
    }

    private function sendPasswordSetupLink(User $user): void
    {
        Password::broker()->sendResetLink(['email' => $user->email]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = request()->user();
        
        $query = Personnel::with(['department', 'user']);

        $deptId = ManagerScope::departmentIdFor($user);
        if ($deptId === false) {
            $query->where('id', 0); // manager'a bağlı personel kaydı yok — hiçbir şey görmesin
        } elseif ($deptId !== null) {
            $query->where('department_id', $deptId);
        }

        $personnels = $query->get();

        return response()->json($personnels);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($request->user()->role === 'manager') {
            abort(403, 'Sadece İnsan Kaynakları ve Sistem Yöneticileri personel ekleyebilir.');
        }

        // Gelen verileri doğrula. 'email' verilirse personele bağlı bir login hesabı açılır.
        $data = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,on-leave,inactive,resigned',
            'start_date' => 'nullable|date',
            'avatar_url' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'role' => 'nullable|string|in:super_admin,hr_admin,manager,employee',
            'title' => 'nullable|string|max:255',
        ]);

        if (!empty($data['avatar_url']) && str_starts_with($data['avatar_url'], 'data:')) {
            $url = DataUriUpload::store($data['avatar_url'], 'avatars', self::ALLOWED_AVATAR_MIME_EXTENSIONS);
            if ($url === null) {
                return response()->json(['message' => 'Geçersiz veya desteklenmeyen avatar dosya türü. Sadece JPEG/PNG kabul edilir.'], 422);
            }
            $data['avatar_url'] = $url;
        }

        // E-posta gönderildiyse otomatik-şifreli bir kullanıcı oluştur ve personele bağla.
        // Personel + kullanıcı birlikte oluşmalı; hata olursa ikisi de geri alınsın diye transaction.
        // Rol ataması yalnızca super_admin'e açık — update() ile aynı kural.
        // Aksi halde bir hr_admin, personel oluştururken kendine super_admin
        // rolünde bir hesap açabilirdi (yetki yükseltme).
        $canAssignRoles = $request->user()->role === 'super_admin';

        $newUser = null;
        $personnel = DB::transaction(function () use ($data, &$newUser, $canAssignRoles) {
            if (! empty($data['email'])) {
                $newUser = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $this->generateRandomPassword(), // User modelindeki 'hashed' cast hash'ler
                    'role' => $canAssignRoles ? ($data['role'] ?? 'employee') : 'employee',
                ]);
                $data['user_id'] = $newUser->id;
            }

            unset($data['role']);

            unset($data['email']); // 'email' personnels tablosunda bir kolon değil

            $data['annual_leave_balance'] = \App\Support\LeaveRules::annualEntitlement($data['start_date'] ?? null);

            return Personnel::create($data);
        });

        // Yeni açılan hesaba, çalışanın kendi şifresini belirlemesi için sıfırlama bağlantısı gönder.
        if ($newUser) {
            $this->sendPasswordSetupLink($newUser);
        }

        // Departman ve (varsa) bağlı kullanıcı ilişkisiyle birlikte geri dön
        return response()->json($personnel->load(['department', 'user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Personnel $personnel)
    {
        $user = request()->user();
        if ($user->role === 'manager' && $user->personnel) {
            if ($personnel->department_id !== $user->personnel->department_id) {
                abort(403, 'Sadece kendi departmanınızdaki personelleri görüntüleyebilirsiniz.');
            }
        }
        
        // Tek bir personeli; departmanı, bağlı kullanıcı hesabı ve izin talepleri geçmişiyle birlikte göster
        return response()->json($personnel->load(['department', 'user', 'leaveRequests.leaveType', 'leaveRequests.decidedBy']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Personnel $personnel)
    {
        if ($request->user()->role === 'manager') {
            abort(403, 'Sadece İnsan Kaynakları ve Sistem Yöneticileri personel güncelleyebilir.');
        }

        // Gelen verileri doğrula
        $data = $request->validate([
            'department_id' => 'sometimes|required|exists:departments,id',
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'nullable|string|max:50',
            'status' => 'nullable|string|in:active,on-leave,inactive,resigned',
            'start_date' => 'nullable|date',
            'avatar_url' => 'nullable|string',
            'user_id' => 'nullable|exists:users,id',
            'role' => 'nullable|string|in:super_admin,hr_admin,manager,employee',
            'title' => 'nullable|string|max:255',
        ]);

        if (!empty($data['avatar_url']) && str_starts_with($data['avatar_url'], 'data:')) {
            $url = DataUriUpload::store($data['avatar_url'], 'avatars', self::ALLOWED_AVATAR_MIME_EXTENSIONS);
            if ($url === null) {
                return response()->json(['message' => 'Geçersiz veya desteklenmeyen avatar dosya türü. Sadece JPEG/PNG kabul edilir.'], 422);
            }
            $data['avatar_url'] = $url;
        }

        // Rol ataması yalnızca super_admin'e açık. Aktörü closure'a taşımadan
        // ÖNCE hesapla: $request closure'ın use() listesinde olmadığı için
        // içeride kullanmak "Undefined variable $request" hatası veriyordu ve
        // rolü olan bir personelin yetkisi hiç değiştirilemiyordu (HTTP 500).
        $canAssignRoles = $request->user()->role === 'super_admin';

        $newUser = null;
        $personnel = DB::transaction(function () use ($data, $personnel, &$newUser, $canAssignRoles) {
            // Henüz login hesabı olmayan bir personele e-posta girildiyse hesabı şimdi aç ve bağla.
            // (Var olan kullanıcı bu uçtan yeniden yazılmaz.)
            if (! empty($data['email']) && ! $personnel->user_id) {
                $newUser = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => $this->generateRandomPassword(),
                    'role' => $canAssignRoles ? ($data['role'] ?? 'employee') : 'employee',
                ]);
                $data['user_id'] = $newUser->id;
            } elseif ($personnel->user_id && isset($data['role']) && $canAssignRoles) {
                $personnel->user->update(['role' => $data['role']]);
            }

            unset($data['email']);
            unset($data['role']);
            $personnel->update($data);

            return $personnel;
        });

        if ($newUser) {
            $this->sendPasswordSetupLink($newUser);
        }

        return response()->json($personnel->load(['department', 'user']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Personnel $personnel)
    {
        if (request()->user()->role === 'manager') {
            abort(403, 'Sadece İnsan Kaynakları ve Sistem Yöneticileri personel silebilir.');
        }
        // Personeli sil
        $personnel->delete();

        return response()->json(['message' => 'Personel başarıyla silindi.']);
    }
}
