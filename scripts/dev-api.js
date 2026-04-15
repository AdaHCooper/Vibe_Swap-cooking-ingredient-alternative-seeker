"use strict";

const http = require("http");
const { loadCatalog } = require("../server/catalog-service");

const PORT = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  if (req.url !== "/api/catalog") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, {
      "Content-Type": "application/json",
      Allow: "GET"
    });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const catalog = await loadCatalog();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(catalog));
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Failed to load catalog.",
      detail: error.message
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev API listening on http://localhost:${PORT}/api/catalog`);
});
