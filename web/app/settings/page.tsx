"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-6 pt-6">
      <Header />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Settings</h1>
        <p className="mb-10 text-sm text-white/55">
          Bring your own OpenAI key. Manage local memory cache.
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl md:p-8">
          <SettingsPanel />
        </div>
      </motion.div>
    </div>
  );
}
