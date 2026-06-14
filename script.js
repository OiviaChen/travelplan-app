const defaultTrip = {
  title: "杭州西湖小猪线徒步",
  overview: "上海可当天往返的杭州西湖边小众徒步路线，串联吴山、八卦田、玉皇山、紫来洞、九曜阁和西湖边。",
  metadata: {
    routeType: "城市山野徒步",
    distance: "约 15 公里",
    elevation: "累计爬升 617 米",
    estimatedDuration: "约 5-7 小时"
  },
  steps: [
    {
      time: "08:00",
      title: "上海虹桥站到吴山广场站 D 口",
      direction: "高铁到杭州东站，地铁换乘到吴山广场站 D 口。",
      note: "上海当天可以往返，吴山天峰是徒步起点。",
      reminder: "提前看好高铁和地铁换乘时间。"
    },
    {
      time: "09:30",
      title: "吴山广场 / 吴山天峰起点",
      direction: "从吴山广场地铁站出发，进入吴山天峰方向。",
      note: "开始画小猪线，第一段走向八卦田。",
      reminder: "想画出完整小猪形状，要勤看轨迹。"
    },
    {
      time: "10:10",
      title: "吴山大观 / 城隍阁",
      direction: "沿吴山路线经过吴山大观和城隍阁。",
      note: "绣球花开时很好看，可按现场情况购票参观。",
      reminder: "参观城隍阁按开放和购票情况决定。"
    },
    {
      time: "10:50",
      title: "绿色藤蔓天幕",
      direction: "从吴山小路拐入安静林间路段。",
      note: "麻藤编织出绿色天幕，像现实版绿野仙踪。",
      reminder: "路口容易错过，继续确认轨迹方向。"
    },
    {
      time: "11:30",
      title: "凤凰山土路爬升",
      direction: "沿万松岭路走一段，右转上山进入凤凰山土路。",
      note: "这一段开始画猪肚皮，树荫多，不太晒。",
      reminder: "土路爬升消耗体力，夏季记得驱蚊。"
    },
    {
      time: "12:30",
      title: "八卦田",
      direction: "穿过八卦田，进入八卦田到九曜阁段。",
      note: "南宋皇帝亲耕田，是路线里很有辨识度的节点。",
      reminder: "从这里继续上玉皇山。"
    },
    {
      time: "13:20",
      title: "玉皇山 / 紫来洞",
      direction: "继续上玉皇山，一路爬升到紫来洞。",
      note: "紫来洞门口凉气扑面，还能俯瞰八卦田。",
      reminder: "玉皇山门票 10 元，爬升段注意补水。"
    },
    {
      time: "14:20",
      title: "七星亭 / 福星观",
      direction: "过七星亭到福星观，可远眺钱塘江和西湖。",
      note: "一带视野开阔，有江湖一览的观景感。",
      reminder: "临时脱离轨迹后，回主路线时重新确认方向。"
    },
    {
      time: "15:10",
      title: "土路下山 / 猪尾巴路段",
      direction: "从福星观附近土路下山，进入猪屁股和猪尾巴路段。",
      note: "短尾巴可按体力和路线选择只画一半。",
      reminder: "岔路注意方向，下山土路注意防滑。"
    },
    {
      time: "16:00",
      title: "九曜阁",
      direction: "完成尾巴路段后爬升到九曜阁。",
      note: "九曜阁可以俯瞰西湖，是后半程的重要观景点。",
      reminder: "到九曜阁前有一段爬升，注意体力分配。"
    },
    {
      time: "17:00",
      title: "西湖边返回吴山广场",
      direction: "沿南屏山游步道下山，再沿西湖边走回吴山广场。",
      note: "天气和时间合适时，有机会收获日落西湖。",
      reminder: "全程约 15 公里，结束后及时补水补能量。"
    }
  ],
  preparation: ["驱蚊液", "水", "轻便徒步鞋", "充电宝", "轨迹导航", "少量补给", "现金/手机支付用于门票"],
  warnings: ["勤看轨迹", "部分土路爬升", "岔路注意方向", "下山注意防滑", "夏季注意防蚊和补水"],
  highlights: ["吴山天峰", "绿色藤蔓天幕", "八卦田", "紫来洞", "九曜阁俯瞰西湖", "日落西湖"]
};

const templateOptions = [
  {
    id: "detailed",
    title: "详细版本",
    subtitle: "适合 A4 打印"
  },
  {
    id: "card",
    title: "小卡片版",
    subtitle: "最小版线路图"
  },
  {
    id: "timeline",
    title: "时间轴版",
    subtitle: "适合贴在 TN / 手帐尺寸"
  }
];

