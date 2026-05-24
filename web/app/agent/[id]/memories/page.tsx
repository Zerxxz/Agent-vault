"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MemoryList } from "@/components/MemoryList";

export default function MemoriesPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-6 pb-20">
      <Header />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Memory ledger
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Every fact your agent has remembered, decrypted in your
              browser.
            </p>
          </div>
          <Link
            href={`/agent/${params.id}`}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs hover:bg-white/10"
          >
            ← Back to chat
          </Link>
        </div>

        <MemoryList agentObjectId={params.id} />
      </motion.div>
    </div>
  );
}
