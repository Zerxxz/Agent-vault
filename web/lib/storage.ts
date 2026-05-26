// Tiny wrapper around `idb-keyval` (IndexedDB) for the local memory
// cache, plus a `localStorage` helper for the user's BYOK API key.
//
// Why IndexedDB for memory? It can hold real volume (we keep raw text
// + 1536-dim embeddings per memory) and survives page reloads.

import { createStore, get, set, keys, del, clear } from "idb-keyval";
import type { Visibility } from "./contract";

const memStore = createStore("heirloom", "memories");

export type LocalMemory = {
  /** Walrus blob id this memory lives at on-chain. */
  blobId: string;
  /** Plaintext memory content. */
  text: string;
  /** OpenAI embedding (text-embedding-3-small ⇒ 1536 floats). */
  embedding: number[];
  category: string;
  /** Mirrors the on-chain visibility flag. Optional for backward compat. */
  visibility?: Visibility;
  createdAtMs: number;
};

const cacheKey = (agentId: string, blobId: string) => `${agentId}:${blobId}`;

export async function putMemory(
  agentId: string,
  mem: LocalMemory,
): Promise<void> {
  await set(cacheKey(agentId, mem.blobId), mem, memStore);
}

export async function getMemory(
  agentId: string,
  blobId: string,
): Promise<LocalMemory | undefined> {
  return get(cacheKey(agentId, blobId), memStore);
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

export async function deleteMemory(
  agentId: string,
  blobId: string,
): Promise<void> {
  await del(cacheKey(agentId, blobId), memStore);
}

export async function clearAllMemories(): Promise<void> {
  await clear(memStore);
}

// ---- BYOK OpenAI key ------------------------------------------------

const KEY_STORAGE = "heirloom.openai_key";

export function getStoredOpenAIKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_STORAGE);
}

export function setStoredOpenAIKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(KEY_STORAGE, value);
  else window.localStorage.removeItem(KEY_STORAGE);
}
