"use client";

// Heir list manager — owner-only. Validates Sui addresses on the way
// in, signs add/remove transactions through the connected wallet, and
// surfaces the result inline. Uses an `onChange` callback so the parent
// can refresh the agent object after each successful tx.

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GlowButton } from "./GlowButton";
import { buildAddHeirTx, buildRemoveHeirTx } from "@/lib/contract";

const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{1,64}$/;

export function HeirManager({
  agentObjectId,
  heirs,
  onChange,
}: {
  agentObjectId: string;
  heirs: string[];
  onChange: () => void;
}) {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"add" | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function flash(setter: (s: string | null) => void, msg: string) {
    setter(msg);
    setTimeout(() => setter(null), 4500);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const candidate = draft.trim();

    if (!SUI_ADDRESS_REGEX.test(candidate)) {
      flash(setError, "Not a valid Sui address. Format: 0x… (hex).");
      return;
    }
    if (account && candidate === account.address) {
      flash(setError, "You can't list yourself as your own heir.");
      return;
    }
    if (heirs.includes(candidate)) {
      flash(setError, "Already on the list.");
      return;
    }

    setBusy("add");
    try {
      const tx = buildAddHeirTx({
        agentObjectId,
        heirAddress: candidate,
      });
      await signAndExecute({ transaction: tx });
      setDraft("");
      flash(setNotice, "Heir added.");
      onChange();
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(addr: string) {
    setError(null);
    setBusy(addr);
    try {
      const tx = buildRemoveHeirTx({
        agentObjectId,
        heirAddress: addr,
      });
      await signAndExecute({ transaction: tx });
      flash(setNotice, "Heir removed.");
      onChange();
    } catch (err) {
      flash(setError, err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">Heirs</h3>
        <p className="mt-1 text-xs text-white/50">
          Wallets that can read this agent once dormancy triggers. They
          can chat in memorial mode but never write new memories.
        </p>
      </div>

      {/* Existing heirs */}
      <ul className="space-y-2">
        {heirs.length === 0 && (
          <li className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-white/40">
            No heirs yet. Add a wallet below to start your inheritance.
          </li>
        )}
        {heirs.map((h) => (
          <motion.li
            key={h}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
          >
            <code className="flex-1 break-all font-mono text-xs text-white/70">
              {h}
            </code>
            <button
              type="button"
              onClick={() => onRemove(h)}
              disabled={busy !== null}
              className={clsx(
                "rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs transition",
                busy === h ? "opacity-60" : "hover:bg-red-500/10 hover:text-red-200",
              )}
            >
              {busy === h ? "Removing…" : "Remove"}
            </button>
          </motion.li>
        ))}
      </ul>

      {/* Add new */}
      <form onSubmit={onAdd} className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-white/60">
          Add an heir
        </label>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="0x..."
            className="flex-1 font-mono text-xs"
            disabled={busy !== null}
          />
          <GlowButton
            type="submit"
            variant="violet"
            disabled={busy !== null || !draft}
            className="!py-2 !px-4 !text-xs"
          >
            {busy === "add" ? "Adding…" : "Add"}
          </GlowButton>
        </div>
      </form>

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
