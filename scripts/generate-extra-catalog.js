"use strict";

const fs = require("fs");
const path = require("path");
const baseCatalog = require("../foods.js");

const targetCount = Number(process.argv[2] || 120);
const outputPath = path.resolve(__dirname, "..", "data", "catalog-extra.json");

const textureVariants = ["丝滑", "绵密", "软嫩", "紧实", "弹嫩", "柔嫩", "浓滑", "脆爽"];
const methodVariants = ["煎制", "炖煮", "凉拌", "焗烤", "快炒", "拌饭", "夹馅", "调酱"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function tweakMetric(value, offset) {
  return clamp(Math.round(value + offset), 0, 10);
}

function uniqueArray(items) {
  return [...new Set(items.filter(Boolean))];
}

function buildVariant(baseFood, index) {
  const cycle = index % 5;
  const fattyOffset = [-1, 0, 1, -2, 2][cycle];
  const umamiOffset = [1, -1, 0, 2, -2][cycle];
  const acidityOffset = [0, 1, -1, 0, 1][cycle];
  const sweetnessOffset = [0, 0, 1, -1, 1][cycle];
  const waterinessOffset = [1, -1, 0, 1, -1][cycle];
  const aromaOffset = [0, 1, -1, 2, -2][cycle];

  const variantNo = index + 1;
  const variantTag = `扩展款${variantNo}`;
  const newId = `${baseFood.id}-x${variantNo}`;
  const newName = `${baseFood.name}${variantTag}`;
  const newNameEn = `${baseFood.nameEn} Variant ${variantNo}`;

  return {
    id: newId,
    name: newName,
    nameEn: newNameEn,
    aliases: uniqueArray([...(baseFood.aliases || []), `${baseFood.name}${variantNo}`, `variant-${variantNo}`]),
    category: baseFood.category,
    image: baseFood.image,
    texture: textureVariants[(variantNo + (baseFood.texture || "").length) % textureVariants.length] || baseFood.texture,
    fatty: tweakMetric(baseFood.fatty, fattyOffset),
    umami: tweakMetric(baseFood.umami, umamiOffset),
    acidity: tweakMetric(baseFood.acidity, acidityOffset),
    sweetness: tweakMetric(baseFood.sweetness, sweetnessOffset),
    wateriness: tweakMetric(baseFood.wateriness, waterinessOffset),
    aroma: tweakMetric(baseFood.aroma, aromaOffset),
    cookMethods: uniqueArray([...(baseFood.cookMethods || []), methodVariants[variantNo % methodVariants.length]]).slice(0, 4),
    dietaryTags: uniqueArray(baseFood.dietaryTags || []),
    allergens: uniqueArray(baseFood.allergens || []),
    bestFor: `${baseFood.bestFor}（${variantTag}）`,
    advantage: `${baseFood.advantage}，更适合做结构替代测试。`,
    disadvantage: `${baseFood.disadvantage}，风味表现会有轻微偏移。`,
    vibeNote: `${baseFood.vibeNote} 该版本用于扩展样本库，保持核心定位并加入小幅结构变化。`
  };
}

function main() {
  const baseFoods = baseCatalog.foods;
  const neededExtra = Math.max(0, targetCount - baseFoods.length);

  const generated = [];
  for (let i = 0; i < neededExtra; i += 1) {
    const source = baseFoods[i % baseFoods.length];
    generated.push(buildVariant(source, i));
  }

  const extraCatalog = {
    foods: generated,
    dimensions: []
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(extraCatalog, null, 2)}\n`, "utf8");

  console.log(`Base foods: ${baseFoods.length}`);
  console.log(`Generated extra foods: ${generated.length}`);
  console.log(`Projected total foods: ${baseFoods.length + generated.length}`);
  console.log(`Written: ${outputPath}`);
}

main();