const sampleTripText = [
  defaultTrip.overview,
  ...defaultTrip.steps.map((step) => `${step.time} ${step.title} - ${step.direction}`)
].join("\n");

const appState = {
  screen: "home",
  selectedTemplate: "detailed",
  draggingIndex: null,
  focusedIndex: null,
  isTripIndexOpen: false,
  trip: cloneTrip(defaultTrip)
};

const screenMeta = {
  home: { kicker: "home", title: "Create trip", step: "1 / 5" },
  trip: { kicker: "TRIP", title: "Trip puzzle", step: "2 / 5" },
  check: { kicker: "check", title: "Route check", step: "3 / 5" },
  template: { kicker: "template", title: "Template", step: "4 / 5" },
  final: { kicker: "check", title: "Final preview", step: "5 / 5" }
};

const previousScreen = {
  trip: "home",
  check: "trip",
  template: "check",
  final: "template"
};

const screens = {
  home: document.getElementById("screen-home"),
  trip: document.getElementById("screen-trip"),
  check: document.getElementById("screen-check"),
  template: document.getElementById("screen-template"),
  final: document.getElementById("screen-final")
};

const sourceText = document.getElementById("sourceText");
const createButton = document.getElementById("createButton");
const finalCreateButton = document.getElementById("finalCreateButton");
const createNewButton = document.getElementById("createNewButton");
const tripTitleInput = document.getElementById("tripTitleInput");
const tripIndexButton = document.getElementById("tripIndexButton");
const headerBackButton = document.getElementById("headerBackButton");
const desktopRouteIndexQuery = window.matchMedia("(min-width: 1100px)");

sourceText.value = sampleTripText;

createButton.addEventListener("click", () => {
  appState.trip = buildTripFromInput(sourceText.value);
  appState.selectedTemplate = "detailed";
  appState.focusedIndex = null;
  appState.isTripIndexOpen = false;
  goToScreen("trip");
});

finalCreateButton.addEventListener("click", () => {
  document.getElementById("finalMessage").textContent = "Saved. This prototype does not export files yet.";
});

createNewButton.addEventListener("click", () => {
  appState.trip = cloneTrip(defaultTrip);
  appState.selectedTemplate = "detailed";
  appState.draggingIndex = null;
  appState.focusedIndex = null;
  appState.isTripIndexOpen = false;
  sourceText.value = sampleTripText;
  document.getElementById("finalMessage").textContent = "";
  goToScreen("home");
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    syncTripTitle();
    appState.isTripIndexOpen = false;
    goToScreen(button.dataset.go);
  });
});

tripIndexButton.addEventListener("click", () => {
  appState.isTripIndexOpen = !appState.isTripIndexOpen;
  renderPuzzleEditor();
});

desktopRouteIndexQuery.addEventListener("change", () => {
  if (appState.screen === "trip") renderPuzzleEditor();
});

headerBackButton.addEventListener("click", () => {
  const target = previousScreen[appState.screen];
  if (!target) return;
  syncTripTitle();
  appState.isTripIndexOpen = false;
  goToScreen(target);
});

function cloneTrip(trip) {
  return JSON.parse(JSON.stringify(trip));
}

function buildTripFromInput(value) {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length || String(value).trim() === sampleTripText.trim()) return cloneTrip(defaultTrip);

  const steps = lines.slice(0, 6).map((line, index) => {
    const timeMatch = line.match(/(?:^|\s)(\d{1,2}[:：]\d{2})(?:\s|$)/);
    const time = timeMatch ? timeMatch[1].replace("：", ":") : `${9 + index}:00`;
    const title = cleanTitle(line.replace(timeMatch?.[1] || "", "")) || `Location ${index + 1}`;
    return {
      time,
      title,
      direction: "",
      note: "",
      reminder: ""
    };
  });

  return {
    title: "Trip #1",
    overview: "从输入内容生成的简版路线，可在拼图编辑器里继续整理。",
    metadata: {
      routeType: "自定义路线",
      distance: "待补充",
      elevation: "待补充",
      estimatedDuration: "待补充"
    },
    steps,
    preparation: [],
    warnings: [],
    highlights: []
  };
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/^[-—·,，。:：\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
}

