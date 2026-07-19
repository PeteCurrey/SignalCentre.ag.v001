// ============================================================
// lib/ai-clients.ts
// AI Orchestration for Consensus Engine
// ============================================================

export interface MarketDataBundle {
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    close: number;
    change_pct: number;
  };
  ohlcv: {
    m15: any[];
    h1: any[];
    h4: any[];
    d1: any[];
  };
  indicators: any;
  patterns: any[];
  news: any[];
  sentiment_score: number;
}

export interface SignalObject {
  direction: "bullish" | "bearish" | "neutral";
  conviction: number; // 1-10
  key_reasons: string[]; // max 3, <15 words each
  invalidation_level: string;
  risk_grade: "A+" | "A" | "B" | "C" | "D";
  rationale: string; // under 25 words
}

const SYSTEM_PROMPT_TEMPLATE = `You are a professional market analyst. Analyse the provided market data bundle for {symbol} and return ONLY a valid JSON object with this exact structure:
{
  "direction": "bullish" | "bearish" | "neutral",
  "conviction": number (1-10),
  "key_reasons": string[] (3 items max, each under 15 words),
  "invalidation_level": string (price level that would negate this view),
  "risk_grade": "A+" | "A" | "B" | "C" | "D",
  "rationale": string (one sentence, under 25 words)
}
Return nothing except the JSON object. No preamble, no markdown.`;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ── Claude (Anthropic) ───────────────────────────────────────

export async function callClaude(symbol: string, data: MarketDataBundle): Promise<SignalObject> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("your_anthropic")) {
    throw new Error("Anthropic API Key not configured");
  }

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{symbol}", symbol);
  const userMessage = JSON.stringify(data);

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!res.ok) throw new Error(`Claude HTTP ${res.status}`);
  const json = await res.json();
  const text = json.content[0].text;
  return parseAIResponse(text, "Claude");
}

// ── GPT-4o (OpenAI) ──────────────────────────────────────────

export async function callGpt(symbol: string, data: MarketDataBundle): Promise<SignalObject> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("your_openai")) {
    throw new Error("OpenAI API Key not configured");
  }

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{symbol}", symbol);

  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(data) }
      ]
    })
  });

  if (!res.ok) throw new Error(`GPT HTTP ${res.status}`);
  const json = await res.json();
  const text = json.choices[0].message.content;
  return parseAIResponse(text, "GPT");
}

// ── Grok (xAI) ───────────────────────────────────────────────

export async function callGrok(symbol: string, data: MarketDataBundle): Promise<SignalObject> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey.includes("your_xai")) {
    throw new Error("xAI API Key not configured");
  }

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{symbol}", symbol);

  const res = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(data) }
      ]
    })
  });

  if (!res.ok) throw new Error(`Grok HTTP ${res.status}`);
  const json = await res.json();
  const text = json.choices[0].message.content;
  return parseAIResponse(text, "Grok");
}

// ── Helper ───────────────────────────────────────────────────

function parseAIResponse(rawText: string, modelName: string): SignalObject {
  try {
    // Strip markdown formatting if the model ignored instructions
    let cleanText = rawText.trim();
    if (cleanText.startsWith("\`\`\`json")) {
      cleanText = cleanText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (cleanText.startsWith("\`\`\`")) {
      cleanText = cleanText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    const obj = JSON.parse(cleanText) as Partial<SignalObject>;

    // Validate structure (minimal safe defaults)
    if (!["bullish", "bearish", "neutral"].includes(obj.direction || "")) obj.direction = "neutral";
    if (typeof obj.conviction !== "number") obj.conviction = 5;
    if (!Array.isArray(obj.key_reasons)) obj.key_reasons = ["Analysis generated"];
    if (typeof obj.invalidation_level !== "string") obj.invalidation_level = "Unknown";
    if (!["A+", "A", "B", "C", "D"].includes(obj.risk_grade || "")) obj.risk_grade = "C";
    if (typeof obj.rationale !== "string") obj.rationale = "No rationale provided.";

    // Clamp conviction
    obj.conviction = Math.max(1, Math.min(10, obj.conviction));

    return obj as SignalObject;
  } catch (err) {
    console.error(`[${modelName}] Failed to parse response:`, rawText);
    throw new Error(`Invalid JSON format from ${modelName}`);
  }
}
