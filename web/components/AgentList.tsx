"use client";

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { fetchHeirAgentIds, computeDormancy, formatDuration, type AgentChainData } from "@/lib/inheritance";

const PACKAGE_ID =
  process.env.NEXT_PUBLIC_AGENT_PACKAGE_ID ??
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const AGENT_TYPE = `${PACKAGE_ID}::agent::AgentNFT`;

export type AgentSummary = AgentChainData & {
  memoryCount: number;
  role: "owner" | "heir";
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
      // 1. Owned agents (existing)
      const ownedRes = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: AGENT_TYPE },
        options: { showContent: true },
        limit: 50,
      });

      // 2. NEW: Heir-listed agents (from event log)
      const heirIds = await fetchHeirAgentIds(
        suiClient,
        account.address,
        PACKAGE_ID,
      );
      const heirObjs = await Promise.all(
        heirIds.map((id) =>
          suiClient
            .getObject({ id, options: { showContent: true } })
            .catch(() => null),
        ),
      );

      if (cancelled) return;

      const list: AgentSummary[] = [];

      // Parse owned
      for (const item of ownedRes.data) {
        const parsed = parseAgent(item.data);
        if (parsed) list.push({ ...parsed, role: "owner" });
      }

      // Parse heir-listed (skip if it's already in owned, e.g. owner
      // listed themselves accidentally)
      const ownedIds = new Set(list.map((a) => a.id));
      for (const item of heirObjs) {
        if (!item) continue;
        const parsed = parseAgent(item.data);
        if (parsed && !ownedIds.has(parsed.id)) {
          list.push({ ...parsed, role: "heir" });
        }
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
            className="h-36 animate-pulse rounded-2xl border border-white/5 shimmer"
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
      {items.map((agent) => {
        const dormancy = computeDormancy(agent);
        return (
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
                <StatusBadge isDormant={dormancy.isDormant} />
              </div>
              <p className="font-medium">{agent.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-white/50">
                {agent.persona}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] uppercase tracking-wider">
                <span className="text-white/40">
                  {agent.memoryCount}{" "}
                  {agent.memoryCount === 1 ? "memory" : "memories"} ·{" "}
                  {agent.heirs.length}{" "}
                  {agent.heirs.length === 1 ? "heir" : "heirs"}
                </span>
                <span className="text-violet-300">
                  {dormancy.isDormant ? "Memorial →" : "Open chat →"}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-white/30">
                {dormancy.isDormant
                  ? `Dormant since ${formatDuration(dormancy.silentMs)}`
                  : `Active · ${formatDuration(dormancy.remainingMs)} until dormant`}
              </div>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function StatusBadge({ isDormant }: { isDormant: boolean }) {
  if (isDormant) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">
        <span className="size-1.5 rounded-full bg-amber-400" />
        Dormant
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-200">
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
      Active
    </span>
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

/**
 * memory_refs come back from RPC either as `[{ fields: { blob_id } }]`
 * or `[{ blob_id }]` depending on the SDK version. Handle both.
 */
function extractBlobIds(memoryRefs: unknown[]): string[] {
  const out: string[] = [];
  for (const m of memoryRefs) {
    if (m && typeof m === "object") {
      if ("fields" in m) {
        const f = (m as { fields: { blob_id?: string } }).fields;
        if (typeof f.blob_id === "string") out.push(f.blob_id);
        continue;
      }
      if ("blob_id" in m) {
        const b = (m as { blob_id?: string }).blob_id;
        if (typeof b === "string") out.push(b);
      }
    }
  }
  return out;
}

function parseAgent(data: unknown): (AgentChainData & { memoryCount: number }) | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { content?: { dataType?: string; fields?: Record<string, unknown> }; objectId?: string };
  if (d.content?.dataType !== "moveObject") return null;
  const fields = d.content.fields as Record<string, unknown>;
  
  const memoryRefs = (fields.memory_refs as unknown[]) ?? [];
  const heirsRaw = (fields.heirs as unknown[]) ?? [];
  
  return {
    id: d.objectId ?? "",
    creator: (fields.creator as string) ?? "",
    name: (fields.name as string) ?? "Untitled",
    persona: (fields.persona as string) ?? "",
    avatar: (fields.avatar as string) ?? "🤖",
    memoryBlobIds: extractBlobIds(memoryRefs),
    heirs: heirsRaw.filter((h): h is string => typeof h === "string"),
    dormancyThresholdMs: Number(fields.dormancy_threshold_ms ?? 0),
    updatedAtMs: Number(fields.updated_at_ms ?? 0),
    version: Number(fields.version ?? 0),
    memoryCount: memoryRefs.length,
  };
}
