<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    use HasFactory;

    // Kaydedilmesine izin verdiğimiz kolonlar
    protected $fillable = [
        'name',
        'slug',
        'max_days',
        'requires_document',
    ];

    // Bu izin türüne ait olan İzin Talepleri ilişkisi
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }
}
