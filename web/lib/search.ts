// Tiny in-memory cosine-similarity search over OpenAI embeddings.
// 1536-dim vectors × ~1k memories is fine to brute-force in JS; if the
// cap ever rises we can swap in HNSW or move embedding to the server.

export type SearchEntry<T> = {
  embedding: number[];
  payload: T;
};

export type ScoredHit<T> = {
  payload: T;
  score: number;
};

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

export function topK<T>(
  query: number[],
  entries: SearchEntry<T>[],
  k: number,
): ScoredHit<T>[] {
  const scored = entries.map((e) => ({
    payload: e.payload,
    score: cosineSimilarity(query, e.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
