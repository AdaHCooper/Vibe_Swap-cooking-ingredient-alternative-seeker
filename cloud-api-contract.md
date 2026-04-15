# Vibe-Swap Cloud API Contract

## Recommended endpoint

`GET /api/catalog`

## Response shape

```json
{
  "foods": [
    {
      "id": "salmon",
      "name": "三文鱼",
      "nameEn": "Salmon",
      "aliases": ["大西洋鲑", "salmon"],
      "category": "海鲜蛋白",
      "image": "https://cdn.example.com/foods/salmon.jpg",
      "texture": "丝滑",
      "fatty": 9,
      "umami": 8,
      "acidity": 2,
      "sweetness": 1,
      "wateriness": 4,
      "aroma": 6,
      "cookMethods": ["生食", "炙烤", "拌饭"],
      "dietaryTags": ["pescatarian"],
      "allergens": ["fish"],
      "bestFor": "寿司碗、轻食沙拉、拌饭和吐司",
      "advantage": "口感高级、油脂饱满、鲜味稳定",
      "disadvantage": "价格高、保鲜要求高",
      "vibeNote": "适合提供顺滑油脂感和明显鲜味，是冷食里非常强势的主角食材。"
    }
  ],
  "dimensions": [
    { "key": "fatty", "label": "油脂感", "weight": 1.4 },
    { "key": "umami", "label": "鲜味", "weight": 1.6 },
    { "key": "acidity", "label": "酸度", "weight": 0.8 },
    { "key": "sweetness", "label": "甜感", "weight": 0.5 },
    { "key": "wateriness", "label": "含水量", "weight": 0.7 },
    { "key": "aroma", "label": "香气强度", "weight": 0.9 }
  ]
}
```

## Frontend behavior

- Frontend first requests `catalogUrl` from `api-config.js`.
- If the request succeeds, the app uses the cloud catalog directly.
- If the request fails and `fallbackToSeed` is enabled, the app loads `foods.js` as a seed fallback.

## Serverless compatibility

- Vercel route: `api/catalog.js` (same endpoint `/api/catalog`).
- Netlify route: `netlify/functions/catalog.js`, and `netlify.toml` rewrites `/api/catalog` to the function path.
- Both routes call the same shared loader in `server/catalog-service.js`.

## Data-source strategy (generic)

`server/catalog-service.js` supports a pluggable loading sequence:

1. `CATALOG_LOADER_MODULE` (custom JS module export)  
   - Use this when you want to connect any database/SDK directly (Supabase, MongoDB, Postgres, etc.).
2. `CATALOG_URL` (HTTP endpoint)  
   - Optionally pair with `CATALOG_HEADERS_JSON` for auth headers.
3. Local fallback seed (`foods.js`)  
   - Used when no server-side source is configured.

## Deployment note

- If you deploy a serverless route, keep the response shape identical to this contract.
- If you use a database service, let the API layer transform raw table rows into this payload before returning it.
