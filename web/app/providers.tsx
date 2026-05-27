"use client";

import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";
import { ReactNode, useState } from "react";

// Browser-side RPC endpoints. We deliberately use Sui Foundation's
// public fullnode here instead of Tatum — Tatum's gateway requires
// an x-api-key header that we cannot safely ship to the browser, and
// its CORS policy rejects unauthenticated browser calls from arbitrary
// origins (including vercel.app subdomains). The Tatum gateway is
// still used server-side from `lib/sui.ts` where we can safely attach
// the API key header.
const { networkConfig } = createNetworkConfig({
  mainnet: {
    url: "https://fullnode.mainnet.sui.io:443",
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
