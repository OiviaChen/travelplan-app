import React, { useEffect, useRef, useState } from "react";

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
    title: "详细版路线",
    subtitle: "适合A4打印"
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

function cleanRouteContent(value) {
  return String(value || "")
    .replace(/^[-—·,，。:：\s]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 42);
}

function isFixedTimeStep(step) {
  return /^\d{1,2}:\d{2}$/.test(String(step.time || "").trim());
}

function normalizePreviewText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildCardRouteStep(step) {
  const title = normalizePreviewText(step?.title);
  return title;
}

function buildCardRouteText(steps) {
  const routeSteps = (steps || []).map(buildCardRouteStep).filter(Boolean);
  if (!routeSteps.length) return "未填写路线";

  return routeSteps.map((step, index) => (index === 0 ? step : `→ ${step}`)).join("\n");
}

function buildCardMetadataText(trip) {
  const meta = trip?.meta || trip?.metadata;
  if (Array.isArray(meta)) return meta.map(normalizePreviewText).filter(Boolean).join(" ");
  return normalizePreviewText(meta);
}

function makeTripSignature(trip) {
  return JSON.stringify({
    title: trip?.title || "",
    meta: trip?.meta || trip?.metadata || "",
    steps: (trip?.steps || []).map((step) => ({
      time: step.time || "",
      title: step.title || "",
      note: step.note || ""
    }))
  });
}

function wrapCanvasText(context, text, maxWidth) {
  return String(text || "")
    .split("\n")
    .flatMap((line) => {
      const source = line || " ";
      const chars = Array.from(source);
      const lines = [];
      let current = "";

      chars.forEach((char) => {
        const next = `${current}${char}`;
        if (current && context.measureText(next).width > maxWidth) {
          lines.push(current);
          current = char;
        } else {
          current = next;
        }
      });

      lines.push(current);
      return lines;
    });
}

