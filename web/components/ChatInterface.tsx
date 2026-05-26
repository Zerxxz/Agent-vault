"use client";

// The main chat surface — talks to /api/chat, streams the reply, and
// (in the background) extracts + persists durable memories on each
// completed turn:
//
//   1. user types  →  searchRelevant() pulls top-K memories
//   2. POST /api/chat with persona + memory recall block as `system`
//   3. read the plain-text stream into local message state
//   4. on stream end, run extractMemories() against the exchange
//   5. for each new memory:
//        a. persistMemory()  (embed + encrypt + Walrus PUT + IndexedDB)
//        b. sign a single multi-call Sui tx that adds them all
//
// Step 5 runs in the background so the user can send their next
// message immediately. Failures surface as a non-blocking toast.

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChatBubble, type ChatRole } from "./ChatBubble";
import { Avatar } from "./Avatar";
import { GlowButton } from "./GlowButton";
import { config } from "@/lib/config";
import { extractMemories } from "@/lib/llm";
import {
  persistMemory,
  rehydrateFromChain,
  searchRelevant,
} from "@/lib/memory";
import { getStoredOpenAIKey, listMemories } from "@/lib/storage";

export type AgentDescriptor = {
  id: string;
  name: string;
  persona: string;
  avatar: string;
  memoryBlobIds: string[];
};

type Message = {
  id: string;
  role: ChatRole;
  content: string;
};

type Toast = { id: string; text: string; tone: "info" | "error" | "success" };

const MAX_RECALL = 5;

export function ChatInterface({ agent }: { agent: AgentDescriptor }) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rehydrating, setRehydrating] = useState<{ done: number; total: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- One-time rehydrate of the local memory cache ----------------
  useEffect(() => {
    void (async () => {
      const cached = await listMemories(agent.id);
      const cachedIds = new Set(cached.map((m) => m.blobId));
      const missing = agent.memoryBlobIds.filter(
        (b) => !cachedIds.has(b),
      );
      if (missing.length === 0) return;

      setRehydrating({ done: 0, total: missing.length });
      const restored = await rehydrateFromChain({
        agentObjectId: agent.id,
        blobIds: missing,
        onProgress: (done, total) => setRehydrating({ done, total }),
      });
      setRehydrating(null);
      if (restored > 0) {
        pushToast(
          "info",
          `Loaded ${restored} memor${restored === 1 ? "y" : "ies"} from Walrus.`,
        );
      }
    })();
    // We only re-run if the agent id or its blob list changed.
  }, [agent.id, agent.memoryBlobIds.join(",")]);

  // ---- Auto-scroll on new content ----------------------------------
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamText]);

  function pushToast(tone: Toast["tone"], text: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((cur) => [...cur, { id, tone, text }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 4500);
  }

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streaming) return;

      const apiKey = getStoredOpenAIKey();
      if (!apiKey) {
        pushToast("error", "Add your OpenAI key in /settings first.");
        return;
      }

      const userMsg: Message = {
        id: Math.random().toString(36).slice(2),
        role: "user",
        content: text,
      };
      const baseMessages = [...messages, userMsg];
      setMessages(baseMessages);
      setInput("");
      setStreaming(true);
      setStreamText("");

      try {
        // --- 1. Recall relevant memories ---
        const hits = await searchRelevant({
          agentObjectId: agent.id,
          query: text,
          apiKey,
          k: MAX_RECALL,
        });

        const memoryBlock =
          hits.length > 0
            ? `\n\n## Relevant memories about the user\n${hits
                .map((h, i) => `${i + 1}. ${h.payload.text}`)
                .join("\n")}\n\nUse these only if directly relevant.`
            : "";

        const system = agent.persona + memoryBlock;

        // --- 2. Stream reply from /api/chat ---
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-openai-key": apiKey,
          },
          body: JSON.stringify({
            system,
            messages: baseMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => res.statusText);
          throw new Error(err || "Chat request failed.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setStreamText(assistantText);
        }

        const finalMessages: Message[] = [
          ...baseMessages,
          {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: assistantText,
          },
        ];
        setMessages(finalMessages);
        setStreamText("");
        setStreaming(false);

        // --- 3. Extract + persist memories in the background ---
        void (async () => {
          try {
            const extracted = await extractMemories({
              apiKey,
              userMessage: text,
              assistantMessage: assistantText,
            });
            if (extracted.length === 0) return;

            const persisted: { blobId: string; category: string }[] = [];
            for (const mem of extracted) {
              try {
                const { blobId } = await persistMemory({
                  agentObjectId: agent.id,
                  text: mem.text,
                  category: mem.category,
                  apiKey,
                });
                persisted.push({ blobId, category: mem.category });
              } catch {
                // Ignore single-memory failures so the rest still land.
              }
            }
            if (persisted.length === 0) return;

            // Sign a single tx that pushes every blob_id at once.
            const tx = new Transaction();
            for (const m of persisted) {
              tx.moveCall({
                target: `${config.agentPackageId}::agent::add_memory`,
                arguments: [
                  tx.object(agent.id),
                  tx.pure.string(m.blobId),
                  tx.pure.string(m.category),
                  tx.object.clock(),
                ],
              });
            }

            await signAndExecute({ transaction: tx });
            pushToast(
              "success",
              `Remembered ${persisted.length} new ${
                persisted.length === 1 ? "thing" : "things"
              }.`,
            );
          } catch (err) {
            pushToast(
              "error",
              `Memory failed: ${
                err instanceof Error ? err.message : "unknown"
              }`,
            );
          }
        })();
      } catch (err) {
        setStreaming(false);
        setStreamText("");
        pushToast(
          "error",
          err instanceof Error ? err.message : "Chat failed.",
        );
      }
    },
    [agent.id, agent.persona, messages, signAndExecute, streaming],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="relative flex h-[640px] flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
      {/* Rehydrate banner */}
      <AnimatePresence>
        {rehydrating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1 text-xs text-white/70 backdrop-blur"
          >
            Loading memory from Walrus… {rehydrating.done}/{rehydrating.total}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className={
                t.tone === "error"
                  ? "rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200"
                  : t.tone === "success"
                    ? "rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
                    : "rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80"
              }
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && !streaming && (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-white/40">
            <Avatar src={agent.avatar} size={72} className="mb-3" />
            <p className="font-medium text-white/70">
              Say hi to {agent.name}
            </p>
            <p className="mx-auto mt-1 max-w-xs">
              Every meaningful turn becomes a memory on Walrus, signed by
              you on Sui.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role}
            content={m.content}
            avatar={agent.avatar}
          />
        ))}

        {streaming && (
          <ChatBubble
            role="assistant"
            content={streamText}
            avatar={agent.avatar}
            isTyping={streamText.length === 0}
          />
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-white/5 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            account
              ? `Message ${agent.name}…`
              : "Connect your wallet to chat"
          }
          disabled={!account || streaming}
          className="flex-1"
        />
        <GlowButton
          type="submit"
          variant="violet"
          disabled={!account || !input.trim() || streaming}
          className="!py-2.5 !px-5 !text-sm"
        >
          Send →
        </GlowButton>
      </form>
    </div>
  );
}
