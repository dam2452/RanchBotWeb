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

WORKDIR /app

COPY . .

RUN mkdir -p /var/www/html/public && \
    if [ -d /app/public ]; then \
        cp -R /app/public/* /var/www/html/public/ && \
        chown -R www-data:www-data /var/www/html/public; \
    fi

RUN chown -R www-data:www-data /app

CMD ["php-fpm"]