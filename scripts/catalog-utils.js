"use strict";

const fs = require("fs");
const path = require("path");

function resolvePathFromRoot(relativePath) {
  return path.resolve(__dirname, "..", relativePath);
}

function loadCatalogFromFile(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : resolvePathFromRoot(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Catalog file not found: ${absolutePath}`);
  }

  if (absolutePath.endsWith(".js")) {
    return require(absolutePath);
  }

  if (absolutePath.endsWith(".json")) {
    const raw = fs.readFileSync(absolutePath, "utf8");
    return JSON.parse(raw);
  }

  throw new Error(`Unsupported catalog file type: ${absolutePath}`);
}

function assertCatalogShape(catalog, label) {
  if (!catalog || !Array.isArray(catalog.foods) || !Array.isArray(catalog.dimensions)) {
    throw new Error(`${label} must contain { foods: [], dimensions: [] }`);
  }
}

function mergeCatalogs(baseCatalog, extraCatalog) {
  assertCatalogShape(baseCatalog, "baseCatalog");
  assertCatalogShape(extraCatalog, "extraCatalog");

  const foodsById = new Map(baseCatalog.foods.map((food) => [food.id, food]));

  extraCatalog.foods.forEach((food) => {
    if (!food || !food.id) {
      throw new Error("Each extra food item must include id.");
    }

    if (foodsById.has(food.id)) {
      throw new Error(`Duplicate food id found while merging: ${food.id}`);
    }

    foodsById.set(food.id, food);
  });

  const dimensions = extraCatalog.dimensions.length
    ? extraCatalog.dimensions
    : baseCatalog.dimensions;

  return {
    foods: [...foodsById.values()],
    dimensions
  };
}

module.exports = {
  loadCatalogFromFile,
  assertCatalogShape,
  mergeCatalogs,
  resolvePathFromRoot
};
