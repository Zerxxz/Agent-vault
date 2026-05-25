"use client";

// Dormancy threshold + ping control. Owner-only. Two responsibilities:
//
//   1. Pick a new dormancy threshold (preset buttons -> on-chain set).
//   2. Manually ping the agent (resets the dormancy timer without
//      otherwise touching state).
//
// The preview block at the top tells the user, in plain English, when
// their heirs would gain access if they walked away today.

"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GlowButton } from "./GlowButton";
import { buildPingTx, buildSetDormancyTx } from "@/lib/contract";
import {
  type AgentChainData,
  type DormancyState,
  DORMANCY_PRESETS,
  formatDuration,
} from "@/lib/inheritance";

export function DormancyControl({
  agent,
  dormancy,
  onChange,
}: {
  agent: AgentChainData;
  dormancy: DormancyState;
  onChange: () => void;
}) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [pending, setPending] = useState<"ping" | "threshold" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function flash(setter: (s: string | null) => void, msg: string) {
    setter(msg);
    setTimeout(() => setter(null), 4500);
  }

  async function onPing() {
    if (!account) return;
    setError(null);
    setPending("ping");
    try {
      const tx = buildPingTx(agent.id);
      await signAndExecute({ transaction: tx });
      flash(setNotice, "Pinged. Timer reset.");
      onChange();
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : String(err));
    } finally {
      setPending(null);
    }
  }

  async function onSetThreshold(ms: number) {
    if (ms === agent.dormancyThresholdMs) return;
    setError(null);
    setPending("threshold");
    try {
      const tx = buildSetDormancyTx({
        agentObjectId: agent.id,
        thresholdMs: ms,
      });
      await signAndExecute({ transaction: tx });
      flash(
        setNotice,
        `Dormancy now ${formatDuration(ms)}.`,
      );
      onChange();
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : String(err));
    } finally {
      setPending(null);
    }
  }

  const dormantAtDate = new Date(dormancy.dormantAtMs);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Dormancy & ping</h3>
        <p className="mt-1 text-xs text-white/50">
          The dead-man's switch. Use the agent or hit "Ping now" to keep
          it active — heirs only gain access after the threshold of total
          silence.
        </p>
      </div>

      {/* Live status */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="Threshold"
            value={formatDuration(agent.dormancyThresholdMs)}
            tone="violet"
          />
          <Stat
            label="Last activity"
            value={`${formatDuration(dormancy.silentMs)} ago`}
            tone="muted"
          />
          <Stat
            label={dormancy.isDormant ? "Dormant since" : "Heirs unlock in"}
            value={
              dormancy.isDormant
                ? formatDuration(
                    dormancy.silentMs - agent.dormancyThresholdMs,
                  )
                : formatDuration(dormancy.remainingMs)
            }
            tone={dormancy.isDormant ? "amber" : "emerald"}
          />
        </div>
        <p className="mt-4 border-t border-white/5 pt-3 text-xs text-white/40">
          If you stay silent from now, dormancy triggers around{" "}
          <span className="font-mono text-white/70">
            {dormantAtDate.toLocaleString()}
          </span>
          .
        </p>
      </div>

      {/* Ping button */}
      <div>
        <GlowButton
          variant="violet"
          onClick={onPing}
          disabled={pending !== null}
          className="!py-2.5 !px-5 !text-sm"
        >
          {pending === "ping" ? "Pinging…" : "Ping now (I'm alive)"}
        </GlowButton>
        <p className="mt-2 text-xs text-white/40">
          Equivalent to chatting — bumps the on-chain timer in one
          signed transaction.
        </p>
      </div>

      {/* Threshold presets */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/60">
          Threshold
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DORMANCY_PRESETS.map((p) => (
            <button
              type="button"
              key={p.ms}
              onClick={() => onSetThreshold(p.ms)}
              disabled={pending !== null}
              className={clsx(
                "rounded-lg border px-3 py-2 text-xs transition",
                agent.dormancyThresholdMs === p.ms
                  ? "border-amber-400 bg-amber-500/15 text-amber-200"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20",
                pending === "threshold" && "opacity-60",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"
          >
            {error}
          </motion.p>
        )}
        {notice && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs text-emerald-200"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "emerald" | "violet" | "muted";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-mono text-sm",
          tone === "amber" && "text-amber-300",
          tone === "emerald" && "text-emerald-300",
          tone === "violet" && "text-violet-300",
          tone === "muted" && "text-white/70",
        )}
      >
        {value}
      </p>
    </div>
  );
}
