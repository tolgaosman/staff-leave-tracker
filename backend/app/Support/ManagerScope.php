<?php

namespace App\Support;

use App\Models\User;

/**
 * "manager" rolündeki kullanıcıların yalnızca kendi departmanlarını görebilmesi kuralını
 * tek bir yerden çözer. Aynı departman-kısıtlama mantığı önceden PersonnelController,
 * LeaveRequestController, DashboardController ve ReportController içinde ayrı ayrı
 * (kopyala-yapıştır) uygulanıyordu; buradaki tek kaynak, yeni bir uçta kısıtlamanın
 * unutulma riskini azaltır.
 */
class ManagerScope
{
    /**
     * Bir "manager" için erişimin sınırlanacağı departman id'sini döndürür.
     *
     * - Kullanıcı manager değilse: null (kısıtlama yok).
     * - Kullanıcı manager ama kendisine bağlı bir Personnel kaydı yoksa: false
     *   (hiçbir şeye erişemez — çağıran taraf sonucu boş küme ile eşlemelidir).
     * - Kullanıcı manager ve bağlı bir Personnel kaydı varsa: o kaydın department_id'si.
     *
     * @return int|false|null
     */
    public static function departmentIdFor(User $user)
    {
        if ($user->role !== 'manager') {
            return null;
        }

        return $user->personnel?->department_id ?? false;
    }
}