function goToScreen(screenName) {
  appState.screen = screenName;
  Object.entries(screens).forEach(([name, screen]) => {
    screen.classList.toggle("is-active", name === screenName);
  });
  document.querySelectorAll("[data-actions-for]").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.actionsFor === screenName);
  });

  const meta = screenMeta[screenName];
  document.getElementById("screenKicker").textContent = meta.kicker;
  document.getElementById("screenTitle").textContent = meta.title;
  document.getElementById("stepIndicator").textContent = meta.step;
  headerBackButton.classList.toggle("is-visible", screenName !== "home");

  if (screenName === "trip") renderPuzzleEditor();
  if (screenName === "check") renderCheckPreview();
  if (screenName === "template") renderTemplateSelection();
  if (screenName === "final") renderFinalPreview();

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function syncTripTitle() {
  if (!tripTitleInput) return;
  appState.trip.title = tripTitleInput.value.trim() || "Trip #1";
}

function renderPuzzleEditor() {
  tripTitleInput.value = appState.trip.title;
  document.getElementById("puzzleEditor").innerHTML = `
    ${renderTripIndexPanel()}
    <div class="puzzle-board">
      ${appState.trip.steps.map((step, index) => renderPuzzleRow(step, index)).join("")}
    </div>
  `;

  tripIndexButton.setAttribute("aria-expanded", String(appState.isTripIndexOpen));

  document.querySelectorAll("[data-step-field]").forEach((input) => {
    input.addEventListener("input", updateStepField);
  });
  document.querySelectorAll("[data-insert-after]").forEach((button) => {
    button.addEventListener("click", insertStepAfter);
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", moveStep);
  });
  document.querySelectorAll("[data-delete-step]").forEach((button) => {
    button.addEventListener("click", deleteStep);
  });
  document.querySelectorAll(".location-piece").forEach((card) => {
    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
  });
  document.querySelectorAll("[data-focus-step]").forEach((button) => {
    button.addEventListener("click", focusPuzzleStep);
  });
}

function renderTripIndexPanel() {
  if (!shouldShowTripIndex()) return "";
  return `
    <aside class="trip-index-panel" aria-label="路线目录">
      <p>路线目录</p>
      <div>
        ${appState.trip.steps.map((step, index) => `
          <button class="${index === appState.focusedIndex ? "is-active" : ""}" type="button" data-focus-step="${index}">
            <span>${escapeHtml(step.time || "--:--")}</span>
            <b>${escapeHtml(step.title || `Location ${index + 1}`)}</b>
          </button>
        `).join("")}
      </div>
    </aside>
  `;
}

function shouldShowTripIndex() {
  return appState.screen === "trip" && (appState.isTripIndexOpen || desktopRouteIndexQuery.matches);
}

function renderPuzzleRow(step, index) {
  return `
    <div class="puzzle-row ${index === appState.focusedIndex ? "is-focused" : ""}" data-puzzle-row="${index}">
      <label class="time-piece">
        <input value="${escapeAttr(step.time)}" data-step-field="time" data-index="${index}" aria-label="Time for ${escapeAttr(step.title)}">
      </label>
      <article class="location-piece ${appState.draggingIndex === index ? "is-dragging" : ""}" draggable="true" data-drag-index="${index}">
        <input value="${escapeAttr(step.title)}" data-step-field="title" data-index="${index}" aria-label="Location title">
        <div class="piece-details">
          ${step.direction ? `<p>${escapeHtml(step.direction)}</p>` : ""}
          ${step.note ? `<small>${escapeHtml(step.note)}</small>` : ""}
          ${step.reminder ? `<em>${escapeHtml(step.reminder)}</em>` : ""}
        </div>
        <div class="move-controls" aria-label="Swap controls">
          <button type="button" data-move="up" data-index="${index}" ${index === 0 ? "disabled" : ""}>Up</button>
          <button type="button" data-move="down" data-index="${index}" ${index === appState.trip.steps.length - 1 ? "disabled" : ""}>Down</button>
        </div>
        <button class="delete-step-button" type="button" data-delete-step="${index}" aria-label="删除这个行程" ${appState.trip.steps.length === 1 ? "disabled" : ""}>×</button>
      </article>
    </div>
    ${index < appState.trip.steps.length - 1 ? `
      <button class="insert-button" type="button" data-insert-after="${index}" aria-label="Insert itinerary row">+</button>
    ` : ""}
  `;
}

function updateStepField(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.stepField;
  appState.trip.steps[index][field] = event.target.value;
  if (field === "title" && appState.isTripIndexOpen) renderPuzzleEditor();
}

function insertStepAfter(event) {
  syncTripTitle();
  const index = Number(event.currentTarget.dataset.insertAfter);
  appState.trip.steps.splice(index + 1, 0, {
    time: "",
    title: "New location",
    direction: "",
    note: "",
    reminder: ""
  });
  appState.focusedIndex = index + 1;
  renderPuzzleEditor();
}

