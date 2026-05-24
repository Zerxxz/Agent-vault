import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { AuroraBackground } from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "AgentVault — Your AI agent. Owned forever.",
  description:
    "Mint an AI agent NFT on Sui. Memories live on Walrus. Portable across ChatGPT, Claude, anywhere.",
  openGraph: {
    title: "AgentVault",
    description:
      "Portable AI agents with verifiable memory on Walrus + Sui. Built for the Tatum × Walrus Hackathon.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen overflow-x-hidden font-sans antialiased">
        <AuroraBackground />
        <div className="grain" />
        <Providers>
          <div className="relative z-10">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