function getSafeDownloadName(value) {
  const name = normalizePreviewText(value).replace(/[\\/:*?"<>|]/g, "-");
  return name || "route-card";
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas export failed"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isMobileShareTarget() {
  const userAgent = navigator.userAgent || "";
  const isMobileUserAgent = /Android|iPhone|iPad|iPod/i.test(userAgent);
  const isCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  return Boolean(isMobileUserAgent || (isCoarsePointer && window.innerWidth <= 820));
}

function App() {
  const [screen, setScreen] = useState("home");
  const [routeMode, setRouteMode] = useState("view");
  const [selectedTemplate, setSelectedTemplate] = useState("detailed");
  const [undoStack, setUndoStack] = useState([]);
  const [draggingRouteIndex, setDraggingRouteIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [activeEmptyTimeIndex, setActiveEmptyTimeIndex] = useState(null);
  const [activeEmptyRouteIndex, setActiveEmptyRouteIndex] = useState(null);
  const [trip, setTrip] = useState(() => cloneTrip(defaultTrip));
  const [sourceText, setSourceText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const editSnapshotRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  const meta = screenMeta[screen];
  const isEditingRoute = screen === "route" && routeMode === "edit";

  function pushUndoSnapshot(snapshot = cloneTrip(trip)) {
    setUndoStack((current) => [...current, snapshot].slice(-30));
  }

  function goToScreen(nextScreen) {
    setScreen(nextScreen);
    if (nextScreen !== "route") setRouteMode("view");
    if (nextScreen === "preview") setToastMessage("");
  }

  function handleGenerateRoute() {
    setTrip(buildTripFromInput(sourceText));
    setRouteMode("view");
    setSelectedTemplate("detailed");
    goToScreen("route");
  }

  function chooseTemplate(templateId) {
    setSelectedTemplate(templateId);
    goToScreen("preview");
  }

  function handleBack() {
    const target = previousScreen[screen];
    if (!target || isEditingRoute) return;
    goToScreen(target);
  }

  function startEditMode() {
    setRouteMode("edit");
    setUndoStack([]);
  }

  function finishEditMode() {
    setRouteMode("view");
    setUndoStack([]);
    setActiveEmptyTimeIndex(null);
    setActiveEmptyRouteIndex(null);
  }

  function undoLastEdit() {
    setUndoStack((current) => {
      const previousTrip = current[current.length - 1];
      if (!previousTrip) return current;
      setTrip(previousTrip);
      setRouteMode("edit");
      return current.slice(0, -1);
    });
  }

  function createNewRoute() {
    setTrip(cloneTrip(defaultTrip));
    setRouteMode("view");
    setSelectedTemplate("detailed");
    setUndoStack([]);
    setActiveEmptyTimeIndex(null);
    setActiveEmptyRouteIndex(null);
    setSourceText("");
    setToastMessage("");
    goToScreen("home");
  }

  function rememberEditStart() {
    editSnapshotRef.current = JSON.stringify(trip);
  }

  function captureEditChangeUndo() {
    const snapshot = editSnapshotRef.current;
    if (!snapshot) return;
    pushUndoSnapshot(JSON.parse(snapshot));
    editSnapshotRef.current = null;
  }

  function captureFieldUndo() {
    editSnapshotRef.current = null;
  }

  function updateTripField(field, value) {
    captureEditChangeUndo();
    setTrip((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateMetadataField(index, value) {
    captureEditChangeUndo();
    setTrip((current) => ({
      ...current,
      metadata: current.metadata.map((item, itemIndex) => (itemIndex === index ? value : item))
    }));
  }

  function updateRouteField(index, field, value) {
    captureEditChangeUndo();
    setTrip((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, [field]: value } : step))
    }));

    if (field === "time" && String(value || "").trim()) {
      setActiveEmptyTimeIndex(null);
    }
    if (field !== "time" && String(value || "").trim()) {
      setActiveEmptyRouteIndex(null);
    }
  }

  function insertRouteRow(index) {
    pushUndoSnapshot();
    setTrip((current) => ({
      ...current,
      steps: [
        ...current.steps.slice(0, index + 1),
        { time: "", title: "", note: "" },
        ...current.steps.slice(index + 1)
      ]
    }));
  }

  function clearRouteContent(index) {
    if (!trip.steps[index]) return;
    pushUndoSnapshot();
    setTrip((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, title: "", note: "" } : step))
    }));
    setActiveEmptyRouteIndex(null);
  }

  function createRouteContent(index) {
    if (!trip.steps[index]) return;
    setActiveEmptyRouteIndex(index);
  }

  function clearRouteTime(index) {
    if (!trip.steps[index]?.time) return;
    pushUndoSnapshot();
    setTrip((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, time: "" } : step))
    }));
    setActiveEmptyTimeIndex(null);
  }

  function createRouteTime(index) {
    if (!trip.steps[index]) return;
    setActiveEmptyTimeIndex(index);
  }

  function startRouteDrag(event, index) {
    setDraggingRouteIndex(index);
    setDropTargetIndex(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function enterRouteDropTarget(index) {
    if (draggingRouteIndex === null || draggingRouteIndex === index) return;
    setDropTargetIndex(index);
  }

  function moveOverRouteDropTarget(event, index) {
    if (draggingRouteIndex === null || draggingRouteIndex === index) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function leaveRouteDropTarget(event, index) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDropTargetIndex((current) => (current === index ? null : current));
  }

  function dropRouteCard(event, targetIndex) {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("text/plain") || draggingRouteIndex);
    setDraggingRouteIndex(null);
    setDropTargetIndex(null);
    if (!Number.isInteger(sourceIndex) || sourceIndex === targetIndex) return;
    moveRoutePayload(sourceIndex, targetIndex);
  }

  function endRouteDrag() {
    setDraggingRouteIndex(null);
    setDropTargetIndex(null);
  }

  function moveRoutePayload(sourceIndex, targetIndex) {
    if (!trip.steps[sourceIndex] || !trip.steps[targetIndex]) return;
    pushUndoSnapshot();
    setTrip((current) => {
      const steps = current.steps.map((step) => ({ ...step }));
      if (!isFixedTimeStep(steps[sourceIndex]) && !isFixedTimeStep(steps[targetIndex])) {
        [steps[sourceIndex], steps[targetIndex]] = [steps[targetIndex], steps[sourceIndex]];
        return { ...current, steps };
      }

      const currentRoute = {
        title: steps[sourceIndex].title,
        note: steps[sourceIndex].note
      };
      steps[sourceIndex].title = steps[targetIndex].title;
      steps[sourceIndex].note = steps[targetIndex].note;
      steps[targetIndex].title = currentRoute.title;
      steps[targetIndex].note = currentRoute.note;
      return { ...current, steps };
    });
  }

  async function downloadSmallCard() {
    const card = document.getElementById("smallCardExport");
    if (!card) {
      setToastMessage("请先选择小卡路线图。");
      return;
    }

    setToastMessage("正在生成下载图片...");
    const title = card.querySelector(".small-card-title")?.value || "";
    const route = card.querySelector(".small-card-route")?.value || "";
    const meta = card.querySelector(".small-card-meta")?.value || "";
    const scale = Math.max(2, window.devicePixelRatio || 1);
    const cardWidth = Math.round(card.getBoundingClientRect().width || 354);
    const tabVisibleHeight = 55;
    const tabWidth = 255;
    const tabHeight = 57;
    const paddingX = 24;
    const paddingY = 32;
    const contentWidth = cardWidth - paddingX * 2;
    const titleFont = "700 20px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    const bodyFont = "700 16px Arial, PingFang SC, Microsoft YaHei, sans-serif";
    const titleLineHeight = 36;
    const bodyLineHeight = 29;
    const routeGap = 40;
    const metaGap = 16;
    const dividerHeight = 1;
    const background = "#dadada";

    const measureCanvas = document.createElement("canvas");
    const measureContext = measureCanvas.getContext("2d");
    measureContext.font = titleFont;
    const titleLines = wrapCanvasText(measureContext, title, contentWidth);
    measureContext.font = bodyFont;
    const routeLines = wrapCanvasText(measureContext, route, contentWidth);
    const metaLines = wrapCanvasText(measureContext, meta, contentWidth);
    const titleHeight = Math.max(titleLineHeight, titleLines.length * titleLineHeight);
    const routeHeight = Math.max(bodyLineHeight * 3, routeLines.length * bodyLineHeight);
    const metaHeight = Math.max(bodyLineHeight, metaLines.length * bodyLineHeight);
    const cardHeight =
      paddingY + titleHeight + dividerHeight + routeGap + routeHeight + routeGap + dividerHeight + metaGap + metaHeight + paddingY;
    const canvas = document.createElement("canvas");
    canvas.width = cardWidth * scale;
    canvas.height = (tabVisibleHeight + cardHeight) * scale;
    const context = canvas.getContext("2d");
    context.scale(scale, scale);

    context.fillStyle = background;
    context.beginPath();
    context.moveTo(10, 0);
    context.lineTo(tabWidth - 10, 0);
    context.lineTo(tabWidth, tabHeight);
    context.lineTo(0, tabHeight);
    context.closePath();
    context.fill();
    context.fillRect(0, tabVisibleHeight, cardWidth, cardHeight);

    function drawLines(lines, x, y, font, lineHeight) {
      context.fillStyle = "#000";
      context.font = font;
      context.textBaseline = "top";
      lines.forEach((line, index) => {
        context.fillText(line, x, y + index * lineHeight);
      });
    }

    let y = tabVisibleHeight + paddingY;
    drawLines(titleLines, paddingX, y, titleFont, titleLineHeight);
    y += titleHeight;
    context.fillRect(paddingX, y, contentWidth, dividerHeight);
    y += dividerHeight + routeGap;
    drawLines(routeLines, paddingX, y, bodyFont, bodyLineHeight);
    y += routeHeight + routeGap;
    context.fillRect(paddingX, y, contentWidth, dividerHeight);
    y += dividerHeight + metaGap;
    drawLines(metaLines, paddingX, y, bodyFont, bodyLineHeight);

    const filename = `${getSafeDownloadName(title || trip.title)}.png`;
    try {
      const blob = await canvasToPngBlob(canvas);
      const file = new File([blob], filename, { type: "image/png" });

      if (isMobileShareTarget() && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: filename,
          text: "保存这张路线小卡"
        });
        setToastMessage("已打开保存面板，可选择存储图像到相册。");
        return;
      }

      triggerBrowserDownload(blob, filename);
      setToastMessage("已开始下载，请在浏览器下载记录中查看。");
    } catch (error) {
      if (error?.name === "AbortError") {
        setToastMessage("已取消保存。");
        return;
      }
      setToastMessage("下载失败，请稍后再试。");
    }
  }

  return (
    <div className="app-shell" data-screen={screen}>
      <AppHeader
        title={meta.title}
        progress={meta.progress}
        showBack={screen !== "home"}
        backDisabled={isEditingRoute}
        onBack={handleBack}
      />

      <main className="app-main">
        <HomeScreen
          isActive={screen === "home"}
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          onGenerate={handleGenerateRoute}
        />
        <RouteScreen
          activeEmptyRouteIndex={activeEmptyRouteIndex}
          activeEmptyTimeIndex={activeEmptyTimeIndex}
          draggingRouteIndex={draggingRouteIndex}
          dropTargetIndex={dropTargetIndex}
          isActive={screen === "route"}
          onCaptureFieldUndo={captureFieldUndo}
          onClearRouteContent={clearRouteContent}
          onClearRouteTime={clearRouteTime}
          onCreateRouteContent={createRouteContent}
          onCreateRouteTime={createRouteTime}
          onDropRouteCard={dropRouteCard}
          onEndRouteDrag={endRouteDrag}
          onEnterRouteDropTarget={enterRouteDropTarget}
          onInsertRouteRow={insertRouteRow}
          onLeaveRouteDropTarget={leaveRouteDropTarget}
          onMoveOverRouteDropTarget={moveOverRouteDropTarget}
          onRememberEditStart={rememberEditStart}
          onStartRouteDrag={startRouteDrag}
          onUpdateMetadataField={updateMetadataField}
          onUpdateRouteField={updateRouteField}
          onUpdateTripField={updateTripField}
          routeMode={routeMode}
          trip={trip}
        />
        <TemplateScreen
          isActive={screen === "template"}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={chooseTemplate}
        />
        <PreviewScreen
          isActive={screen === "preview"}
          selectedTemplate={selectedTemplate}
          toastMessage={toastMessage}
          trip={trip}
        />
      </main>

      <BottomBar
        canUndo={undoStack.length > 0}
        routeMode={routeMode}
        screen={screen}
        onCreateNewRoute={createNewRoute}
        onDownload={downloadSmallCard}
        onFinishEdit={finishEditMode}
        onGoToScreen={goToScreen}
        onStartEdit={startEditMode}
        onUndo={undoLastEdit}
      />
    </div>
  );
}

