#!/bin/sh
set -e

echo "Running database migrations..."
node docker-migrate.mjs

echo "Starting server..."
exec node server.js
