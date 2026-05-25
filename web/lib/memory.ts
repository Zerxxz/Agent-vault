// Memory engine — orchestrates encryption, Walrus storage, local
// indexing, and on-chain pointer updates.
//
// Two main entry points:
//   - persistMemory: takes plaintext + embedding and pushes it
//     everywhere it needs to live (Walrus, IndexedDB)
//   - searchRelevant: returns the top-K cached memories for a query
//
// On-chain `add_memory` is *not* called from here; the caller owns the
// wallet signature, so we return the blob id and let the page tx-sign.

import { deriveAgentKey, encryptJson, decryptJson } from "./crypto";
import { embed } from "./llm";
import {
  type LocalMemory,
  listMemories,
  putMemory,
} from "./storage";
import { cosineSimilarity, topK, type ScoredHit } from "./search";
import { readBlob, storeBlob } from "./walrus";
import {
  type Visibility,
  VISIBILITY_HEIRS,
  VISIBILITY_PRIVATE,
} from "./contract";

export type MemoryPayload = {
  text: string;
  embedding: number[];
  category: string;
  /** Mirrors the on-chain visibility byte (0 private, 1 heirs-visible). */
  visibility: Visibility;
  createdAtMs: number;
};

/**
 * Encrypts the memory payload and uploads it to Walrus, then caches the
 * full payload locally so search can find it without an aggregator
 * round-trip.
 *
 * Returns the new Walrus blob id — caller is expected to sign a Sui tx
 * that calls `add_memory` with this blob id and the same `visibility`.
 */
export async function persistMemory(args: {
  agentObjectId: string;
  text: string;
  category: string;
  visibility: Visibility;
  apiKey: string;
}): Promise<{ blobId: string; embedding: number[] }> {
  const embedding = await embed(args.text, args.apiKey);

  const payload: MemoryPayload = {
    text: args.text,
    embedding,
    category: args.category,
    visibility: args.visibility,
    createdAtMs: Date.now(),
  };

  const key = await deriveAgentKey(args.agentObjectId);
  const ciphertext = await encryptJson(key, payload);

  const { blobId } = await storeBlob(ciphertext);

  await putMemory(args.agentObjectId, {
    blobId,
    text: args.text,
    embedding,
    category: args.category,
    visibility: args.visibility,
    createdAtMs: payload.createdAtMs,
  });

  return { blobId, embedding };
}

/**
 * Run cosine search over the local cache and return the K best matches.
 * `visibilityFilter` lets the caller restrict which memories can be
 * surfaced — important in heir mode where private memories must stay
 * hidden even though they're decryptable in the cache.
 */
export async function searchRelevant(args: {
  agentObjectId: string;
  query: string;
  apiKey: string;
  k: number;
  /** When set, only memories matching one of these flags are returned. */
  visibilityFilter?: Visibility[];
}): Promise<ScoredHit<LocalMemory>[]> {
  const all = await listMemories(args.agentObjectId);
  const memories =
    args.visibilityFilter === undefined
      ? all
      : all.filter((m) =>
          args.visibilityFilter!.includes(
            (m.visibility ?? VISIBILITY_HEIRS) as Visibility,
          ),
        );

  if (memories.length === 0) return [];

  const queryEmbedding = await embed(args.query, args.apiKey);
  return topK<LocalMemory>(
    queryEmbedding,
    memories.map((m) => ({ embedding: m.embedding, payload: m })),
    args.k,
  );
}

/**
 * Score how strongly two memories overlap. Used for de-duping during
 * memory extraction so we don't keep saving the same fact in slightly
 * different words.
 */
export function memoriesAreSimilar(
  a: number[],
  b: number[],
  threshold = 0.92,
): boolean {
  return cosineSimilarity(a, b) >= threshold;
}

/**
 * Rehydrate the local cache for an agent by pulling every blob_id
 * referenced on-chain, decrypting, and writing into IndexedDB. Used when
 * a user opens the app on a new device.
 *
 * Memories whose payload predates the visibility field default to
 * `VISIBILITY_HEIRS` so older agents migrate cleanly.
 */
export async function rehydrateFromChain(args: {
  agentObjectId: string;
  blobIds: string[];
  onProgress?: (done: number, total: number) => void;
}): Promise<number> {
  const key = await deriveAgentKey(args.agentObjectId);

  let done = 0;
  let restored = 0;
  for (const blobId of args.blobIds) {
    try {
      const ciphertext = await readBlob(blobId);
      const payload = await decryptJson<Partial<MemoryPayload>>(
        key,
        ciphertext,
      );
      const visibility =
        payload.visibility === VISIBILITY_PRIVATE
          ? VISIBILITY_PRIVATE
          : VISIBILITY_HEIRS;
      await putMemory(args.agentObjectId, {
        blobId,
        text: payload.text ?? "",
        embedding: payload.embedding ?? [],
        category: payload.category ?? "memory",
        visibility,
        createdAtMs: payload.createdAtMs ?? Date.now(),
      });
      restored++;
    } catch {
      // Skip corrupted blobs — they shouldn't block the rehydrate.
    } finally {
      done++;
      args.onProgress?.(done, args.blobIds.length);
    }
  }
  return restored;
}