function AppHeader({ title, progress, showBack, backDisabled, onBack }) {
  return (
    <header className="app-header">
      <button
        className={`back-icon-button ${showBack ? "is-visible" : ""}`}
        id="headerBackButton"
        type="button"
        aria-label="返回上一页"
        aria-disabled={String(backDisabled)}
        disabled={backDisabled}
        onClick={onBack}
      >
        &lt;
      </button>
      <div className="header-copy">
        <h1 id="screenTitle">{title}</h1>
        <div className="progress-segments" id="progressSegments" aria-label="进度">
          {[0, 1, 2].map((index) => (
            <span className={index < progress ? "is-active" : ""} key={index} />
          ))}
        </div>
      </div>
    </header>
  );
}

function HomeScreen({ isActive, sourceText, onSourceTextChange, onGenerate }) {
  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-home">
      <h2 className="home-title">你想去哪里?</h2>
      <label className="home-input-block">
        <textarea
          id="sourceText"
          rows="14"
          placeholder={homePlaceholder}
          value={sourceText}
          onChange={(event) => onSourceTextChange(event.target.value)}
        />
      </label>
      <div className="home-action-row">
        <button className="primary-button" id="generateButton" type="button" onClick={onGenerate}>
          生成路线
        </button>
      </div>
    </section>
  );
}

