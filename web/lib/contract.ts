// Helpers for building Move calls against the agent_vault package.
// All entry points are owner-only; the wallet must be the agent's owner.

import { Transaction } from "@mysten/sui/transactions";
import { config } from "./config";

const MODULE = "agent";

/**
 * Visibility flag values mirror the Move contract:
 *   0 = private (owner only, never inherited)
 *   1 = heirs-visible (default — readable by heirs after dormancy)
 */
export const VISIBILITY_PRIVATE = 0;
export const VISIBILITY_HEIRS = 1;

export type Visibility = typeof VISIBILITY_PRIVATE | typeof VISIBILITY_HEIRS;

export function buildMintAgentTx(args: {
  name: string;
  persona: string;
  avatar: string;
  /** Milliseconds without owner activity before heirs can read. */
  dormancyThresholdMs: number | bigint;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::mint_agent`,
    arguments: [
      tx.pure.string(args.name),
      tx.pure.string(args.persona),
      tx.pure.string(args.avatar),
      tx.pure.u64(BigInt(args.dormancyThresholdMs)),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildAddMemoryTx(args: {
  agentObjectId: string;
  blobId: string;
  category: string;
  visibility: Visibility;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::add_memory`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.string(args.blobId),
      tx.pure.string(args.category),
      tx.pure.u8(args.visibility),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildUpdatePersonaTx(args: {
  agentObjectId: string;
  persona: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::update_persona`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.string(args.persona),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildSetIndexBlobTx(args: {
  agentObjectId: string;
  indexBlobId: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::set_index_blob`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.string(args.indexBlobId),
      tx.object.clock(),
    ],
  });
  return tx;
}

/** Owner check-in. Resets the dormancy timer without other side effects. */
export function buildPingTx(agentObjectId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::ping`,
    arguments: [tx.object(agentObjectId), tx.object.clock()],
  });
  return tx;
}

export function buildAddHeirTx(args: {
  agentObjectId: string;
  heirAddress: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::add_heir`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.address(args.heirAddress),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildRemoveHeirTx(args: {
  agentObjectId: string;
  heirAddress: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::remove_heir`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.address(args.heirAddress),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildSetDormancyTx(args: {
  agentObjectId: string;
  thresholdMs: number | bigint;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::set_dormancy_threshold`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.u64(BigInt(args.thresholdMs)),
      tx.object.clock(),
    ],
  });
  return tx;
}
