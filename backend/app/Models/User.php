<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // Yetkilendirmenin tek kaynağı
        // Profil alanları (/profile ekranından PUT /me ile güncellenir)
        'title',
        'phone',
        'birth_date',
        'location',
        'bio',
        'avatar_url',
        'emergency_name',
        'emergency_relation',
        'emergency_phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
        ];
    }

    /**
     * Bu hesaba bağlı personel kaydı (varsa). Çalışan (employee) görünümünde
     * "ben"i ve kendi izinlerini çözmek için kullanılır (bkz. GET /me).
     */
    public function personnel(): HasOne
    {
        return $this->hasOne(Personnel::class);
    }
}
