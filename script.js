const defaultTrip = {
  title: "杭州之行",
  metadata: ["简单", "城市徒步", "5km"],
  steps: [
    {
      time: "7:00",
      title: "上海虹桥车站乘高铁到杭州站",
      note: "填写车次与车厢号"
    },
    {
      time: "7:40",
      title: "到达杭州站后出站",
      note: ""
    },
    {
      time: "8:00",
      title: "地铁乘坐1号线到达西湖站",
      note: "E 地铁口出来"
    },
    {
      time: "起点",
      title: "导航到小群山",
      note: "走 300 米到达起点，约 10 分钟"
    },
    {
      time: "直走",
      title: "沿着西湖路走 1km",
      note: "约 30 分钟"
    },
    {
      time: "到达",
      title: "到达大榕树并短暂停留",
      note: "停留一下"
    },
    {
      time: "山路",
      title: "沿着山路走到达小山寺",
      note: "安静寺庙，可以休息一下啦"
    },
    {
      time: "公交",
      title: "乘 7 路公交到龙井路口",
      note: "下车后沿路口继续步行"
    },
    {
      time: "",
      title: "在茶馆门口休息补水",
      note: "停留 15 分钟"
    }
  ]
};

const templateOptions = [
  {
    id: "detailed",
    title: "详细路线",
    subtitle: "适合 A4 打印"
  },
  {
    id: "card",
    title: "小卡路线图",
    subtitle: "适合打印下来随身携带"
  },
  {
    id: "timeline",
    title: "时间轴路线",
    subtitle: "适合打印放在手帐本里"
  }
];

const sampleTripText = [
  "上海出发去杭州西湖城市徒步。",
  ...defaultTrip.steps.map((step) => `${step.time} ${step.title} - ${step.note}`)
].join("\n");

const homePlaceholder = "将文字攻略或者视频逐字稿粘贴进来，\n我将帮你生成旅行路线~";

const appState = {
  screen: "home",
  routeMode: "view",
  selectedTemplate: "detailed",
  undoStack: [],
  draggingRouteIndex: null,
  activeEmptyTimeIndex: null,
  activeEmptyRouteIndex: null,
  trip: cloneTrip(defaultTrip)
};

const screenMeta = {
  home: { title: "你想去哪儿？", progress: 0 },
  route: { title: "路线编辑", progress: 1 },
  template: { title: "选择模版", progress: 2 },
  preview: { title: "打印预览", progress: 3 }
};

const previousScreen = {
  route: "home",
  template: "route",
  preview: "template"
};

const screens = {
  home: document.getElementById("screen-home"),
  route: document.getElementById("screen-route"),
  template: document.getElementById("screen-template"),
  preview: document.getElementById("screen-preview")
};

const sourceText = document.getElementById("sourceText");
const generateButton = document.getElementById("generateButton");
const editRouteButton = document.getElementById("editRouteButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const finishEditButton = document.getElementById("finishEditButton");
const createNewButton = document.getElementById("createNewButton");
const downloadButton = document.getElementById("downloadButton");
const headerBackButton = document.getElementById("headerBackButton");

sourceText.placeholder = homePlaceholder;

generateButton.addEventListener("click", () => {
  appState.trip = buildTripFromInput(sourceText.value);
  appState.routeMode = "view";
  appState.selectedTemplate = "detailed";
  goToScreen("route");
});

editRouteButton.addEventListener("click", () => {
  appState.routeMode = "edit";
  appState.undoStack = [];
  renderRoutePage();
  renderActionBar();
});

cancelEditButton.addEventListener("click", () => {
  undoLastEdit();
  renderActionBar();
});

finishEditButton.addEventListener("click", () => {
  appState.routeMode = "view";
  appState.undoStack = [];
  renderRoutePage();
  renderActionBar();
});

downloadButton.addEventListener("click", () => {
  document.getElementById("toastMessage").textContent = "下载已准备好。当前原型暂不生成真实文件。";
});

createNewButton.addEventListener("click", () => {
  appState.trip = cloneTrip(defaultTrip);
  appState.routeMode = "view";
  appState.selectedTemplate = "detailed";
  appState.undoStack = [];
  sourceText.value = "";
  sourceText.placeholder = homePlaceholder;
  document.getElementById("toastMessage").textContent = "";
  goToScreen("home");
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    goToScreen(button.dataset.go);
  });
});

