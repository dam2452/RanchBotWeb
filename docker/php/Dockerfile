FROM php:8.3.20-fpm-alpine3.20

ENV RUN_DEPS \
    zlib \
    libzip \
    libpng \
    libjpeg-turbo \
    postgresql-libs

ENV BUILD_DEPS \
    zlib-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    postgresql-dev

ENV PHP_EXTENSIONS \
    opcache \
    zip \
    gd \
    bcmath \
    pgsql \
    pdo_pgsql

RUN apk add --no-cache --virtual .build-deps $BUILD_DEPS \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install -j "$(nproc)" $PHP_EXTENSIONS \
    && apk del .build-deps

RUN apk add --no-cache --virtual .run-deps $RUN_DEPS

RUN echo 'memory_limit = -1' >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini;

# Ustaw katalog roboczy przed kopiowaniem
WORKDIR /app

# Skopiuj kod aplikacji
COPY . .

# --- DODANY KROK ---
# Utwórz katalog na pliki publiczne wewnątrz obrazu (tam, gdzie PHP-FPM je umieści)
# i skopiuj tam zawartość z /app/public (lub innego Twojego publicznego folderu).
# Ten katalog /var/www/html/public będzie potem zamapowany na wolumen php_public_assets,
# z którego Caddy będzie serwował pliki statyczne.
# Zakładamy, że Twój folder publiczny w projekcie to 'public'. Jeśli jest inny, zmień '/app/public'.
RUN mkdir -p /var/www/html/public && \
    if [ -d /app/public ]; then \
        cp -R /app/public/* /var/www/html/public/ && \
        chown -R www-data:www-data /var/www/html/public; \
    fi
# --- KONIEC DODANEGO KROKU ---

# Upewnij się, że użytkownik www-data ma odpowiednie uprawnienia do katalogu aplikacji,
# jeśli PHP-FPM działa jako ten użytkownik (co jest domyślne dla obrazów alpine).
RUN chown -R www-data:www-data /app

# VOLUME ["/app"] # Ta linia jest opcjonalna, jeśli zarządzasz wolumenami w docker-compose.yml

CMD ["php-fpm"]