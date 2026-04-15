"use strict";

const fs = require("fs");
const path = require("path");
const {
  loadCatalogFromFile,
  mergeCatalogs,
  resolvePathFromRoot
} = require("./catalog-utils");

function main() {
  const extraPathArg = process.argv[2] || "data/catalog-extra.json";
  const outputPathArg = process.argv[3] || "data/catalog-expanded.json";

  const baseCatalog = loadCatalogFromFile("foods.js");
  const extraCatalog = loadCatalogFromFile(extraPathArg);
  const mergedCatalog = mergeCatalogs(baseCatalog, extraCatalog);

  const outputPath = path.isAbsolute(outputPathArg)
    ? outputPathArg
    : resolvePathFromRoot(outputPathArg);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(mergedCatalog, null, 2)}\n`, "utf8");

  console.log(`Base foods: ${baseCatalog.foods.length}`);
  console.log(`Extra foods: ${extraCatalog.foods.length}`);
  console.log(`Merged foods: ${mergedCatalog.foods.length}`);
  console.log(`Expanded catalog written to: ${outputPath}`);
}

main();
