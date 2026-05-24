// Walrus HTTP publisher/aggregator wrapper.
// Docs: https://docs.wal.app/usage/web-api.html

import { config } from "./config";

export type StoreResult = {
  blobId: string;
  raw: unknown;
};

export async function storeBlob(
  data: Uint8Array,
  epochs: number = config.walrus.defaultEpochs,
): Promise<StoreResult> {
  const url = `${config.walrus.publisher}/v1/blobs?epochs=${epochs}`;
  const res = await fetch(url, {
    method: "PUT",
    body: data as BodyInit,
  });

  if (!res.ok) {
    throw new Error(`Walrus store failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const newly = (json.newlyCreated as { blobObject?: { blobId?: string } })
    ?.blobObject?.blobId;
  const already = (json.alreadyCertified as { blobId?: string })?.blobId;
  const blobId = newly ?? already;

  if (!blobId) {
    throw new Error(`Unexpected Walrus response: ${JSON.stringify(json)}`);
  }

  return { blobId, raw: json };
}

export async function readBlob(blobId: string): Promise<Uint8Array> {
  const url = `${config.walrus.aggregator}/v1/blobs/${blobId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Walrus read failed: ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
