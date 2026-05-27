// Browser-side LLM helpers. Reads provider config from localStorage so
// the same `embed()` / `extractMemories()` calls work whether the user
// chose OpenAI or OpenRouter — they share the OpenAI wire format,
// only baseURL + model name change.

import {
  EMBEDDING_MODEL,
  PROVIDER_BASE_URL,
  getStoredModel,
  getStoredProvider,
  type LLMProvider,
} from "./storage";

function buildHeaders(apiKey: string, provider: LLMProvider): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };
  if (provider === "openrouter") {
    // OpenRouter recommends these for analytics + leaderboard ranking.
    headers["HTTP-Referer"] =
      typeof window !== "undefined" ? window.location.origin : "https://heirloom.app";
    headers["X-Title"] = "Heirloom";
  }
  return headers;
}

export async function embed(text: string, apiKey: string): Promise<number[]> {
  const provider = getStoredProvider();
  const baseUrl = PROVIDER_BASE_URL[provider];
  const model = EMBEDDING_MODEL[provider];

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: buildHeaders(apiKey, provider),
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) {
    throw new Error(
      `Embed failed (${provider} / ${model}): ${res.status} ${await res.text()}`,
    );
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

const EXTRACT_SYSTEM = `You distill conversations into atomic, durable memories about the USER. Output STRICT JSON: { "memories": [{ "text": "...", "category": "fact|preference|context|task" }] }. Rules:
- Only include things worth remembering across future conversations.
- Skip greetings, small talk, or transient questions.
- Each memory must be a single self-contained sentence, written in third person about the user.
- Return up to 3 memories. Empty array is fine.
- Respond with ONLY the JSON object, no prose, no markdown fences.`;

/**
 * Pulls the JSON object out of an LLM reply. Some providers (notably
 * OpenRouter Claude/Gemini routes) wrap their output in markdown fences
 * or add a stray sentence even with strict instructions, so we forgive
 * both shapes.
 */
function parseMemoriesJson(raw: string): { text: string; category: string }[] {
  const trimmed = raw.trim();
  // Try direct parse first (response_format=json_object path).
  try {
    const parsed = JSON.parse(trimmed) as {
      memories?: { text: string; category: string }[];
    };
    return Array.isArray(parsed.memories) ? parsed.memories : [];
  } catch {
    // Strip ```json ... ``` fences or extract the first {...} block.
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fence?.[1] ?? trimmed).trim();
    const objStart = candidate.indexOf("{");
    const objEnd = candidate.lastIndexOf("}");
    if (objStart >= 0 && objEnd > objStart) {
      try {
        const parsed = JSON.parse(candidate.slice(objStart, objEnd + 1)) as {
          memories?: { text: string; category: string }[];
        };
        return Array.isArray(parsed.memories) ? parsed.memories : [];
      } catch {
        // fall through
      }
    }
    return [];
  }
}

export async function extractMemories(args: {
  apiKey: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<{ text: string; category: string }[]> {
  const provider = getStoredProvider();
  const baseUrl = PROVIDER_BASE_URL[provider];
  const model = getStoredModel();

  const userContent = `User said:
${args.userMessage}

Assistant replied:
${args.assistantMessage}`;

  // First attempt: ask for JSON via `response_format`. This is the
  // strict path supported by OpenAI and most OpenRouter relays.
  const baseBody = {
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: EXTRACT_SYSTEM },
      { role: "user", content: userContent },
    ],
  };

  let res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(args.apiKey, provider),
    body: JSON.stringify({
      ...baseBody,
      response_format: { type: "json_object" },
    }),
  });

  // Some routes (notably OpenRouter Anthropic/Gemini) reject
  // `response_format`. Retry once without it — the system prompt
  // already instructs the model to emit strict JSON.
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    const errText = await res.text().catch(() => "");
    if (typeof console !== "undefined") {
      console.debug(
        "[memory] response_format rejected by",
        provider,
        model,
        "→ retrying without it.",
        errText,
      );
    }
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: buildHeaders(args.apiKey, provider),
      body: JSON.stringify(baseBody),
    });
  }

  if (!res.ok) {
    throw new Error(
      `Memory extraction failed (${provider} / ${model}): ${res.status} ${await res.text()}`,
    );
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const memories = parseMemoriesJson(raw);
  if (typeof console !== "undefined") {
    console.debug(
      "[memory] extractor returned",
      memories.length,
      "candidates from",
      model,
    );
  }
  return memories;
}