function RouteScreen({
  activeEmptyRouteIndex,
  activeEmptyTimeIndex,
  draggingRouteIndex,
  dropTargetIndex,
  isActive,
  onCaptureFieldUndo,
  onClearRouteContent,
  onClearRouteTime,
  onCreateRouteContent,
  onCreateRouteTime,
  onDropRouteCard,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onInsertRouteRow,
  onLeaveRouteDropTarget,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onUpdateMetadataField,
  onUpdateRouteField,
  onUpdateTripField,
  routeMode,
  trip
}) {
  const isEditing = routeMode === "edit";

  return (
    <section className={`screen ${isActive ? "is-active" : ""} ${isEditing ? "is-editing" : ""}`} id="screen-route">
      <section className="route-hero">
        <h2 id="tripTitle">
          {isEditing ? (
            <input
              className="trip-title-input"
              value={trip.title}
              data-trip-field="title"
              aria-label="路线名称"
              onBlur={onCaptureFieldUndo}
              onChange={(event) => onUpdateTripField("title", event.target.value)}
              onFocus={onRememberEditStart}
            />
          ) : (
            trip.title
          )}
        </h2>
        <div className="metadata-chips" aria-label="路线标签">
          {trip.metadata.map((item, index) => (
            <span key={index}>
              {isEditing ? (
                <input
                  value={item}
                  data-metadata-index={index}
                  aria-label={`路线标签 ${index + 1}`}
                  onBlur={onCaptureFieldUndo}
                  onChange={(event) => onUpdateMetadataField(index, event.target.value)}
                  onFocus={onRememberEditStart}
                />
              ) : (
                item
              )}
            </span>
          ))}
        </div>
      </section>
      <div id="routeEditor">
        <div className={`route-list ${isEditing ? "is-editing" : ""}`}>
          {trip.steps.map((step, index) => (
            <RouteRow
              activeEmptyRouteIndex={activeEmptyRouteIndex}
              activeEmptyTimeIndex={activeEmptyTimeIndex}
              draggingRouteIndex={draggingRouteIndex}
              dropTargetIndex={dropTargetIndex}
              index={index}
              isEditing={isEditing}
              isLast={index === trip.steps.length - 1}
              key={index}
              onCaptureFieldUndo={onCaptureFieldUndo}
              onClearRouteContent={onClearRouteContent}
              onClearRouteTime={onClearRouteTime}
              onCreateRouteContent={onCreateRouteContent}
              onCreateRouteTime={onCreateRouteTime}
              onDropRouteCard={onDropRouteCard}
              onEndRouteDrag={onEndRouteDrag}
              onEnterRouteDropTarget={onEnterRouteDropTarget}
              onInsertRouteRow={onInsertRouteRow}
              onLeaveRouteDropTarget={onLeaveRouteDropTarget}
              onMoveOverRouteDropTarget={onMoveOverRouteDropTarget}
              onRememberEditStart={onRememberEditStart}
              onStartRouteDrag={onStartRouteDrag}
              onUpdateRouteField={onUpdateRouteField}
              step={step}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RouteRow({
  activeEmptyRouteIndex,
  activeEmptyTimeIndex,
  draggingRouteIndex,
  dropTargetIndex,
  index,
  isEditing,
  isLast,
  onCaptureFieldUndo,
  onClearRouteContent,
  onClearRouteTime,
  onCreateRouteContent,
  onCreateRouteTime,
  onDropRouteCard,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onInsertRouteRow,
  onLeaveRouteDropTarget,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onUpdateRouteField,
  step
}) {
  const hasTimeLabel = Boolean(String(step.time || "").trim());
  const hasRouteContent = Boolean(String(step.title || "").trim() || String(step.note || "").trim());
  const rowClasses = [
    "route-row",
    !hasTimeLabel ? "has-empty-time" : "",
    !hasRouteContent ? "has-empty-route" : "",
    !hasTimeLabel && activeEmptyTimeIndex === index ? "is-filling-empty-time" : "",
    draggingRouteIndex === index ? "is-dragging-row" : "",
    dropTargetIndex === index ? "is-drop-target-row" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <article className={rowClasses}>
        <div className="time-block">
          <TimeBlock
            activeEmptyTimeIndex={activeEmptyTimeIndex}
            hasTimeLabel={hasTimeLabel}
            index={index}
            isEditing={isEditing}
            onCaptureFieldUndo={onCaptureFieldUndo}
            onCreateRouteTime={onCreateRouteTime}
            onRememberEditStart={onRememberEditStart}
            onUpdateRouteField={onUpdateRouteField}
            step={step}
          />
        </div>
        <RouteBlock
          activeEmptyRouteIndex={activeEmptyRouteIndex}
          draggingRouteIndex={draggingRouteIndex}
          dropTargetIndex={dropTargetIndex}
          hasRouteContent={hasRouteContent}
          index={index}
          isEditing={isEditing}
          onCaptureFieldUndo={onCaptureFieldUndo}
          onClearRouteContent={onClearRouteContent}
          onCreateRouteContent={onCreateRouteContent}
          onDropRouteCard={onDropRouteCard}
          onEndRouteDrag={onEndRouteDrag}
          onEnterRouteDropTarget={onEnterRouteDropTarget}
          onLeaveRouteDropTarget={onLeaveRouteDropTarget}
          onMoveOverRouteDropTarget={onMoveOverRouteDropTarget}
          onRememberEditStart={onRememberEditStart}
          onStartRouteDrag={onStartRouteDrag}
          onUpdateRouteField={onUpdateRouteField}
          step={step}
        />
        {isEditing && hasTimeLabel ? (
          <button
            className="delete-row-button"
            type="button"
            data-clear-time={index}
            aria-label="清空时间"
            onClick={() => onClearRouteTime(index)}
          />
        ) : null}
      </article>
      {isEditing && !isLast ? (
        <button
          className="insert-row-button"
          type="button"
          data-insert-after={index}
          aria-label="插入路线"
          onClick={() => onInsertRouteRow(index)}
        >
          +
        </button>
      ) : null}
    </>
  );
}

function TimeBlock({
  activeEmptyTimeIndex,
  hasTimeLabel,
  index,
  isEditing,
  onCaptureFieldUndo,
  onCreateRouteTime,
  onRememberEditStart,
  onUpdateRouteField,
  step
}) {
  if (isEditing && (hasTimeLabel || activeEmptyTimeIndex === index)) {
    return (
      <input
        value={step.time}
        data-route-field="time"
        data-index={index}
        aria-label="时间"
        onBlur={onCaptureFieldUndo}
        onChange={(event) => onUpdateRouteField(index, "time", event.target.value)}
        onFocus={onRememberEditStart}
      />
    );
  }

  if (isEditing && !hasTimeLabel) {
    return (
      <button className="create-time-button" type="button" data-create-time={index} aria-label="新增时间" onClick={() => onCreateRouteTime(index)}>
        +
      </button>
    );
  }

  return <span>{step.time || ""}</span>;
}

function RouteBlock({
  activeEmptyRouteIndex,
  draggingRouteIndex,
  dropTargetIndex,
  hasRouteContent,
  index,
  isEditing,
  onCaptureFieldUndo,
  onClearRouteContent,
  onCreateRouteContent,
  onDropRouteCard,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onLeaveRouteDropTarget,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onUpdateRouteField,
  step
}) {
  const classes = [
    "route-block",
    !hasRouteContent && activeEmptyRouteIndex === index ? "is-filling-empty-route" : "",
    draggingRouteIndex === index ? "is-dragging" : "",
    dropTargetIndex === index ? "is-drop-target" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      draggable={isEditing && hasRouteContent}
      data-drag-index={isEditing && hasRouteContent ? index : undefined}
      onDragEnd={isEditing && hasRouteContent ? onEndRouteDrag : undefined}
      onDragEnter={isEditing && hasRouteContent ? () => onEnterRouteDropTarget(index) : undefined}
      onDragLeave={isEditing && hasRouteContent ? (event) => onLeaveRouteDropTarget(event, index) : undefined}
      onDragOver={isEditing && hasRouteContent ? (event) => onMoveOverRouteDropTarget(event, index) : undefined}
      onDragStart={isEditing && hasRouteContent ? (event) => onStartRouteDrag(event, index) : undefined}
      onDrop={isEditing && hasRouteContent ? (event) => onDropRouteCard(event, index) : undefined}
    >
      {isEditing ? (
        <EditableRouteContent
          activeEmptyRouteIndex={activeEmptyRouteIndex}
          hasRouteContent={hasRouteContent}
          index={index}
          onCaptureFieldUndo={onCaptureFieldUndo}
          onClearRouteContent={onClearRouteContent}
          onCreateRouteContent={onCreateRouteContent}
          onRememberEditStart={onRememberEditStart}
          onUpdateRouteField={onUpdateRouteField}
          step={step}
        />
      ) : (
        <RouteContent step={step} />
      )}
    </div>
  );
}

function RouteContent({ step }) {
  if (!String(step.title || "").trim() && !String(step.note || "").trim()) return null;

  return (
    <>
      <strong>{step.title}</strong>
      {step.note ? <p>{step.note}</p> : null}
    </>
  );
}

function EditableRouteContent({
  activeEmptyRouteIndex,
  hasRouteContent,
  index,
  onCaptureFieldUndo,
  onClearRouteContent,
  onCreateRouteContent,
  onRememberEditStart,
  onUpdateRouteField,
  step
}) {
  if (!hasRouteContent && activeEmptyRouteIndex !== index) {
    return (
      <button className="create-route-button" type="button" data-create-route={index} aria-label="新增路线内容" onClick={() => onCreateRouteContent(index)}>
        +
      </button>
    );
  }

  return (
    <>
      {hasRouteContent ? (
        <button
          className="delete-route-button"
          type="button"
          data-delete-row={index}
          aria-label="清空路线内容"
          onClick={() => onClearRouteContent(index)}
        />
      ) : null}
      <input
        className="route-title-input"
        value={step.title}
        data-route-field="title"
        data-index={index}
        draggable="false"
        aria-label="路线标题"
        onBlur={onCaptureFieldUndo}
        onChange={(event) => onUpdateRouteField(index, "title", event.target.value)}
        onFocus={onRememberEditStart}
      />
      <textarea
        rows="2"
        value={step.note}
        data-route-field="note"
        data-index={index}
        draggable="false"
        aria-label="路线说明"
        onBlur={onCaptureFieldUndo}
        onChange={(event) => onUpdateRouteField(index, "note", event.target.value)}
        onFocus={onRememberEditStart}
      />
      {hasRouteContent ? <span className="drag-handle-button" aria-hidden="true">≡</span> : null}
    </>
  );
}

function TemplateScreen({ isActive, selectedTemplate, onSelectTemplate }) {
  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-template">
      <div className="template-stack" id="templateStack">
        {templateOptions.map((template) => (
          <button
            className={`template-card ${template.id === selectedTemplate ? "is-selected" : ""}`}
            type="button"
            data-template={template.id}
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
          >
            <span>
              <b>{template.title}</b>
              <small>{template.subtitle}</small>
            </span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function PreviewScreen({ isActive, selectedTemplate, toastMessage, trip }) {
  const template = templateOptions.find((option) => option.id === selectedTemplate) || templateOptions[0];
  const tripSignature = makeTripSignature(trip);
  const isCardTemplate = selectedTemplate === "card";
  const [cardText, setCardText] = useState(() => ({
    title: trip.title || "",
    route: buildCardRouteText(trip.steps),
    meta: buildCardMetadataText(trip)
  }));

  useEffect(() => {
    if (!isActive) return;
    setCardText({
      title: trip.title || "",
      route: buildCardRouteText(trip.steps),
      meta: buildCardMetadataText(trip)
    });
  }, [isActive, tripSignature]);

  function updateCardField(field, value) {
    setCardText((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-preview">
      <div id="templatePreview">
        {isCardTemplate ? (
          <section className="small-card-stage" aria-label={template.title}>
            <article className="sticky-route-card" id="smallCardExport">
              <input
                className="small-card-field small-card-title"
                value={cardText.title}
                aria-label="小卡路线标题"
                onChange={(event) => updateCardField("title", event.target.value)}
              />
              <div className="small-card-divider" aria-hidden="true" />
              <textarea
                className="small-card-field small-card-route"
                value={cardText.route}
                rows={Math.max(3, cardText.route.split("\n").length)}
                aria-label="小卡路线内容"
                onChange={(event) => updateCardField("route", event.target.value)}
              />
              <div className="small-card-divider" aria-hidden="true" />
              <textarea
                className="small-card-field small-card-meta"
                value={cardText.meta}
                rows={Math.max(1, cardText.meta.split("\n").length)}
                aria-label="小卡路线信息"
                onChange={(event) => updateCardField("meta", event.target.value)}
              />
            </article>
          </section>
        ) : (
          <section className="preview-card">
            <p>{template.title}</p>
            <h2>{trip.title}</h2>
            <div className="preview-route">
              {trip.steps.map((step, index) => (
                <div key={index}>
                  <span>{step.time || "节点"}</span>
                  <strong>{step.title}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <p className="status-message" id="toastMessage" aria-live="polite">
        {toastMessage}
      </p>
    </section>
  );
}

function BottomBar({ canUndo, routeMode, screen, onCreateNewRoute, onDownload, onFinishEdit, onGoToScreen, onStartEdit, onUndo }) {
  const actionKey = screen === "route" ? `route-${routeMode}` : screen;

  return (
    <footer className="app-bottom-bar">
      <div className={`button-row two-up ${actionKey === "route-view" ? "is-active" : ""}`} data-actions-for="route-view">
        <button className="secondary-button" id="editRouteButton" type="button" onClick={onStartEdit}>
          修改
        </button>
        <button className="primary-button" data-go="template" type="button" onClick={() => onGoToScreen("template")}>
          生成路线图
        </button>
      </div>
      <div className={`button-row two-up ${actionKey === "route-edit" ? "is-active" : ""}`} data-actions-for="route-edit">
        <button className="secondary-button" id="cancelEditButton" type="button" disabled={!canUndo} onClick={onUndo}>
          撤回
        </button>
        <button className="primary-button" id="finishEditButton" type="button" onClick={onFinishEdit}>
          完成
        </button>
      </div>
      <div className={`button-row two-up ${actionKey === "preview" ? "is-active" : ""}`} data-actions-for="preview">
        <button className="secondary-button" id="createNewButton" type="button" onClick={onCreateNewRoute}>
          创建新路线
        </button>
        <button className="primary-button" id="downloadButton" type="button" onClick={onDownload}>
          下载
        </button>
      </div>
    </footer>
  );
}

export default App;
