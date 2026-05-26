"use client";

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";

const PACKAGE_ID =
  process.env.NEXT_PUBLIC_AGENT_PACKAGE_ID ??
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AGENT_TYPE = `${PACKAGE_ID}::agent::AgentNFT`;

export type AgentSummary = {
  id: string;
  name: string;
  persona: string;
  avatar: string;
  memoryCount: number;
  version: number;
  updatedAtMs: number;
};

export function AgentList() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const [items, setItems] = useState<AgentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      setItems(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: { StructType: AGENT_TYPE },
          options: { showContent: true },
          limit: 50,
        });

        if (cancelled) return;

        const list: AgentSummary[] = [];
        for (const item of res.data) {
          const content = item.data?.content;
          if (!content || content.dataType !== "moveObject") continue;
          const fields = content.fields as Record<string, unknown>;
          list.push({
            id: item.data?.objectId ?? "",
            name: (fields.name as string) ?? "Untitled",
            persona: (fields.persona as string) ?? "",
            avatar: (fields.avatar as string) ?? "🤖",
            memoryCount: Array.isArray(fields.memory_refs)
              ? (fields.memory_refs as unknown[]).length
              : 0,
            version: Number(fields.version ?? 0),
            updatedAtMs: Number(fields.updated_at_ms ?? 0),
          });
        }

        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setItems(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account, suiClient]);

  if (!account) {
    return (
      <EmptyState
        title="Connect your wallet"
        body="Once connected, your agents will show up here."
      />
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Couldn't load agents: {error}
      </p>
    );
  }

  if (items === null) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/5 shimmer"
          />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No agents yet"
        body={
          <>
            Mint your first one in 30 seconds.{" "}
            <Link href="/create" className="text-violet-300 hover:text-violet-200">
              Create →
            </Link>
          </>
        }
      />
    );
  }

  return (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((agent) => (
        <motion.li
          key={agent.id}
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Link
            href={`/agent/${agent.id}`}
            className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition gradient-border hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <Avatar src={agent.avatar} size={48} rounded="lg" />
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/50">
                v{agent.version}
              </span>
            </div>
            <p className="font-medium">{agent.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-white/50">
              {agent.persona}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider">
              <span className="text-white/40">
                {agent.memoryCount} {agent.memoryCount === 1 ? "memory" : "memories"}
              </span>
              <span className="text-violet-300">Open chat →</span>
            </div>
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-white/50">{body}</p>
    </div>
  );
}
