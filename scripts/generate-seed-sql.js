"use strict";

const fs = require("fs");
const path = require("path");
const { loadCatalogFromFile, assertCatalogShape } = require("./catalog-utils");

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }
  return String(value);
}

function renderInsert(table, columns, rows) {
  if (!rows.length) {
    return "";
  }

  const valueLines = rows.map((row) => `(${row.join(", ")})`).join(",\n");
  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${valueLines};\n`;
}

function buildSql(catalog) {
  assertCatalogShape(catalog, "catalog");
  const lines = [];
  lines.push("-- Auto-generated seed SQL");
  lines.push("BEGIN;");
  lines.push("TRUNCATE TABLE catalog_aliases, catalog_cook_methods, catalog_dietary_tags, catalog_allergens, catalog_foods, catalog_dimensions RESTART IDENTITY CASCADE;");

  const foodRows = catalog.foods.map((food) => ([
    sqlString(food.id),
    sqlString(food.name),
    sqlString(food.nameEn),
    sqlString(food.category),
    sqlString(food.image),
    sqlString(food.texture),
    sqlNumber(food.fatty),
    sqlNumber(food.umami),
    sqlNumber(food.acidity),
    sqlNumber(food.sweetness),
    sqlNumber(food.wateriness),
    sqlNumber(food.aroma),
    sqlString(food.bestFor),
    sqlString(food.advantage),
    sqlString(food.disadvantage),
    sqlString(food.vibeNote)
  ]));

  lines.push(renderInsert("catalog_foods", [
    "id", "name", "name_en", "category", "image", "texture",
    "fatty", "umami", "acidity", "sweetness", "wateriness", "aroma",
    "best_for", "advantage", "disadvantage", "vibe_note"
  ], foodRows));

  const aliasRows = [];
  const cookMethodRows = [];
  const dietaryTagRows = [];
  const allergenRows = [];

  catalog.foods.forEach((food) => {
    (food.aliases || []).forEach((alias) => aliasRows.push([sqlString(food.id), sqlString(alias)]));
    (food.cookMethods || []).forEach((method) => cookMethodRows.push([sqlString(food.id), sqlString(method)]));
    (food.dietaryTags || []).forEach((tag) => dietaryTagRows.push([sqlString(food.id), sqlString(tag)]));
    (food.allergens || []).forEach((allergen) => allergenRows.push([sqlString(food.id), sqlString(allergen)]));
  });

  lines.push(renderInsert("catalog_aliases", ["food_id", "alias"], aliasRows));
  lines.push(renderInsert("catalog_cook_methods", ["food_id", "method"], cookMethodRows));
  lines.push(renderInsert("catalog_dietary_tags", ["food_id", "tag"], dietaryTagRows));
  lines.push(renderInsert("catalog_allergens", ["food_id", "allergen"], allergenRows));

  const dimensionRows = catalog.dimensions.map((dimension, idx) => ([
    sqlString(dimension.key),
    sqlString(dimension.label),
    sqlNumber(dimension.weight),
    sqlNumber(idx + 1)
  ]));
  lines.push(renderInsert("catalog_dimensions", ["key", "label", "weight", "position"], dimensionRows));

  lines.push("COMMIT;");
  return lines.filter(Boolean).join("\n");
}

function main() {
  const inputPathArg = process.argv[2];
  const sourcePath = inputPathArg || process.env.CATALOG_INPUT_PATH || "foods.js";
  const catalog = loadCatalogFromFile(sourcePath);
  const outputPath = path.join(__dirname, "..", "server", "sql", "catalog-seed.sql");
  const sql = buildSql(catalog);
  fs.writeFileSync(outputPath, sql, "utf8");
  console.log(`Generated seed SQL: ${outputPath}`);
  console.log(`Source catalog: ${sourcePath}`);
  console.log(`Foods count: ${catalog.foods.length}`);
}

main();
