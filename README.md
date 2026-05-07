# Logistics Backend (Express + Prisma + PostgreSQL)

## Requirements

- Node.js
- npm
- Local PostgreSQL (no Docker)

## Database setup

```bash
psql -U postgres
CREATE DATABASE delivery_db;
```

## Environment setup

Copy `.env.example` to `.env` and adjust values as needed.

## Install

```bash
npm install
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Validate Prisma schema

```bash
npx prisma validate
```

## Migrate

```bash
npx prisma migrate dev --name init
```

## Seed

```bash
npm run seed
```

Seeded users (password for all: `Password123!`):

- Admin: `admin@example.com` / `+251900000001`
- Staff: `staff@example.com` / `+251900000002`
- Driver: `driver@example.com` / `+251900000003`
- Customer: `customer@example.com` / `+251900000004`

## Start dev

```bash
npm run dev
```

## Test health

```bash
curl http://localhost:4000/health
```

## API docs

See `docs/API.md` for a full list of routes, inputs, roles, and Postman-ready examples.

## Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"admin@example.com","password":"Password123!"}'
```

