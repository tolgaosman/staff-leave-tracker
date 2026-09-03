<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Support\DataUriUpload;
use App\Support\LeaveRules;
use App\Support\ManagerScope;
use App\Support\WorkingDays;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LeaveRequestController extends Controller
{
    /**
     * Ek belge olarak yüklenmesine izin verilen gerçek MIME türleri => dosya uzantısı.
     */
    private const ALLOWED_ATTACHMENT_MIME_EXTENSIONS = [
        'application/pdf' => 'pdf',
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
    ];

    /**
     * Tüm izin taleplerini listeler.
     */
    public function index()
    {
        // Talepleri personel, departman ve izin türü ilişkileriyle birlikte çekiyoruz
        $user = request()->user();

        $query = LeaveRequest::with(['personnel.department', 'leaveType', 'decidedBy']);

        $deptId = ManagerScope::departmentIdFor($user);
        if ($deptId === false) {
            $query->where('id', 0); // manager'a bağlı personel kaydı yok — hiçbir şey görmesin
        } elseif ($deptId !== null) {
            $query->whereHas('personnel', fn ($q) => $q->where('department_id', $deptId));
        }

        $requests = $query->get();

        return response()->json($requests);
    }

    /**
     * Yeni bir izin talebi oluşturur.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'personnel_id' => 'required|exists:personnels,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:1000',
            'total_days' => 'nullable|integer',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB
            'attachment_url' => 'nullable|string',
            'status' => 'nullable|string|in:pending,approved',
        ]);

        // Yönetici olmayan bir kullanıcı yalnızca KENDİ personel kaydı için talep
        // oluşturabilir — istemcinin gönderdiği personnel_id ne olursa olsun,
        // kendi hesabına bağlı personele sabitlenir (başkası adına talep açılamaz).
        $actor = $request->user();
        $ownPersonnel = null;
        if (! in_array($actor->role, ['super_admin', 'hr_admin'])) {
            $ownPersonnel = $actor->personnel;
            if (! $ownPersonnel) {
                return response()->json([
                    'message' => 'Hesabınıza bağlı bir personel kaydı bulunamadı.',
                ], 422);
            }
            $data['personnel_id'] = $ownPersonnel->id;
        }

        // Eğer toplam gün gönderilmediyse, iş günlerini (hafta sonu + resmi tatiller hariç) otomatik hesapla
        if (empty($data['total_days'])) {
            $data['total_days'] = WorkingDays::count($data['start_date'], $data['end_date']);
        }

        if ($request->hasFile('attachment')) {
            // 'public' diski BİLEREK sabit — bkz. DataUriUpload::store().
            // config('filesystems.default') 'local' olduğunda dosya storage/app/private
            // altına düşer (403) ve url() mutlak değil göreli yol döndürür.
            $path = $request->file('attachment')->store('attachments', 'public');
            $data['attachment_url'] = Storage::disk('public')->url($path);
            // Diskteki ad hash'lendiği için okunabilir değil; kullanıcıya
            // göstermek üzere özgün dosya adını ayrıca saklıyoruz. İstemciden
            // geldiği için yalnızca dosya adını alıp uzunluğunu sınırlıyoruz.
            $data['attachment_name'] = mb_substr(
                basename($request->file('attachment')->getClientOriginalName()),
                0,
                255
            );
        } elseif (!empty($data['attachment_url']) && str_starts_with($data['attachment_url'], 'data:')) {
            $url = DataUriUpload::store($data['attachment_url'], 'attachments', self::ALLOWED_ATTACHMENT_MIME_EXTENSIONS);
            if ($url === null) {
                return response()->json(['message' => 'Geçersiz veya desteklenmeyen belge türü. Sadece PDF/JPEG/PNG kabul edilir.'], 422);
            }
            $data['attachment_url'] = $url;
        }

        // Sunucu tarafı kurallar: çakışma, zorunlu belge, yıllık izin bakiyesi.
        // Frontend'deki aynı kontrollerin doğrudan API çağrılarıyla atlanmasını önler.
        $personnel = $ownPersonnel ?? Personnel::findOrFail($data['personnel_id']);
        $leaveType = LeaveType::findOrFail($data['leave_type_id']);
        $error = LeaveRules::validateNewRequest(
            $personnel,
            $leaveType,
            $data['start_date'],
            $data['end_date'],
            $data['total_days'],
            $data['attachment_url'] ?? null
        );
        if ($error) {
            return response()->json(['message' => $error], 422);
        }

        $requestedStatus = $request->input('status', 'pending');
        if (in_array($requestedStatus, ['approved', 'pending']) && in_array($actor->role, ['super_admin', 'hr_admin', 'manager'])) {
            $data['status'] = $requestedStatus;
        } else {
            $data['status'] = 'pending';
        }

        if ($data['status'] === 'approved') {
            $data['decided_by'] = $actor->id;
            $data['decided_at'] = now();
        }

        $leaveRequest = LeaveRequest::create($data);

        // Talep doğrudan "onaylı" oluşturulduysa bakiyeden şimdi düş.
        // (Yeni kayıt olduğu için burada çift düşme riski yok.)
        if ($leaveRequest->status === 'approved' && $leaveType->slug === 'annual') {
            LeaveRules::deductAnnual($personnel, (int) $data['total_days']);
        }

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']), 201);
    }

    /**
     * Tek bir izin talebinin detayını gösterir.
     */
    public function show(LeaveRequest $leaveRequest)
    {
        $user = request()->user();
        
        // Eğer kullanıcı super_admin veya hr_admin değilse, kısıtlamalar uygulanır
        if (!in_array($user->role, ['super_admin', 'hr_admin'])) {
            if ($user->role === 'employee') {
                // Çalışanlar SADECE kendi izin taleplerini görebilir
                if (!$user->personnel || $leaveRequest->personnel_id !== $user->personnel->id) {
                    abort(403, 'Sadece kendi izin taleplerinizi görüntüleyebilirsiniz.');
                }
            } elseif ($user->role === 'manager') {
                // Müdürler kendi izinlerini VEYA kendi departmanlarındaki çalışanların izinlerini görebilir
                if (!$user->personnel || 
                    ($leaveRequest->personnel_id !== $user->personnel->id && 
                     $leaveRequest->personnel->department_id !== $user->personnel->department_id)) {
                    abort(403, 'Sadece kendi departmanınızdaki izin taleplerini görüntüleyebilirsiniz.');
                }
            }
        }

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']));
    }

    /**
     * İzin talebini günceller.
     */
    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        $isOwner = $user->personnel && $leaveRequest->personnel_id === $user->personnel->id;
        $isAdmin = in_array($user->role, ['super_admin', 'hr_admin']);
        $isManager = $user->role === 'manager';
        
        $targetUserRole = $leaveRequest->personnel->user ? $leaveRequest->personnel->user->role : 'employee';
        $targetIsEmployee = $targetUserRole === 'employee';
        $targetIsManager = $targetUserRole === 'manager';
        
        $canEdit = false;
        
        if ($isOwner && $leaveRequest->status === 'pending') {
            $canEdit = true;
        } elseif ($leaveRequest->status === 'approved') {
            if ($isAdmin && ($targetIsManager || $targetIsEmployee)) {
                $canEdit = true;
            } elseif ($isManager && $targetIsEmployee && $user->personnel && $leaveRequest->personnel->department_id === $user->personnel->department_id) {
                $canEdit = true;
            }
        }
        
        if (!$canEdit) {
            abort(403, 'Sadece kendi bekleyen izin taleplerinizi veya yetkiniz dahilindeki onaylanmış izinleri güncelleyebilirsiniz.');
        }

        $data = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:1000',
            'total_days' => 'nullable|integer',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB
            'attachment_url' => 'nullable|string',
        ]);

        if (empty($data['total_days'])) {
            $data['total_days'] = WorkingDays::count($data['start_date'], $data['end_date']);
        }

        if ($request->hasFile('attachment')) {
            // 'public' diski BİLEREK sabit — bkz. DataUriUpload::store().
            // config('filesystems.default') 'local' olduğunda dosya storage/app/private
            // altına düşer (403) ve url() mutlak değil göreli yol döndürür.
            $path = $request->file('attachment')->store('attachments', 'public');
            $data['attachment_url'] = Storage::disk('public')->url($path);
            // Diskteki ad hash'lendiği için okunabilir değil; kullanıcıya
            // göstermek üzere özgün dosya adını ayrıca saklıyoruz. İstemciden
            // geldiği için yalnızca dosya adını alıp uzunluğunu sınırlıyoruz.
            $data['attachment_name'] = mb_substr(
                basename($request->file('attachment')->getClientOriginalName()),
                0,
                255
            );
        } elseif (!empty($data['attachment_url']) && str_starts_with($data['attachment_url'], 'data:')) {
            $url = DataUriUpload::store($data['attachment_url'], 'attachments', self::ALLOWED_ATTACHMENT_MIME_EXTENSIONS);
            if ($url === null) {
                return response()->json(['message' => 'Geçersiz veya desteklenmeyen belge türü. Sadece PDF/JPEG/PNG kabul edilir.'], 422);
            }
            $data['attachment_url'] = $url;
        }

        // Onaylı bir yıllık iznin süresi değiştiyse bakiyeyi yeniden dengele:
        // eski gün sayısını iade edip yenisini düş. Aksi halde tarih düzenlemesi
        // bakiyeyi sessizce kaydırır.
        $wasApprovedAnnual = $leaveRequest->status === 'approved'
            && $leaveRequest->leaveType->slug === 'annual';
        $oldDays = (int) $leaveRequest->total_days;

        $leaveRequest->update($data);

        if ($wasApprovedAnnual) {
            $newDays = (int) $leaveRequest->fresh()->total_days;
            if ($newDays !== $oldDays) {
                $personnel = $leaveRequest->personnel;
                LeaveRules::refundAnnual($personnel, $oldDays);
                LeaveRules::deductAnnual($personnel, $newDays);
            }
        }

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']));
    }

    /**
     * İzin talebini siler.
     */
    public function destroy(LeaveRequest $leaveRequest)
    {
        $user = request()->user();
        if ($user->role === 'manager' && $user->personnel) {
            if ($leaveRequest->personnel_id === $user->personnel->id) {
                abort(403, 'Kendi izin taleplerinizi silemezsiniz.');
            }
            if ($leaveRequest->personnel->department_id !== $user->personnel->department_id) {
                abort(403, 'Sadece kendi departmanınızdaki talepleri silebilirsiniz.');
            }
        }

        if ($leaveRequest->status === 'approved' && $leaveRequest->leaveType->slug === 'annual') {
            LeaveRules::refundAnnual($leaveRequest->personnel, (int) $leaveRequest->total_days);
        }

        $leaveRequest->delete();

        return response()->json(['message' => 'İzin talebi başarıyla silindi.']);
    }

    /**
     * Kullanıcının KENDİ bekleyen izin talebini iptal etmesi (geri çekmesi).
     *
     * destroy()'dan ayrı bir uç nokta: destroy() yöneticilere özeldir ve
     * onaylı izinlerde bakiye iadesi yapar. Onu çalışanlara açmak, rotayı
     * admin middleware grubundan çıkarmayı gerektirirdi ve bir hata durumunda
     * çalışanın başkasının ya da onaylanmış bir talebi silmesine kapı aralardı.
     *
     * Bakiyeye dokunulmuyor: bekleyen talep hiç düşülmemiş olur (LeaveRules::
     * deductAnnual yalnızca onayda çalışır), kalan gün hesabı bekleyeni zaten
     * dinamik olarak çıkarır. Kaydı silmek yeterli.
     */
    public function cancel(Request $request, LeaveRequest $leaveRequest)
    {
        $personnel = $request->user()->personnel;

        if (! $personnel) {
            abort(403, 'Hesabınıza bağlı bir personel kaydı bulunamadı.');
        }

        if ($leaveRequest->personnel_id !== $personnel->id) {
            abort(403, 'Sadece kendi izin talebinizi iptal edebilirsiniz.');
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(
                ['message' => 'Yalnızca onay bekleyen talepler iptal edilebilir.'],
                422
            );
        }

        $leaveRequest->delete();

        return response()->json(['message' => 'İzin talebiniz iptal edildi.']);
    }

    /**
     * İzin talebini onaylar.
     */
    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if ($user->role === 'manager' && $user->personnel) {
            if ($leaveRequest->personnel->department_id !== $user->personnel->department_id) {
                abort(403, 'Sadece kendi departmanınızdaki talepleri onaylayabilirsiniz.');
            }
        }

        if ($leaveRequest->personnel->user && $leaveRequest->personnel->user->role === 'manager') {
            if ($user->role !== 'super_admin') {
                abort(403, 'Departman müdürlerinin izin taleplerini sadece Sistem Yöneticisi onaylayabilir.');
            }
        }

        // Bakiyeyi DEĞİŞTİRMEDEN ÖNCE önceki durumu yakala: zaten onaylı bir
        // talep tekrar onaylanırsa günler ikinci kez düşülmemeli (idempotent).
        $wasApproved = $leaveRequest->status === 'approved';

        $leaveRequest->update([
            'status' => 'approved',
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        if (! $wasApproved && $leaveRequest->leaveType->slug === 'annual') {
            LeaveRules::deductAnnual($leaveRequest->personnel, (int) $leaveRequest->total_days);
        }

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']));
    }

    /**
     * Belirli bir izin talebiyle çakışan, aynı departmandaki diğer talepleri döndürür.
     * Onay ekranında yönetici için uyarı göstermekte kullanılır.
     */
    public function conflicts(Request $request, LeaveRequest $leaveRequest)
    {
        $deptId = $leaveRequest->personnel->department_id;

        $conflicts = LeaveRequest::with(['personnel'])
            ->whereHas('personnel', fn ($q) => $q->where('department_id', $deptId))
            ->where('id', '!=', $leaveRequest->id)
            ->whereIn('status', ['approved', 'pending'])
            ->where('start_date', '<=', $leaveRequest->end_date)
            ->where('end_date', '>=', $leaveRequest->start_date)
            ->get()
            ->map(fn ($r) => [
                'id'            => $r->id,
                'personnel_name' => $r->personnel->name ?? 'Bilinmeyen',
                'start_date'    => $r->start_date,
                'end_date'      => $r->end_date,
                'status'        => $r->status,
            ]);

        return response()->json($conflicts);
    }

    /**
     * İzin talebini reddeder (Gerekçe ile birlikte).
     */
    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if ($user->role === 'manager' && $user->personnel) {
            if ($leaveRequest->personnel->department_id !== $user->personnel->department_id) {
                abort(403, 'Sadece kendi departmanınızdaki talepleri reddedebilirsiniz.');
            }
        }

        if ($leaveRequest->personnel->user && $leaveRequest->personnel->user->role === 'manager') {
            if ($user->role !== 'super_admin') {
                abort(403, 'Departman müdürlerinin izin taleplerini sadece Sistem Yöneticisi reddedebilir.');
            }
        }

        $data = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        // Önceden onaylanmış bir yıllık izin reddediliyorsa düşülen günleri
        // iade et — aksi halde günler kalıcı olarak kaybolur (pending() ile aynı desen).
        $wasApproved = $leaveRequest->status === 'approved';

        $leaveRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);

        if ($wasApproved && $leaveRequest->leaveType->slug === 'annual') {
            LeaveRules::refundAnnual($leaveRequest->personnel, (int) $leaveRequest->total_days);
        }

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']));
    }

    /**
     * İzin talebini tekrar "bekliyor" (pending) durumuna çeker.
     */
    public function pending(Request $request, LeaveRequest $leaveRequest)
    {
        $user = $request->user();
        
        if ($user->role === 'manager' && $user->personnel) {
            if ($leaveRequest->personnel->department_id !== $user->personnel->department_id) {
                abort(403, 'Sadece kendi departmanınızdaki talepleri güncelleyebilirsiniz.');
            }
        }

        if ($leaveRequest->personnel->user && $leaveRequest->personnel->user->role === 'manager') {
            if ($user->role !== 'super_admin') {
                abort(403, 'Departman müdürlerinin izin taleplerini sadece Sistem Yöneticisi değiştirebilir.');
            }
        }

        // Eğer daha önce onaylanmış bir yıllık izin ise, düşülen günleri iade et
        if ($leaveRequest->status === 'approved' && $leaveRequest->leaveType->slug === 'annual') {
            LeaveRules::refundAnnual($leaveRequest->personnel, (int) $leaveRequest->total_days);
        }

        $leaveRequest->update([
            'status' => 'pending',
            'rejection_reason' => null,
            'decided_by' => null,
            'decided_at' => null,
        ]);

        return response()->json($leaveRequest->load(['personnel', 'leaveType', 'decidedBy']));
    }
}
