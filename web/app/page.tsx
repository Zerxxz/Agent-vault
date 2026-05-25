"use client";

import { motion } from "framer-motion";
import { AgentList } from "@/components/AgentList";
import { AgentVisual } from "@/components/AgentVisual";
import { GlowButton } from "@/components/GlowButton";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <Header />

      {/* ─────────── Hero ─────────── */}
      <section className="grid gap-12 py-12 md:grid-cols-2 md:items-center md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200/80 backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
            Tatum × Walrus Hackathon — Living Will edition
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            A mind that
            <br />
            <span className="gradient-text">outlives you.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            Train an AI agent on your voice and your values. Encrypt every
            memory on Walrus. Pin them to an NFT on Sui. When you go silent
            — by choice or by fate — your heirs inherit the mind, and they
            can talk to it forever.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <GlowButton href="/create" variant="violet">
              Mint your agent
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </GlowButton>
            <GlowButton href="/agents" variant="ghost">
              My agents
            </GlowButton>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/40">
            <Stat value="Walrus" label="for memory" />
            <Stat value="Sui" label="for ownership" />
            <Stat value="Dead-man" label="for the gate" />
            <Stat value="BYOK" label="for the brain" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="hidden md:flex md:justify-center"
        >
          <AgentVisual />
        </motion.div>
      </section>

      {/* ─────────── The promise ─────────── */}
      <section className="py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-amber-300/80">
            The promise
          </p>
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            Your wisdom shouldn't die with you.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/55">
            Every conversation you have today becomes a memory tomorrow.
            Every memory is encrypted, signed by you, and waiting in
            Walrus. The day someone you love needs your voice, it's there.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Step
            n={1}
            tag="Mint"
            title="Pick a persona"
            body="Templates for research, coaching, family voice — or write your own. The Move contract mints an Agent NFT to your wallet."
          />
          <Step
            n={2}
            tag="Train"
            body="Talk to it like a chatbot. The model distills atomic memories from each turn, encrypts them, and pushes one signed transaction per batch."
            title="Live with it"
          />
          <Step
            n={3}
            tag="Inherit"
            title="Pass it on"
            body="Add heir wallets. Set a dormancy window. If you go silent, heirs unlock the agent — but in memorial mode only. The soul stays as you wrote it."
            warm
          />
        </div>
      </section>

      {/* ─────────── Your roster ─────────── */}
      <section className="py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Your roster</h2>
            <p className="mt-1 text-sm text-white/50">
              Agents you've minted. Status updates live as the dormancy
              clock ticks.
            </p>
          </div>
          <GlowButton
            href="/agents"
            variant="ghost"
            className="!py-2 !px-5 !text-xs"
          >
            See all →
          </GlowButton>
        </div>
        <AgentList />
      </section>

      {/* ─────────── Use cases ─────────── */}
      <section className="py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-amber-300/80">
            Why it matters
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            More than nostalgia. Real continuity.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            emoji="🤍"
            title="Family voice"
            body="Your kids ask 'how would Mom handle this?' a decade from now — and the answer comes in her own words."
            warm
          />
          <Feature
            emoji="📜"
            title="Living will"
            body="Passwords, account hints, the where-is-everything map. Dormant until your heirs need it."
          />
          <Feature
            emoji="🦉"
            title="Mentor archive"
            body="Founders, teachers, elders — bequeath your reasoning patterns to the next generation, not just your money."
          />
          <Feature
            emoji="📰"
            title="Journalist's switch"
            body="Source memories that auto-publish to your designated colleagues if you stop pinging."
          />
        </div>
      </section>

      {/* ─────────── How the gate works ─────────── */}
      <section className="py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.05] to-violet-500/[0.05] p-8 backdrop-blur-xl">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-amber-300/80">
              The gate
            </p>
            <h3 className="text-2xl font-bold">
              A dead-man's switch you actually use.
            </h3>
            <p className="mt-4 text-sm text-white/60">
              Every chat, every persona edit, every heir tweak counts as
              "I'm alive." Set the silence window — 5 minutes for a demo,
              180 days for a real legacy. When the threshold passes, the
              Move contract's <code className="font-mono text-xs">is_dormant_at</code>{" "}
              tells every client: this mind has gone quiet.
            </p>
            <p className="mt-3 text-sm text-white/60">
              Heirs don't take the NFT. They don't change anything. They
              just open the door, sit down, and ask.
            </p>
          </div>

          <div className="space-y-4">
            <Pill
              icon="✓"
              tone="emerald"
              title="Active"
              body="Owner has chatted recently. Only the owner can read or write."
            />
            <Pill
              icon="…"
              tone="amber"
              title="Dormant"
              body="Threshold passed. Listed heirs gain read access — chat, but in memorial mode."
              warm
            />
            <Pill
              icon="🔒"
              tone="muted"
              title="Stranger"
              body="Not the owner. Not on the heir list. Locked screen, no exceptions."
            />
          </div>
        </div>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="mt-12 border-t border-white/5 py-12 text-center text-xs text-white/40">
        Built solo for the{" "}
        <a
          href="https://tatum.io/sui-hackathon"
          target="_blank"
          rel="noreferrer"
          className="text-white/60 hover:text-white"
        >
          Tatum × Walrus Hackathon
        </a>
        . Architecture inspired by Mysten Labs'{" "}
        <a
          href="https://github.com/MystenLabs/MemWal"
          target="_blank"
          rel="noreferrer"
          className="text-white/60 hover:text-white"
        >
          MemWal SDK
        </a>
        . Powered by Walrus, Sui, and Tatum.
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span className="font-mono text-sm font-semibold text-white">
        {value}
      </span>
      <span className="ml-1.5">{label}</span>
    </div>
  );
}

function Step({
  n,
  tag,
  title,
  body,
  warm,
}: {
  n: number;
  tag: string;
  title: string;
  body: string;
  warm?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`glass glass-hover relative gradient-border overflow-hidden rounded-2xl p-6 ${
        warm ? "border-amber-400/20" : ""
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm ${
            warm
              ? "bg-amber-500/15 text-amber-200"
              : "bg-violet-500/15 text-violet-300"
          }`}
        >
          {n}
        </span>
        <span
          className={`text-[10px] uppercase tracking-widest ${
            warm ? "text-amber-300/70" : "text-white/40"
          }`}
        >
          {tag}
        </span>
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-white/60">{body}</p>
    </motion.div>
  );
}

function Feature({
  emoji,
  title,
  body,
  warm,
}: {
  emoji: string;
  title: string;
  body: string;
  warm?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`glass glass-hover rounded-2xl p-5 ${
        warm ? "border border-amber-400/15" : ""
      }`}
    >
      <div className="mb-3 text-2xl">{emoji}</div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-sm text-white/55">{body}</p>
    </motion.div>
  );
}

function Pill({
  icon,
  tone,
  title,
  body,
  warm,
}: {
  icon: string;
  tone: "emerald" | "amber" | "muted";
  title: string;
  body: string;
  warm?: boolean;
}) {
  const toneClasses = {
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    muted: "border-white/10 bg-white/5 text-white/60",
  } as const;
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border bg-white/[0.02] p-4 ${
        warm ? "border-amber-400/15" : "border-white/10"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-sm ${toneClasses[tone]}`}
      >
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-white/55">{body}</p>
      </div>
    </div>
  );
}
