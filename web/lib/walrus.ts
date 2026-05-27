// Walrus HTTP publisher/aggregator wrapper.
// Docs: https://docs.wal.app/usage/web-api.html
//
// We try a list of publishers/aggregators in order: any single endpoint
// can DNS-fail, time out, or rate-limit, so a single configured URL is
// a single point of failure for the whole memory pipeline. The list is
// built in `lib/config.ts` from env override (first) + a curated set of
// community endpoints (fallbacks).

import { config } from "./config";

export type StoreResult = {
  blobId: string;
  raw: unknown;
};

/**
 * Did the failure look transient/endpoint-specific? If so, we should
 * fail over to the next publisher rather than aborting the pipeline.
 *
 * - DNS errors / `Failed to fetch` → TypeError from the browser fetch.
 * - 5xx + 429 from a working endpoint → server-side issue, try a peer.
 * - 4xx (other than 429) → almost certainly our payload is bad; don't
 *   waste retries on it.
 */
function shouldFailOver(err: unknown): boolean {
  if (err instanceof TypeError) return true; // network / DNS / CORS preflight
  if (err instanceof Error) {
    const m = err.message;
    if (/(^|\s)5\d\d(\s|$)/.test(m)) return true;
    if (m.includes(" 429 ")) return true;
  }
  return false;
}

export async function storeBlob(
  data: Uint8Array,
  epochs: number = config.walrus.defaultEpochs,
): Promise<StoreResult> {
  const publishers = config.walrus.publishers;
  const errors: string[] = [];

  for (let i = 0; i < publishers.length; i++) {
    const base = publishers[i];
    const url = `${base}/v1/blobs?epochs=${epochs}`;
    try {
      const res = await fetch(url, {
        method: "PUT",
        body: data as BodyInit,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const msg = `${res.status} ${body}`;
        // Server-side failures from this publisher: try the next one.
        if (res.status >= 500 || res.status === 429) {
          console.warn(
            `[walrus] publisher ${base} returned ${msg}, trying fallback`,
          );
          errors.push(`${base}: ${msg}`);
          continue;
        }
        throw new Error(`Walrus store failed: ${msg}`);
      }

      const json = (await res.json()) as Record<string, unknown>;
      const newly = (json.newlyCreated as { blobObject?: { blobId?: string } })
        ?.blobObject?.blobId;
      const already = (json.alreadyCertified as { blobId?: string })?.blobId;
      const blobId = newly ?? already;

      if (!blobId) {
        throw new Error(`Unexpected Walrus response: ${JSON.stringify(json)}`);
      }

      if (i > 0) {
        console.info(`[walrus] stored via fallback publisher ${base}`);
      }
      return { blobId, raw: json };
    } catch (err) {
      if (shouldFailOver(err)) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[walrus] publisher ${base} unreachable (${reason}), trying fallback`,
        );
        errors.push(`${base}: ${reason}`);
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `All Walrus publishers failed:\n  ${errors.join("\n  ") ||
      "no publishers configured"}`,
  );
}

export async function readBlob(blobId: string): Promise<Uint8Array> {
  const aggregators = config.walrus.aggregators;
  const errors: string[] = [];

  for (let i = 0; i < aggregators.length; i++) {
    const base = aggregators[i];
    const url = `${base}/v1/blobs/${blobId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const msg = `${res.status}`;
        if (res.status === 404) {
          // Blob really isn't there — failover won't help.
          throw new Error(`Walrus read failed: 404 (blob ${blobId} not found)`);
        }
        if (res.status >= 500 || res.status === 429) {
          console.warn(
            `[walrus] aggregator ${base} returned ${msg}, trying fallback`,
          );
          errors.push(`${base}: ${msg}`);
          continue;
        }
        throw new Error(`Walrus read failed: ${msg}`);
      }
      const buf = await res.arrayBuffer();
      if (i > 0) {
        console.info(`[walrus] read via fallback aggregator ${base}`);
      }
      return new Uint8Array(buf);
    } catch (err) {
      if (shouldFailOver(err)) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[walrus] aggregator ${base} unreachable (${reason}), trying fallback`,
        );
        errors.push(`${base}: ${reason}`);
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `All Walrus aggregators failed:\n  ${errors.join("\n  ") ||
      "no aggregators configured"}`,
  );
}
