"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

export type ChatRole = "user" | "assistant";

export function ChatBubble({
  role,
  content,
  avatar,
  isTyping = false,
}: {
  role: ChatRole;
  content: string;
  avatar?: string;
  isTyping?: boolean;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "flex w-full items-start gap-3",
        isUser && "justify-end",
      )}
    >
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-violet-500/15 text-base">
          {avatar ?? "🤖"}
        </div>
      )}

      <div
        className={clsx(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-white text-slate-900"
            : "border border-white/10 bg-white/[0.03] text-white",
        )}
      >
        {isTyping ? (
          <span className="text-violet-300">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
        ) : (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-cyan-500/15 text-base">
          🫵
        </div>
      )}
    </motion.div>
  );
}
