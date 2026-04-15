# Deploy With Supabase

## 1) Prepare Supabase tables

1. Open Supabase SQL editor.
2. Run `server/sql/catalog-schema.sql`.
3. Run seed import:
   - Generate latest seed file: `npm run seed:sql`
   - Copy and execute `server/sql/catalog-seed.sql`

## 2) Environment variables (Vercel/Netlify)

Set these exactly:

- `CATALOG_LOADER_MODULE=./server/loaders/supabase-loader.js`
- `SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`
- `SUPABASE_SCHEMA=public` (optional, default is `public`)
- `CATALOG_TABLE_PREFIX=catalog_` (optional, default is `catalog_`)

## 3) Security note

- Use `SUPABASE_SERVICE_ROLE_KEY` only on serverless backend (never in frontend files).
- Frontend only calls `/api/catalog`.

## 4) Verify after deploy

1. Open `https://<your-domain>/api/catalog`
2. Check response includes:
   - `foods` array
   - `dimensions` array
   - `source` should be `custom-loader`

## 5) Local quick test

In project root:

```bash
npm run dev:api
```

Then visit:

`http://localhost:8787/api/catalog`
