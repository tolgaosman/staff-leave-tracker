<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Aktif duyuruları listeler — tüm giriş yapmış kullanıcılar görebilir (yetkiye göre filtrelenir).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Announcement::with(['creator:id,name', 'department:id,name'])->latest();

        if ($request->boolean('include_scheduled') || $request->boolean('all')) {
            $query->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                });
        } else {
            $query->active();
        }

        if (!in_array($user->role, ['super_admin', 'hr_admin'])) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('department_id');
                if ($user->personnel && $user->personnel->department_id) {
                    $q->orWhere('department_id', $user->personnel->department_id);
                }
            });
        }

        return response()->json($query->get());
    }

    /**
     * Yeni duyuru oluşturur — super_admin, hr_admin, manager.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'         => 'required|string|max:255',
            'body'          => 'required|string|max:5000',
            'department_id' => 'nullable|exists:departments,id',
            'is_active'     => 'sometimes|boolean',
            'start_date'    => 'nullable|date',
            'expires_at'    => 'nullable|date|after_or_equal:start_date',
        ]);

        $user = $request->user();

        // Departman müdürü ise sadece kendi departmanına atabilir
        if ($user->role === 'manager') {
            $data['department_id'] = $user->personnel->department_id;
        }

        $announcement = Announcement::create([
            ...$data,
            'created_by' => $user->id,
        ]);

        return response()->json($announcement->load(['creator:id,name', 'department:id,name']), 201);
    }

    /**
     * Duyuruyu günceller (aktif/pasif, süresi vb.).
     */
    public function update(Request $request, Announcement $announcement)
    {
        $user = $request->user();
        if ($user->role === 'manager' && $announcement->department_id !== $user->personnel->department_id) {
            abort(403, 'Sadece kendi departmanınızın duyurularını düzenleyebilirsiniz.');
        }

        $data = $request->validate([
            'title'         => 'sometimes|string|max:255',
            'body'          => 'sometimes|string|max:5000',
            'department_id' => 'nullable|exists:departments,id',
            'is_active'     => 'sometimes|boolean',
            'start_date'    => 'nullable|date',
            'expires_at'    => 'nullable|date',
        ]);

        if ($user->role === 'manager') {
            unset($data['department_id']); // Müdür departmanı değiştiremez
        }

        $announcement->update($data);

        return response()->json($announcement->load(['creator:id,name', 'department:id,name']));
    }

    /**
     * Duyuruyu siler.
     */
    public function destroy(Request $request, Announcement $announcement)
    {
        $user = $request->user();
        if ($user->role === 'manager' && $announcement->department_id !== $user->personnel->department_id) {
            abort(403, 'Sadece kendi departmanınızın duyurularını silebilirsiniz.');
        }

        $announcement->delete();

        return response()->json(['message' => 'Duyuru silindi.']);
    }
}
