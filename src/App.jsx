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
    subtitle: "适合A4打印",
    disabled: true
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

const timelineSizeOptions = [
  {
    id: "passport",
    label: "TN 护照尺寸",
    widthMm: 89,
    heightMm: 124
  },
  {
    id: "standard",
    label: "TN 标准尺寸",
    widthMm: 110,
    heightMm: 210
  }
];

const purposeOptions = [
  {
    id: "detailed",
    title: "详细旅行行程",
    subtitle: "出行前打印详细路线",
    templateId: "detailed",
    disabled: true
  },
  {
    id: "card",
    title: "行程小卡",
    subtitle: "随身携带/总结行程",
    templateId: "card"
  },
  {
    id: "timeline",
    title: "时间轴",
    subtitle: "旅行手帐",
    templateId: "timeline",
    disabled: true
  }
];

const sampleTripText = [
  "上海出发去杭州西湖城市徒步。",
  ...defaultTrip.steps.map((step) => `${step.time} ${step.title} - ${step.note}`)
].join("\n");

const homePlaceholder = "（有内置测试文字，可直接生成路线体验）\n将文字攻略或者视频逐字稿粘贴进来，\n我将帮你生成旅行路线~";

const routeGenerationStages = ["正在读取攻略…", "正在提取路线节点…", "正在整理成路线卡…"];

const screenMeta = {
  purpose: { title: "走走自然", progress: 0 },
  home: { title: "导入行程", progress: 1 },
  route: { title: "路线编辑", progress: 2 },
  template: { title: "选择模版", progress: 2 },
  templateEdit: { title: "打印编辑", progress: 3 },
  preview: { title: "打印预览", progress: 4 }
};

const previousScreen = {
  home: "purpose",
  route: "home",
  template: "preview",
  templateEdit: "route",
  preview: "templateEdit"
};

function cloneTrip(trip) {
  return JSON.parse(JSON.stringify(trip));
}

function getUtf8ByteLength(value) {
  return new TextEncoder().encode(String(value || "")).length;
}

function inferTripTitle(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => cleanRouteContent(line))
    .filter(Boolean);
  const firstLine = lines[0] || "";
  const destinationMatch = firstLine.match(/(?:去|到|游|逛)([^，。,.、\s]{2,16})/);
  if (destinationMatch) return `${destinationMatch[1]}路线`;
  return firstLine.slice(0, 18) || "旅行路线";
}

function buildTripFromInput(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) return cloneTrip(defaultTrip);

  const sourceForParsing =
    getUtf8ByteLength(normalizedValue) < 30 ? `${normalizedValue}\n${sampleTripText}` : normalizedValue;

  const lines = sourceForParsing
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: inferTripTitle(sourceForParsing),
    metadata: [inferDifficulty(sourceForParsing), inferRouteType(sourceForParsing), inferDistanceLabel(sourceForParsing)],
    steps: lines.slice(0, 8).map(parseRouteLine).map(normalizeRouteStep)
  };
}

async function analyzeRouteWithApi(sourceText) {
  const response = await fetch("/api/analyze-route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: sourceText })
  });

  if (!response.ok) {
    throw new Error("Route analysis request failed");
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(data.error);
  }

  return normalizeAiTrip(data, sourceText);
}

