// Helpers for building Move calls against the agent_vault package.
// All entry points are owner-only; the wallet must be the agent's owner.

import { Transaction } from "@mysten/sui/transactions";
import { config } from "./config";

const MODULE = "agent";

export function buildMintAgentTx(args: {
  name: string;
  persona: string;
  avatar: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::mint_agent`,
    arguments: [
      tx.pure.string(args.name),
      tx.pure.string(args.persona),
      tx.pure.string(args.avatar),
      tx.object.clock(),
    ],
  });
  return tx;
}

export function buildAddMemoryTx(args: {
  agentObjectId: string;
  blobId: string;
  category: string;
}): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.agentPackageId}::${MODULE}::add_memory`,
    arguments: [
      tx.object(args.agentObjectId),
      tx.pure.string(args.blobId),
      tx.pure.string(args.category),
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
