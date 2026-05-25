// Inheritance helpers — pure functions that compute role + dormancy
// state from the on-chain agent fields. The contract intentionally
// keeps no boolean "is_dormant" flag; everything is derived so a single
// chain read tells the full story.

import type { Visibility } from "./contract";
import { VISIBILITY_HEIRS, VISIBILITY_PRIVATE } from "./contract";

export type AgentChainData = {
  id: string;
  creator: string;
  name: string;
  persona: string;
  avatar: string;
  memoryBlobIds: string[];
  /** Wallet addresses that may read after dormancy. */
  heirs: string[];
  dormancyThresholdMs: number;
  updatedAtMs: number;
  version: number;
};

/** Roles a connected wallet can have relative to an agent. */
export type AgentRole = "owner" | "heir" | "stranger";

export function detectRole(
  agent: AgentChainData,
  walletAddress: string | null | undefined,
): AgentRole {
  if (!walletAddress) return "stranger";
  if (walletAddress === agent.creator) return "owner";
  if (agent.heirs.includes(walletAddress)) return "heir";
  return "stranger";
}

export type DormancyState = {
  isDormant: boolean;
  /** Milliseconds remaining until the agent becomes dormant (0 if already). */
  remainingMs: number;
  /** Milliseconds since the last owner activity. */
  silentMs: number;
  /** Unix ms timestamp at which dormancy will trigger. */
  dormantAtMs: number;
};

export function computeDormancy(
  agent: AgentChainData,
  nowMs: number = Date.now(),
): DormancyState {
  const dormantAtMs = agent.updatedAtMs + agent.dormancyThresholdMs;
  const isDormant = nowMs > dormantAtMs;
  return {
    isDormant,
    remainingMs: Math.max(0, dormantAtMs - nowMs),
    silentMs: Math.max(0, nowMs - agent.updatedAtMs),
    dormantAtMs,
  };
}

/**
 * Whether a viewer with the given role + dormancy state may interact
 * with the agent. Owners can always interact; heirs only after dormancy
 * triggers; strangers never.
 */
export function canInteract(
  role: AgentRole,
  dormancy: DormancyState,
): boolean {
  if (role === "owner") return true;
  if (role === "heir") return dormancy.isDormant;
  return false;
}

/**
 * Visibility flags a viewer may see. Owners see everything; heirs see
 * only heirs-visible memories (and only after dormancy). Strangers see
 * nothing.
 */
export function visibleMemoryFlags(
  role: AgentRole,
  dormancy: DormancyState,
): Visibility[] {
  if (role === "owner") return [VISIBILITY_PRIVATE, VISIBILITY_HEIRS];
  if (role === "heir" && dormancy.isDormant) return [VISIBILITY_HEIRS];
  return [];
}

/**
 * Pretty short-form of a duration. We intentionally keep this in lib so
 * the exact same formatting is shared between the agent card, the
 * legacy page, and the heir banner.
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3_600);
  const minutes = Math.floor((s % 3_600) / 60);
  const seconds = s % 60;
  if (days >= 1) return `${days}d ${pad(hours)}h`;
  if (hours >= 1) return `${hours}h ${pad(minutes)}m`;
  if (minutes >= 1) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Common dormancy presets so the UI doesn't need to hardcode magic
 * numbers in multiple places.
 */
export const DORMANCY_PRESETS: { label: string; ms: number }[] = [
  { label: "5 minutes (demo)", ms: 5 * 60_000 },
  { label: "1 day", ms: 86_400_000 },
  { label: "30 days", ms: 30 * 86_400_000 },
  { label: "90 days", ms: 90 * 86_400_000 },
  { label: "180 days", ms: 180 * 86_400_000 },
  { label: "365 days", ms: 365 * 86_400_000 },
  { label: "5 years", ms: 5 * 365 * 86_400_000 },
];

export const DEFAULT_DORMANCY_MS = 180 * 86_400_000;
