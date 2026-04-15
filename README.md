# Vibe-Swap Serverless API

This project now includes a portable serverless API endpoint: `GET /api/catalog`.

It supports:

- Vercel (`api/catalog.js`)
- Netlify (`netlify/functions/catalog.js` + `netlify.toml` rewrite)
- Pluggable server-side data loading for any cloud database

## 1) Install dependencies

```bash
npm install
```

Quick check:

```bash
npm run check:serverless
```

Local API dry run:

```bash
npm run dev:api
```

## 2) Choose one data source strategy

Copy `.env.example` to your platform env vars and choose one option:

- **Supabase direct loader**
  - `CATALOG_LOADER_MODULE=./server/loaders/supabase-loader.js`
  - `SUPABASE_URL=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
- **Postgres direct loader**
  - `CATALOG_LOADER_MODULE=./server/loaders/postgres-loader.js`
  - `POSTGRES_URL=...`
- **HTTP passthrough**
  - `CATALOG_URL=...`
  - optional `CATALOG_HEADERS_JSON=...`

When no server-side source is configured, API falls back to local `foods.js`.

## 3) Database schema

Use `server/sql/catalog-schema.sql` as baseline for both Supabase Postgres and generic Postgres.

Default table names (prefix configurable by `CATALOG_TABLE_PREFIX`):

- `catalog_foods`
- `catalog_dimensions`
- `catalog_aliases`
- `catalog_cook_methods`
- `catalog_dietary_tags`
- `catalog_allergens`

Generate seed SQL from current `foods.js`:

```bash
npm run seed:sql
```

Then import `server/sql/catalog-seed.sql` into your database.

## 4) Frontend config

`api-config.js` already points to:

```js
catalogUrl: "/api/catalog"
```

So no frontend URL rewrite is needed on Vercel/Netlify.

## 5) Platform notes

### Vercel

- Deploy as a normal project.
- Add env vars in Project Settings -> Environment Variables.
- API route is available at `/api/catalog`.

### Netlify

- `netlify.toml` already rewrites `/api/catalog` to `/.netlify/functions/catalog`.
- Add env vars in Site Settings -> Environment variables.

## 6) Direct deployment guides

- Supabase path: `docs/deploy-supabase.md`
- Postgres path: `docs/deploy-postgres.md`
- Expand to 100+ foods: `docs/expand-to-100-plus.md`

## 7) Loader contract (for any custom DB)

If you need another backend (MongoDB, DynamoDB, etc.), add a module and set:

```bash
CATALOG_LOADER_MODULE=./server/loaders/your-loader.js
```

The module should export either:

- `module.exports = async function (...) { ... }`, or
- `module.exports.loadCatalog = async function (...) { ... }`

And return:

```json
{
  "foods": [],
  "dimensions": []
}
```

Template file: `server/loaders/custom-loader.template.js`
