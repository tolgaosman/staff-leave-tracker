<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Personnel extends Model
{
    use HasFactory;

    // Veritabanındaki tablo adını tanımlıyoruz
    protected $table = 'personnels';

    // Kaydedilmesine izin verdiğimiz kolonlar
    protected $fillable = [
        'user_id',
        'department_id',
        'name',
        'phone',
        'status',
        'start_date',
        'avatar_url',
        'title',
        'annual_leave_balance',
        'carried_over_balance',
    ];

    protected $casts = [
        'annual_leave_balance' => 'integer',
        'carried_over_balance' => 'integer',
    ];

    // Personelin ait olduğu Departman ilişkisi
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    // Personelin bağlı olduğu Kullanıcı Hesabı ilişkisi (boş kalabilir)
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Personelin yaptığı İzin Talepleri ilişkisi
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
