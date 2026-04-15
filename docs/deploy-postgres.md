# Deploy With Postgres

## 1) Prepare database schema

1. Connect to your Postgres instance.
2. Run `server/sql/catalog-schema.sql`.
3. Import seed data:
   - Generate latest seed file: `npm run seed:sql`
   - Execute `server/sql/catalog-seed.sql`

## 2) Environment variables (Vercel/Netlify)

Set these exactly:

- `CATALOG_LOADER_MODULE=./server/loaders/postgres-loader.js`
- `POSTGRES_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME`
- `POSTGRES_SCHEMA=public` (optional, default is `public`)
- `POSTGRES_SSL=require` (optional; set `disable` if your DB is local/trusted network)
- `CATALOG_TABLE_PREFIX=catalog_` (optional, default is `catalog_`)

## 3) Verify after deploy

1. Open `https://<your-domain>/api/catalog`
2. Check response includes:
   - `foods` array
   - `dimensions` array
   - `source` should be `custom-loader`

## 4) Local quick test

In project root:

```bash
npm run dev:api
```

Then visit:

`http://localhost:8787/api/catalog`
