// Centralised env access. Throw early if a required value is missing so
// failures surface during boot, not deep inside a request handler.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "mainnet") as
    | "mainnet"
    | "testnet"
    | "devnet",
  tatumRpcUrl: required(
    "NEXT_PUBLIC_TATUM_RPC_URL",
    process.env.NEXT_PUBLIC_TATUM_RPC_URL,
  ),
  tatumApiKey: process.env.TATUM_API_KEY ?? "",
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
