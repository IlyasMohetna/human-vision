#!/bin/sh
set -e

# If node_modules does not exist, run npm install
if [ ! -d "node_modules" ]; then
  echo "node_modules directory not found. Running npm install..."
  npm install
fi

# Execute the CMD passed in the Dockerfile
exec "$@"