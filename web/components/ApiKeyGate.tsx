"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredOpenAIKey } from "@/lib/storage";

// Renders nothing if a BYOK key is stored. Otherwise blocks the
// children with a friendly call-to-action pointing at /settings.

export function ApiKeyGate({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    setHasKey(Boolean(getStoredOpenAIKey()));
  }, []);

  if (hasKey === null) {
    return (
      <div className="h-32 animate-pulse rounded-2xl border border-white/5 shimmer" />
    );
  }

  if (!hasKey) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-8 text-center backdrop-blur-xl">
        <p className="text-2xl">🔑</p>
        <h3 className="mt-3 text-lg font-semibold">Add your OpenAI key</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          AgentVault uses your own OpenAI key (BYOK) so the model talks to
          your data, not ours. We never see it.
        </p>
        <Link
          href="/settings"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90"
        >
          Open settings →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
