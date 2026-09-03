<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasFactory;

    // Kaydedilmesine izin verdiğimiz kolonlar
    protected $fillable = [
        'personnel_id',
        'leave_type_id',
        'start_date',
        'end_date',
        'total_days',
        'note',
        'status',
        'rejection_reason',
        'decided_by',
        'decided_at',
        'attachment_url',
        'attachment_name',
    ];

    // Tarih alanlarının doğru formatta işlenmesini sağlar
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'decided_at' => 'datetime',
        ];
    }

    // İznin ait olduğu Personel ilişkisi
    public function personnel(): BelongsTo
    {
        return $this->belongsTo(Personnel::class);
    }

    // İznin ait olduğu İzin Türü ilişkisi
    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    // İznin kararını veren Yönetici ilişkisi (decided_by kolonu üzerinden users tablosuna bağlanır)
    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    /**
     * Tam URL döndürmek için attachment_url Accessor'ı.
     */
    protected function attachmentUrl(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: function (?string $value) {
                if (!$value) return null;
                if (str_starts_with($value, 'http') || str_starts_with($value, 'data:')) {
                    return $value;
                }
                return url('storage/' . $value);
            },
        );
    }
}
