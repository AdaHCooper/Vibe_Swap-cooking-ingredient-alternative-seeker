let foodDatabase = [];
let dimensionConfig = [];

const targetFoodInput = document.getElementById("targetFoodInput");
const categoryFilter = document.getElementById("categoryFilter");
const dietaryFilter = document.getElementById("dietaryFilter");
const selectedFoodHint = document.getElementById("selectedFoodHint");
const searchSuggestions = document.getElementById("searchSuggestions");
const dataSourceStatus = document.getElementById("dataSourceStatus");
const searchMeta = document.getElementById("searchMeta");
const searchBtn = document.getElementById("searchBtn");
const targetSection = document.getElementById("targetSection");
const targetCard = document.getElementById("targetCard");
const resultSection = document.getElementById("resultSection");
const resultSummary = document.getElementById("resultSummary");
const resultList = document.getElementById("resultList");

let selectedFoodId = null;

function setControlsDisabled(disabled) {
  targetFoodInput.disabled = disabled;
  categoryFilter.disabled = disabled;
  dietaryFilter.disabled = disabled;
  searchBtn.disabled = disabled;
}

function updateDataSourceStatus(message) {
  dataSourceStatus.textContent = message;
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function populateCategoryFilter() {
  categoryFilter.innerHTML = '<option value="">全部类别</option>';
  const categories = [...new Set(foodDatabase.map((food) => food.category))].sort((left, right) => left.localeCompare(right, "zh-CN"));

  categoryFilter.innerHTML += categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function getFilteredFoods() {
  return foodDatabase.filter((food) => {
    const categoryPass = !categoryFilter.value || food.category === categoryFilter.value;
    const dietaryPass = !dietaryFilter.value || (food.dietaryTags || []).includes(dietaryFilter.value);
    return categoryPass && dietaryPass;
  });
}

function buildSearchIndex(food) {
  return [
    food.name,
    food.nameEn,
    food.category,
    ...(food.aliases || [])
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

function getFoodById(foodId) {
  return foodDatabase.find((food) => food.id === foodId) || null;
}

function getMatches(query) {
  const candidateFoods = getFilteredFoods();
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return candidateFoods.slice(0, 6);
  }

  return candidateFoods
    .map((food) => {
      const searchIndex = buildSearchIndex(food);
      let rank = 0;

      if (normalizeText(food.name) === normalizedQuery || normalizeText(food.nameEn) === normalizedQuery) {
        rank += 120;
      }

      if ((food.aliases || []).some((alias) => normalizeText(alias) === normalizedQuery)) {
        rank += 100;
      }

      if (normalizeText(food.name).includes(normalizedQuery)) {
        rank += 70;
      }

      if (normalizeText(food.nameEn).includes(normalizedQuery)) {
        rank += 55;
      }

      if ((food.aliases || []).some((alias) => normalizeText(alias).includes(normalizedQuery))) {
        rank += 45;
      }

      if (searchIndex.includes(normalizedQuery)) {
        rank += 20;
      }

      return { food, rank };
    })
    .filter(({ rank }) => rank > 0)
    .sort((left, right) => right.rank - left.rank)
    .slice(0, 6)
    .map(({ food }) => food);
}

function setSelectedFood(food) {
  selectedFoodId = food.id;
  targetFoodInput.value = food.name;
  selectedFoodHint.textContent = `当前已锁定：${food.name} · ${food.category}`;
}

function renderSuggestions(matches, query) {
  if (!matches.length) {
    searchSuggestions.innerHTML = "";
    searchSuggestions.classList.add("is-empty");
    const filterLabel = [categoryFilter.value, dietaryFilter.options[dietaryFilter.selectedIndex]?.text]
      .filter(Boolean)
      .join(" / ");
    searchMeta.textContent = filterLabel
      ? `当前筛选下没有找到和“${query || "该条件"}”相关的食材，可以放宽筛选或换个关键词。`
      : `没有找到和“${query}”相关的食材，可以试试中文名、英文名或更短的关键词。`;
    return;
  }

  searchSuggestions.classList.remove("is-empty");
  const totalCount = getFilteredFoods().length;
  searchMeta.textContent = query
    ? `找到 ${matches.length} 个候选，当前筛选池共有 ${totalCount} 个食材。`
    : `当前筛选池共有 ${totalCount} 个食材，支持中文名、英文名和别名匹配。`;

  searchSuggestions.innerHTML = matches.map((food) => `
    <button class="suggestion-item${food.id === selectedFoodId ? " is-active" : ""}" type="button" data-food-id="${food.id}">
      <strong>${food.name} · ${food.nameEn}</strong>
      <span>${food.category} · 烹饪法：${(food.cookMethods || []).slice(0, 3).join(" / ")}</span>
    </button>
  `).join("");
}

function calcSimilarity(target, candidate) {
  let penalty = 0;

  dimensionConfig.forEach(({ key, weight }) => {
    penalty += Math.abs(target[key] - candidate[key]) * weight;
  });

  penalty += target.texture === candidate.texture ? 0 : 5;
  penalty -= target.category === candidate.category ? 1.4 : 0;
  penalty -= Math.min(getSharedCookMethods(target, candidate).length, 2) * 0.7;

  const score = Math.max(0, Math.min(99, 100 - penalty * 3.6));
  return Number(score.toFixed(1));
}

function getSharedCookMethods(target, candidate) {
  return (target.cookMethods || []).filter((method) => (candidate.cookMethods || []).includes(method));
}

function formatMetricList(food) {
  return dimensionConfig.map(({ key, label }) => {
    const width = Math.max(8, food[key] * 10);
    return `
      <div class="metric-item">
        <span>${label}</span>
        <div class="metric-track">
          <div class="metric-fill" style="width:${width}%"></div>
        </div>
        <span class="metric-value">${food[key]}/10</span>
      </div>
    `;
  }).join("");
}

function getDeltaClass(diff) {
  if (diff <= 1) {
    return "is-close";
  }

  if (diff <= 3) {
    return "is-mid";
  }

  return "is-far";
}

function formatDelta(diff) {
  if (diff === 0) {
    return "完全贴合";
  }

  return `差 ${diff.toFixed(1)}`;
}

function buildComparisonRows(target, candidate) {
  return dimensionConfig.map(({ key, label }) => {
    const diff = Math.abs(target[key] - candidate[key]);

    return `
      <div class="compare-row">
        <div class="compare-label">${label}</div>
        <div class="compare-cell">
          <strong>${target[key]}/10</strong>
          <span>目标食材</span>
        </div>
        <div class="compare-cell">
          <strong>${candidate[key]}/10</strong>
          <span>替代食材</span>
        </div>
        <div class="compare-delta ${getDeltaClass(diff)}">${formatDelta(diff)}</div>
      </div>
    `;
  }).join("");
}

function getLargestGaps(target, candidate) {
  return dimensionConfig
    .map(({ key, label }) => ({
      label,
      diff: Math.abs(target[key] - candidate[key]),
      targetValue: target[key],
      candidateValue: candidate[key]
    }))
    .sort((left, right) => right.diff - left.diff)
    .slice(0, 2);
}

function getGapSummary(target, candidate) {
  const largestGaps = getLargestGaps(target, candidate).filter((item) => item.diff > 0);

  if (!largestGaps.length) {
    return `这组候选在核心结构维度上和 ${target.name} 几乎重合，差异更多会体现在具体食材风味本身。`;
  }

  return largestGaps
    .map((item) => `${item.label}${item.candidateValue > item.targetValue ? "更强" : "更弱"}`)
    .join("，");
}

function buildSimilarityReasons(target, candidate) {
  const reasons = [];
  const differences = [];
  const sharedCookMethods = getSharedCookMethods(target, candidate);

  if (Math.abs(target.fatty - candidate.fatty) <= 2) {
    reasons.push(`油脂感接近，能比较好地补上 ${target.name} 的顺滑满足感。`);
  } else {
    differences.push(`油脂感差距明显，入口丰润度会和 ${target.name} 拉开。`);
  }

  if (Math.abs(target.umami - candidate.umami) <= 2) {
    reasons.push(`鲜味层次相近，做成主角食材时不容易“掉气场”。`);
  } else if (candidate.umami < target.umami) {
    differences.push(`鲜味弱于 ${target.name}，需要靠酱油、盐或调味补强。`);
  } else {
    differences.push(`鲜味更冲，会把整体风格拉得更厚重。`);
  }

  if (Math.abs(target.acidity - candidate.acidity) <= 2) {
    reasons.push("酸度落点接近，不容易打乱原本的风味平衡。");
  } else if (candidate.acidity > target.acidity) {
    differences.push(`酸度更高，适合清爽路线，但可能改变原菜的重心。`);
  } else {
    differences.push(`酸度更低，整体会更圆润，但层次感可能少一点。`);
  }

  if (Math.abs(target.aroma - candidate.aroma) <= 2) {
    reasons.push("香气强度比较接近，做成成品后不会特别跳戏。");
  } else {
    differences.push("香气强度差异较大，成菜的第一鼻感会有明显变化。");
  }

  if (target.texture === candidate.texture) {
    reasons.push(`口感同属“${target.texture}”路线，吃起来的第一印象比较接近。`);
  } else {
    differences.push(`口感从“${target.texture}”偏向“${candidate.texture}”，体感会变。`);
  }

  if (sharedCookMethods.length) {
    reasons.push(`都适合 ${sharedCookMethods.slice(0, 2).join(" / ")}，烹饪迁移成本比较低。`);
  } else {
    differences.push("常见烹饪方式重合不多，替代时需要调整做法。");
  }

  return {
    reasons: reasons.slice(0, 2),
    differences: differences.slice(0, 2)
  };
}

function getUsageHint(target, candidate) {
  if (candidate.fatty >= target.fatty && candidate.umami >= target.umami - 1) {
    return `适合顶替 ${target.name} 在主角位的存在感，尤其适合 ${candidate.bestFor}。`;
  }

  if (candidate.fatty < target.fatty) {
    return `更适合作为“轻量版替代”，建议搭配油脂或酱汁一起使用，场景上推荐 ${candidate.bestFor}。`;
  }

  return `适合在家常版本里替代 ${target.name}，能保住一部分气质，但会带来新的风味方向。`;
}

function formatInfoTags(food) {
  const dietaryLabel = (food.dietaryTags || []).length ? food.dietaryTags.join(" / ") : "无特殊饮食标签";
  const allergenLabel = (food.allergens || []).length ? food.allergens.join(" / ") : "常见过敏原较少";

  return [
    `适合 ${food.bestFor}`,
    `烹饪法：${(food.cookMethods || []).slice(0, 3).join(" / ")}`,
    `饮食标签：${dietaryLabel}`,
    `过敏原：${allergenLabel}`
  ]
    .map((text) => `<span class="mini-tag">${text}</span>`)
    .join("");
}

function renderTarget(food) {
  targetCard.innerHTML = `
    <article class="target-card">
      <div class="food-header">
        <img class="food-thumb" src="${food.image}" alt="${food.name}">
        <div class="food-title">
          <h3>${food.name}</h3>
          <p>${food.category} · ${food.texture}口感</p>
        </div>
      </div>

      <div class="tag-row">
        ${formatInfoTags(food)}
      </div>

      <div class="metric-row">
        ${formatMetricList(food)}
      </div>

      <p class="overview-copy">${food.vibeNote} 优点：${food.advantage}。风险：${food.disadvantage}。</p>
    </article>
  `;

  targetSection.classList.remove("hidden");
}

function renderResults(target, results) {
  const filterBits = [categoryFilter.value, dietaryFilter.options[dietaryFilter.selectedIndex]?.text]
    .filter((value) => value && value !== "不限")
    .join(" / ");
  resultSummary.textContent = filterBits
    ? `基于 6 个结构维度，并结合当前筛选 ${filterBits}，为 ${target.name} 找到最接近的 ${results.length} 个候选影子节点。`
    : `基于 6 个结构维度，为 ${target.name} 找到最接近的 ${results.length} 个候选影子节点。`;

  resultList.innerHTML = results.map(({ food, score }) => {
    const { reasons, differences } = buildSimilarityReasons(target, food);
    const sharedCookMethods = getSharedCookMethods(target, food);
    const gapSummary = getGapSummary(target, food);

    return `
      <article class="result-card">
        <div class="result-top">
          <div class="food-header">
            <img class="food-thumb" src="${food.image}" alt="${food.name}">
            <div class="food-title">
              <h3>${food.name}</h3>
              <p>${food.category} · ${food.texture}口感</p>
            </div>
          </div>
          <div class="result-score">
            <strong>${score}%</strong>
            <span>匹配度</span>
          </div>
        </div>

        <div class="result-summary">
          ${getUsageHint(target, food)}
        </div>

        <div class="tag-row">
          ${formatInfoTags(food)}
        </div>

        <div class="compare-block">
          <div class="compare-head">
            <strong>${target.name} vs ${food.name}</strong>
            <span>直接对比核心结构维度</span>
          </div>
          <div class="compare-grid">
            ${buildComparisonRows(target, food)}
          </div>
        </div>

        <div class="metric-row">
          ${formatMetricList(food)}
        </div>

        <div class="reason-list">
          <div class="reason-item">
            <strong>为什么像</strong>
            <p>${reasons.join(" ") || "当前样本库里和目标食材仍存在较明显差异。"} </p>
          </div>
          <div class="reason-item">
            <strong>关键差异</strong>
            <p>${differences.join(" ") || "整体结构比较接近，差异主要体现在具体风味细节。"} 当前最需要注意的是：${gapSummary}。</p>
          </div>
          <div class="reason-item">
            <strong>优点与代价</strong>
            <p>优点：${food.advantage}。代价：${food.disadvantage}。</p>
          </div>
          <div class="reason-item">
            <strong>烹饪适配</strong>
            <p>${sharedCookMethods.length ? `和 ${target.name} 都适合 ${sharedCookMethods.join(" / ")}。` : "和目标食材常见做法重合较少，替代时建议同步调整处理方式。"} 目标场景：${food.bestFor}。</p>
          </div>
        </div>
      </article>
    `;
  }).join("");

  resultSection.classList.remove("hidden");
}

function runRecommendation(foodId = selectedFoodId) {
  const target = getFoodById(foodId);

  if (!target) {
    searchMeta.textContent = "请先从候选列表里选中一个食材，再生成替代建议。";
    return;
  }

  setSelectedFood(target);
  renderSuggestions(getMatches(target.name), target.name);

  const results = getFilteredFoods()
    .filter((food) => food.id !== target.id)
    .map((food) => ({
      food,
      score: calcSimilarity(target, food)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  renderTarget(target);
  renderResults(target, results);
}

function handleSearchInput() {
  const query = targetFoodInput.value;
  const matches = getMatches(query);
  const exactMatch = matches.find((food) => normalizeText(food.name) === normalizeText(query))
    || matches.find((food) => normalizeText(food.nameEn) === normalizeText(query))
    || matches.find((food) => (food.aliases || []).some((alias) => normalizeText(alias) === normalizeText(query)));

  if (exactMatch) {
    selectedFoodId = exactMatch.id;
    selectedFoodHint.textContent = `已自动识别：${exactMatch.name} · ${exactMatch.category}`;
  } else if (normalizeText(query) !== normalizeText(getFoodById(selectedFoodId)?.name)) {
    selectedFoodId = null;
    selectedFoodHint.textContent = "还没有锁定食材，点一个候选或直接回车选中第一项。";
  }

  renderSuggestions(matches, query);
}

function refreshSearchState() {
  const query = targetFoodInput.value;
  const matches = getMatches(query);
  const selectedFood = getFoodById(selectedFoodId);

  if (selectedFood && !getFilteredFoods().some((food) => food.id === selectedFood.id)) {
    selectedFoodId = null;
    selectedFoodHint.textContent = "当前锁定食材不在筛选结果中，请重新选择。";
  }

  renderSuggestions(matches, query);
}

targetFoodInput.addEventListener("input", handleSearchInput);

targetFoodInput.addEventListener("focus", () => {
  renderSuggestions(getMatches(targetFoodInput.value), targetFoodInput.value);
});

targetFoodInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  const [firstMatch] = getMatches(targetFoodInput.value);

  if (firstMatch) {
    setSelectedFood(firstMatch);
    renderSuggestions(getMatches(firstMatch.name), firstMatch.name);
    runRecommendation(firstMatch.id);
  }
});

searchSuggestions.addEventListener("click", (event) => {
  const suggestionButton = event.target.closest("[data-food-id]");

  if (!suggestionButton) {
    return;
  }

  const food = getFoodById(suggestionButton.dataset.foodId);

  if (!food) {
    return;
  }

  setSelectedFood(food);
  renderSuggestions(getMatches(food.name), food.name);
});

searchBtn.addEventListener("click", () => {
  if (selectedFoodId) {
    runRecommendation(selectedFoodId);
    return;
  }

  const [firstMatch] = getMatches(targetFoodInput.value);

  if (firstMatch) {
    runRecommendation(firstMatch.id);
    return;
  }

  searchMeta.textContent = "没有可用于推荐的目标食材，请先输入并选中一个候选。";
});

categoryFilter.addEventListener("change", refreshSearchState);
dietaryFilter.addEventListener("change", refreshSearchState);

function applyCatalog(catalog) {
  foodDatabase = catalog.foods;
  dimensionConfig = catalog.dimensions;
  populateCategoryFilter();

  if (!foodDatabase.length) {
    throw new Error("Catalog is empty.");
  }

  setSelectedFood(foodDatabase[0]);
  renderSuggestions(getMatches(""), "");
  runRecommendation(foodDatabase[0].id);
}

async function initApp() {
  setControlsDisabled(true);
  updateDataSourceStatus("正在连接云端食材库...");
  searchMeta.textContent = "应用会优先从云端接口拉取目录，失败时再回退到本地种子。";

  try {
    const catalog = await window.vibeSwapApi.loadCatalog();
    applyCatalog(catalog);
    setControlsDisabled(false);

    if (catalog.source === "cloud") {
      updateDataSourceStatus("当前数据源：云端接口已连接。");
      searchMeta.textContent = `已从云端拉取 ${foodDatabase.length} 条食材数据，后续扩库不需要再把大数组塞进前端。`;
      return;
    }

    updateDataSourceStatus("当前数据源：本地种子兜底。云端接口暂未连通。");
    searchMeta.textContent = `云端接口暂未返回数据，已按需加载本地种子 ${foodDatabase.length} 条。等你把 catalogUrl 指向真实服务后，这里会自动切回云端。`;
  } catch (error) {
    setControlsDisabled(true);
    updateDataSourceStatus("数据源连接失败。");
    searchMeta.textContent = `未能加载食材目录：${error.message}`;
    selectedFoodHint.textContent = "请先配置可用的云端接口，或保留本地种子兜底。";
  }
}

initApp();
