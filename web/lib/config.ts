// Centralised env access. During SSR build the full env isn't available;
// we return placeholder values so the build succeeds. Client-side calls
// receive the real values (NEXT_PUBLIC_* vars are embedded at build time).

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    console.warn(`[config] Missing env var: ${name} — using fallback`);
    return "PLACEHOLDER_" + name;
  }
  return value;
}

// Walrus publisher/aggregator endpoints are operated by Mysten + a
// growing community of stakers. Any single endpoint can DNS-fail, time
// out, or rate-limit you, so we ship a fallback list that walrus.ts
// rotates through. The first entry is what we hit first; it's also
// what `.env.example` documents so users get the same default.
//
// Sourced 2025-05 by DNS-checking the entries listed in Walrus docs +
// a few community publishers. Update if a domain goes dark.
const WALRUS_TESTNET_PUBLISHERS = [
  "https://publisher.walrus-testnet.walrus.space",
  "https://wal-publisher-testnet.staketab.org",
];
const WALRUS_TESTNET_AGGREGATORS = [
  "https://aggregator.walrus-testnet.walrus.space",
  "https://wal-aggregator-testnet.staketab.org",
];
const WALRUS_MAINNET_PUBLISHERS = [
  "https://publisher.walrus.banansen.dev",
];
const WALRUS_MAINNET_AGGREGATORS = [
  "https://aggregator.walrus-mainnet.walrus.space",
  "https://aggregator.walrus.banansen.dev",
];

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
  | "mainnet"
  | "testnet"
  | "devnet";

const isMainnet = network === "mainnet";
const defaultPublishers = isMainnet
  ? WALRUS_MAINNET_PUBLISHERS
  : WALRUS_TESTNET_PUBLISHERS;
const defaultAggregators = isMainnet
  ? WALRUS_MAINNET_AGGREGATORS
  : WALRUS_TESTNET_AGGREGATORS;

// If the user pinned a single publisher via env, it goes first; the
// curated list still backs it up so a stale/dead env var no longer
// hangs the whole memory pipeline.
function buildEndpointList(
  envValue: string | undefined,
  defaults: readonly string[],
): string[] {
  const explicit = envValue?.trim();
  if (!explicit) return [...defaults];
  // Dedupe in case the env var matches a default.
  const out = [explicit];
  for (const d of defaults) {
    if (d !== explicit) out.push(d);
  }
  return out;
}

export const config = {
  network,
  // Tatum RPC URLs + API key for hackathon submission
  tatumRpcUrl: required(
    "NEXT_PUBLIC_TATUM_RPC_URL",
    process.env.NEXT_PUBLIC_TATUM_RPC_URL,
  ),
  tatumTestnetRpc: required(
    "NEXT_PUBLIC_TATUM_TESTNET_RPC",
    process.env.NEXT_PUBLIC_TATUM_TESTNET_RPC,
  ),
  tatumApiKey: process.env.NEXT_PUBLIC_TATUM_API_KEY ?? "",
  walrus: {
    /** Primary publisher (env override or first default). Kept for
     *  backwards compatibility — new code should prefer `publishers`. */
    publisher:
      process.env.NEXT_PUBLIC_WALRUS_PUBLISHER?.trim() || defaultPublishers[0],
    /** Primary aggregator (same shape). */
    aggregator:
      process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR?.trim() ||
      defaultAggregators[0],
    /** Ordered fallback list — try in order until one succeeds. */
    publishers: buildEndpointList(
      process.env.NEXT_PUBLIC_WALRUS_PUBLISHER,
      defaultPublishers,
    ),
    aggregators: buildEndpointList(
      process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR,
      defaultAggregators,
    ),
    defaultEpochs: Number(
      process.env.NEXT_PUBLIC_WALRUS_DEFAULT_EPOCHS ?? "53",
    ),
  },
  agentPackageId: required(
    "NEXT_PUBLIC_AGENT_PACKAGE_ID",
    process.env.NEXT_PUBLIC_AGENT_PACKAGE_ID,
  ),
};
