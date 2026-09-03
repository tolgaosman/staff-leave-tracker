# Personel İzin Takip Sistemi

Next.js frontend + Laravel API backend, tek repoda.

- [`frontend/`](frontend/) — Next.js 16 (App Router), TypeScript, shadcn/ui. Detaylar: [frontend/README.md](frontend/README.md)
- [`backend/`](backend/) — Laravel 12 + Sanctum, token tabanlı JSON API. Detaylar: [backend/README.md](backend/README.md)

## Yerel geliştirme

**Backend** (`backend/`):

```bash
composer install
cp .env.example .env
php artisan key:generate
# .env içinde DB_CONNECTION=mysql, DB_HOST=127.0.0.1, DB_PORT=3306,
# DB_DATABASE=staff_leave_tracker, DB_USERNAME=root olacak şekilde ayarla
# (XAMPP MySQL çalışıyor olmalı), veritabanını oluştur, sonra:
php artisan migrate:fresh --seed
php artisan serve
# `php artisan serve` bu makinede port dinlemede başarısız olursa yerine:
php -S 127.0.0.1:8000 -t public
```

API `http://localhost:8000` üzerinde ayağa kalkar. Seed hesapları: admin
`admin@test.com` / `password`; örnek çalışanlar `ahmet@test.com`,
`mehmet@test.com`, `ayse@test.com` (hepsi `password`).

**Frontend** (`frontend/`):

```bash
npm install
# frontend/.env.local içine: NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

Site `http://localhost:3000` üzerinde ayağa kalkar ve backend'e bağlanır.
