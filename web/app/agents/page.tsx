"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AgentList } from "@/components/AgentList";
import { GlowButton } from "@/components/GlowButton";
import { Header } from "@/components/Header";

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-6">
      <Header />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Your <span className="gradient-text-violet">agents</span>
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Every agent NFT in your wallet, with live memory counts.
            </p>
          </div>
          <GlowButton
            href="/create"
            variant="violet"
            className="!py-2.5 !px-5 !text-sm"
          >
            + Mint another
          </GlowButton>
        </div>

        <AgentList />
      </motion.div>

      <p className="mt-12 text-center text-xs text-white/30">
        <Link href="/" className="hover:text-white/60">
          ← Home
        </Link>
      </p>
    </div>
  );
}
