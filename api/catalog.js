"use strict";

const { loadCatalog } = require("../server/catalog-service");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const catalog = await loadCatalog();
    res.status(200).json(catalog);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load catalog.",
      detail: error.message
    });
  }
};
