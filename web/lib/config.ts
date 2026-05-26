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

export const config = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "mainnet") as
    | "mainnet"
    | "testnet"
    | "devnet",
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
    publisher: required(
      "NEXT_PUBLIC_WALRUS_PUBLISHER",
      process.env.NEXT_PUBLIC_WALRUS_PUBLISHER,
    ),
    aggregator: required(
      "NEXT_PUBLIC_WALRUS_AGGREGATOR",
      process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR,
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
