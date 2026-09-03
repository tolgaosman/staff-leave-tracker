# Staff Leave Tracker API — Laravel 12 / PHP 8.2
# Demo/genel amaçlı imaj: php artisan serve ile 8000 portunda API sunar.
# (Yüksek trafik için php-fpm + nginx önerilir; bu imaj kolay taşınabilirlik içindir.)
FROM php:8.2-cli

# Sistem bağımlılıkları ve gerekli PHP eklentileri (pdo_mysql production DB için)
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev \
    && docker-php-ext-install pdo_mysql zip bcmath \
    && rm -rf /var/lib/apt/lists/*

# Composer'ı resmi imajdan al
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Önce sadece bağımlılık manifestlerini kopyala (Docker katman cache'i için)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Uygulama kodunu kopyala ve autoload'u optimize et
COPY . .
RUN composer dump-autoload --optimize \
    && cp -n .env.production.example .env || true

EXPOSE 8000

# Başlangıçta migrasyonları uygula, sonra API'yi ayağa kaldır.
# İLK kurulumda demo veri için: docker compose exec app php artisan migrate:fresh --seed
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
