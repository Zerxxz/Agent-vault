"use client";

// Owner-only inheritance management page. Two surfaces:
//   - DormancyControl: threshold + ping
//   - HeirManager:     add / remove heir wallets
//
// We re-fetch the agent after every successful mutation so the UI
// stays in sync with the on-chain state without a hard reload.

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DormancyControl } from "@/components/DormancyControl";
import { Header } from "@/components/Header";
import { HeirManager } from "@/components/HeirManager";
import {
  computeDormancy,
  detectRole,
  type AgentChainData,
} from "@/lib/inheritance";

export default function LegacyPage({
  params,
}: {
  params: { id: string };
}) {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  const [agent, setAgent] = useState<AgentChainData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const obj = await suiClient.getObject({
          id: params.id,
          options: { showContent: true, showOwner: true },
        });
        const content = obj.data?.content;
        if (!content || content.dataType !== "moveObject") {
          throw new Error("Object is not an Agent NFT");
        }
        const fields = content.fields as Record<string, unknown>;

        const memoryRefs = (fields.memory_refs as unknown[]) ?? [];
        const blobIds: string[] = [];
        for (const m of memoryRefs) {
          if (m && typeof m === "object") {
            if ("fields" in m) {
              const f = (m as { fields: { blob_id?: string } }).fields;
              if (typeof f.blob_id === "string") blobIds.push(f.blob_id);
            } else if ("blob_id" in m) {
              const b = (m as { blob_id?: string }).blob_id;
              if (typeof b === "string") blobIds.push(b);
            }
          }
        }

        const heirs = ((fields.heirs as unknown[]) ?? []).filter(
          (h): h is string => typeof h === "string",
        );

        setAgent({
          id: params.id,
          creator: (fields.creator as string) ?? "",
          name: (fields.name as string) ?? "Agent",
          persona: (fields.persona as string) ?? "",
          avatar: (fields.avatar as string) ?? "🤖",
          memoryBlobIds: blobIds,
          heirs,
          dormancyThresholdMs: Number(fields.dormancy_threshold_ms ?? 0),
          updatedAtMs: Number(fields.updated_at_ms ?? 0),
          version: Number(fields.version ?? 0),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [params.id, suiClient, refreshTick]);

  // Live tick so the dormancy countdown advances while we sit here.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const role = useMemo(
    () => (agent ? detectRole(agent, account?.address) : "stranger"),
    [agent, account?.address],
  );
  const dormancy = useMemo(
    () => (agent ? computeDormancy(agent, now) : null),
    [agent, now],
  );

  if (error) {
    return (
      <Shell>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="font-semibold">Couldn't load that agent</p>
          <p className="mt-2 text-sm text-red-200">{error}</p>
        </div>
      </Shell>
    );
  }

  if (!agent || !dormancy) {
    return (
      <Shell>
        <div className="h-96 animate-pulse rounded-3xl border border-white/5 shimmer" />
      </Shell>
    );
  }

  if (role !== "owner") {
    return (
      <Shell>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
          <p className="text-2xl">🔒</p>
          <h2 className="mt-3 text-xl font-semibold">Owner only</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
            The Legacy page is where the owner of an agent manages
            heirs and the dead-man's switch. Connect with the wallet
            that minted this agent to continue.
          </p>
          <Link
            href={`/agent/${agent.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs hover:bg-white/10"
          >
            ← Back to chat
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-10"
      >
        {/* Header */}
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300/80">
            Living will
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Legacy of <span className="gradient-text-violet">{agent.name}</span>
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Choose who inherits this mind, and how long it waits in
            silence before they can read it.
          </p>
          <Link
            href={`/agent/${agent.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs hover:bg-white/10"
          >
            ← Back to chat
          </Link>
        </div>

        {/* Dormancy */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl md:p-8">
          <DormancyControl
            agent={agent}
            dormancy={dormancy}
            onChange={refetch}
          />
        </section>

        {/* Heirs */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl md:p-8">
          <HeirManager
            agentObjectId={agent.id}
            heirs={agent.heirs}
            onChange={refetch}
          />
        </section>

        {/* Reminder */}
        <p className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-xs text-amber-100/80">
          Heirs only ever read in <strong>memorial mode</strong> — they
          can chat with your preserved memory, but they cannot add new
          memories or change your persona. Your soul stays as you wrote it.
        </p>
      </motion.div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-6 pb-20">
      <Header />
      {children}
    </div>
  );
}
