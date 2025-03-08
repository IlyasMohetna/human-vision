#!/bin/sh
set -e

if [ ! -d vendor ]; then
  echo "Vendor directory not found. Installing Composer dependencies..."
  composer install
  cp .env.example .env
  php artisan key:generate
  php artisan migrate
  php artisan db:seed
fi

exec "$@"
