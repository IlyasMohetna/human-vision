#!/bin/sh
set -e

if [ ! -d vendor ]; then
  echo "Vendor directory not found. Installing Composer dependencies..."
  composer install
fi

exec "$@"
