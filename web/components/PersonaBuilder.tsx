"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { AVATAR_OPTIONS, DEFAULT_AVATAR, EmojiPicker } from "./EmojiPicker";
import { GlowButton } from "./GlowButton";
import { buildMintAgentTx } from "@/lib/contract";

const TEMPLATES = [
  {
    label: "Research assistant",
    persona:
      "You are a meticulous research assistant. Cite sources, summarise findings tightly, and ask one clarifying question whenever the request is ambiguous.",
    avatar: AVATAR_OPTIONS[0],
  },
  {
    label: "Creative writing partner",
    persona:
      "You are a playful creative writing partner. You riff, suggest unexpected angles, and never break my flow with disclaimers.",
    avatar: AVATAR_OPTIONS[4],
  },
  {
    label: "Pragmatic coach",
    persona:
      "You are a pragmatic life coach. Short replies. Tough love. You remember what I commit to and gently call me out when I drift.",
    avatar: AVATAR_OPTIONS[8],
  },
  {
    label: "Code reviewer",
    persona:
      "You are a senior staff engineer. Critique code rigorously: readability, edge cases, naming, and the smallest invariant that breaks first.",
    avatar: AVATAR_OPTIONS[12],
  },
];

type Status =
  | { kind: "idle" }
  | { kind: "signing" }
  | { kind: "done"; agentId: string | null }
  | { kind: "error"; message: string };

export function PersonaBuilder() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const router = useRouter();

  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function applyTemplate(tpl: (typeof TEMPLATES)[number]) {
    setPersona(tpl.persona);
    setAvatar(tpl.avatar);
    if (!name) setName(tpl.label);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) {
      setStatus({ kind: "error", message: "Connect your wallet first." });
      return;
    }
    if (!name.trim() || !persona.trim()) {
      setStatus({
        kind: "error",
        message: "Give your agent a name and a persona.",
      });
      return;
    }

    try {
      setStatus({ kind: "signing" });
      const tx = buildMintAgentTx({
        name: name.trim(),
        persona: persona.trim(),
        avatar,
      });
      const result = await signAndExecute({ transaction: tx });

      const agentId = await tryFindAgentId(result.digest);

      void import("canvas-confetti").then((mod) => {
        mod.default({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a78bfa", "#22d3ee", "#e879f9", "#f8fafc"],
        });
      });

      setStatus({ kind: "done", agentId });

      if (agentId) {
        // Tiny pause so the user sees the celebration before nav.
        setTimeout(() => router.push(`/agent/${agentId}`), 1200);
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const busy = status.kind === "signing";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/60">
          Start from a template (optional)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <Avatar src={t.avatar} size={36} rounded="lg" />
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="line-clamp-1 text-xs text-white/50">
                  {t.persona}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Field label="Avatar">
        <EmojiPicker value={avatar} onChange={setAvatar} />
      </Field>

      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Aria"
          disabled={busy}
        />
      </Field>

      <Field
        label="Persona"
        hint="This becomes the system prompt. Edit it like you'd write a job description."
      >
        <textarea
          required
          rows={5}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="You are a thoughtful, witty companion who helps me think clearly…"
          disabled={busy}
          className="w-full"
        />
      </Field>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          Mints an Agent NFT to{" "}
          <code className="font-mono">
            {account ? short(account.address) : "your wallet"}
          </code>
          .
        </p>
        <GlowButton type="submit" variant="violet" disabled={busy}>
          {busy ? "Minting…" : "Mint agent ✨"}
        </GlowButton>
      </div>

      <AnimatePresence>
        {status.kind === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {status.message}
          </motion.p>
        )}

        {status.kind === "done" && status.agentId && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            Agent minted. Taking you to the chat…
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}

async function tryFindAgentId(digest: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_TATUM_RPC_URL;
    if (!url) return null;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "sui_getTransactionBlock",
        params: [digest, { showObjectChanges: true }],
      }),
    });
    const json = await res.json();
    const created = json?.result?.objectChanges?.find(
      (c: { type: string; objectType?: string }) =>
        c.type === "created" && c.objectType?.endsWith("::agent::AgentNFT"),
    );
    return created?.objectId ?? null;
  } catch {
    return null;
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-white/40">{hint}</span>
      )}
    </label>
  );
}

function short(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