function normalizeAiTrip(aiResult, sourceText) {
  const routeItems = Array.isArray(aiResult?.routeItems) ? aiResult.routeItems : [];
  const steps = routeItems
    .map((item) =>
      normalizeRouteStep({
        time: cleanRouteContent(item?.time).slice(0, 12),
        title: cleanRouteContent(item?.title),
        note: cleanRouteContent(item?.note).slice(0, 20)
      })
    )
    .filter((step) => step.title);

  if (!steps.length) {
    throw new Error("Route analysis returned no route items");
  }

  const meta = aiResult?.meta || {};
  const difficulty = cleanRouteContent(meta.difficulty) || inferDifficulty(sourceText);
  const routeType = cleanRouteContent(meta.type) || inferRouteType(sourceText);
  const distance = cleanRouteContent(meta.distance) || inferDistanceLabel(sourceText);
  const duration = cleanRouteContent(meta.duration);

  return {
    title: cleanRouteContent(aiResult?.title) || inferTripTitle(sourceText),
    metadata: [difficulty, routeType, distance],
    routeMeta: {
      type: routeType,
      distance,
      duration
    },
    steps
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

function extractDurationValue(value) {
  const source = normalizePreviewText(value)
    .replace(/[()（）]/g, "")
    .replace(/^(?:预计|大约|约|大概|耗时|用时|时长|需要)+\s*/, "")
    .replace(/^(?:预计|大约|约|大概)?\s*(?:耗时|用时|时长|需要)\s*/, "");
  const durationMatch = source.match(/(\d+(?:\.\d+)?(?:\s*[-~～至到]\s*\d+(?:\.\d+)?)?\s*(?:分钟|分|小时|钟头|h|hr|hrs|min|mins))/i);
  if (!durationMatch) return "";

  return durationMatch[1]
    .replace(/\s*([-~～至到])\s*/g, "$1")
    .replace(/\s+(分钟|分|小时|钟头|h|hr|hrs|min|mins)$/i, "$1")
    .trim();
}

function isDurationLabel(value) {
  const normalizedValue = normalizePreviewText(value);
  return Boolean(normalizedValue && extractDurationValue(normalizedValue));
}

function formatDurationNote(value) {
  const durationValue = extractDurationValue(value);
  return durationValue ? `（约耗时${durationValue}）` : "";
}

function appendDurationToText(text, durationNote) {
  const normalizedText = String(text || "").trim();
  if (!durationNote) return normalizedText;
  const durationValue = durationNote.replace(/^（约耗时/, "").replace(/）$/, "");
  if (normalizedText.includes(durationNote) || normalizedText.includes(`约耗时${durationValue}`)) return normalizedText;
  return `${normalizedText}${durationNote}`;
}

function normalizeRouteStep(step) {
  const nextStep = { ...step };
  if (!isDurationLabel(nextStep.time)) return nextStep;

  const durationNote = formatDurationNote(nextStep.time);
  nextStep.time = "";

  if (normalizePreviewText(nextStep.direction)) {
    nextStep.direction = appendDurationToText(nextStep.direction, durationNote);
  } else {
    nextStep.title = appendDurationToText(nextStep.title, durationNote);
  }

  return nextStep;
}

function isFixedTimeStep(step) {
  return /^\d{1,2}:\d{2}$/.test(String(step.time || "").trim());
}

function normalizePreviewText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isKnownRouteMeta(value) {
  const normalizedValue = normalizePreviewText(value);
  return Boolean(normalizedValue && normalizedValue !== "未知" && normalizedValue !== "-km");
}

function createGeneratedSummary(trip) {
  const routeItemsLength = Array.isArray(trip?.steps) ? trip.steps.length : 0;
  const meta = trip?.routeMeta || {};

  return {
    count: routeItemsLength,
    type: isKnownRouteMeta(meta.type) ? meta.type : "",
    distance: isKnownRouteMeta(meta.distance) ? meta.distance : "",
    duration: isKnownRouteMeta(meta.duration) ? meta.duration : ""
  };
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getRouteMainText(step) {
  return step?.direction || step?.title || "";
}

function buildCardRouteStep(step) {
  const title = normalizePreviewText(getRouteMainText(step));
  return title;
}

function buildCardRouteText(steps) {
  const routeSteps = (steps || []).map(normalizeRouteStep).map(buildCardRouteStep).filter(Boolean);
  if (!routeSteps.length) return "未填写路线";

  return routeSteps.map((step, index) => (index === 0 ? step : `→ ${step}`)).join("\n");
}

function buildCardMetadataText(trip) {
  const meta = trip?.meta || trip?.metadata;
  if (Array.isArray(meta)) return meta.map(normalizePreviewText).filter(Boolean).join(" ");
  return normalizePreviewText(meta);
}

function buildDetailedRouteText(steps) {
  const detailSteps = (steps || [])
    .map(normalizeRouteStep)
    .map((step) => {
      const time = normalizePreviewText(step?.time);
      const title = normalizePreviewText(getRouteMainText(step));
      const note = normalizePreviewText(step?.note);
      if (!title && !note) return "";
      return [time, title, note].filter(Boolean).join("｜");
    })
    .filter(Boolean);
  return detailSteps.length ? detailSteps.join("\n") : "未填写路线";
}

function buildTimelineRouteText(steps) {
  const timelineSteps = (steps || [])
    .map(normalizeRouteStep)
    .map((step) => {
      const time = normalizePreviewText(step?.time);
      const title = normalizePreviewText(getRouteMainText(step));
      if (!title) return "";
      return isFixedTimeStep(step) ? `${time}  ${title}` : title;
    })
    .filter(Boolean);
  return timelineSteps.length ? timelineSteps.join("\n") : "未填写路线";
}

function getTimelineSizeOption(sizeId) {
  return timelineSizeOptions.find((option) => option.id === sizeId) || timelineSizeOptions[0];
}

function getNextTimelineSizeId(currentSizeId, direction = 1) {
  const currentIndex = timelineSizeOptions.findIndex((option) => option.id === currentSizeId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + timelineSizeOptions.length) % timelineSizeOptions.length;
  return timelineSizeOptions[nextIndex].id;
}

function parseTimelineLine(line) {
  const source = String(line || "").replace(/\s+/g, " ").trim();
  const timeMatch = source.match(/^(\d{1,2}[:：]\d{2})\s*(.*)$/);
  if (!source) return null;

  return {
    hasTime: Boolean(timeMatch),
    time: timeMatch ? timeMatch[1].replace("：", ":") : "",
    text: timeMatch ? normalizePreviewText(timeMatch[2]) : source
  };
}

function getTimelineItems(routeText) {
  const items = String(routeText || "")
    .split("\n")
    .map(parseTimelineLine)
    .filter(Boolean);
  return items.length ? items : [{ hasTime: false, time: "", text: "未填写路线" }];
}

function createTemplateDraft(trip, templateId = "card") {
  const metadata = buildCardMetadataText(trip);
  const title = trip?.title || "";
  const steps = (trip?.steps || []).map(normalizeRouteStep);
  const routeBuilders = {
    detailed: () => buildDetailedRouteText(steps),
    card: () => buildCardRouteText(steps),
    timeline: () => buildTimelineRouteText(steps)
  };
  const metaBuilders = {
    detailed: () => `${metadata}\n适合 A4 打印，可保留详细交通、停留和提醒。`.trim(),
    card: () => metadata,
    timeline: () => `${metadata}\n按时间顺序查看每个节点。`.trim()
  };

  return {
    title,
    route: (routeBuilders[templateId] || routeBuilders.card)(),
    meta: (metaBuilders[templateId] || metaBuilders.card)(),
    visible: {
      title: true,
      route: true,
      meta: true
    }
  };
}

function createTemplateDrafts(trip) {
  return templateOptions.reduce((drafts, template) => {
    drafts[template.id] = createTemplateDraft(trip, template.id);
    return drafts;
  }, {});
}

function syncTemplateDraftsWithTrip(currentDrafts, trip) {
  return templateOptions.reduce((drafts, template) => {
    const previousDraft = currentDrafts[template.id];
    const nextDraft = createTemplateDraft(trip, template.id);
    drafts[template.id] = {
      ...nextDraft,
      visible: previousDraft?.visible || nextDraft.visible
    };
    return drafts;
  }, {});
}

function getVisibleTemplateText(templateDraft) {
  const draft = templateDraft || createTemplateDraft(defaultTrip);
  return {
    title: draft.visible?.title ? draft.title : "",
    route: draft.visible?.route ? draft.route : "",
    meta: draft.visible?.meta ? draft.meta : ""
  };
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    function handleChange(event) {
      setMatches(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

function getTemplateShortTitle(templateId) {
  if (templateId === "card") return "小卡";
  if (templateId === "timeline") return "时间轴";
  return "详细版路线";
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

const routeCardExportBase = {
  width: 354,
  tabVisibleHeight: 55,
  tabWidth: 255,
  tabHeight: 57,
  tabInset: 10,
  paddingX: 24,
  paddingY: 32,
  titleSize: 20,
  bodySize: 16,
  titleLineHeight: 36,
  bodyLineHeight: 29,
  routeGap: 40,
  metaGap: 16,
  dividerHeight: 1,
  background: "#dadada",
  text: "#000"
};

const printExportSize = {
  a4Width: 2480,
  a4Height: 3508,
  cardWidth: 850,
  firstCardX: 200,
  secondCardX: 1130,
  cardY: 360,
  helperX: 200,
  helperY: 200,
  helperLineGap: 84,
  helperFontSize: 50
};

function drawRouteCard(context, { x, y, width, title, route, meta }) {
  const ratio = width / routeCardExportBase.width;
  const tabVisibleHeight = routeCardExportBase.tabVisibleHeight * ratio;
  const tabWidth = routeCardExportBase.tabWidth * ratio;
  const tabHeight = routeCardExportBase.tabHeight * ratio;
  const tabInset = routeCardExportBase.tabInset * ratio;
  const paddingX = routeCardExportBase.paddingX * ratio;
  const paddingY = routeCardExportBase.paddingY * ratio;
  const contentWidth = width - paddingX * 2;
  const titleFont = `700 ${routeCardExportBase.titleSize * ratio}px Arial, PingFang SC, Microsoft YaHei, sans-serif`;
  const bodyFont = `700 ${routeCardExportBase.bodySize * ratio}px Arial, PingFang SC, Microsoft YaHei, sans-serif`;
  const titleLineHeight = routeCardExportBase.titleLineHeight * ratio;
  const bodyLineHeight = routeCardExportBase.bodyLineHeight * ratio;
  const routeGap = routeCardExportBase.routeGap * ratio;
  const metaGap = routeCardExportBase.metaGap * ratio;
  const dividerHeight = Math.max(1, routeCardExportBase.dividerHeight * ratio);

  const sections = [];
  if (normalizePreviewText(title)) {
    context.font = titleFont;
    sections.push({
      kind: "title",
      lines: wrapCanvasText(context, title, contentWidth),
      font: titleFont,
      lineHeight: titleLineHeight
    });
  }
  if (normalizePreviewText(route)) {
    context.font = bodyFont;
    sections.push({
      kind: "route",
      lines: wrapCanvasText(context, route, contentWidth),
      font: bodyFont,
      lineHeight: bodyLineHeight,
      minHeight: bodyLineHeight * 3
    });
  }
  if (normalizePreviewText(meta)) {
    context.font = bodyFont;
    sections.push({
      kind: "meta",
      lines: wrapCanvasText(context, meta, contentWidth),
      font: bodyFont,
      lineHeight: bodyLineHeight
    });
  }
  if (!sections.length) {
    context.font = bodyFont;
    sections.push({
      kind: "route",
      lines: wrapCanvasText(context, "未填写路线", contentWidth),
      font: bodyFont,
      lineHeight: bodyLineHeight,
      minHeight: bodyLineHeight
    });
  }
  const sectionHeights = sections.map((section) =>
    Math.max(section.minHeight || section.lineHeight, section.lines.length * section.lineHeight)
  );
  const dividerCount = Math.max(0, sections.length - 1);
  const contentHeight = sectionHeights.reduce((total, height) => total + height, 0);
  const cardHeight = paddingY + contentHeight + dividerCount * dividerHeight + dividerCount * routeGap + paddingY;

  context.fillStyle = routeCardExportBase.background;
  context.beginPath();
  context.moveTo(x + tabInset, y);
  context.lineTo(x + tabWidth - tabInset, y);
  context.lineTo(x + tabWidth, y + tabHeight);
  context.lineTo(x, y + tabHeight);
  context.closePath();
  context.fill();
  context.fillRect(x, y + tabVisibleHeight, width, cardHeight);

  function drawLines(lines, lineX, lineY, font, lineHeight) {
    context.fillStyle = routeCardExportBase.text;
    context.font = font;
    context.textBaseline = "top";
    lines.forEach((line, index) => {
      context.fillText(line, lineX, lineY + index * lineHeight);
    });
  }

  let currentY = y + tabVisibleHeight + paddingY;
  sections.forEach((section, index) => {
    drawLines(section.lines, x + paddingX, currentY, section.font, section.lineHeight);
    currentY += sectionHeights[index];
    if (index < sections.length - 1) {
      context.fillStyle = routeCardExportBase.text;
      context.fillRect(x + paddingX, currentY, contentWidth, dividerHeight);
      currentY += dividerHeight + routeGap;
    }
  });

  return {
    width,
    height: tabVisibleHeight + cardHeight
  };
}

function createSmallCardCanvas({ title, route, meta, width = printExportSize.cardWidth }) {
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  const size = drawRouteCard(measureContext, { x: 0, y: 0, width, title, route, meta });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size.width);
  canvas.height = Math.ceil(size.height);
  const context = canvas.getContext("2d");
  drawRouteCard(context, { x: 0, y: 0, width, title, route, meta });
  return canvas;
}

function createA4Canvas({ title, route, meta }) {
  const canvas = document.createElement("canvas");
  canvas.width = printExportSize.a4Width;
  canvas.height = printExportSize.a4Height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#9c9c9c";
  context.font = `400 ${printExportSize.helperFontSize}px Arial, PingFang SC, Microsoft YaHei, sans-serif`;
  context.textBaseline = "top";
  context.fillText("按 100% 比例打印", printExportSize.helperX, printExportSize.helperY);
  context.fillText("沿小卡边缘裁剪，空白部分可裁去", printExportSize.helperX, printExportSize.helperY + printExportSize.helperLineGap);
  drawRouteCard(context, {
    x: printExportSize.firstCardX,
    y: printExportSize.cardY,
    width: printExportSize.cardWidth,
    title,
    route,
    meta
  });
  drawRouteCard(context, {
    x: printExportSize.secondCardX,
    y: printExportSize.cardY,
    width: printExportSize.cardWidth,
    title,
    route,
    meta
  });
  return canvas;
}

function App() {
  const [screen, setScreen] = useState("purpose");
  const [selectedPurpose, setSelectedPurpose] = useState("card");
  const [selectedTemplate, setSelectedTemplate] = useState("card");
  const [selectedTimelineSize, setSelectedTimelineSize] = useState("passport");
  const [templateDrafts, setTemplateDrafts] = useState(() => createTemplateDrafts(defaultTrip));
  const [, setUndoStack] = useState([]);
  const [draggingRouteIndex, setDraggingRouteIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [editingRouteIndex, setEditingRouteIndex] = useState(null);
  const [editingHeaderField, setEditingHeaderField] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [trip, setTrip] = useState(() => cloneTrip(defaultTrip));
  const [sourceText, setSourceText] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState(null);
  const editSnapshotRef = useRef(null);
  const isDesktopRouteLayout = useMediaQuery("(min-width: 768px)");
  const meta = screenMeta[screen];
  const currentTemplateDraft = templateDrafts[selectedTemplate] || createTemplateDraft(trip, selectedTemplate);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [screen]);

  useEffect(() => {
    if (screen !== "route") return;
    setTemplateDrafts((current) => syncTemplateDraftsWithTrip(current, trip));
  }, [screen, trip]);

  useEffect(() => {
    if (screen !== "route" || editingRouteIndex === null) return;
    const titleInput = document.querySelector(`[data-route-field="title"][data-index="${editingRouteIndex}"]`);
    if (titleInput instanceof HTMLElement) titleInput.focus();
  }, [screen, editingRouteIndex, trip.steps.length]);

  useEffect(() => {
    if (screen !== "route" || editingHeaderField === null) return;
    const headerInput = document.querySelector(`[data-header-field="${editingHeaderField}"]`);
    if (headerInput instanceof HTMLElement) headerInput.focus();
  }, [screen, editingHeaderField]);

  useEffect(() => {
    if (screen !== "route") return;

    function closeLocalEdit(event) {
      if (editingRouteIndex === null && editingHeaderField === null) return;
      if (event.target instanceof Element && event.target.closest("[data-route-edit-scope]")) return;
      setEditingRouteIndex(null);
      setEditingHeaderField(null);
    }

    document.addEventListener("pointerdown", closeLocalEdit);
    return () => document.removeEventListener("pointerdown", closeLocalEdit);
  }, [screen, editingRouteIndex, editingHeaderField]);

  useEffect(() => {
    if (selectedTemplate !== "timeline" || (screen !== "templateEdit" && screen !== "preview")) return;

    function switchTimelineSize(event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      event.preventDefault();
      setSelectedTimelineSize((current) => getNextTimelineSizeId(current, event.key === "ArrowRight" ? 1 : -1));
    }

    window.addEventListener("keydown", switchTimelineSize);
    return () => window.removeEventListener("keydown", switchTimelineSize);
  }, [screen, selectedTemplate]);

  function pushUndoSnapshot(snapshot = cloneTrip(trip)) {
    setUndoStack((current) => [...current, snapshot].slice(-30));
  }

  function goToScreen(nextScreen) {
    setScreen(nextScreen);
    if (nextScreen !== "route") {
      setEditingRouteIndex(null);
      setEditingHeaderField(null);
    }
    if (nextScreen === "preview") setToastMessage("");
    setIsDownloadModalOpen(false);
  }

  async function handleGenerateRoute() {
    if (isGeneratingRoute) return;

    const purpose = purposeOptions.find((option) => option.id === selectedPurpose) || purposeOptions[1];
    let loadingMessageIndex = 0;

    setIsGeneratingRoute(true);
    setGeneratedSummary({ message: routeGenerationStages[loadingMessageIndex], stageIndex: loadingMessageIndex });
    setToastMessage("");
    setSelectedTemplate(purpose.templateId);
    goToScreen("route");

    const loadingMessageTimer = window.setInterval(() => {
      loadingMessageIndex = Math.min(loadingMessageIndex + 1, routeGenerationStages.length - 1);
      setGeneratedSummary({ message: routeGenerationStages[loadingMessageIndex], stageIndex: loadingMessageIndex });
    }, 900);

    try {
      const generatedTrip = await analyzeRouteWithApi(sourceText);
      const summary = createGeneratedSummary(generatedTrip);

      window.clearInterval(loadingMessageTimer);
      setTrip(generatedTrip);
      setTemplateDrafts(createTemplateDrafts(generatedTrip));
      setGeneratedSummary(summary);
      await delay(1000);
    } catch (error) {
      window.clearInterval(loadingMessageTimer);

      if (import.meta.env.DEV) {
        for (const [stageIndex, message] of routeGenerationStages.entries()) {
          setGeneratedSummary({ message, stageIndex });
          await delay(750);
        }

        const sampleTrip = cloneTrip(defaultTrip);
        const summary = createGeneratedSummary(sampleTrip);
        setTrip(sampleTrip);
        setTemplateDrafts(createTemplateDrafts(sampleTrip));
        setGeneratedSummary(summary);
        await delay(1000);
      } else {
        setGeneratedSummary({ message: "路线生成失败，请稍后再试" });
        await delay(1000);
      }
    } finally {
      window.clearInterval(loadingMessageTimer);
      setIsGeneratingRoute(false);
    }
  }

  function choosePurpose(purposeId) {
    const purpose = purposeOptions.find((option) => option.id === purposeId) || purposeOptions[1];
    if (purpose.disabled) {
      setToastMessage("暂未开放");
      return;
    }

    setToastMessage("");
    setSelectedPurpose(purpose.id);
    setSelectedTemplate(purpose.templateId);
    goToScreen("home");
  }

  function chooseTemplate(templateId) {
    const nextTemplate = templateOptions.find((template) => template.id === templateId);
    if (nextTemplate?.disabled) {
      setToastMessage("暂未开放");
      return;
    }

    setToastMessage("");
    setSelectedTemplate(templateId);
    goToScreen("templateEdit");
  }

  function chooseTemplateMode(templateId) {
    const nextTemplate = templateOptions.find((template) => template.id === templateId);
    if (nextTemplate?.disabled) {
      setToastMessage("暂未开放");
      return;
    }

    setToastMessage("");
    setSelectedTemplate(templateId);
  }

  function updateTemplateDraftField(field, value) {
    setTemplateDrafts((current) => ({
      ...current,
      [selectedTemplate]: {
        ...(current[selectedTemplate] || createTemplateDraft(trip, selectedTemplate)),
        [field]: value
      }
    }));
  }

  function toggleTemplateDraftField(field) {
    setTemplateDrafts((current) => {
      const draft = current[selectedTemplate] || createTemplateDraft(trip, selectedTemplate);
      return {
        ...current,
        [selectedTemplate]: {
          ...draft,
          visible: {
            ...draft.visible,
            [field]: !draft.visible?.[field]
          }
        }
      }
    });
  }

  function handleBack() {
    const target = previousScreen[screen];
    if (!target) return;
    goToScreen(target);
  }

  function createNewRoute() {
    setTrip(cloneTrip(defaultTrip));
    setSelectedPurpose("card");
    setSelectedTemplate("card");
    setTemplateDrafts(createTemplateDrafts(defaultTrip));
    setUndoStack([]);
    setDraggingRouteIndex(null);
    setDropTargetIndex(null);
    setEditingRouteIndex(null);
    setEditingHeaderField(null);
    setIsDownloadModalOpen(false);
    setSourceText("");
    setToastMessage("");
    goToScreen("purpose");
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
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? normalizeRouteStep({ ...step, [field]: value }) : step
      )
    }));
  }

  function insertRouteRow(index) {
    pushUndoSnapshot();
    setTrip((current) => ({
      ...current,
      steps: [
        ...current.steps.slice(0, index + 1),
        { time: "", title: "", direction: "", note: "" },
        ...current.steps.slice(index + 1)
      ]
    }));
    setEditingRouteIndex(index + 1);
    setEditingHeaderField(null);
  }

  function deleteRouteRow(index) {
    if (!trip.steps[index]) return;
    pushUndoSnapshot();
    const currentLength = trip.steps.length;
    setTrip((current) => {
      if (current.steps.length <= 1) {
        return {
          ...current,
          steps: [{ time: "", title: "", direction: "", note: "" }]
        };
      }

      return {
        ...current,
        steps: current.steps.filter((_, stepIndex) => stepIndex !== index)
      };
    });
    setEditingRouteIndex(currentLength <= 1 ? 0 : Math.min(index, currentLength - 2));
    setEditingHeaderField(null);
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
    pushUndoSnapshot();
    setTrip((current) => {
      if (!current.steps[sourceIndex] || !current.steps[targetIndex]) return current;
      const steps = current.steps.map((step) => ({ ...step }));
      if (!isFixedTimeStep(steps[sourceIndex]) && !isFixedTimeStep(steps[targetIndex])) {
        [steps[sourceIndex], steps[targetIndex]] = [steps[targetIndex], steps[sourceIndex]];
        return { ...current, steps };
      }

      const currentRoute = {
        title: steps[sourceIndex].title,
        direction: steps[sourceIndex].direction,
        note: steps[sourceIndex].note
      };
      steps[sourceIndex].title = steps[targetIndex].title;
      steps[sourceIndex].direction = steps[targetIndex].direction;
      steps[sourceIndex].note = steps[targetIndex].note;
      steps[targetIndex].title = currentRoute.title;
      steps[targetIndex].direction = currentRoute.direction;
      steps[targetIndex].note = currentRoute.note;
      return { ...current, steps };
    });
  }

  function moveSelectedRoute(index, direction) {
    const targetIndex = index + direction;
    if (!trip.steps[index] || !trip.steps[targetIndex]) return;
    moveRoutePayload(index, targetIndex);
    setEditingRouteIndex(targetIndex);
    setEditingHeaderField(null);
  }

  async function downloadSmallCard() {
    const { title, route, meta } = getVisibleTemplateText(currentTemplateDraft);
    const canvas = createSmallCardCanvas({ title, route, meta });
    const filename = `${getSafeDownloadName(title || currentTemplateDraft.title || trip.title)}.png`;
    await saveCanvasImage(canvas, filename, "保存这张路线小卡");
  }

  function downloadA4Print() {
    setToastMessage("暂未开放");
  }

  async function saveCanvasImage(canvas, filename, shareText) {
    setIsDownloadModalOpen(false);
    setToastMessage("正在生成下载图片...");
    try {
      const blob = await canvasToPngBlob(canvas);
      const file = new File([blob], filename, { type: "image/png" });

      if (isMobileShareTarget() && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: filename,
          text: shareText
        });
        setToastMessage("");
        setIsDownloadModalOpen(true);
        return;
      }

      triggerBrowserDownload(blob, filename);
      setToastMessage("");
      setIsDownloadModalOpen(true);
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
        showBack={screen !== "purpose"}
        backDisabled={false}
        onBack={handleBack}
      />

      <main className="app-main">
        <PurposeScreen
          isActive={screen === "purpose"}
          selectedPurpose={selectedPurpose}
          onSelectPurpose={choosePurpose}
          toastMessage={toastMessage}
        />
        <HomeScreen
          isActive={screen === "home"}
          isGeneratingRoute={isGeneratingRoute}
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          onGenerate={handleGenerateRoute}
        />
        <RouteScreen
          draggingRouteIndex={draggingRouteIndex}
          dropTargetIndex={dropTargetIndex}
          isDesktopRouteLayout={isDesktopRouteLayout}
          isActive={screen === "route"}
          isGeneratingRoute={isGeneratingRoute}
          onCaptureFieldUndo={captureFieldUndo}
          onDropRouteCard={dropRouteCard}
          onEndRouteDrag={endRouteDrag}
          onEnterRouteDropTarget={enterRouteDropTarget}
          onInsertRouteRow={insertRouteRow}
          onLeaveRouteDropTarget={leaveRouteDropTarget}
          onMoveRouteRow={moveSelectedRoute}
          onMoveOverRouteDropTarget={moveOverRouteDropTarget}
          onRememberEditStart={rememberEditStart}
          onEditHeaderField={(field) => {
            setEditingHeaderField(field);
            setEditingRouteIndex(null);
          }}
          onEditRouteRow={(index) => {
            setEditingRouteIndex(index);
            setEditingHeaderField(null);
          }}
          onStartRouteDrag={startRouteDrag}
          onDeleteRouteRow={deleteRouteRow}
          onUpdateMetadataField={updateMetadataField}
          onUpdateRouteField={updateRouteField}
          onUpdateTripField={updateTripField}
          editingHeaderField={editingHeaderField}
          editingRouteIndex={editingRouteIndex}
          generatedSummary={generatedSummary}
          onCloseRouteDetail={() => {
            setEditingRouteIndex(null);
            setEditingHeaderField(null);
          }}
          trip={trip}
        />
        <TemplateEditScreen
          isActive={screen === "templateEdit"}
          selectedTemplate={selectedTemplate}
          selectedTimelineSize={selectedTimelineSize}
          templateDraft={currentTemplateDraft}
          onSelectTemplate={chooseTemplateMode}
          onSelectTimelineSize={setSelectedTimelineSize}
          onToggleField={toggleTemplateDraftField}
          onUpdateDraftField={updateTemplateDraftField}
          toastMessage={toastMessage}
        />
        <PreviewScreen
          isActive={screen === "preview"}
          selectedTemplate={selectedTemplate}
          selectedTimelineSize={selectedTimelineSize}
          templateDraft={currentTemplateDraft}
          toastMessage={toastMessage}
          trip={trip}
        />
      </main>

      <BottomBar
        screen={screen}
        onDownloadA4={downloadA4Print}
        onDownloadCard={downloadSmallCard}
        onGoToScreen={goToScreen}
      />
      <DownloadSuccessModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onCreateNewRoute={createNewRoute}
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
          {[0, 1, 2, 3].map((index) => (
            <span className={index < progress ? "is-active" : ""} key={index} />
          ))}
        </div>
      </div>
    </header>
  );
}

function PurposeScreen({ isActive, selectedPurpose, onSelectPurpose, toastMessage }) {
  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-purpose">
      <h2 className="purpose-title">你想制作什么？</h2>
      <div className="purpose-card-list" aria-label="选择用途">
        {purposeOptions.map((purpose) => (
          <button
            className={`purpose-card ${selectedPurpose === purpose.id ? "is-selected" : ""} ${purpose.disabled ? "is-disabled" : ""}`}
            type="button"
            aria-disabled={String(Boolean(purpose.disabled))}
            key={purpose.id}
            onClick={() => onSelectPurpose(purpose.id)}
          >
            <span>
              <b>{purpose.title}</b>
              <small>{purpose.subtitle}</small>
            </span>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="status-message purpose-status" aria-live="polite">
        {toastMessage}
      </p>
    </section>
  );
}

function HomeScreen({ isActive, isGeneratingRoute, sourceText, onSourceTextChange, onGenerate }) {
  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-home">
      <h2 className="home-title">导入行程</h2>
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
        <button className="primary-button" id="generateButton" type="button" disabled={isGeneratingRoute} onClick={onGenerate}>
          生成路线
        </button>
      </div>
    </section>
  );
}

function RouteScreen({
  draggingRouteIndex,
  dropTargetIndex,
  editingHeaderField,
  editingRouteIndex,
  generatedSummary,
  isDesktopRouteLayout,
  isActive,
  isGeneratingRoute,
  onCaptureFieldUndo,
  onCloseRouteDetail,
  onDropRouteCard,
  onEditHeaderField,
  onEditRouteRow,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onInsertRouteRow,
  onLeaveRouteDropTarget,
  onMoveRouteRow,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onDeleteRouteRow,
  onUpdateMetadataField,
  onUpdateRouteField,
  onUpdateTripField,
  trip
}) {
  const isRouteTitleEditing = editingHeaderField === "title";
  const hasLocalEdit = editingRouteIndex !== null || editingHeaderField !== null;
  const editingStep = editingRouteIndex !== null ? trip.steps[editingRouteIndex] : null;

  return (
    <section className={`screen ${isActive ? "is-active" : ""} ${hasLocalEdit ? "is-editing" : ""}`} id="screen-route">
      <div className={`route-workbench ${isGeneratingRoute ? "is-generating-route" : ""}`}>
        <section className="route-main-panel">
          <section className="route-hero">
            <h2 id="tripTitle" onDoubleClick={() => onEditHeaderField("title")}>
              {isRouteTitleEditing ? (
                <input
                  className="trip-title-input"
                  value={trip.title}
                  data-trip-field="title"
                  data-header-field="title"
                  data-route-edit-scope
                  aria-label="路线名称"
                  onBlur={onCaptureFieldUndo}
                  onChange={(event) => onUpdateTripField("title", event.target.value)}
                  onFocus={onRememberEditStart}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                />
              ) : (
                trip.title
              )}
            </h2>
            <div className="metadata-chips" aria-label="路线标签">
              {trip.metadata.map((item, index) => (
                <span key={index} onDoubleClick={() => onEditHeaderField(`metadata-${index}`)}>
                  {editingHeaderField === `metadata-${index}` ? (
                    <input
                      value={item}
                      data-metadata-index={index}
                      data-header-field={`metadata-${index}`}
                      data-route-edit-scope
                      aria-label={`路线标签 ${index + 1}`}
                      onBlur={onCaptureFieldUndo}
                      onChange={(event) => onUpdateMetadataField(index, event.target.value)}
                      onFocus={onRememberEditStart}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                    />
                  ) : (
                    item
                  )}
                </span>
              ))}
            </div>
          </section>
          <div id="routeEditor" className={`route-workspace ${editingRouteIndex !== null ? "has-detail" : ""}`}>
            <div className={`route-list ${editingRouteIndex !== null ? "is-editing" : ""}`}>
              {trip.steps.map((step, index) => (
                <RouteRow
                  draggingRouteIndex={draggingRouteIndex}
                  dropTargetIndex={dropTargetIndex}
                  index={index}
                  isDesktopRouteLayout={isDesktopRouteLayout}
                  isEditing={editingRouteIndex === index}
                  isLast={index === trip.steps.length - 1}
                  isSelected={editingRouteIndex === index}
                  key={index}
                  onCaptureFieldUndo={onCaptureFieldUndo}
                  onDeleteRouteRow={onDeleteRouteRow}
                  onDropRouteCard={onDropRouteCard}
                  onEndRouteDrag={onEndRouteDrag}
                  onEnterRouteDropTarget={onEnterRouteDropTarget}
                  onInsertRouteRow={onInsertRouteRow}
                  onLeaveRouteDropTarget={onLeaveRouteDropTarget}
                  onMoveRouteRow={onMoveRouteRow}
                  onMoveOverRouteDropTarget={onMoveOverRouteDropTarget}
                  onRememberEditStart={onRememberEditStart}
                  onEditRouteRow={onEditRouteRow}
                  onStartRouteDrag={onStartRouteDrag}
                  onUpdateRouteField={onUpdateRouteField}
                  step={step}
                />
              ))}
            </div>
            {editingStep ? (
              <RouteDetailPanel
                index={editingRouteIndex}
                isLast={editingRouteIndex === trip.steps.length - 1}
                onCancel={onCloseRouteDetail}
                onCaptureFieldUndo={onCaptureFieldUndo}
                onDeleteRouteRow={onDeleteRouteRow}
                onInsertRouteRow={onInsertRouteRow}
                onMoveRouteRow={onMoveRouteRow}
                onRememberEditStart={onRememberEditStart}
                onSave={onCloseRouteDetail}
                onUpdateRouteField={onUpdateRouteField}
                step={editingStep}
              />
            ) : null}
          </div>
        </section>
        <RouteCardFeedbackPreview trip={trip} />
      </div>
      {isGeneratingRoute ? <GenerationModal summary={generatedSummary} /> : null}
      {!isDesktopRouteLayout && editingStep ? (
        <RouteBottomSheet
          index={editingRouteIndex}
          onCancel={onCloseRouteDetail}
          onSave={onCloseRouteDetail}
          onUpdateRouteField={onUpdateRouteField}
          step={editingStep}
        />
      ) : null}
    </section>
  );
}

function GenerationModal({ summary }) {
  const statusText = summary?.message || (summary?.count ? `已生成 ${summary.count} 个路线节点` : "正在读取攻略…");
  const activeStageIndex = typeof summary?.stageIndex === "number" ? summary.stageIndex : 0;
  const isLoading = Boolean(summary?.message && !summary?.count);

  return (
    <div className="modal-backdrop generation-modal-backdrop" role="status" aria-live="polite" aria-label="路线生成状态">
      <div className="generation-modal">
        <p>{statusText}</p>
        {isLoading ? (
          <div className="generation-stage-list" aria-hidden="true">
            {routeGenerationStages.map((stage, index) => {
              const stageState = index < activeStageIndex ? "is-complete" : index === activeStageIndex ? "is-active" : "is-pending";

              return (
                <div className={`generation-stage ${stageState}`} key={stage}>
                  <span>{stage}</span>
                  <i />
                </div>
              );
            })}
          </div>
        ) : null}
        {summary?.count && !summary?.message ? (
          <div className="generation-modal-summary">
            {summary.type ? <span>路线类型：{summary.type}</span> : null}
            {summary.distance ? <span>距离：{summary.distance}</span> : null}
            {summary.duration ? <span>预计耗时：{summary.duration}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RouteRow({
  draggingRouteIndex,
  dropTargetIndex,
  index,
  isDesktopRouteLayout,
  isEditing,
  isLast,
  isSelected,
  onCaptureFieldUndo,
  onDeleteRouteRow,
  onDropRouteCard,
  onEditRouteRow,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onInsertRouteRow,
  onLeaveRouteDropTarget,
  onMoveRouteRow,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onUpdateRouteField,
  step
}) {
  const hasTimeLabel = Boolean(String(step.time || "").trim());
  const hasRouteContent = Boolean(String(step.direction || step.title || step.note || "").trim());
  const rowClasses = [
    "route-row",
    !hasTimeLabel ? "has-empty-time" : "",
    !hasRouteContent ? "has-empty-route" : "",
    isSelected ? "is-selected" : "",
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
            index={index}
            isDesktopRouteLayout={isDesktopRouteLayout}
            isEditing={isEditing}
            isSelected={isSelected}
            onCaptureFieldUndo={onCaptureFieldUndo}
            onRememberEditStart={onRememberEditStart}
            onUpdateRouteField={onUpdateRouteField}
            step={step}
          />
        </div>
        <RouteBlock
          draggingRouteIndex={draggingRouteIndex}
          dropTargetIndex={dropTargetIndex}
          hasRouteContent={hasRouteContent}
          index={index}
          isDesktopRouteLayout={isDesktopRouteLayout}
          isEditing={isEditing}
          isLast={isLast}
          isSelected={isSelected}
          onCaptureFieldUndo={onCaptureFieldUndo}
          onDeleteRouteRow={onDeleteRouteRow}
          onDropRouteCard={onDropRouteCard}
          onEditRouteRow={onEditRouteRow}
          onEndRouteDrag={onEndRouteDrag}
          onEnterRouteDropTarget={onEnterRouteDropTarget}
          onInsertRouteRow={onInsertRouteRow}
          onLeaveRouteDropTarget={onLeaveRouteDropTarget}
          onMoveRouteRow={onMoveRouteRow}
          onMoveOverRouteDropTarget={onMoveOverRouteDropTarget}
          onRememberEditStart={onRememberEditStart}
          onStartRouteDrag={onStartRouteDrag}
          onUpdateRouteField={onUpdateRouteField}
          step={step}
        />
      </article>
    </>
  );
}

function TimeBlock({
  index,
  isDesktopRouteLayout,
  isEditing,
  isSelected,
  onCaptureFieldUndo,
  onRememberEditStart,
  onUpdateRouteField,
  step
}) {
  if (isDesktopRouteLayout && isEditing && isSelected) {
    return (
      <input
        value={step.time}
        data-route-field="time"
        data-index={index}
        aria-label="时间"
        onBlur={onCaptureFieldUndo}
        onChange={(event) => onUpdateRouteField(index, "time", event.target.value)}
        onFocus={onRememberEditStart}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    );
  }

  return <span>{step.time || ""}</span>;
}

function RouteBlock({
  draggingRouteIndex,
  dropTargetIndex,
  hasRouteContent,
  index,
  isDesktopRouteLayout,
  isEditing,
  isLast,
  isSelected,
  onCaptureFieldUndo,
  onDeleteRouteRow,
  onDropRouteCard,
  onEditRouteRow,
  onEndRouteDrag,
  onEnterRouteDropTarget,
  onInsertRouteRow,
  onLeaveRouteDropTarget,
  onMoveRouteRow,
  onMoveOverRouteDropTarget,
  onRememberEditStart,
  onStartRouteDrag,
  onUpdateRouteField,
  step
}) {
  const classes = [
    "route-block",
    isSelected ? "is-selected" : "",
    draggingRouteIndex === index ? "is-dragging" : "",
    dropTargetIndex === index ? "is-drop-target" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      data-route-edit-scope={isEditing && !isDesktopRouteLayout ? true : undefined}
      draggable={false}
      onClick={() => onEditRouteRow(index)}
      onDoubleClick={() => onEditRouteRow(index)}
      data-drag-index={undefined}
      onDragEnd={undefined}
      onDragEnter={undefined}
      onDragLeave={undefined}
      onDragOver={undefined}
      onDragStart={undefined}
      onDrop={undefined}
    >
      <RouteContent step={step} />
    </div>
  );
}

function RouteDetailPanel({
  index,
  isLast,
  onCancel,
  onCaptureFieldUndo,
  onDeleteRouteRow,
  onInsertRouteRow,
  onMoveRouteRow,
  onRememberEditStart,
  onSave,
  onUpdateRouteField,
  step
}) {
  return (
    <aside className="route-detail-panel" data-route-edit-scope>
      <div className="route-detail-heading">
        <strong>{`节点详情 ${String(index + 1).padStart(2, "0")}`}</strong>
        <span>编辑的是统一路线资料</span>
      </div>
      <label>
        <span>时间</span>
        <input
          value={step.time}
          data-route-field="time"
          data-index={index}
          aria-label="时间"
          onBlur={onCaptureFieldUndo}
          onChange={(event) => onUpdateRouteField(index, "time", event.target.value)}
          onFocus={onRememberEditStart}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </label>
      <label>
        <span>标题</span>
        <input
          value={step.title}
          data-route-field="title"
          data-index={index}
          aria-label="路线标题"
          onBlur={onCaptureFieldUndo}
          onChange={(event) => onUpdateRouteField(index, "title", event.target.value)}
          onFocus={onRememberEditStart}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </label>
      <div className="route-item-controls" aria-label="路线操作">
        <button type="button" onClick={() => onInsertRouteRow(index)}>
          插入
        </button>
        <button type="button" onClick={() => onDeleteRouteRow(index)}>
          删除
        </button>
        <button type="button" disabled={index === 0} onClick={() => onMoveRouteRow(index, -1)}>
          上移
        </button>
        <button type="button" disabled={isLast} onClick={() => onMoveRouteRow(index, 1)}>
          下移
        </button>
      </div>
      <div className="route-detail-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          取消
        </button>
        <button className="primary-button" type="button" onClick={onSave}>
          保存
        </button>
      </div>
    </aside>
  );
}

function RouteCardFeedbackPreview({ trip }) {
  const visibleText = getVisibleTemplateText(createTemplateDraft(trip, "card"));

  return (
    <aside className="route-card-preview" aria-label="小卡预览">
      <div className="route-card-preview-copy">
        <strong>小卡预览</strong>
        <span>结果反馈，不在这里编辑</span>
      </div>
      <section className="small-card-stage route-card-preview-stage" aria-label="小卡路线图">
        <article className="sticky-route-card">
          {visibleText.title ? <p className="small-card-text small-card-title">{visibleText.title}</p> : null}
          {visibleText.title && visibleText.route ? <div className="small-card-divider" aria-hidden="true" /> : null}
          {visibleText.route ? <p className="small-card-text small-card-route">{visibleText.route}</p> : null}
          {(visibleText.title || visibleText.route) && visibleText.meta ? <div className="small-card-divider" aria-hidden="true" /> : null}
          {visibleText.meta ? <p className="small-card-text small-card-meta">{visibleText.meta}</p> : null}
        </article>
      </section>
    </aside>
  );
}

function RouteBottomSheet({ index, onCancel, onSave, onUpdateRouteField, step }) {
  return (
    <div className="route-sheet-backdrop" data-route-edit-scope onClick={onCancel}>
      <aside className="route-bottom-sheet" aria-label="编辑路线节点" onClick={(event) => event.stopPropagation()}>
        <div className="route-detail-heading">
          <strong>{`节点 ${String(index + 1).padStart(2, "0")}`}</strong>
          <span>编辑当前路线资料</span>
        </div>
        <label>
          <span>标题</span>
          <input value={step.title || ""} onChange={(event) => onUpdateRouteField(index, "title", event.target.value)} />
        </label>
        <label>
          <span>时间</span>
          <input value={step.time || ""} onChange={(event) => onUpdateRouteField(index, "time", event.target.value)} />
        </label>
        <label>
          <span>地点/方向</span>
          <input value={step.direction || step.title || ""} onChange={(event) => onUpdateRouteField(index, "direction", event.target.value)} />
        </label>
        <div className="route-detail-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            取消
          </button>
          <button className="primary-button" type="button" onClick={onSave}>
            完成
          </button>
        </div>
      </aside>
    </div>
  );
}

function RouteContent({ step }) {
  const text = step.direction || step.title;
  if (!String(text || "").trim()) return null;

  return (
    <>
      <strong>{text}</strong>
    </>
  );
}

function TemplateScreen({ isActive, selectedTemplate, onSelectTemplate, toastMessage }) {
  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-template">
      <div className="template-stack" id="templateStack">
        {templateOptions.map((template) => (
          <button
            className={`template-card ${template.id === selectedTemplate ? "is-selected" : ""} ${template.disabled ? "is-disabled" : ""}`}
            type="button"
            aria-disabled={String(Boolean(template.disabled))}
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
      <p className="status-message template-status" aria-live="polite">
        {toastMessage}
      </p>
    </section>
  );
}

function TemplateEditScreen({
  isActive,
  selectedTemplate,
  selectedTimelineSize,
  templateDraft,
  onSelectTemplate,
  onSelectTimelineSize,
  onToggleField,
  onUpdateDraftField,
  toastMessage
}) {
  const template = templateOptions.find((option) => option.id === selectedTemplate) || templateOptions[1];
  const isTimelineTemplate = selectedTemplate === "timeline";

  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-template-edit">
      <div className="template-mode-switcher" aria-label="切换模板">
        {templateOptions.map((option) => (
          <button
            className={`${option.id === selectedTemplate ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
            type="button"
            aria-disabled={String(Boolean(option.disabled))}
            key={option.id}
            onClick={() => onSelectTemplate(option.id)}
          >
            {getTemplateShortTitle(option.id)}
          </button>
        ))}
      </div>

      {isTimelineTemplate ? (
        <TimelineSizeSwitcher
          selectedTimelineSize={selectedTimelineSize}
          onSelectTimelineSize={onSelectTimelineSize}
        />
      ) : null}

      <div className="template-edit-preview" aria-label={`${template.title}编辑预览`}>
        <EditableTemplatePreview
          selectedTemplate={selectedTemplate}
          selectedTimelineSize={selectedTimelineSize}
          templateDraft={templateDraft}
          onUpdateDraftField={onUpdateDraftField}
        />
      </div>

      <section className="template-field-panel" aria-label="模板内容开关">
        <TemplateToggle
          checked={templateDraft.visible?.title}
          label="行程标题"
          onChange={() => onToggleField("title")}
        />
        <TemplateToggle
          checked={templateDraft.visible?.route}
          label="路线详情"
          onChange={() => onToggleField("route")}
        />
        <TemplateToggle
          checked={templateDraft.visible?.meta}
          label="路线提示"
          onChange={() => onToggleField("meta")}
        />
      </section>
      <p className="status-message template-status" aria-live="polite">
        {toastMessage}
      </p>
    </section>
  );
}

function TimelineSizeSwitcher({ selectedTimelineSize, onSelectTimelineSize }) {
  const size = getTimelineSizeOption(selectedTimelineSize);

  return (
    <div className="timeline-size-switcher" aria-label="切换时间轴尺寸">
      <button
        type="button"
        aria-label="切换到上一个时间轴尺寸"
        onClick={() => onSelectTimelineSize(getNextTimelineSizeId(selectedTimelineSize, -1))}
      >
        &lt;
      </button>
      <span>
        <b>{size.label}</b>
        <small>{size.widthMm} x {size.heightMm} mm</small>
      </span>
      <button
        type="button"
        aria-label="切换到下一个时间轴尺寸"
        onClick={() => onSelectTimelineSize(getNextTimelineSizeId(selectedTimelineSize, 1))}
      >
        &gt;
      </button>
    </div>
  );
}

function TemplateToggle({ checked, label, onChange }) {
  return (
    <label className="template-toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={Boolean(checked)} onChange={onChange} />
      <i aria-hidden="true" />
    </label>
  );
}

function EditableTemplatePreview({ selectedTemplate, selectedTimelineSize, templateDraft, onUpdateDraftField }) {
  if (selectedTemplate === "timeline") {
    return (
      <TimelineTemplatePreview
        isEditable
        selectedTimelineSize={selectedTimelineSize}
        templateDraft={templateDraft}
        onUpdateDraftField={onUpdateDraftField}
      />
    );
  }

  if (selectedTemplate !== "card") {
    return (
      <section className={`preview-card template-preview-${selectedTemplate}`}>
        {templateDraft.visible?.title ? (
          <input
            className="template-edit-title"
            value={templateDraft.title}
            aria-label="模板标题"
            onChange={(event) => onUpdateDraftField("title", event.target.value)}
          />
        ) : null}
        <div className="preview-route">
          {templateDraft.visible?.route ? (
            <textarea
              className="template-edit-route"
              value={templateDraft.route}
              rows={Math.max(6, templateDraft.route.split("\n").length)}
              aria-label="模板路线详情"
              onChange={(event) => onUpdateDraftField("route", event.target.value)}
            />
          ) : null}
          {templateDraft.visible?.meta ? (
            <textarea
              className="template-edit-meta"
              value={templateDraft.meta}
              rows={Math.max(2, templateDraft.meta.split("\n").length)}
              aria-label="模板路线提示"
              onChange={(event) => onUpdateDraftField("meta", event.target.value)}
            />
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="small-card-stage template-edit-card-stage" aria-label="小卡编辑">
      <article className="sticky-route-card">
        {templateDraft.visible?.title ? (
          <input
            className="small-card-field small-card-title"
            value={templateDraft.title}
            aria-label="小卡路线标题"
            onChange={(event) => onUpdateDraftField("title", event.target.value)}
          />
        ) : null}
        {templateDraft.visible?.title && templateDraft.visible?.route ? <div className="small-card-divider" aria-hidden="true" /> : null}
        {templateDraft.visible?.route ? (
          <textarea
            className="small-card-field small-card-route"
            value={templateDraft.route}
            rows={Math.max(3, templateDraft.route.split("\n").length)}
            aria-label="小卡路线内容"
            onChange={(event) => onUpdateDraftField("route", event.target.value)}
          />
        ) : null}
        {(templateDraft.visible?.title || templateDraft.visible?.route) && templateDraft.visible?.meta ? (
          <div className="small-card-divider" aria-hidden="true" />
        ) : null}
        {templateDraft.visible?.meta ? (
          <textarea
            className="small-card-field small-card-meta"
            value={templateDraft.meta}
            rows={Math.max(1, templateDraft.meta.split("\n").length)}
            aria-label="小卡路线信息"
            onChange={(event) => onUpdateDraftField("meta", event.target.value)}
          />
        ) : null}
      </article>
    </section>
  );
}

function TimelineTemplatePreview({ isEditable = false, selectedTimelineSize, templateDraft, onUpdateDraftField }) {
  const visibleText = getVisibleTemplateText(templateDraft);
  const size = getTimelineSizeOption(selectedTimelineSize);
  const timelineItems = getTimelineItems(visibleText.route);
  const editableTimelineLines = String(templateDraft.route || "")
    .split("\n")
    .map((line) => ({ raw: line, parsed: parseTimelineLine(line) || { hasTime: false, time: "", text: "" } }));
  if (!editableTimelineLines.length) editableTimelineLines.push({ raw: "", parsed: { hasTime: false, time: "", text: "" } });
  const showTitle = Boolean(templateDraft.visible?.title && (isEditable || visibleText.title));
  const showRoute = Boolean(templateDraft.visible?.route && (isEditable || visibleText.route));
  const showMeta = Boolean(templateDraft.visible?.meta && (isEditable || visibleText.meta));
  const style = {
    "--timeline-ratio": `${size.widthMm} / ${size.heightMm}`
  };

  function updateTimelineRouteLine(lineIndex, value) {
    const lines = String(templateDraft.route || "").split("\n");
    lines[lineIndex] = value;
    onUpdateDraftField("route", lines.join("\n"));
  }

  return (
    <section className={`timeline-sticker-stage timeline-size-${size.id}`} aria-label={`${size.label}时间轴`}>
      <article className="timeline-sticker" style={style}>
        {showTitle ? (
          isEditable ? (
            <input
              className="timeline-title-field"
              value={templateDraft.title}
              aria-label="时间轴标题"
              onChange={(event) => onUpdateDraftField("title", event.target.value)}
            />
          ) : (
            <h2>{visibleText.title}</h2>
          )
        ) : null}
        {showTitle && showRoute ? <div className="timeline-divider" aria-hidden="true" /> : null}
        {showRoute ? (
          <div className="timeline-body">
            {isEditable ? (
              <ol className="timeline-list timeline-list-editable">
                {editableTimelineLines.map((item, index) => (
                  <li className={item.parsed.hasTime ? "has-time" : "is-continuation"} key={index}>
                    <i aria-hidden="true" />
                    <input
                      className="timeline-line-field"
                      value={item.raw}
                      aria-label={`时间轴路线第 ${index + 1} 行`}
                      onChange={(event) => updateTimelineRouteLine(index, event.target.value)}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="timeline-list">
                {timelineItems.map((item, index) => (
                  <li className={item.hasTime ? "has-time" : "is-continuation"} key={`${item.time}-${item.text}-${index}`}>
                    <i aria-hidden="true" />
                    <span>{item.hasTime ? `${item.time} ${item.text}` : item.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
        {showRoute && showMeta ? <div className="timeline-divider" aria-hidden="true" /> : null}
        {showMeta ? (
          isEditable ? (
            <textarea
              className="timeline-meta-field"
              value={templateDraft.meta}
              rows={Math.max(1, templateDraft.meta.split("\n").length)}
              aria-label="时间轴路线提示"
              onChange={(event) => onUpdateDraftField("meta", event.target.value)}
            />
          ) : (
            <p className="timeline-meta">{visibleText.meta}</p>
          )
        ) : null}
      </article>
    </section>
  );
}

function PreviewScreen({ isActive, selectedTemplate, selectedTimelineSize, templateDraft, toastMessage, trip }) {
  const template = templateOptions.find((option) => option.id === selectedTemplate) || templateOptions[0];
  const isCardTemplate = selectedTemplate === "card";
  const isTimelineTemplate = selectedTemplate === "timeline";
  const visibleText = getVisibleTemplateText(templateDraft);

  return (
    <section className={`screen ${isActive ? "is-active" : ""}`} id="screen-preview">
      <div id="templatePreview">
        {isTimelineTemplate ? (
          <TimelineTemplatePreview
            selectedTimelineSize={selectedTimelineSize}
            templateDraft={templateDraft}
          />
        ) : isCardTemplate ? (
          <section className="small-card-stage" aria-label={template.title}>
            <article className="sticky-route-card" id="smallCardExport">
              {visibleText.title ? <p className="small-card-text small-card-title">{visibleText.title}</p> : null}
              {visibleText.title && visibleText.route ? <div className="small-card-divider" aria-hidden="true" /> : null}
              {visibleText.route ? <p className="small-card-text small-card-route">{visibleText.route}</p> : null}
              {(visibleText.title || visibleText.route) && visibleText.meta ? <div className="small-card-divider" aria-hidden="true" /> : null}
              {visibleText.meta ? <p className="small-card-text small-card-meta">{visibleText.meta}</p> : null}
            </article>
          </section>
        ) : (
          <section className="preview-card">
            <p>{template.title}</p>
            {visibleText.title ? <h2>{visibleText.title}</h2> : null}
            <div className="preview-route">
              {visibleText.route ? <p>{visibleText.route}</p> : null}
              {visibleText.meta ? <small>{visibleText.meta}</small> : null}
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

function BottomBar({ screen, onDownloadA4, onDownloadCard, onGoToScreen }) {
  const actionKey = screen;

  return (
    <footer className="app-bottom-bar">
      <div className={`button-row one-up ${actionKey === "route" ? "is-active" : ""}`} data-actions-for="route">
        <button className="primary-button" data-go="template-edit" type="button" onClick={() => onGoToScreen("templateEdit")}>
          生成路线图
        </button>
      </div>
      <div className={`button-row one-up ${actionKey === "templateEdit" ? "is-active" : ""}`} data-actions-for="template-edit">
        <button className="primary-button" id="finishTemplateEditButton" type="button" onClick={() => onGoToScreen("preview")}>
          完成
        </button>
      </div>
      <div className={`button-row two-up ${actionKey === "preview" ? "is-active" : ""}`} data-actions-for="preview">
        <button className="secondary-button is-disabled" id="downloadA4Button" type="button" aria-disabled="true" onClick={onDownloadA4}>
          A4打印版
        </button>
        <button className="primary-button" id="downloadCardButton" type="button" onClick={onDownloadCard}>
          下载小卡
        </button>
      </div>
    </footer>
  );
}

function DownloadSuccessModal({ isOpen, onClose, onCreateNewRoute }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="download-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="downloadSuccessTitle"
      >
        <button className="modal-close-button" type="button" aria-label="关闭弹窗" onClick={onClose}>
          ×
        </button>
        <p id="downloadSuccessTitle">下载成功</p>
        <button className="primary-button modal-primary-action" type="button" onClick={onCreateNewRoute}>
          创建新路程
        </button>
      </section>
    </div>
  );
}

export default App;
