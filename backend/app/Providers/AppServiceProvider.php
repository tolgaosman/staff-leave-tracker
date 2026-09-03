<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Auth\Notifications\ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url', 'http://localhost:3000') . "/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });

        // Giriş yapmış kullanıcılar için genel API hız sınırı (bkz. routes/api.php: 'throttle:api').
        // Kullanıcı bazlı, oturum açmamışsa IP bazlı sınırlanır.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Yıl sonu devir komutu: her 1 Ocak saat 00:05'te.
        $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
            $schedule->command('leave:carry-forward')->yearlyOn(1, 1, '00:05');
        });
    }
}
