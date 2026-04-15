(function () {
  const defaultConfig = {
    catalogUrl: "/api/catalog",
    fallbackToSeed: true,
    fallbackScriptUrl: "./foods.js",
    requestTimeoutMs: 8000,
    requestHeaders: {}
  };

  function getConfig() {
    return { ...defaultConfig, ...(window.vibeSwapApiConfig || {}) };
  }

  function normalizeCatalog(payload, source) {
    if (!payload || !Array.isArray(payload.foods) || !Array.isArray(payload.dimensions)) {
      throw new Error("Catalog payload shape is invalid.");
    }

    return {
      foods: payload.foods,
      dimensions: payload.dimensions,
      source
    };
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-vibe-swap-src="${url}"]`);

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${url}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.dataset.vibeSwapSrc = url;
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error(`Failed to load script: ${url}`)), { once: true });
      document.head.appendChild(script);
    });
  }

  async function fetchRemoteCatalog(config) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    const requestHeaders = {
      Accept: "application/json",
      ...(config.requestHeaders || {})
    };

    try {
      const response = await fetch(config.catalogUrl, {
        method: "GET",
        headers: requestHeaders,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Remote catalog request failed with ${response.status}.`);
      }

      const payload = await response.json();
      return normalizeCatalog(payload, "cloud");
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadSeedCatalog(config) {
    await loadScript(config.fallbackScriptUrl);

    if (!window.vibeSwapSeedData) {
      throw new Error("Seed catalog script loaded, but no seed data was found.");
    }

    return normalizeCatalog(window.vibeSwapSeedData, "seed");
  }

  async function loadCatalog() {
    const config = getConfig();

    try {
      return await fetchRemoteCatalog(config);
    } catch (remoteError) {
      if (!config.fallbackToSeed) {
        throw remoteError;
      }

      const seedCatalog = await loadSeedCatalog(config);
      return {
        ...seedCatalog,
        source: "seed-fallback",
        remoteError
      };
    }
  }

  window.vibeSwapApi = {
    loadCatalog
  };
})();
