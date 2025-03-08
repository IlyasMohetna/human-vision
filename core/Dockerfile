# Use PHP-FPM as the base image
FROM php:8.2-fpm

ARG WWWUSER=1000
ARG WWWGROUP=1000

# Install necessary packages
RUN apt-get update && apt-get install -y \
    libpq-dev zip unzip curl net-tools iproute2 procps lsof vim \
    && docker-php-ext-install pdo pdo_mysql

RUN groupadd --force -g $WWWGROUP core \
    && useradd -u $WWWUSER -g core -m core

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Ensure PHP-FPM listens on all addresses
RUN sed -i 's/^listen = 127.0.0.1:9000/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf
RUN sed -i 's/;error_log = log\/php-fpm.log/error_log = \/var\/log\/php-fpm.log/' /usr/local/etc/php-fpm.conf

# 🔥 Force PHP-FPM to run as 'core' instead of 'www-data'
RUN sed -i 's/^user = www-data/user = core/' /usr/local/etc/php-fpm.d/www.conf
RUN sed -i 's/^group = www-data/group = core/' /usr/local/etc/php-fpm.d/www.conf

# Set the working directory
WORKDIR /var/www

# Copy project files
COPY --chown=core:core . .

# Fix permissions on storage & cache
RUN chown -R core:core /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Copy the entrypoint script and make it executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# Set non-root user for running the container
USER core

# Start PHP-FPM
CMD ["php-fpm"]
