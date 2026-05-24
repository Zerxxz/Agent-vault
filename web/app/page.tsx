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
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-violet-400" />
            Tatum × Walrus Hackathon
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Your AI agent.
            <br />
            <span className="gradient-text">Owned forever.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            Mint an Agent NFT on Sui. Its memory lives on Walrus. Talk to it
            from anywhere — ChatGPT today, Claude tomorrow, your own
            chatbot next year. The brain comes with you.
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

      {/* ─────────── How it works ─────────── */}
      <section className="py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-violet-300/80">
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Memory you can take with you.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Step
            n={1}
            title="Mint the agent"
            body="Pick a persona, an avatar, a name. The Move package mints an Agent NFT to your wallet."
            tag="Sui"
          />
          <Step
            n={2}
            title="Chat normally"
            body="Talk to your agent like any chatbot. Every meaningful turn is distilled into atomic memories."
            tag="OpenAI BYOK"
          />
          <Step
            n={3}
            title="Memories pin to chain"
            body="Each memory is encrypted, uploaded to Walrus, and its blob_id appended to your Agent NFT."
            tag="Walrus"
          />
        </div>
      </section>

      {/* ─────────── Your agents ─────────── */}
      <section className="py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Your roster</h2>
            <p className="mt-1 text-sm text-white/50">
              Agents you've minted, ready when you are.
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

      {/* ─────────── The pitch ─────────── */}
      <section className="py-16">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-violet-300/80">
            Why it matters
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Verifiable. Available. Portable.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            emoji="🔍"
            title="Verifiable"
            body="Every memory has a blob_id signed into the Move object. Tamper-evident by design."
          />
          <Feature
            emoji="🛡️"
            title="Available"
            body="Walrus erasure-codes your blobs across many storage nodes. No single point of failure."
          />
          <Feature
            emoji="🚚"
            title="Portable"
            body="Your agent's brain isn't trapped in one provider. Switch models without losing context."
          />
          <Feature
            emoji="🤝"
            title="Shareable"
            body="Transfer the NFT or share read access. Pair-program with your friend's agent."
          />
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
        . Inspired by Mysten Labs'{" "}
        <a
          href="https://github.com/MystenLabs/MemWal"
          target="_blank"
          rel="noreferrer"
          className="text-white/60 hover:text-white"
        >
          MemWal SDK
        </a>
        .
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
  title,
  body,
  tag,
}: {
  n: number;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass glass-hover relative gradient-border overflow-hidden rounded-2xl p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 font-mono text-sm text-violet-300">
          {n}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-white/40">
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
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="glass glass-hover rounded-2xl p-5"
    >
      <div className="mb-3 text-2xl">{emoji}</div>
      <h3 className="mb-1.5 font-semibold">{title}</h3>
      <p className="text-sm text-white/55">{body}</p>
    </motion.div>
  );
}
