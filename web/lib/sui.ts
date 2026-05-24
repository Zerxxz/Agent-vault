// Sui RPC client wired through the Tatum gateway. Server-side requests
// attach the API key; browser requests hit the public endpoint.

import { SuiClient, SuiHTTPTransport } from "@mysten/sui/client";
import { config } from "./config";

let client: SuiClient | null = null;

export function getSuiClient(): SuiClient {
  if (client) return client;

  const headers =
    typeof window === "undefined" && config.tatumApiKey
      ? { "x-api-key": config.tatumApiKey }
      : undefined;

  client = new SuiClient({
    transport: new SuiHTTPTransport({
      url: config.tatumRpcUrl,
      rpc: headers ? { headers } : undefined,
    }),
  });

  return client;
}
