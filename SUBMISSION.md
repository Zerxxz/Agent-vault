# AgentVault — Hackathon Submission

> Portable AI agents with verifiable memory on Walrus + Sui.
> Submission for the **Tatum × Walrus Hackathon** (May 23 – Jun 6).

---

## 🎯 Elevator pitch

AgentVault gives every AI agent a memory it actually owns. Mint a
persona as an NFT on Sui. Encrypted memories live on Walrus. Switch
models, switch devices, switch chat apps — the brain comes with you.
Inspired by Mysten Labs' MemWal SDK; designed to drop into the official
client once a hosted relayer ships.

---

## 💡 Inspiration

Every chatbot today has the same flaw: amnesia. Every conversation
starts cold. Every provider holds your context hostage. When you switch
from GPT-4 to Claude, your assistant loses everything you've built up
over months.

Walrus's MemWal launch in May 2026 framed the right problem: **memory
should be user-owned infrastructure**. Verifiable. Available. Portable.
Shareable. AgentVault is the first product that takes those four words
literally for an end-user — not a developer SDK demo.

---

## 🛠️ What it does

- **Mint an Agent NFT.** Pick a persona (templates included), an avatar,
  and a name. The Move contract creates an `AgentNFT` in your wallet.
- **Chat naturally.** Talk like any chatbot. Streaming responses via
  OpenAI (`gpt-4o-mini`).
- **Auto-extract memories.** After every meaningful turn, an LLM call
  distills atomic facts about the user (preferences, context, tasks).
- **Encrypt + store.** Each memory is AES-GCM encrypted in the browser,
  uploaded to Walrus, and pinned by a `blob_id` on the agent's NFT.
- **Semantic recall.** Future messages embed the user query and pull the
  top-K most relevant memories via cosine similarity on locally-cached
  embeddings, then inject them as system context.
- **Inspect everything.** A dedicated Memory Ledger page shows every
  fact your agent has remembered, with category tags and Walrus blob ids.
- **Rehydrate from chain.** Open the agent on a fresh device — the app
  pulls every blob id from Sui, fetches from Walrus, decrypts, and
  rebuilds the local index.

Use cases:
- 🦉 A research agent that remembers your reading list across sessions
- 🦊 A life coach that calls you out when you drift from goals you set
- 🤖 A code reviewer that internalises your codebase conventions
- 🦄 A creative partner that remembers every world you've built together
- 🤝 Shared agents — transfer the NFT, the new owner inherits the memory

---

## 🏗️ How we built it

| Layer            | Tech                                                   |
| ---------------- | ------------------------------------------------------ |
| Storage          | Walrus mainnet (HTTP publisher/aggregator)             |
| Smart contract   | Sui Move (~110 LOC, edition 2024.beta)                 |
| RPC gateway      | Tatum (`https://sui-mainnet.gateway.tatum.io/`)        |
| Wallet           | `@mysten/dapp-kit` (Suiet, Slush, Sui Wallet)          |
| Frontend         | Next.js 14 App Router, TypeScript strict, Tailwind     |
| Animations       | Framer Motion + custom CSS (aurora, glassmorphism)     |
| LLM              | OpenAI `gpt-4o-mini` chat + `text-embedding-3-small`   |
| AI SDK           | Vercel AI SDK (`ai`, `@ai-sdk/openai`) for streaming   |
| Memory cache     | IndexedDB via `idb-keyval`                             |
| Crypto           | Web Crypto API (AES-GCM, PBKDF2 key derivation)        |
| Deploy           | Vercel                                                 |
| CI               | GitHub Actions (typecheck + build on every push)       |

The architecture is intentionally three-tier:
1. **On-chain (Sui Move)** owns the agent identity, the persona prompt,
   and an append-only list of `MemoryRef { blob_id, category, timestamp }`.
2. **On-Walrus** holds every encrypted memory — one blob per atomic fact.
3. **In-browser** holds the decrypted cache + the embedding index, so
   recall is instant and works offline once rehydrated.

A single Sui transaction adds N memories at once via batched
`moveCall`s, so the per-turn UX cost is one signature regardless of how
many facts the LLM extracts.

---

## 🤔 Challenges

- **MemWal needs a relayer.** The official SDK assumes a self-hosted
  Postgres + embedding service stack. For a 14-day solo build that's
  out of scope, so I implemented the same pattern client-side. The Move
  shape is intentionally compatible — when MemWal ships hosted relayer
  pricing, swapping is mostly a `lib/memory.ts` rewrite.
- **Streaming + structured memory extraction in one turn.** The chat
  uses Vercel AI SDK's text-stream protocol; the memory extractor
  needs JSON output. Solved by running them sequentially — extraction
  fires after the stream ends, in the background, so user UX is
  un-blocked.
- **AES key portability.** v0 used a per-session random key (lost on
  refresh). The MVP derives the key from the agent's object id via
  PBKDF2, so the same wallet on a new device can decrypt without any
  out-of-band sharing. Production will move this to Seal.
- **Sui object-shape for `memory_refs`.** RPC returns nested
  `{ fields: { blob_id } }` for vectors of structs. The page handles
  both that shape and a flat shape for forward compatibility.
- **Two `@mysten/sui` versions in the dep tree.** Pinned `1.36.1`
  everywhere via `overrides` to keep `Transaction` types compatible
  with `@mysten/dapp-kit`'s expectations.

---

## 🎓 What I learned

- **MemWal's four pillars are the right framing.** "Verifiable,
  available, portable, shareable" — every architectural decision can be
  justified or vetoed by which pillar it serves.
- **Sui Move 2024 is great.** `public struct`, `ctx.sender()`, vector
  ergonomics — none of it gets in the way.
- **Vercel AI SDK + plain text streams** is the simplest streaming
  combo. Tools and structured output are nice but they're not necessary
  for a single-turn chat.
- **IndexedDB is underrated.** Holding a few thousand 1536-dim vectors
  + plaintext memories with `idb-keyval` is one import and zero schema.
- **Constraints sharpen scope.** "Cannot host a relayer" forced me to
  ship the smallest credible version of MemWal's pattern, which turned
  out to be the most demonstrable for judges.

---

## 🚀 What's next

- Drop in `@mysten-incubation/memwal` once hosted relayer pricing ships.
- **Seal integration** for proper threshold encryption (so agents can
  be transferred without leaking the AES key).
- **Memory consolidation.** Once `memory_refs` exceeds a threshold,
  roll the older entries into the optional `index_blob` to keep
  on-chain reads cheap.
- **Multi-provider chat.** Claude, Gemini, local Ollama — same memory.
- **NemoClaw / OpenClaw plugins** so existing agents can plug in
  AgentVault as their memory backend.
- **Agent marketplace.** Sell pre-trained personas (curated memories)
  as NFTs.

---

## 📦 Deliverables

| Item                         | Link                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| Live demo                    | `https://agent-vault.vercel.app` *(after deploy)*                  |
| Source code                  | `https://github.com/Zerxxz/Agent-vault`                            |
| Move package on Sui Mainnet  | `0x...` *(after publish, paste the package id here)*               |
| Demo video                   | YouTube link *(see DEMO_SCRIPT.md)*                                |
| Architecture diagram         | See `README.md`                                                    |

---

## 🙏 Credits

Built solo for the [Tatum × Walrus Hackathon](https://tatum.io/sui-hackathon).
Architecture inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal). Powered by
[Walrus](https://www.walrus.xyz/), [Sui](https://sui.io/),
[Tatum](https://tatum.io/), and OpenAI.

Big thanks to the Walrus team for shipping the MemWal blog post that
sparked the idea three days into the hackathon.
