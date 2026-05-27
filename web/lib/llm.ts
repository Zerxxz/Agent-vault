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

export async function extractMemories(args: {
  apiKey: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<{ text: string; category: string }[]> {
  const provider = getStoredProvider();
  const baseUrl = PROVIDER_BASE_URL[provider];
  const model = getStoredModel();

  const system = `You distill conversations into atomic, durable memories about the USER. Output STRICT JSON: { "memories": [{ "text": "...", "category": "fact|preference|context|task" }] }. Rules:
- Only include things worth remembering across future conversations.
- Skip greetings, small talk, or transient questions.
- Each memory must be a single self-contained sentence, written in third person about the user.
- Return up to 3 memories. Empty array is fine.`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(args.apiKey, provider),
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `User said:
${args.userMessage}

Assistant replied:
${args.assistantMessage}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Memory extraction failed (${provider} / ${model}): ${res.status} ${await res.text()}`,
    );
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  try {
    const parsed = JSON.parse(json.choices[0].message.content) as {
      memories?: { text: string; category: string }[];
    };
    return Array.isArray(parsed.memories) ? parsed.memories : [];
  } catch {
    return [];
  }
}
