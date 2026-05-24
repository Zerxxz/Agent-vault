// OpenAI client helpers used directly from the browser via BYOK key.
// Embeddings + small "memory extractor" calls run client-side so no
// secret has to round-trip through our server. The streaming chat call
// goes through /api/chat so we can use the Vercel AI SDK's helpers
// without bundling the OpenAI SDK into the client.

const OPENAI_BASE = "https://api.openai.com/v1";

export const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dim
export const CHAT_MODEL = "gpt-4o-mini";
export const EXTRACTOR_MODEL = "gpt-4o-mini";

export async function embed(
  text: string,
  apiKey: string,
): Promise<number[]> {
  const res = await fetch(`${OPENAI_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embed failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  return json.data[0].embedding;
}

/**
 * Ask the model to extract zero or more atomic memories from a chat
 * exchange. We deliberately ask for an explicit JSON array so we can
 * parse without fancy schema validation.
 */
export async function extractMemories(args: {
  apiKey: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<{ text: string; category: string }[]> {
  const system = `You distill conversations into atomic, durable memories about the USER. Output STRICT JSON: { "memories": [{ "text": "...", "category": "fact|preference|context|task" }] }. Rules:
- Only include things worth remembering across future conversations.
- Skip greetings, small talk, or transient questions.
- Each memory must be a single self-contained sentence, written in third person about the user.
- Return up to 3 memories. Empty array is fine.`;

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: EXTRACTOR_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `User said:\n${args.userMessage}\n\nAssistant replied:\n${args.assistantMessage}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(
      `OpenAI extract failed: ${res.status} ${await res.text()}`,
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
