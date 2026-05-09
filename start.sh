#!/bin/sh
set -e

echo "Starting delivery-backend..."

if [ -n "$DATABASE_URL" ]; then
  echo "Creating database if not exists..."

  URL_NO_PREFIX=$(echo "$DATABASE_URL" | sed 's|.*://||')
  DB_USER=$(echo "$URL_NO_PREFIX" | cut -d: -f1)
  DB_PASS=$(echo "$URL_NO_PREFIX" | cut -d: -f2 | cut -d@ -f1)
  DB_HOST=$(echo "$URL_NO_PREFIX" | sed 's|.*@||' | cut -d: -f1)
  DB_PORT=$(echo "$URL_NO_PREFIX" | sed 's|.*@||' | cut -d: -f2 | cut -d/ -f1)
  DB_NAME=$(echo "$URL_NO_PREFIX" | sed 's|.*/||' | sed 's|?.*||')

  echo "Connecting to $DB_HOST:$DB_PORT as $DB_USER..."
  PGPASSWORD="$DB_PASS" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "Database may already exist, continuing..."
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting server..."
exec node dist/server.js
