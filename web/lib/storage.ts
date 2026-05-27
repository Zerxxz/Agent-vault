// Tiny wrapper around `idb-keyval` (IndexedDB) for the local memory
// cache, plus localStorage helpers for the user's BYOK LLM config
// (provider + key + chat model).

import { createStore, get, set, keys, del, clear } from "idb-keyval";
import type { Visibility } from "./contract";

const memStore = createStore("heirloom", "memories");

export type LocalMemory = {
  blobId: string;
  text: string;
  embedding: number[];
  category: string;
  visibility?: Visibility;
  createdAtMs: number;
};

const cacheKey = (agentId: string, blobId: string) => `${agentId}:${blobId}`;

export async function putMemory(agentId: string, mem: LocalMemory) {
  await set(cacheKey(agentId, mem.blobId), mem, memStore);
}

export async function getMemory(agentId: string, blobId: string) {
  return get<LocalMemory>(cacheKey(agentId, blobId), memStore);
}

export async function listMemories(agentId: string): Promise<LocalMemory[]> {
  const ks = await keys(memStore);
  const prefix = `${agentId}:`;
  const out: LocalMemory[] = [];
  for (const k of ks) {
    if (typeof k !== "string" || !k.startsWith(prefix)) continue;
    const v = await get<LocalMemory>(k, memStore);
    if (v) out.push(v);
  }
  return out;
}

export async function deleteMemory(agentId: string, blobId: string) {
  await del(cacheKey(agentId, blobId), memStore);
}

export async function clearAllMemories() {
  await clear(memStore);
}

// =====================================================================
// LLM provider settings (BYOK — all client-side)
// =====================================================================

export type LLMProvider = "openai" | "openrouter";

const KEY_STORAGE = "heirloom.openai_key"; // legacy name kept for compat
const PROVIDER_STORAGE = "heirloom.llm_provider";
const MODEL_STORAGE = "heirloom.llm_model";

export const PROVIDER_BASE_URL: Record<LLMProvider, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
};

export const PROVIDER_LABEL: Record<LLMProvider, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
};

export const KEY_PLACEHOLDER: Record<LLMProvider, string> = {
  openai: "sk-...",
  openrouter: "sk-or-v1-...",
};

/** Models we expose in the dropdown. OpenRouter ids must include the
 *  "<vendor>/" prefix; OpenAI ones are bare model names. */
export const CHAT_MODELS: Record<LLMProvider, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini (fast + cheap)" },
    { id: "gpt-4o", label: "GPT-4o (best OpenAI)" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  openrouter: [
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
    { id: "openai/gpt-4o", label: "GPT-4o" },
    { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku (fast)" },
    { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (free)" },
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
  ],
};

export const DEFAULT_CHAT_MODEL: Record<LLMProvider, string> = {
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
};

/** Embedding model — same name on both providers because OpenRouter
 *  proxies OpenAI's embedding endpoints with the "openai/" prefix. */
export const EMBEDDING_MODEL: Record<LLMProvider, string> = {
  openai: "text-embedding-3-small",
  openrouter: "openai/text-embedding-3-small",
};

// ---- BYOK key + provider + model getters/setters --------------------

export function getStoredOpenAIKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_STORAGE);
}

export function setStoredOpenAIKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(KEY_STORAGE, value);
  else window.localStorage.removeItem(KEY_STORAGE);
}

export function getStoredProvider(): LLMProvider {
  if (typeof window === "undefined") return "openai";
  const v = window.localStorage.getItem(PROVIDER_STORAGE);
  return v === "openrouter" ? "openrouter" : "openai";
}

export function setStoredProvider(p: LLMProvider): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROVIDER_STORAGE, p);
}

export function getStoredModel(): string {
  if (typeof window === "undefined") return DEFAULT_CHAT_MODEL.openai;
  const v = window.localStorage.getItem(MODEL_STORAGE);
  if (v) return v;
  return DEFAULT_CHAT_MODEL[getStoredProvider()];
}

export function setStoredModel(m: string): void {
  if (typeof window === "undefined") return;
  if (m) window.localStorage.setItem(MODEL_STORAGE, m);
  else window.localStorage.removeItem(MODEL_STORAGE);
}