headerBackButton.addEventListener("click", () => {
  const target = previousScreen[appState.screen];
  if (!target) return;
  if (appState.screen === "route" && appState.routeMode === "edit") {
    appState.routeMode = "view";
  }
  goToScreen(target);
});

function cloneTrip(trip) {
  return JSON.parse(JSON.stringify(trip));
}

function buildTripFromInput(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue || normalizedValue === sampleTripText.trim()) return cloneTrip(defaultTrip);

  const lines = normalizedValue
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: "杭州之行",
    metadata: [inferDifficulty(normalizedValue), inferRouteType(normalizedValue), inferDistanceLabel(normalizedValue)],
    steps: lines.slice(0, 8).map(parseRouteLine)
  };
}

function parseRouteLine(line) {
  const normalizedLine = String(line || "").replace(/\s+/g, " ").trim();
  const timeMatch = normalizedLine.match(/(?:^|\s)(\d{1,2}[:：]\d{2})(?:\s|$)/);
  const keyword = timeMatch ? "" : extractRouteKeyword(normalizedLine);
  const label = timeMatch ? timeMatch[1].replace("：", ":") : keyword;
  const contentWithoutLabel = removeExtractedLabel(normalizedLine, timeMatch?.[1] || keyword);
  const { title, note } = splitRouteContent(contentWithoutLabel || normalizedLine);

  return {
    time: label,
    title,
    note
  };
}

function extractRouteKeyword(line) {
  const routeKeywords = ["起点", "直走", "到达", "山路", "公交", "地铁", "高铁", "打车", "步行", "导航", "换乘", "左转", "右转", "上山", "下山"];
  return routeKeywords.find((keyword) => line.includes(keyword)) || "";
}

function removeExtractedLabel(line, label) {
  if (!label) return line;
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return line
    .replace(new RegExp(`^\\s*${escapedLabel}\\s*[-—·,，。:：]?\\s*`), "")
    .replace(new RegExp(`\\s+${escapedLabel}\\s+`), " ")
    .trim();
}

function splitRouteContent(line) {
  const [titlePart, ...noteParts] = String(line || "")
    .split(/\s*[-—|｜。；;]\s*/)
    .filter(Boolean);

  return {
    title: cleanRouteContent(titlePart || line),
    note: cleanRouteContent(noteParts.join(" "))
  };
}

function inferDifficulty(text) {
  const content = String(text || "");
  const explicitRules = [
    { level: "困难", words: ["困难", "难度高", "强度大", "高强度", "不适合新手", "虐线", "暴走", "陡", "很累"] },
    { level: "中等", words: ["中等", "适中", "一般难度", "有点累", "小爬升", "轻徒步"] },
    { level: "简单", words: ["简单", "轻松", "容易", "新手友好", "亲子", "平路", "休闲", "citywalk", "Citywalk"] }
  ];

  for (const rule of explicitRules) {
    if (rule.words.some((word) => content.includes(word))) return rule.level;
  }

  const distanceKm = extractDistanceKm(content);
  const elevationM = extractElevationM(content);
  let score = 0;

  if (distanceKm >= 12) score += 2;
  else if (distanceKm >= 6) score += 1;

  if (elevationM >= 500) score += 2;
  else if (elevationM >= 200) score += 1;

  if (/(爬升|山路|徒步|台阶|土路|下山|登山|越野|环线)/.test(content)) score += 1;
  if (/(地铁|公交|城市|西湖|街区|公园|广场|博物馆)/.test(content)) score -= 1;

  if (score >= 3) return "困难";
  if (score >= 1) return "中等";
  return "简单";
}

function extractDistanceKm(text) {
  const kmMatch = String(text || "").match(/(\d+(?:\.\d+)?)\s*(?:km|公里|千米)/i);
  if (kmMatch) return Number(kmMatch[1]);

  const meterMatch = String(text || "").match(/(\d+(?:\.\d+)?)\s*(?:m|米)/i);
  if (meterMatch) return Number(meterMatch[1]) / 1000;

  return 0;
}

