"use strict";

const path = require("path");
const localSeedCatalog = require("../foods.js");

function parseHeaderJson(rawHeadersJson) {
  if (!rawHeadersJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawHeadersJson);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    throw new Error("CATALOG_HEADERS_JSON is not valid JSON.");
  }
}

function normalizeCatalog(payload) {
  if (!payload || !Array.isArray(payload.foods) || !Array.isArray(payload.dimensions)) {
    throw new Error("Catalog payload shape is invalid.");
  }

  return {
    foods: payload.foods,
    dimensions: payload.dimensions
  };
}

async function loadFromHttpEndpoint() {
  const catalogUrl = process.env.CATALOG_URL;

  if (!catalogUrl) {
    return null;
  }

  const headers = {
    Accept: "application/json",
    ...parseHeaderJson(process.env.CATALOG_HEADERS_JSON)
  };

  const response = await fetch(catalogUrl, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    throw new Error(`CATALOG_URL request failed with ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeCatalog(payload);
}

async function loadFromCustomLoader() {
  const loaderModulePath = process.env.CATALOG_LOADER_MODULE;

  if (!loaderModulePath) {
    return null;
  }

  const resolvedLoaderPath = path.isAbsolute(loaderModulePath)
    ? loaderModulePath
    : path.resolve(process.cwd(), loaderModulePath);
  const customLoader = require(resolvedLoaderPath);
  const loaderFn = customLoader.loadCatalog || customLoader;

  if (typeof loaderFn !== "function") {
    throw new Error("CATALOG_LOADER_MODULE must export a function or loadCatalog().");
  }

  const payload = await loaderFn({ env: process.env });
  return normalizeCatalog(payload);
}

async function loadCatalog() {
  const fromCustomLoader = await loadFromCustomLoader();
  if (fromCustomLoader) {
    return {
      ...fromCustomLoader,
      source: "custom-loader"
    };
  }

  const fromHttpEndpoint = await loadFromHttpEndpoint();
  if (fromHttpEndpoint) {
    return {
      ...fromHttpEndpoint,
      source: "http-endpoint"
    };
  }

  return {
    ...normalizeCatalog(localSeedCatalog),
    source: "local-seed"
  };
}

module.exports = {
  loadCatalog
};
