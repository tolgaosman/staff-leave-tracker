<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Giriş yapabilmemiz için test yöneticisi (Admin) oluşturuyoruz
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@test.com',
            'role' => 'super_admin',
            'title' => 'Sistem Yöneticisi',
            'phone' => '0555 999 88 77',
            'location' => 'Merkez Ofis',
            'bio' => 'Sistemin genel yönetimi ve bakımı benden sorulur.',
        ]);

        // 2. Departmanları oluşturuyoruz
        $software = Department::create(['name' => 'Bilgi İşlem']);
        $hr = Department::create(['name' => 'İnsan Kaynakları']);
        $finance = Department::create(['name' => 'Muhasebe']);
        $marketing = Department::create(['name' => 'Pazarlama']);

        // Admin için Personnel kaydı oluşturalım
        Personnel::create([
            'user_id' => $admin->id,
            'department_id' => $hr->id, // Admin genel olarak hr / yönetimde olsun
            'name' => $admin->name,
            'title' => 'Sistem Yöneticisi',
            'phone' => '0555 999 88 77',
            'status' => 'active',
            'start_date' => now()->subYears(5)->format('Y-m-d'),
            'annual_leave_balance' => 20,
            'carried_over_balance' => 5,
        ]);

        // 3. İzin Türlerini oluşturuyoruz
        // Yıllık İzin: Yılda 14 gün limitli, rapor/belge gerektirmez
        $annual = LeaveType::create(['name' => 'Yıllık İzin', 'slug' => 'annual', 'max_days' => 14, 'requires_document' => false]);
        // Mazeret İzni: Yılda 5 gün limitli, dilekçe/belge gerektirir
        $excuse = LeaveType::create(['name' => 'Mazeret İzni', 'slug' => 'excuse', 'max_days' => 5, 'requires_document' => true]);
        // Hastalık İzni: Yılda 30 gün limitli, doktor raporu gerektirir
        $sick = LeaveType::create(['name' => 'Hastalık İzni', 'slug' => 'sick', 'max_days' => 30, 'requires_document' => true]);
        // Ücretsiz İzin: Gün limiti yok, belge gerektirmez
        $unpaid = LeaveType::create(['name' => 'Ücretsiz İzin', 'slug' => 'unpaid', 'max_days' => null, 'requires_document' => false]);

        // 4. Tolga Osman Falay'ı ekliyoruz
        $tolgaUser = User::create([
            'name' => 'Tolga Osman Falay',
            'email' => 'tolgaosmanfly@gmail.com',
            'password' => '12345678',
            'role' => 'employee',
            'title' => 'Kurucu / Yazılım Geliştirici',
            'phone' => '0530 111 22 33',
            'location' => 'Ar-Ge / Merkez',
            'bio' => 'Staff Leave Tracker projesinin geliştiricisi.',
            'avatar_url' => 'https://avatars.githubusercontent.com/u/108253139?v=4', // Orjinal PP URL'si veya örnek bir avatar
        ]);
        
        $tolgaPersonnel = Personnel::create([
            'user_id' => $tolgaUser->id,
            'department_id' => $software->id, // Default to Bilgi İşlem
            'name' => $tolgaUser->name,
            'title' => 'Kurucu / Yazılım Geliştirici',
            'phone' => '0530 111 22 33',
            'status' => 'active',
            // Yeni işe başlamış bir personel. 3 ay, aşağıda oluşturulan izin
            // kayıtlarının (subMonths(2) ve subDays(10)) hepsinden önce kalacak
            // şekilde seçildi — izinler işe giriş tarihinden önce görünmesin.
            // Kıdem 1 yılın altında olduğu için yıllık hak ediş yine 14 gün
            // (bkz. LeaveRules::annualEntitlement) ve devreden bakiye doğal olarak 0.
            'start_date' => now()->subMonths(3)->format('Y-m-d'),
            'annual_leave_balance' => 14, // Elle 14 gün bakiye atıyoruz
            'avatar_url' => 'https://avatars.githubusercontent.com/u/108253139?v=4',
        ]);

        // Tolga'ya geçmişte ve şimdi izin talepleri ekleyelim
        LeaveRequest::create([
            'personnel_id' => $tolgaPersonnel->id,
            'leave_type_id' => $annual->id,
            'start_date' => now()->subMonths(2)->format('Y-m-d'),
            'end_date' => now()->subMonths(2)->addDays(5)->format('Y-m-d'),
            'total_days' => 5,
            'note' => 'Yaz tatili',
            'status' => 'approved',
            'decided_by' => $admin->id,
            'decided_at' => now()->subMonths(2)->subDays(2),
        ]);
        
        LeaveRequest::create([
            'personnel_id' => $tolgaPersonnel->id,
            'leave_type_id' => $sick->id,
            'start_date' => now()->subDays(10)->format('Y-m-d'),
            'end_date' => now()->subDays(8)->format('Y-m-d'),
            'total_days' => 3,
            'note' => 'Grip nedeniyle doktor raporu',
            'status' => 'approved',
            'decided_by' => $admin->id,
            'decided_at' => now()->subDays(10),
        ]);

        // 4.1 Leora Nader (Bilgi İşlem Müdürü)
        $leoraUser = User::create([
            'name' => 'Leora Nader',
            'email' => 'leora.nader5970@test.com',
            'password' => '12345678',
            'role' => 'manager',
            'title' => 'Bilgi İşlem Müdürü',
            'phone' => '0544 333 44 55',
            'location' => 'Plaza 1 - Kat 4',
            'bio' => 'Bilgi işlem departmanından sorumlu yönetici.',
        ]);
        
        Personnel::create([
            'user_id' => $leoraUser->id,
            'department_id' => $software->id,
            'name' => $leoraUser->name,
            'title' => 'Bilgi İşlem Müdürü',
            'phone' => '0544 333 44 55',
            'status' => 'active',
            'start_date' => now()->subYears(3)->format('Y-m-d'),
            'annual_leave_balance' => 14,
            'carried_over_balance' => 0,
        ]);

        // 4.2 Monroe Stracke (Bilgi İşlem Uzmanı)
        $monroeUser = User::create([
            'name' => 'Monroe Stracke',
            'email' => 'monroe.stracke7386@test.com',
            'password' => '12345678',
            'role' => 'employee',
            'title' => 'Bilgi İşlem Uzmanı',
            'phone' => '0533 222 11 00',
            'location' => 'Plaza 1 - Kat 4',
            'bio' => 'Sistem ve network uzmanı.',
        ]);
        
        Personnel::create([
            'user_id' => $monroeUser->id,
            'department_id' => $software->id,
            'name' => $monroeUser->name,
            'title' => 'Bilgi İşlem Uzmanı',
            'phone' => '0533 222 11 00',
            'status' => 'active',
            'start_date' => now()->subYears(2)->format('Y-m-d'),
            'annual_leave_balance' => 14,
            'carried_over_balance' => 0,
        ]);

        // 5. Örnek Personelleri oluşturuyoruz.
        $departments = collect([$software, $hr, $finance, $marketing]);
        $leaveTypes = collect([$annual, $excuse, $sick, $unpaid]);

        for ($i = 0; $i < 75; $i++) {
            $user = User::factory()->create();
            $startDate = fake()->dateTimeBetween('-5 years', '-1 month');

            // Geçen yıldan devreden izin. Yalnızca en az 1 yıllık kıdemi olana
            // verilir — çalışmadığın bir yıldan izin devredemezsin. Üst sınır
            // uygulamanın kendi kuralıyla aynı: LeaveCalculateAccruals'taki
            // CARRY_FORWARD_CAP = 5 gün.
            $hasFullYear = $startDate <= new \DateTime('-1 year');
            $carriedOver = $hasFullYear ? rand(0, 5) : 0;

            $personnel = Personnel::factory()->create([
                'user_id' => $user->id,
                'department_id' => $departments->random()->id,
                'name' => $user->name,
                'start_date' => $startDate->format('Y-m-d'),
                'annual_leave_balance' => rand(2, 14), // Kalan yıllık izin hakkı (rastgele)
                'carried_over_balance' => $carriedOver,
                'status' => fake()->randomElement(['active', 'active', 'active', 'on-leave']), // Çoğunluk aktif
            ]);

            // İşe başlama tarihinden itibaren çeşitli izinler ekleyelim
            $tenureYears = $startDate->diff(new \DateTime())->y;
            $leaveCount = rand(2, 5 + ($tenureYears * 2)); // Kıdemli çalışanlar daha çok izin kullanmış olsun

            for ($j = 0; $j < $leaveCount; $j++) {
                // Daha gerçekçi durum dağılımı (çoğu onaylanmış, azı reddedilmiş, yeniler bekliyor olabilir)
                $statusRoll = rand(1, 100);
                if ($statusRoll <= 75) {
                    $status = 'approved';
                } elseif ($statusRoll <= 90) {
                    $status = 'rejected';
                } else {
                    $status = 'pending';
                }
                
                // Daha gerçekçi izin tipi dağılımı (çoğu yıllık izin, biraz hastalık vb.)
                $typeRoll = rand(1, 100);
                if ($typeRoll <= 60) {
                    $type = $annual;
                } elseif ($typeRoll <= 80) {
                    $type = $sick;
                } elseif ($typeRoll <= 95) {
                    $type = $excuse;
                } else {
                    $type = $unpaid;
                }
                
                // İzin tarihlerini işe başlama tarihi ile şu an arasında (veya biraz gelecekte) rastgele belirleyelim
                $start = fake()->dateTimeBetween($startDate->format('Y-m-d'), '+2 months');
                
                // Bekleyen izinler genelde gelecekte veya çok yakın geçmişte olur
                if ($status === 'pending' && $start < new \DateTime('-1 month')) {
                    $start = fake()->dateTimeBetween('-1 week', '+2 months');
                }
                
                // Süre (yıllık izinler 3-14 gün, diğerleri 1-5 gün)
                $duration = ($type->id === $annual->id) ? rand(3, 14) : rand(1, 5);
                $end = (clone $start)->modify('+' . $duration . ' days');

                $decidedAt = null;
                if ($status !== 'pending') {
                    // Karar tarihi, başlangıç tarihinden önce veya en fazla 1-2 gün sonra olmalı
                    $decidedAt = (clone $start)->modify('-' . rand(1, 15) . ' days')->setTime(12, 0, 0);
                    if ($decidedAt < $startDate) {
                        $decidedAt = (clone $start)->setTime(12, 0, 0);
                    }
                }

                LeaveRequest::create([
                    'personnel_id' => $personnel->id,
                    'leave_type_id' => $type->id,
                    'start_date' => $start->format('Y-m-d'),
                    'end_date' => $end->format('Y-m-d'),
                    'total_days' => $duration + 1,
                    'note' => fake()->optional(0.7)->sentence(), // %70 ihtimalle not var
                    'status' => $status,
                    'rejection_reason' => $status === 'rejected' ? fake()->sentence() : null,
                    'decided_by' => $status !== 'pending' ? $admin->id : null,
                    'decided_at' => $decidedAt,
                ]);
            }
        }

        // 6. Örnek Duyurular
        $announcements = [
            [
                'title'         => '🎉 Yaz Tatili İzin Talepleri Başladı',
                'body'          => "Temmuz-Ağustos dönemi için yıllık izin taleplerini en geç 15 Haziran'a kadar sisteme girmeniz gerekmektedir. Geç kalan talepler onay sürecine alınamayacaktır. Detaylı bilgi için İK departmanıyla iletişime geçebilirsiniz.",
                'expires_at'    => now()->addMonths(2),
                'department_id' => null, // Global
            ],
            [
                'title'         => '📋 İK Departmanına Özel Eğitim',
                'body'          => "İnsan Kaynakları personeli için yeni puantaj yazılımı eğitimi yarın 14:00'te toplantı odasında yapılacaktır.",
                'expires_at'    => null,
                'department_id' => $hr->id, // Sadece İK'ya özel
            ],
            [
                'title'         => '🏢 Ofis Kapalı — Kurban Bayramı',
                'body'          => "Kurban Bayramı nedeniyle ofisimiz 5-9 Haziran tarihleri arasında kapalı olacaktır. Acil durumlarda yöneticinizle iletişime geçebilirsiniz.",
                'expires_at'    => now()->addWeeks(3),
                'department_id' => null, // Global
            ],
        ];

        foreach ($announcements as $a) {
            \App\Models\Announcement::create([
                ...$a,
                'created_by' => $admin->id,
                'is_active'  => true,
            ]);
        }
    }
}
