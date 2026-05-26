"use client";

import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { ReactNode, useState } from "react";

// Tatum REST JSON-RPC endpoints (NOT gRPC — dApp Kit uses JSON-RPC over HTTP)
const TATUM_API_KEY = process.env.NEXT_PUBLIC_TATUM_API_KEY ?? "";
const TATUM_MAINNET = process.env.NEXT_PUBLIC_TATUM_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io";
const TATUM_TESTNET = process.env.NEXT_PUBLIC_TATUM_TESTNET_RPC ?? "https://sui-testnet.gateway.tatum.io";

const makeHeaders = () =>
  TATUM_API_KEY ? ({ "x-api-key": TATUM_API_KEY } as Record<string, string>) : {};

const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: TATUM_MAINNET,
    headers: makeHeaders(),
  },
  testnet: {
    url: TATUM_TESTNET,
    headers: makeHeaders(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const network =
    (process.env.NEXT_PUBLIC_SUI_NETWORK as "mainnet" | "testnet") ??
    "mainnet";

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}