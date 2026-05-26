"use client";

import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { ReactNode, useState } from "react";

const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: process.env.NEXT_PUBLIC_SUI_RPC_URL ?? "https://fullnode.mainnet.sui.io:443",
  },
  testnet: {
    url: "https://fullnode.testnet.sui.io:443",
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