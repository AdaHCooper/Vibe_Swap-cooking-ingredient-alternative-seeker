"use strict";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseJsonMaybe(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in env value: ${value}`);
  }
}

async function fetchJson(url, headers) {
  const response = await fetch(url, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    const rawBody = await response.text();
    throw new Error(`Supabase request failed with ${response.status}: ${rawBody.slice(0, 300)}`);
  }

  return response.json();
}

function groupFoodRows(foodRows, aliases, cookMethods, dietaryTags, allergens) {
  const aliasesByFoodId = aliases.reduce((acc, row) => {
    acc[row.food_id] = acc[row.food_id] || [];
    acc[row.food_id].push(row.alias);
    return acc;
  }, {});

  const cookMethodsByFoodId = cookMethods.reduce((acc, row) => {
    acc[row.food_id] = acc[row.food_id] || [];
    acc[row.food_id].push(row.method);
    return acc;
  }, {});

  const dietaryTagsByFoodId = dietaryTags.reduce((acc, row) => {
    acc[row.food_id] = acc[row.food_id] || [];
    acc[row.food_id].push(row.tag);
    return acc;
  }, {});

  const allergensByFoodId = allergens.reduce((acc, row) => {
    acc[row.food_id] = acc[row.food_id] || [];
    acc[row.food_id].push(row.allergen);
    return acc;
  }, {});

  return foodRows.map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.name_en,
    aliases: aliasesByFoodId[row.id] || [],
    category: row.category,
    image: row.image,
    texture: row.texture,
    fatty: row.fatty,
    umami: row.umami,
    acidity: row.acidity,
    sweetness: row.sweetness,
    wateriness: row.wateriness,
    aroma: row.aroma,
    cookMethods: cookMethodsByFoodId[row.id] || [],
    dietaryTags: dietaryTagsByFoodId[row.id] || [],
    allergens: allergensByFoodId[row.id] || [],
    bestFor: row.best_for,
    advantage: row.advantage,
    disadvantage: row.disadvantage,
    vibeNote: row.vibe_note
  }));
}

async function loadCatalog() {
  const supabaseUrl = getRequiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseServiceKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const schema = process.env.SUPABASE_SCHEMA || "public";
  const tablePrefix = process.env.CATALOG_TABLE_PREFIX || "catalog_";

  const headers = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    Accept: "application/json",
    "Content-Profile": schema
  };

  const foodsTable = `${tablePrefix}foods`;
  const dimensionsTable = `${tablePrefix}dimensions`;
  const aliasesTable = `${tablePrefix}aliases`;
  const cookMethodsTable = `${tablePrefix}cook_methods`;
  const dietaryTagsTable = `${tablePrefix}dietary_tags`;
  const allergensTable = `${tablePrefix}allergens`;

  const base = `${supabaseUrl}/rest/v1`;
  const [foodRows, dimensionRows, aliasRows, cookMethodRows, dietaryTagRows, allergenRows] = await Promise.all([
    fetchJson(`${base}/${foodsTable}?select=*&order=id.asc`, headers),
    fetchJson(`${base}/${dimensionsTable}?select=key,label,weight&order=position.asc`, headers),
    fetchJson(`${base}/${aliasesTable}?select=food_id,alias`, headers),
    fetchJson(`${base}/${cookMethodsTable}?select=food_id,method`, headers),
    fetchJson(`${base}/${dietaryTagsTable}?select=food_id,tag`, headers),
    fetchJson(`${base}/${allergensTable}?select=food_id,allergen`, headers)
  ]);

  const foods = groupFoodRows(foodRows, aliasRows, cookMethodRows, dietaryTagRows, allergenRows);
  const dimensions = dimensionRows.map((row) => ({
    key: row.key,
    label: row.label,
    weight: row.weight
  }));

  const customSource = parseJsonMaybe(process.env.CATALOG_LOADER_META_JSON, {});

  return {
    foods,
    dimensions,
    ...customSource
  };
}

module.exports = {
  loadCatalog
};
