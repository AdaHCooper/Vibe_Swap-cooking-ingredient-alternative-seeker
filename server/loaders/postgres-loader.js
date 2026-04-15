"use strict";

const { Pool } = require("pg");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function toMap(rows, valueKey) {
  return rows.reduce((acc, row) => {
    acc[row.food_id] = acc[row.food_id] || [];
    acc[row.food_id].push(row[valueKey]);
    return acc;
  }, {});
}

async function loadCatalog() {
  const connectionString = getRequiredEnv("POSTGRES_URL");
  const schema = process.env.POSTGRES_SCHEMA || "public";
  const tablePrefix = process.env.CATALOG_TABLE_PREFIX || "catalog_";

  const pool = new Pool({
    connectionString,
    ssl: process.env.POSTGRES_SSL === "disable" ? false : { rejectUnauthorized: false }
  });

  const foodsTable = `${schema}.${tablePrefix}foods`;
  const dimensionsTable = `${schema}.${tablePrefix}dimensions`;
  const aliasesTable = `${schema}.${tablePrefix}aliases`;
  const cookMethodsTable = `${schema}.${tablePrefix}cook_methods`;
  const dietaryTagsTable = `${schema}.${tablePrefix}dietary_tags`;
  const allergensTable = `${schema}.${tablePrefix}allergens`;

  try {
    const [
      foodsResult,
      dimensionsResult,
      aliasesResult,
      cookMethodsResult,
      dietaryTagsResult,
      allergensResult
    ] = await Promise.all([
      pool.query(`SELECT * FROM ${foodsTable} ORDER BY id ASC`),
      pool.query(`SELECT key, label, weight FROM ${dimensionsTable} ORDER BY position ASC`),
      pool.query(`SELECT food_id, alias FROM ${aliasesTable}`),
      pool.query(`SELECT food_id, method FROM ${cookMethodsTable}`),
      pool.query(`SELECT food_id, tag FROM ${dietaryTagsTable}`),
      pool.query(`SELECT food_id, allergen FROM ${allergensTable}`)
    ]);

    const aliasesByFoodId = toMap(aliasesResult.rows, "alias");
    const cookMethodsByFoodId = toMap(cookMethodsResult.rows, "method");
    const dietaryTagsByFoodId = toMap(dietaryTagsResult.rows, "tag");
    const allergensByFoodId = toMap(allergensResult.rows, "allergen");

    const foods = foodsResult.rows.map((row) => ({
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

    const dimensions = dimensionsResult.rows.map((row) => ({
      key: row.key,
      label: row.label,
      weight: row.weight
    }));

    return {
      foods,
      dimensions
    };
  } finally {
    await pool.end();
  }
}

module.exports = {
  loadCatalog
};
