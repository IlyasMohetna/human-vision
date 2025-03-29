FROM php:8.2-fpm

ARG WWWUSER=1000
ARG WWWGROUP=1000

RUN apt-get update && apt-get install -y \
    libpq-dev zip unzip curl net-tools iproute2 procps lsof vim libimage-exiftool-perl \
    supervisor \
    && docker-php-ext-install pdo pdo_mysql pcntl exif

RUN pecl install mongodb && docker-php-ext-enable mongodb

RUN groupadd --force -g $WWWGROUP core \
    && useradd -u $WWWUSER -g core -m core

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN sed -i 's/^listen = 127.0.0.1:9000/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf
RUN sed -i 's/;error_log = log\/php-fpm.log/error_log = \/var\/log\/php-fpm.log/' /usr/local/etc/php-fpm.conf

RUN sed -i 's/^user = www-data/user = core/' /usr/local/etc/php-fpm.d/www.conf
RUN sed -i 's/^group = www-data/group = core/' /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www

COPY --chown=core:core . .

RUN mkdir -p /var/log/supervisor && chown -R core:core /var/log/supervisor

RUN chown -R core:core /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER core

COPY ./supervisord.conf /etc/supervisor/conf.d

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["php-fpm"]
