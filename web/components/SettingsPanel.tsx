"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GlowButton } from "./GlowButton";
import {
  clearAllMemories,
  getStoredOpenAIKey,
  setStoredOpenAIKey,
} from "@/lib/storage";

export function SettingsPanel() {
  const [key, setKey] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    const stored = getStoredOpenAIKey();
    if (stored) {
      setKey(stored);
      setHasSaved(true);
    }
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setStoredOpenAIKey(key.trim());
    setHasSaved(Boolean(key.trim()));
    setSavedNotice("Saved to your browser only.");
    setTimeout(() => setSavedNotice(""), 3000);
  }

  async function wipeMemoryCache() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "This clears the LOCAL memory cache only. Your memories on Walrus + Sui stay intact and rehydrate next time you open an agent. Continue?",
      )
    ) {
      return;
    }
    await clearAllMemories();
    setSavedNotice("Local cache cleared.");
    setTimeout(() => setSavedNotice(""), 3000);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
            OpenAI API key
          </span>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 text-xs hover:bg-white/10"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">
            Stored in your browser's localStorage only. Never sent to any
            server other than OpenAI's. Get one at{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 hover:text-violet-200"
            >
              platform.openai.com
            </a>
            .
          </p>
        </label>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">
            {hasSaved ? "Key on file" : "No key on file yet"}
          </span>
          <GlowButton type="submit" variant="violet">
            Save key
          </GlowButton>
        </div>
      </form>

      <div className="border-t border-white/5 pt-6">
        <h3 className="mb-2 text-sm font-medium">Local memory cache</h3>
        <p className="mb-4 text-xs text-white/50">
          Heirloom keeps a decrypted copy of your memories in IndexedDB so
          recall is instant. Clearing it forces a re-fetch from Walrus the
          next time an agent loads.
        </p>
        <GlowButton onClick={wipeMemoryCache} variant="ghost">
          Clear local cache
        </GlowButton>
      </div>

      {savedNotice && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
        >
          {savedNotice}
        </motion.p>
      )}
    </div>
  );
}
