// Streaming chat endpoint. The user's BYOK OpenAI key is sent in a
// header from the client; we never persist it server-side. We use the
// Vercel AI SDK so the wire format is the standard data-stream protocol
// the `useChat` hook on the client speaks natively.

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "edge";

type Body = {
  messages: CoreMessage[];
  /** Per-agent system prompt (persona + memory recall block). */
  system: string;
};

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-openai-key");
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing OpenAI API key. Set one in /settings to start chatting.",
      },
      { status: 400 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON body" }, { status: 400 });
  }

  const openai = createOpenAI({ apiKey });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: body.system,
    messages: body.messages,
    temperature: 0.7,
  });

  // Plain text stream — easier to consume from a custom client hook than
  // the data-stream protocol. We sacrifice tool-call support, which we
  // don't need for this MVP anyway.
  return result.toTextStreamResponse();
}
