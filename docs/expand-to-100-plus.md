# Expand Catalog To 100+

Goal: keep `foods.js` as base (37 items), add many new foods in `data/catalog-extra.json`, then generate one SQL seed for Supabase.

## 1) Prepare extra foods file

1. Copy structure from `data/catalog-extra.template.json`
2. Fill new foods into `data/catalog-extra.json`
3. Keep unique `id` for each new food

Or auto-generate a draft set (120 total target):

```bash
npm run catalog:generate-extra
```

You only need to fill:

- `foods`: new items
- `dimensions`: keep `[]` (reuse base dimensions)

## 2) Build expanded catalog JSON

```bash
npm run catalog:build
```

This writes:

`data/catalog-expanded.json`

## 3) Generate SQL from expanded catalog

```bash
npm run seed:sql:expanded
```

This overwrites:

`server/sql/catalog-seed.sql`

## 4) Import to Supabase

In SQL Editor:

1. Run `server/sql/catalog-schema.sql` (once)
2. Run new `server/sql/catalog-seed.sql`

## 5) Verify

After deploy, check:

`/api/catalog`

And verify:

- `source` is `custom-loader`
- `foods.length` is greater than 100
