# AgentVault — Living Will Edition · Hackathon Submission

> **A mind that outlives you.**
> Submission for the **Tatum × Walrus Hackathon** (May 23 – Jun 6).

---

## 🎯 Elevator pitch

AgentVault is the first AI agent that can be inherited. Train it on your
voice and values today. List the wallets you love. When you go silent —
by choice, by absence, or by fate — the Move contract unlocks the agent
for your heirs and they can talk to it forever, in your own preserved
voice.

Memories live encrypted on **Walrus**. Ownership + the dead-man's
switch live on **Sui**, accessed through a **Tatum** RPC gateway.
Architecture inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal).

---

## 💡 Inspiration

Last year my friend's father died unexpectedly. The thing that stuck
with her wasn't the absence — it was the questions she never got to ask.
The "how would Dad handle this?" moments that now have no answer.

Cloud accounts get deleted. Voicemails are 30 seconds long. A printed
journal can't talk back. The closest existing analogue — a notarized
will — only opens once and only contains what you remembered to write.

Walrus's MemWal SDK launched in May with the right framing: memory
should be **verifiable, available, portable, shareable**. AgentVault
takes those four words seriously and adds a fifth: **inheritable**.
This is what MemWal could become at the human layer, not just the
developer layer.

---

## 🛠️ What it does

### As an owner

- **Mint an Agent NFT** with persona + avatar + dormancy threshold
  (5 minutes for demos, 180 days by default for real use).
- **Chat naturally.** Streaming via Vercel AI SDK + OpenAI BYOK.
- **Auto memory extraction.** After every meaningful turn, an LLM
  distills atomic facts about you, encrypts them with AES-GCM, pushes
  to Walrus, and pins each `blob_id` on the Move object — all in a
  single batched signature.
- **Privacy toggle.** Flip "Private mode" mid-chat to mark new
  memories as `visibility=0` (owner-only forever) instead of the
  default `visibility=1` (heirs-visible after dormancy).
- **Manage heirs.** `/agent/{id}/legacy` — add wallet addresses, set
  the dormancy window, hit "Ping now" to reset the timer.

### As an heir

- After dormancy triggers, open the agent and find a **Memorial
  mode** banner. The agent answers in the original owner's voice
  using only heirs-visible memories. **No new memories are written.**
  The soul stays as written.
- Memorial conversations are ephemeral — they don't change the chain
  state, they don't shape the persona, they just let you ask.

### As anyone else

- Locked screen. The Move contract enforces ownership on every
  mutating function via Sui's object-ownership model. Strangers
  can't read because the AES key is derived from the agent id; even
  if they decrypt, the frontend won't render.

---

## 🏗️ How we built it

| Layer            | Tech                                                   |
| ---------------- | ------------------------------------------------------ |
| Storage          | Walrus mainnet (HTTP publisher/aggregator)             |
| Smart contract   | Sui Move (~250 LOC, edition 2024.beta), 7 unit tests   |
| RPC gateway      | Tatum (`https://sui-mainnet.gateway.tatum.io/`)        |
| Wallet           | `@mysten/dapp-kit` (Suiet / Slush / Sui Wallet)        |
| Frontend         | Next.js 14 App Router, TypeScript strict, Tailwind     |
| Animations       | Framer Motion + custom CSS aurora + glassmorphism      |
| LLM              | OpenAI `gpt-4o-mini` chat + `text-embedding-3-small`   |
| AI SDK           | Vercel AI SDK plain text streaming                     |
| Memory cache     | IndexedDB via `idb-keyval`                             |
| Crypto           | Web Crypto API (AES-GCM, PBKDF2 key derivation)        |
| Deploy           | Vercel                                                 |
| CI               | GitHub Actions (typecheck + build on every push)       |

The architecture has three tiers:
1. **On-chain (Sui Move)** — agent identity, persona, append-only
   list of `MemoryRef { blob_id, category, created_at_ms, visibility }`,
   `heirs[]`, `dormancy_threshold_ms`, `updated_at_ms`. Every mutation
   bumps `updated_at_ms`, which is the on-chain source of truth for
   "is this owner alive."
