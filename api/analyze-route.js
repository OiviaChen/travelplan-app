const SILICONFLOW_URL = "https://api.siliconflow.cn/v1/chat/completions";
const SILICONFLOW_MODEL = "Qwen/Qwen2.5-72B-Instruct";

const systemPrompt = [
  "你是旅行路线结构化助手。",
  "你必须只返回严格 JSON，不要 Markdown，不要解释，不要代码块。",
  "只提取路线相关信息，不要编造地点。",
  "routeItems 必须按原攻略中的实际顺序排列。",
  "note 控制在 20 个中文字符以内。",
  "如果信息缺失，使用空字符串或未知。"
].join("\n");

const userPrompt = (text) => `请从下面的旅行攻略中提取路线数据，严格返回这个 JSON 结构：
{
  "title": "路线标题",
  "meta": {
    "difficulty": "简单/中等/较难/未知",
    "type": "城市徒步/徒步/自驾/综合/未知",
    "distance": "距离，如 5km 或 未知",
    "duration": "耗时，如 4-5h 或 未知"
  },
  "routeItems": [
    {
      "id": "item-1",
      "time": "时间或空字符串",
      "title": "路线节点/动作",
      "note": "一句简短提醒，可为空"
    }
  ]
}

旅行攻略：
${text}`;

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function parseRouteJson(content) {
  const trimmedContent = String(content || "").trim();
  if (!trimmedContent) throw new Error("Empty AI response");

  try {
    return JSON.parse(trimmedContent);
  } catch (error) {
    const jsonMatch = trimmedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw error;
    return JSON.parse(jsonMatch[0]);
  }
}

function trimText(value, maxLength) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeRouteData(routeData) {
  if (!routeData || typeof routeData !== "object") {
    throw new Error("Invalid route data");
  }

  const routeItems = Array.isArray(routeData.routeItems) ? routeData.routeItems : [];
  const normalizedItems = routeItems
    .map((item, index) => ({
      id: trimText(item?.id, 32) || `item-${index + 1}`,
      time: trimText(item?.time, 24),
      title: trimText(item?.title, 80),
      note: trimText(item?.note, 20)
    }))
    .filter((item) => item.title);

  if (!normalizedItems.length) {
    throw new Error("No route items returned");
  }

  const meta = routeData.meta || {};

  return {
    title: trimText(routeData.title, 40) || "旅行路线",
    meta: {
      difficulty: trimText(meta.difficulty, 12) || "未知",
      type: trimText(meta.type, 12) || "未知",
      distance: trimText(meta.distance, 20) || "未知",
      duration: trimText(meta.duration, 20) || "未知"
    },
    routeItems: normalizedItems
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) {
    return sendJson(res, 500, { error: "Missing SiliconFlow API key" });
  }

  try {
    const text = trimText(req.body?.text, 12000);
    if (!text) {
      return sendJson(res, 400, { error: "Missing route text" });
    }

    const siliconFlowResponse = await fetch(SILICONFLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: SILICONFLOW_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt(text) }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!siliconFlowResponse.ok) {
      return sendJson(res, 502, { error: "SiliconFlow request failed" });
    }

    const completion = await siliconFlowResponse.json();
    const content = completion?.choices?.[0]?.message?.content;
    const routeData = normalizeRouteData(parseRouteJson(content));

    return sendJson(res, 200, routeData);
  } catch (error) {
    return sendJson(res, 500, { error: "Route analysis failed" });
  }
}