function moveStep(event) {
  syncTripTitle();
  const index = Number(event.currentTarget.dataset.index);
  const direction = event.currentTarget.dataset.move;
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (!appState.trip.steps[nextIndex]) return;
  const steps = appState.trip.steps;
  [steps[index], steps[nextIndex]] = [steps[nextIndex], steps[index]];
  appState.focusedIndex = nextIndex;
  renderPuzzleEditor();
}

function deleteStep(event) {
  syncTripTitle();
  const index = Number(event.currentTarget.dataset.deleteStep);
  if (appState.trip.steps.length <= 1 || !appState.trip.steps[index]) return;
  appState.trip.steps.splice(index, 1);
  if (appState.focusedIndex === index) {
    appState.focusedIndex = null;
  } else if (appState.focusedIndex > index) {
    appState.focusedIndex -= 1;
  }
  renderPuzzleEditor();
}

function focusPuzzleStep(event) {
  const index = Number(event.currentTarget.dataset.focusStep);
  appState.focusedIndex = index;
  appState.isTripIndexOpen = false;
  renderPuzzleEditor();
  const target = document.querySelector(`[data-puzzle-row="${index}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleDragStart(event) {
  appState.draggingIndex = Number(event.currentTarget.dataset.dragIndex);
  event.currentTarget.classList.add("is-dragging");
}

function handleDragEnd(event) {
  appState.draggingIndex = null;
  event.currentTarget.classList.remove("is-dragging");
}

function renderCheckPreview() {
  syncTripTitle();
  document.getElementById("checkTitle").textContent = appState.trip.title;
  document.getElementById("checkPreview").innerHTML = `
    <section class="preview-panel">
      <div class="route-summary">
        <p>${escapeHtml(appState.trip.overview || "当前路线预览")}</p>
        ${renderMetadataLine(appState.trip)}
      </div>
      ${appState.trip.steps.map((step, index) => `
        <div class="check-row">
          <span>${escapeHtml(step.time || "--:--")}</span>
          <div>
            <strong>${escapeHtml(step.title || `Location ${index + 1}`)}</strong>
            ${step.direction ? `<small>${escapeHtml(step.direction)}</small>` : ""}
            ${step.reminder ? `<em>${escapeHtml(step.reminder)}</em>` : ""}
          </div>
        </div>
      `).join("")}
      ${renderCompactInfo("准备", appState.trip.preparation)}
      ${renderCompactInfo("提醒", appState.trip.warnings)}
    </section>
  `;
}

function renderTemplateSelection() {
  document.getElementById("templateStack").innerHTML = templateOptions.map((template) => `
    <button class="template-card ${template.id === appState.selectedTemplate ? "is-selected" : ""}" type="button" data-template="${template.id}">
      <span>
        <b>${template.title}</b>
        <small>${template.subtitle}</small>
      </span>
      <i aria-hidden="true"></i>
    </button>
  `).join("");

  document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedTemplate = button.dataset.template;
      renderTemplateSelection();
    });
  });
}

function renderFinalPreview() {
  syncTripTitle();
  const template = templateOptions.find((option) => option.id === appState.selectedTemplate) || templateOptions[0];
  document.getElementById("finalMessage").textContent = "";
  document.getElementById("finalPreview").innerHTML = `
    <section class="final-card final-${escapeAttr(template.id)}">
      <p>${escapeHtml(template.title)}</p>
      <h2>${escapeHtml(appState.trip.title)}</h2>
      ${renderMetadataLine(appState.trip)}
      <div class="final-route">
        ${renderTemplateSteps(template.id)}
      </div>
      ${template.id !== "card" ? renderCompactInfo("提醒", appState.trip.warnings) : ""}
      ${template.id === "detailed" ? renderCompactInfo("准备", appState.trip.preparation) : ""}
    </section>
  `;
}

function renderTemplateSteps(templateId) {
  const steps = templateId === "card" ? appState.trip.steps.slice(0, 7) : appState.trip.steps;
  return steps.map((step) => `
    <div>
      <span>${escapeHtml(step.time || "--:--")}</span>
      <strong>${escapeHtml(step.title || "Location")}</strong>
      ${templateId === "detailed" && step.reminder ? `<small>${escapeHtml(step.reminder)}</small>` : ""}
    </div>
  `).join("");
}

function renderMetadataLine(trip) {
  const metadata = trip.metadata || {};
  const parts = [metadata.distance, metadata.elevation, metadata.estimatedDuration].filter(Boolean);
  if (!parts.length) return "";
  return `<div class="meta-strip">${parts.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>`;
}

function renderCompactInfo(title, items = []) {
  if (!items.length) return "";
  return `
    <div class="compact-info">
      <b>${escapeHtml(title)}</b>
      <p>${items.map(escapeHtml).join(" / ")}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
