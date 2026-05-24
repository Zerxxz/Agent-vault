"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import {
  ChatInterface,
  type AgentDescriptor,
} from "@/components/ChatInterface";
import { Header } from "@/components/Header";

type LoadedAgent = AgentDescriptor & {
  version: number;
  memoryCount: number;
};

export default function AgentChatPage({
  params,
}: {
  params: { id: string };
}) {
  const suiClient = useSuiClient();
  const [agent, setAgent] = useState<LoadedAgent | null>(null);
  const [error, setError] = useState<string | null>(null);

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

        const memoryRefs = (fields.memory_refs as { fields: Record<string, unknown> }[] | unknown[]) ?? [];
        const blobIds = (memoryRefs as unknown[])
          .map((m) => {
            // memory_refs comes back as either array of { fields: { blob_id } }
            // or a flat array, depending on RPC version. Handle both.
            if (m && typeof m === "object" && "fields" in m) {
              return (
                ((m as { fields: { blob_id?: string } }).fields.blob_id) ?? null
              );
            }
            if (m && typeof m === "object" && "blob_id" in m) {
              return (m as { blob_id?: string }).blob_id ?? null;
            }
            return null;
          })
          .filter((s): s is string => typeof s === "string" && s.length > 0);

        setAgent({
          id: params.id,
          name: (fields.name as string) ?? "Agent",
          persona: (fields.persona as string) ?? "",
          avatar: (fields.avatar as string) ?? "🤖",
          memoryBlobIds: blobIds,
          memoryCount: blobIds.length,
          version: Number(fields.version ?? 0),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [params.id, suiClient]);

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

  if (!agent) {
    return (
      <Shell>
        <div className="h-[640px] animate-pulse rounded-3xl border border-white/5 shimmer" />
      </Shell>
    );
  }

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{agent.avatar}</span>
            <div>
              <h1 className="text-xl font-semibold">{agent.name}</h1>
              <p className="font-mono text-[11px] text-white/40">
                {agent.id.slice(0, 10)}…{agent.id.slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
              v{agent.version}
            </span>
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-violet-200">
              {agent.memoryCount}{" "}
              {agent.memoryCount === 1 ? "memory" : "memories"}
            </span>
            <Link
              href={`/agent/${agent.id}/memories`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
            >
              Inspect →
            </Link>
          </div>
        </div>

        <ApiKeyGate>
          <ChatInterface agent={agent} />
        </ApiKeyGate>
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
