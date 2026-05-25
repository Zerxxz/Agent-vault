"use client";

import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import clsx from "clsx";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { ChatInterface } from "@/components/ChatInterface";
import { Header } from "@/components/Header";
import {
  computeDormancy,
  detectRole,
  formatDuration,
  type AgentChainData,
} from "@/lib/inheritance";

export default function AgentChatPage({
  params,
}: {
  params: { id: string };
}) {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();

  const [agent, setAgent] = useState<AgentChainData | null>(null);
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

        const heirsRaw = (fields.heirs as unknown[]) ?? [];
        const heirs = heirsRaw.filter(
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
  }, [params.id, suiClient]);

  // Tick once a minute so dormancy state stays fresh while the user
  // sits on the page.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const role = useMemo(
    () => (agent ? detectRole(agent, account?.address) : "stranger"),
    [agent, account?.address],
  );
  const dormancy = useMemo(
    () => (agent ? computeDormancy(agent) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agent, tick],
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
        <div className="h-[640px] animate-pulse rounded-3xl border border-white/5 shimmer" />
      </Shell>
    );
  }

  const isOwner = role === "owner";
  const isHeir = role === "heir";
  const heirLocked = isHeir && !dormancy.isDormant;
  const stranger = role === "stranger";

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header — name, status, links */}
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <StatusPill
              tone={dormancy.isDormant ? "amber" : "emerald"}
              label={dormancy.isDormant ? "Dormant" : "Active"}
            />
            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-violet-200">
              {agent.memoryBlobIds.length}{" "}
              {agent.memoryBlobIds.length === 1 ? "memory" : "memories"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
              {agent.heirs.length} {agent.heirs.length === 1 ? "heir" : "heirs"}
            </span>
            <Link
              href={`/agent/${agent.id}/memories`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10"
            >
              Memories →
            </Link>
            {isOwner && (
              <Link
                href={`/agent/${agent.id}/legacy`}
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20"
              >
                Legacy →
              </Link>
            )}
          </div>
        </div>

        {/* Status sub-line — humans don't read tick counts; show ms in plain English */}
        <p className="mb-6 text-xs text-white/40">
          {dormancy.isDormant ? (
            <>
              Memorial mode unlocked{" "}
              <span className="text-white/60">
                {formatDuration(dormancy.silentMs - dormancy.dormantAtMs + agent.updatedAtMs)}
              </span>{" "}
              ago · last activity {formatDuration(dormancy.silentMs)} ago
            </>
          ) : (
            <>
              Dormancy in{" "}
              <span className="font-mono text-white/70">
                {formatDuration(dormancy.remainingMs)}
              </span>{" "}
              · last activity {formatDuration(dormancy.silentMs)} ago
            </>
          )}
        </p>

        {/* Gate: stranger sees nothing useful */}
        {stranger && (
          <LockedScreen
            title="Not your agent"
            body={
              <>
                Only the owner and listed heirs can interact with this agent.
                If you should be on the list, ask the owner to add{" "}
                <code className="font-mono text-xs">
                  {account?.address?.slice(0, 6) ?? "your wallet"}
                </code>{" "}
                via the Legacy page.
              </>
            }
          />
        )}

        {heirLocked && (
          <LockedScreen
            title="Not yet"
            body={
              <>
                You're listed as an heir, but {agent.name} is still active.
                The agent unlocks for you in{" "}
                <span className="font-mono text-amber-200">
                  {formatDuration(dormancy.remainingMs)}
                </span>{" "}
                of silence — or sooner if the owner sets a shorter dormancy.
              </>
            }
          />
        )}

        {(isOwner || (isHeir && dormancy.isDormant)) && (
          <ApiKeyGate>
            <ChatInterface agent={agent} role={role} dormancy={dormancy} />
          </ApiKeyGate>
        )}
      </motion.div>
    </Shell>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: "amber" | "emerald";
  label: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
        tone === "amber" &&
          "border-amber-400/40 bg-amber-500/15 text-amber-200",
        tone === "emerald" &&
          "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
      )}
    >
      <span
        className={clsx(
          "size-1.5 rounded-full",
          tone === "amber" ? "bg-amber-400" : "animate-pulse bg-emerald-400",
        )}
      />
      {label}
    </span>
  );
}

function LockedScreen({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
      <p className="text-2xl">🔒</p>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/55">{body}</p>
    </div>
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