2. **Off-chain (Walrus)** — every encrypted memory blob, addressed
   by `blob_id`. The on-chain `MemoryRef` is just a pointer.
3. **In-browser** — decrypted plaintext + 1536-dim OpenAI embeddings
   in IndexedDB, so cosine recall is instant. Heirs filter the cache
   client-side via `visibleMemoryFlags(role, dormancy)`.

A single Sui transaction adds N memories at once (N moveCalls in one
tx) so per-turn UX cost is one wallet signature regardless of how
many facts the LLM extracted.

---

## 🤔 Challenges

- **MemWal needs a relayer.** The official SDK assumes self-hosted
  Postgres + embedding service infrastructure that doesn't exist for
  beta users yet. Reproducing MemWal's API on top of pure Walrus +
  OpenAI took two days and produced a system that's intentionally
  swap-compatible: when MemWal ships hosted pricing, replacing
  `lib/memory.ts` is the only meaningful diff.
- **Dormancy without a flag.** The first design stored a boolean
  `is_dormant` on chain. That requires *someone* to flip it after
  death, which defeats the point. The shipped design has zero state
  for dormancy — every read computes it from
  `updated_at_ms + dormancy_threshold_ms`. Cleaner contract, no race
  conditions, the chain becomes self-healing.
- **Memorial integrity.** The whole product depends on heirs not being
  able to mutate the agent. Sui's ownership model handles this for
  free — heirs aren't owners, so they can't borrow `&mut AgentNFT`.
  The frontend respects the same boundary: `ChatInterface` short-
  circuits all memory persistence when `role !== "owner"`.
- **AES key portability.** We derive AES keys from the agent's object
  id via PBKDF2 with a fixed app-level salt. This means a heir on a
  fresh device can decrypt without out-of-band sharing — but it also
  means knowing the agent id is enough to derive the key. We
  documented this as the v2 path to Seal threshold encryption.
- **Two `@mysten/sui` versions in the dep tree.** Pinned `1.36.1`
  everywhere via `overrides` to keep `Transaction` types compatible
  with `@mysten/dapp-kit`'s expectations.

---

## 🎓 What I learned

- **Inheritance is the killer feature for MemWal-style memory.**
  Verifiable, available, portable, shareable — but also
  *inheritable*. Once you frame it that way, every other property
  feels obvious in support.
- **Skip the boolean.** State you can compute is state you can't
  corrupt. The contract is shorter, the tests are easier, and the
  dormancy logic now Just Works on any client.
- **Constraints sharpen scope.** Without a relayer, with one
  developer, in 14 days, with the demand "be emotionally
  unforgettable" — every cut feature was the right cut.
- **Move 2024 makes this a 250-line problem.** No Solidity-style
  storage gymnastics, no manual event indexing, just data + entry
  functions + tests.

---

## 🚀 What's next

- **Drop in `@mysten-incubation/memwal`** when hosted relayer pricing
  ships.
- **Seal threshold encryption** so heirs need their wallet *signature*
  to decrypt, not just the agent id.
- **Multi-sig override** for accidents — a quorum of heirs can
  unlock the agent before dormancy if they all sign.
- **Memorial page** — a public, no-wallet-required read view for
  family members who don't have crypto.
- **Multi-provider chat.** Claude, Gemini, local Ollama. Same vault,
  swappable brain.
- **Mentor agent marketplace.** A creator economy on top of
  inheritance — sell pre-trained personas with curated memories.

---

## 📦 Deliverables

| Item                         | Link                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| Live demo                    | `https://agent-vault.vercel.app` *(after deploy)*                  |
| Source code                  | `https://github.com/Zerxxz/Agent-vault`                            |
| Move package on Sui Mainnet  | `0x...` *(after publish, paste here)*                              |
| Demo video                   | YouTube link *(see DEMO_SCRIPT.md)*                                |
| Architecture diagram         | See `README.md`                                                    |

---

## 🙏 Credits

Built solo in 14 days for the [Tatum × Walrus Hackathon](https://tatum.io/sui-hackathon).

Architecture inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal). Powered by
[Walrus](https://www.walrus.xyz/), [Sui](https://sui.io/),
[Tatum](https://tatum.io/), and OpenAI.

For everyone who has ever wished they'd asked one more question.