function inferDistanceLabel(text) {
  const distanceKm = extractTotalDistanceKm(text);
  if (!distanceKm) return "-km";
  return `${formatDistance(distanceKm)}km`;
}

function extractTotalDistanceKm(text) {
  const content = String(text || "");
  const totalKeywords = "(?:全程|总长|总距离|路线长度|路程|总路程|距离|共|约|大约)";
  const totalKmMatch = content.match(new RegExp(`${totalKeywords}[^\\d]{0,8}(\\d+(?:\\.\\d+)?)\\s*(?:km|公里|千米)`, "i"));
  if (totalKmMatch) return Number(totalKmMatch[1]);

  const kmMatch = content.match(/(\d+(?:\.\d+)?)\s*(?:km|公里|千米)/i);
  if (kmMatch) return Number(kmMatch[1]);

  const totalMeterMatch = content.match(new RegExp(`${totalKeywords}[^\\d]{0,8}(\\d+(?:\\.\\d+)?)\\s*(?:m|米)`, "i"));
  if (totalMeterMatch) return Number(totalMeterMatch[1]) / 1000;

  return 0;
}

function formatDistance(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function extractElevationM(text) {
  const elevationMatch = text.match(/(?:爬升|海拔|上升|累计爬升)[^\d]*(\d+(?:\.\d+)?)\s*(?:m|米)/i);
  return elevationMatch ? Number(elevationMatch[1]) : 0;
}

function inferRouteType(text) {
  const content = String(text || "");
  const typeRules = [
    { type: "山野徒步", words: ["山路", "登山", "爬山", "爬升", "下山", "土路", "越野", "步道", "环线", "山脊"] },
    { type: "湖岸徒步", words: ["湖边", "沿湖", "西湖", "湖岸", "江边", "河边", "滨水", "栈道"] },
    { type: "公园徒步", words: ["公园", "绿道", "湿地", "植物园", "森林公园", "园区"] },
    { type: "城市徒步", words: ["城市徒步", "citywalk", "Citywalk", "街区", "老街", "巷子", "城市", "步行", "city walk", "马路"] },
    { type: "轻徒步", words: ["轻徒步", "休闲", "轻松", "亲子", "平路", "散步", "短线"] }
  ];

  const scoredTypes = typeRules.map((rule, ruleIndex) => {
    const score = rule.words.reduce((total, word) => total + (content.includes(word) ? 1 : 0), 0);
    return { type: rule.type, score, ruleIndex };
  });
  scoredTypes.sort((a, b) => b.score - a.score || a.ruleIndex - b.ruleIndex);

  return scoredTypes[0].score > 0 ? scoredTypes[0].type : "自由徒步";
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/^[-—·,，。:：\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function cleanRouteContent(value) {
  return String(value || "")
    .replace(/^[-—·,，。:：\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 42);
}

function goToScreen(screenName) {
  appState.screen = screenName;
  if (screenName !== "route") appState.routeMode = "view";

  Object.entries(screens).forEach(([name, screen]) => {
    screen.classList.toggle("is-active", name === screenName);
  });

  const meta = screenMeta[screenName];
  document.getElementById("screenTitle").textContent = meta.title;
  headerBackButton.classList.toggle("is-visible", screenName !== "home");
  renderProgress(meta.progress);

  if (screenName === "route") renderRoutePage();
  if (screenName === "template") renderTemplateSelection();
  if (screenName === "preview") renderTemplatePreview();
  renderActionBar();

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function renderProgress(activeStep) {
  document.querySelectorAll("#progressSegments span").forEach((segment, index) => {
    segment.classList.toggle("is-active", index < activeStep);
  });
}

function renderActionBar() {
  const actionKey = appState.screen === "route" ? `route-${appState.routeMode}` : appState.screen;
  const isEditingRoute = appState.screen === "route" && appState.routeMode === "edit";
  headerBackButton.disabled = isEditingRoute;
  headerBackButton.setAttribute("aria-disabled", String(isEditingRoute));
  cancelEditButton.disabled = isEditingRoute && !appState.undoStack.length;
  document.querySelectorAll("[data-actions-for]").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.actionsFor === actionKey);
  });
}

function renderRoutePage() {
  const isEditing = appState.routeMode === "edit";
  document.getElementById("screen-route").classList.toggle("is-editing", isEditing);
  document.getElementById("tripTitle").innerHTML = isEditing
    ? `<input class="trip-title-input" value="${escapeAttr(appState.trip.title)}" data-trip-field="title" aria-label="路线名称">`
    : escapeHtml(appState.trip.title);
  document.querySelector(".metadata-chips").innerHTML = appState.trip.metadata
    .map((item, index) => isEditing
      ? `<span><input value="${escapeAttr(item)}" data-metadata-index="${index}" aria-label="路线标签 ${index + 1}"></span>`
      : `<span>${escapeHtml(item)}</span>`)
    .join("");
  document.getElementById("routeEditor").innerHTML = `
    <div class="route-list ${appState.routeMode === "edit" ? "is-editing" : ""}">
      ${appState.trip.steps.map((step, index) => renderRouteRow(step, index)).join("")}
    </div>
  `;

  document.querySelectorAll("[data-trip-field]").forEach((input) => {
    input.addEventListener("focus", rememberEditStart);
    input.addEventListener("change", captureFieldUndo);
    input.addEventListener("input", updateTripField);
  });
  document.querySelectorAll("[data-metadata-index]").forEach((input) => {
    input.addEventListener("focus", rememberEditStart);
    input.addEventListener("change", captureFieldUndo);
    input.addEventListener("input", updateMetadataField);
  });
  document.querySelectorAll("[data-route-field]").forEach((input) => {
    input.addEventListener("focus", rememberEditStart);
    input.addEventListener("change", captureFieldUndo);
    input.addEventListener("input", updateRouteField);
  });
  document.querySelectorAll("[data-insert-after]").forEach((button) => {
    button.addEventListener("click", insertRouteRow);
  });
  document.querySelectorAll("[data-delete-row]").forEach((button) => {
    button.addEventListener("click", clearRouteContent);
  });
  document.querySelectorAll("[data-create-route]").forEach((button) => {
    button.addEventListener("click", createRouteContent);
  });
  document.querySelectorAll("[data-clear-time]").forEach((button) => {
    button.addEventListener("click", clearRouteTime);
  });
  document.querySelectorAll("[data-create-time]").forEach((button) => {
    button.addEventListener("click", createRouteTime);
  });
  document.querySelectorAll("[data-drag-index]").forEach((card) => {
    card.addEventListener("dragstart", startRouteDrag);
    card.addEventListener("dragenter", enterRouteDropTarget);
    card.addEventListener("dragover", moveOverRouteDropTarget);
    card.addEventListener("dragleave", leaveRouteDropTarget);
    card.addEventListener("drop", dropRouteCard);
    card.addEventListener("dragend", endRouteDrag);
  });
}

function renderRouteRow(step, index) {
  const isEditing = appState.routeMode === "edit";
  const hasTimeLabel = Boolean(String(step.time || "").trim());
  const hasRouteContent = Boolean(String(step.title || "").trim() || String(step.note || "").trim());
  return `
    <article class="route-row ${!hasTimeLabel ? "has-empty-time" : ""} ${!hasRouteContent ? "has-empty-route" : ""}">
      <div class="time-block">
        ${renderTimeBlockContent(step, index, isEditing, hasTimeLabel)}
      </div>
      <div class="route-block" ${isEditing && hasRouteContent ? `draggable="true" data-drag-index="${index}"` : ""}>
        ${isEditing
          ? renderEditableRouteContent(step, index)
          : renderRouteContent(step)}
      </div>
      ${isEditing && hasTimeLabel ? `
        <button class="delete-row-button" type="button" data-clear-time="${index}" aria-label="清空时间"></button>
      ` : ""}
    </article>
    ${isEditing && index < appState.trip.steps.length - 1 ? `
      <button class="insert-row-button" type="button" data-insert-after="${index}" aria-label="插入路线">+</button>
    ` : ""}
  `;
}

function renderTimeBlockContent(step, index, isEditing, hasTimeLabel) {
  if (isEditing && hasTimeLabel) {
    return `<input value="${escapeAttr(step.time)}" data-route-field="time" data-index="${index}" aria-label="时间">`;
  }
  if (isEditing && appState.activeEmptyTimeIndex === index) {
    return `<input value="" data-route-field="time" data-index="${index}" aria-label="时间">`;
  }
  if (isEditing && !hasTimeLabel) {
    return `<button class="create-time-button" type="button" data-create-time="${index}" aria-label="新增时间">+</button>`;
  }
  return `<span>${escapeHtml(step.time || "")}</span>`;
}

function renderRouteContent(step) {
  if (!String(step.title || "").trim() && !String(step.note || "").trim()) return "";
  return `
    <strong>${escapeHtml(step.title)}</strong>
    ${step.note ? `<p>${escapeHtml(step.note)}</p>` : ""}
  `;
}

function renderEditableRouteContent(step, index) {
  const hasRouteContent = Boolean(String(step.title || "").trim() || String(step.note || "").trim());
  if (!hasRouteContent && appState.activeEmptyRouteIndex !== index) {
    return `<button class="create-route-button" type="button" data-create-route="${index}" aria-label="新增路线内容">+</button>`;
  }
  return `
    ${hasRouteContent ? `<button class="delete-route-button" type="button" data-delete-row="${index}" aria-label="清空路线内容"></button>` : ""}
    <input class="route-title-input" value="${escapeAttr(step.title)}" data-route-field="title" data-index="${index}" draggable="false" aria-label="路线标题">
    <textarea rows="2" data-route-field="note" data-index="${index}" draggable="false" aria-label="路线说明">${escapeHtml(step.note)}</textarea>
    ${hasRouteContent ? `<span class="drag-handle-button" aria-hidden="true">≡</span>` : ""}
  `;
}

function rememberEditStart(event) {
  event.target.dataset.undoSnapshot = JSON.stringify(appState.trip);
}

function captureFieldUndo(event) {
  const snapshot = event.target.dataset.undoSnapshot;
  if (!snapshot) return;
  if (snapshot !== JSON.stringify(appState.trip)) {
    pushUndoSnapshot(JSON.parse(snapshot));
  }
  delete event.target.dataset.undoSnapshot;
}

function pushUndoSnapshot(snapshot = cloneTrip(appState.trip)) {
  appState.undoStack.push(snapshot);
  if (appState.undoStack.length > 30) appState.undoStack.shift();
  renderActionBar();
}

function undoLastEdit() {
  const previousTrip = appState.undoStack.pop();
  if (!previousTrip) return;
  appState.trip = previousTrip;
  appState.routeMode = "edit";
  renderRoutePage();
  renderActionBar();
}

function updateTripField(event) {
  appState.trip[event.target.dataset.tripField] = event.target.value;
}

function updateMetadataField(event) {
  appState.trip.metadata[Number(event.target.dataset.metadataIndex)] = event.target.value;
}

function updateRouteField(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.routeField;
  appState.trip.steps[index][field] = event.target.value;
  if (field === "time" && String(event.target.value || "").trim()) {
    appState.activeEmptyTimeIndex = null;
  }
  if (field !== "time" && String(event.target.value || "").trim()) {
    appState.activeEmptyRouteIndex = null;
  }
}

function insertRouteRow(event) {
  const index = Number(event.currentTarget.dataset.insertAfter);
  pushUndoSnapshot();
  appState.trip.steps.splice(index + 1, 0, {
    time: "",
    title: "",
    note: ""
  });
  renderRoutePage();
}

function clearRouteContent(event) {
  const index = Number(event.currentTarget.dataset.deleteRow);
  if (!appState.trip.steps[index]) return;
  pushUndoSnapshot();
  appState.trip.steps[index].title = "";
  appState.trip.steps[index].note = "";
  appState.activeEmptyRouteIndex = null;
  renderRoutePage();
}

function createRouteContent(event) {
  const index = Number(event.currentTarget.dataset.createRoute);
  if (!appState.trip.steps[index]) return;
  appState.activeEmptyRouteIndex = index;
  renderRoutePage();
}

function clearRouteTime(event) {
  const index = Number(event.currentTarget.dataset.clearTime);
  if (!appState.trip.steps[index] || !appState.trip.steps[index].time) return;
  pushUndoSnapshot();
  appState.trip.steps[index].time = "";
  appState.activeEmptyTimeIndex = null;
  renderRoutePage();
}

function createRouteTime(event) {
  const index = Number(event.currentTarget.dataset.createTime);
  if (!appState.trip.steps[index]) return;
  appState.activeEmptyTimeIndex = index;
  renderRoutePage();
}

function startRouteDrag(event) {
  const index = Number(event.currentTarget.dataset.dragIndex);
  appState.draggingRouteIndex = index;
  event.currentTarget.classList.add("is-dragging");
  event.currentTarget.closest(".route-row")?.classList.add("is-dragging-row");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(index));
}

function enterRouteDropTarget(event) {
  const targetCard = event.currentTarget;
  if (!hasDifferentDragTarget(targetCard)) return;
  targetCard.classList.add("is-drop-target");
  targetCard.closest(".route-row")?.classList.add("is-drop-target-row");
}

function moveOverRouteDropTarget(event) {
  if (!hasDifferentDragTarget(event.currentTarget)) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function leaveRouteDropTarget(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  event.currentTarget.classList.remove("is-drop-target");
  event.currentTarget.closest(".route-row")?.classList.remove("is-drop-target-row");
}

function dropRouteCard(event) {
  event.preventDefault();
  const sourceIndex = Number(event.dataTransfer.getData("text/plain") || appState.draggingRouteIndex);
  const targetIndex = Number(event.currentTarget.dataset.dragIndex);
  clearRouteDragClasses();
  if (!Number.isInteger(sourceIndex) || sourceIndex === targetIndex) return;
  moveRoutePayload(sourceIndex, targetIndex);
}

function endRouteDrag() {
  appState.draggingRouteIndex = null;
  clearRouteDragClasses();
}

function hasDifferentDragTarget(card) {
  return appState.draggingRouteIndex !== null && Number(card.dataset.dragIndex) !== appState.draggingRouteIndex;
}

function clearRouteDragClasses() {
  document.querySelectorAll(".is-dragging, .is-dragging-row, .is-drop-target, .is-drop-target-row").forEach((node) => {
    node.classList.remove("is-dragging", "is-dragging-row", "is-drop-target", "is-drop-target-row");
  });
}

function moveRoutePayload(sourceIndex, targetIndex) {
  if (!appState.trip.steps[sourceIndex] || !appState.trip.steps[targetIndex]) return;
  pushUndoSnapshot();
  if (!isFixedTimeStep(appState.trip.steps[sourceIndex]) && !isFixedTimeStep(appState.trip.steps[targetIndex])) {
    [appState.trip.steps[sourceIndex], appState.trip.steps[targetIndex]] = [appState.trip.steps[targetIndex], appState.trip.steps[sourceIndex]];
    renderRoutePage();
    return;
  }

  const currentRoute = {
    title: appState.trip.steps[sourceIndex].title,
    note: appState.trip.steps[sourceIndex].note
  };
  appState.trip.steps[sourceIndex].title = appState.trip.steps[targetIndex].title;
  appState.trip.steps[sourceIndex].note = appState.trip.steps[targetIndex].note;
  appState.trip.steps[targetIndex].title = currentRoute.title;
  appState.trip.steps[targetIndex].note = currentRoute.note;
  renderRoutePage();
}

function isFixedTimeStep(step) {
  return /^\d{1,2}:\d{2}$/.test(String(step.time || "").trim());
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

function renderTemplatePreview() {
  const template = templateOptions.find((option) => option.id === appState.selectedTemplate) || templateOptions[0];
  document.getElementById("toastMessage").textContent = "";
  document.getElementById("templatePreview").innerHTML = `
    <section class="preview-card">
      <p>${escapeHtml(template.title)}</p>
      <h2>${escapeHtml(appState.trip.title)}</h2>
      <div class="preview-route">
        ${appState.trip.steps.map((step) => `
          <div>
            <span>${escapeHtml(step.time || "节点")}</span>
            <strong>${escapeHtml(step.title)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

// Future route index iteration placeholder:
// keep route index out of the UI for this version, then reintroduce it here if navigation grows.

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
