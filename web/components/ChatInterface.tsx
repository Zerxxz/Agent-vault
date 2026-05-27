"use client";

// The main chat surface. Behaviour is role-aware:
//
//   - owner: full chat with privacy toggle. After every assistant turn
//     we extract atomic memories, encrypt them, push to Walrus, and
//     batch-sign a single `add_memory` tx (with `visibility = private`
//     when the toggle is on, else `heirs-visible`).
//
//   - heir (only when the agent is dormant): "memorial mode". The agent
//     still answers using owner-visible memories from Walrus, but we
//     never extract or persist new memories — the soul is read-only.
//     The privacy toggle is hidden.
//
//   - stranger / non-dormant heir: ChatInterface isn't rendered at all
//     (the parent page shows a locked screen).

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { ChatBubble, type ChatRole } from "./ChatBubble";
import { GlowButton } from "./GlowButton";
import { config } from "@/lib/config";
import {
  VISIBILITY_HEIRS,
  VISIBILITY_PRIVATE,
  type Visibility,
} from "@/lib/contract";
import {
  type AgentChainData,
  type AgentRole,
  type DormancyState,
  visibleMemoryFlags,
} from "@/lib/inheritance";
import { extractMemories } from "@/lib/llm";
import {
  persistMemory,
  rehydrateFromChain,
  searchRelevant,
} from "@/lib/memory";
import { getStoredOpenAIKey, listMemories } from "@/lib/storage";

type Message = {
  id: string;
  role: ChatRole;
  content: string;
};

type Toast = { id: string; text: string; tone: "info" | "error" | "success" };

const MAX_RECALL = 5;

export function ChatInterface({
  agent,
  role,
  dormancy,
}: {
  agent: AgentChainData;
  role: AgentRole;
  dormancy: DormancyState;
}) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const isOwner = role === "owner";
  const isHeirActive = role === "heir" && dormancy.isDormant;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [rehydrating, setRehydrating] = useState<{ done: number; total: number } | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- One-time rehydrate of the local memory cache ----------------
  useEffect(() => {
    void (async () => {
      const cached = await listMemories(agent.id);
      const cachedIds = new Set(cached.map((m) => m.blobId));
      const missing = agent.memoryBlobIds.filter((b) => !cachedIds.has(b));
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
        // --- 1. Recall — filter by what the current viewer is allowed to see.
        const visibilityFilter = visibleMemoryFlags(role, dormancy);
        const hits = await searchRelevant({
          agentObjectId: agent.id,
          query: text,
          apiKey,
          k: MAX_RECALL,
          visibilityFilter,
        });

        const memoryBlock =
          hits.length > 0
            ? `\n\n## Relevant memories about the user\n${hits
                .map((h, i) => `${i + 1}. ${h.payload.text}`)
                .join("\n")}\n\nUse these only if directly relevant.`
            : "";

        const memorialPreamble = isHeirActive
          ? `\n\nIMPORTANT: The original owner is no longer active. Speak in their voice and from their preserved memories. Do not invent new facts about them. If asked something the memories don't cover, say so honestly and offer to share what you do know.`
          : "";

        const system = agent.persona + memorialPreamble + memoryBlock;

        // --- 2. Stream reply from /api/chat
        const res = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-llm-key": apiKey,
    "x-llm-provider": getStoredProvider(),
    "x-llm-model": getStoredModel(),
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

        // --- 3. Memory extraction is OWNER-ONLY. Heirs read the soul,
        //        they don't shape it.
        if (!isOwner) return;

        void (async () => {
          try {
            const extracted = await extractMemories({
              apiKey,
              userMessage: text,
              assistantMessage: assistantText,
            });
            if (extracted.length === 0) return;

            const memoryVisibility: Visibility = privacyMode
              ? VISIBILITY_PRIVATE
              : VISIBILITY_HEIRS;

            const persisted: { blobId: string; category: string }[] = [];
            for (const mem of extracted) {
              try {
                const { blobId } = await persistMemory({
                  agentObjectId: agent.id,
                  text: mem.text,
                  category: mem.category,
                  visibility: memoryVisibility,
                  apiKey,
                });
                persisted.push({ blobId, category: mem.category });
              } catch {
                // Tolerate partial failures.
              }
            }
            if (persisted.length === 0) return;

            // One tx for the batch — N moveCalls, one signature.
            const tx = new Transaction();
            for (const m of persisted) {
              tx.moveCall({
                target: `${config.agentPackageId}::agent::add_memory`,
                arguments: [
                  tx.object(agent.id),
                  tx.pure.string(m.blobId),
                  tx.pure.string(m.category),
                  tx.pure.u8(memoryVisibility),
                  tx.object.clock(),
                ],
              });
            }

            await signAndExecute({ transaction: tx });
            pushToast(
              "success",
              `Remembered ${persisted.length} ${
                memoryVisibility === VISIBILITY_PRIVATE
                  ? "private"
                  : "heir-visible"
              } ${persisted.length === 1 ? "thing" : "things"}.`,
            );
          } catch (err) {
            pushToast(
              "error",
              `Memory failed: ${err instanceof Error ? err.message : "unknown"}`,
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
    [
      agent.id,
      agent.persona,
      messages,
      streaming,
      role,
      dormancy,
      isOwner,
      isHeirActive,
      privacyMode,
      signAndExecute,
    ],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="relative flex h-[640px] flex-col rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
      {/* Memorial-mode banner for heirs */}
      {isHeirActive && (
        <div className="flex items-center justify-center gap-2 border-b border-amber-400/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 px-5 py-2 text-xs">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <span className="font-medium uppercase tracking-[0.2em] text-amber-200">
            Memorial mode
          </span>
          <span className="text-amber-200/70">
            · speaking with {agent.name}'s preserved memory
          </span>
        </div>
      )}

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
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs",
                t.tone === "error" &&
                  "border border-red-500/30 bg-red-500/10 text-red-200",
                t.tone === "success" &&
                  "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                t.tone === "info" &&
                  "border border-white/10 bg-black/40 text-white/80",
              )}
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
              {isHeirActive
                ? `Ask ${agent.name} something — they'd want you to`
                : `Say hi to ${agent.name}`}
            </p>
            <p className="mx-auto mt-1 max-w-xs">
              {isHeirActive
                ? "Their voice is preserved on Walrus. New conversations don't change who they were."
                : "Every meaningful turn becomes a memory on Walrus, signed by you on Sui."}
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

      {/* Privacy toggle (owner only) */}
      {isOwner && (
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-2 text-xs">
          <button
            type="button"
            onClick={() => setPrivacyMode((p) => !p)}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3 py-1 transition",
              privacyMode
                ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
            )}
          >
            <span
              className={clsx(
                "inline-block h-2 w-4 rounded-full transition",
                privacyMode ? "bg-amber-400" : "bg-white/30",
              )}
            />
            {privacyMode ? "Private mode — heirs won't see" : "Heirs-visible mode (default)"}
          </button>
          <span className="text-white/30">
            New memories tagged{" "}
            <code className="font-mono">
              {privacyMode ? "visibility=0" : "visibility=1"}
            </code>
          </span>
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-white/5 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !account
              ? "Connect your wallet to chat"
              : isHeirActive
                ? `Ask ${agent.name} something…`
                : `Message ${agent.name}…`
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
