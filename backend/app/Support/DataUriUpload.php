<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Base64 "data:" URI olarak gönderilen dosyaları (avatar/ek belge) doğrulayıp diske yazar.
 * Uzantı, istemcinin data URI'de beyan ettiği MIME string'inden DEĞİL, çözülmüş dosya
 * içeriğinin gerçek MIME türünden (finfo) belirlenir — böylece bir istemci "image/png"
 * etiketiyle rastgele içerik yükleyip sunucuya farklı bir uzantıyla yazdıramaz.
 */
class DataUriUpload
{
    /**
     * @param  array<string,string>  $allowedMimeExtensions  gerçek MIME türü => dosya uzantısı eşlemesi
     * @return string|null  Başarılıysa saklanan dosyanın URL'i, veri geçersiz/izin verilmeyen bir
     *                       türdeyse null (çağıran taraf bunu 422 doğrulama hatasına çevirmeli).
     */
    public static function store(string $dataUri, string $directory, array $allowedMimeExtensions): ?string
    {
        if (! preg_match('/^data:([^;]+);base64,(.+)$/', $dataUri, $matches)) {
            return null;
        }

        $decoded = base64_decode($matches[2], true);
        if ($decoded === false || $decoded === '') {
            return null;
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $realMime = $finfo->buffer($decoded);

        if (! isset($allowedMimeExtensions[$realMime])) {
            return null;
        }

        // 'public' diski BİLEREK sabit: config('filesystems.default') FILESYSTEM_DISK
        // env'inden gelir ve 'local' olduğunda dosyalar storage/app/private altına
        // düşüp servis edilemez (403) + url() göreli yol döndürür.
        $disk = Storage::disk('public');
        $fileName = $directory.'/'.\Illuminate\Support\Str::uuid().'.'.$allowedMimeExtensions[$realMime];
        $disk->put($fileName, $decoded);

        return $disk->url($fileName);
    }
}
