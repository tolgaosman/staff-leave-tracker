<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    // Kaydedilmesine izin verdiğimiz alanlar
    protected $fillable = ['name'];

    // Departman ve Personel arasındaki 1'e Çoklu (1-to-Many) ilişki
    public function personnels(): HasMany
    {
        return $this->hasMany(Personnel::class);
    }
}
