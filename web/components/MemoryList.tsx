"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { listMemories, type LocalMemory } from "@/lib/storage";

const CATEGORY_COLOR: Record<string, string> = {
  fact: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  preference: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  context: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  task: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};

export function MemoryList({ agentObjectId }: { agentObjectId: string }) {
  const [items, setItems] = useState<LocalMemory[] | null>(null);

  useEffect(() => {
    void (async () => {
      const list = await listMemories(agentObjectId);
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      setItems(list);
    })();
  }, [agentObjectId]);

  if (items === null) {
    return (
      <ul className="space-y-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-16 animate-pulse rounded-xl border border-white/5 shimmer"
          />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/50">
        No memories yet. Chat with the agent — the important bits will land
        here automatically.
      </p>
    );
  }

  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.04 } },
      }}
      className="space-y-2"
    >
      {items.map((m) => (
        <motion.li
          key={m.blobId}
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0 },
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                CATEGORY_COLOR[m.category] ??
                "border-white/15 bg-white/5 text-white/60"
              }`}
            >
              {m.category || "memory"}
            </span>
            <span className="font-mono text-[10px] text-white/30">
              {new Date(m.createdAtMs).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-white/85">{m.text}</p>
          <p className="mt-2 break-all font-mono text-[10px] text-white/30">
            {m.blobId}
          </p>
        </motion.li>
      ))}
    </motion.ul>
  );
}
