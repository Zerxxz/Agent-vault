// Streaming chat proxy. Reads provider + model from request headers
// so the same edge route serves OpenAI and OpenRouter (and any other
// OpenAI-compatible endpoint we add later — Groq, Together, etc.).

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";

const PROVIDER_BASE_URL = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
} as const;

type Body = {
  messages: CoreMessage[];
  system: string;
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-llm-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Set one in /settings to start chatting." },
      { status: 400 },
    );
  }

  const provider =
    (req.headers.get("x-llm-provider") as keyof typeof PROVIDER_BASE_URL) ||
    "openai";
  const model = req.headers.get("x-llm-model") || "gpt-4o-mini";
  const baseURL = PROVIDER_BASE_URL[provider];

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON body" }, { status: 400 });
  }

  const client = createOpenAI({
    apiKey,
    baseURL,
    headers:
      provider === "openrouter"
        ? {
            "HTTP-Referer": req.headers.get("origin") ?? "https://heirloom.app",
            "X-Title": "Heirloom",
          }
        : undefined,
  });

  const result = streamText({
    model: client(model),
    system: body.system,
    messages: body.messages,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
