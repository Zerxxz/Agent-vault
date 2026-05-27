"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { GlowButton } from "./GlowButton";
import {
  CHAT_MODELS,
  KEY_PLACEHOLDER,
  PROVIDER_LABEL,
  clearAllMemories,
  getStoredModel,
  getStoredOpenAIKey,
  getStoredProvider,
  setStoredModel,
  setStoredOpenAIKey,
  setStoredProvider,
  type LLMProvider,
} from "@/lib/storage";

export function SettingsPanel() {
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    const p = getStoredProvider();
    const m = getStoredModel();
    const k = getStoredOpenAIKey();
    setProvider(p);
    setModel(m);
    if (k) {
      setKey(k);
      setHasSaved(true);
    }
  }, []);

  function changeProvider(next: LLMProvider) {
    setProvider(next);
    setStoredProvider(next);
    // Reset model to provider's default (first item in list).
    const firstModel = CHAT_MODELS[next][0].id;
    setModel(firstModel);
    setStoredModel(firstModel);
  }

  function changeModel(next: string) {
    setModel(next);
    setStoredModel(next);
  }

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
    )
      return;
    await clearAllMemories();
    setSavedNotice("Local cache cleared.");
    setTimeout(() => setSavedNotice(""), 3000);
  }

  return (
    <div className="space-y-8">
      {/* Provider toggle */}
      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
          Provider
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PROVIDER_LABEL) as LLMProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => changeProvider(p)}
              className={clsx(
                "rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                provider === p
                  ? "border-violet-400 bg-violet-500/15 text-violet-200"
                  : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20",
              )}
            >
              {PROVIDER_LABEL[p]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">
          {provider === "openrouter"
            ? "OpenRouter unlocks Claude, Gemini, Llama, and 100+ models with one key."
            : "Direct to OpenAI. Best for GPT-4o family."}
        </p>
      </div>

      {/* API Key */}
      <form onSubmit={save} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
            {PROVIDER_LABEL[provider]} API key
          </span>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={KEY_PLACEHOLDER[provider]}
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
            Stored in your browser's localStorage only. Never sent anywhere
            except the provider you selected. Get one at{" "}
            {provider === "openai" ? (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                platform.openai.com
              </a>
            ) : (
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                openrouter.ai/keys
              </a>
            )}
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

      {/* Chat model picker */}
      <div className="border-t border-white/5 pt-6">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/60">
          Chat model
        </span>
        <select
          value={model}
          onChange={(e) => changeModel(e.target.value)}
          className="w-full"
        >
          {CHAT_MODELS[provider].map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-white/40">
          Embeddings always use{" "}
          <code className="font-mono text-[11px]">text-embedding-3-small</code>{" "}
          (works on both providers).
        </p>
      </div>

      {/* Local cache */}
      <div className="border-t border-white/5 pt-6">
        <h3 className="mb-2 text-sm font-medium">Local memory cache</h3>
        <p className="mb-4 text-xs text-white/50">
          Heirloom keeps a decrypted copy of your memories in IndexedDB so
          recall is instant. Clearing it forces a re-fetch from Walrus.
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
