# 🕯️ Heirloom

> **A mind that outlives you.**
> Submission for the **Tatum × Walrus Hackathon** (Build on Sui with Walrus, May 23 – Jun 6).

Heirloom is the first AI you can pass down. You train it on your voice
and your values today; you list the wallets of people you love. The Move
contract on Sui watches for your silence. If you stop ping-ing — by
choice, by absence, or by fate — your heirs unlock the agent and can
talk to it forever, in your own preserved voice.

The agent's memories live encrypted on **Walrus**. Ownership and the
dead-man's switch live on **Sui**, accessed through a **Tatum** RPC
gateway. Architecture is inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal).

> **A note on names.** This repo is `Agent-vault` and the on-chain
> Move package is `agent_vault::agent` — those are legacy identifiers
> kept stable for the published package. The user-facing brand is
> Heirloom.

---

## How it integrates the stack

| Layer        | Used for                                                       |
| ------------ | -------------------------------------------------------------- |
| **Walrus**   | Encrypted memory blobs (one per atomic memory, transparent PNGs of mind) |
| **Sui Move** | `AgentNFT` — persona, memory_refs, heirs, dormancy threshold    |
| **Tatum**    | All Sui RPC traffic from the Next.js app + wallet calls         |
| **OpenAI**   | Chat (`gpt-4o-mini`) + embeddings (`text-embedding-3-small`)    |

```
┌─────────────────────────────────────────────┐
│        Next.js App (Browser)                │
│                                             │
│  Chat → /api/chat (streaming)               │
│        │                                    │
│        ↓                                    │
│   ┌─────────────────────────┐               │
│   │  Memory Engine          │               │
│   │  • extract atomic facts │               │
│   │  • embed (OpenAI)       │               │
│   │  • AES-encrypt          │               │
│   │  • cosine recall local  │               │
│   └────────┬─────────┬──────┘               │
└────────────┼─────────┼──────────────────────┘
             ▼         ▼
       ┌─────────┐  ┌──────────────────┐
       │ Walrus  │  │ Sui via Tatum    │
       │ blobs   │  │ AgentNFT {       │
       │ (per-   │  │   memory_refs[], │
       │  mem)   │  │   heirs[],       │
       └─────────┘  │   dormancy_ms,   │
                    │   updated_at_ms  │
                    │ }                │
                    └──────────────────┘
```

---

## The dead-man's switch — in plain English

- **Owner** has chatted (or pinged) recently → `is_dormant = false`.
  Only the owner can read or write.
- **Owner** goes silent for longer than the dormancy threshold →
  `is_dormant = true`. Listed heirs can now read.
- **Heir** opens the agent → "Memorial mode" banner. They chat. The
  agent answers using the owner's heir-visible memories, in the
  owner's voice. **No new memories are written.** The soul stays as
  the original owner wrote it.
- Anyone not on the heir list → locked screen, no exceptions.

The contract never stores a `is_dormant` boolean. It's computed off-chain
from `now > updated_at_ms + dormancy_threshold_ms`. Every owner-only
mutation bumps `updated_at_ms`, so just *using* the agent counts as
"I'm alive."

---

## Repo layout

```
.
├── move/
│   ├── Move.toml
│   ├── sources/agent.move        # AgentNFT + heirs + dormancy + ping
│   └── tests/agent_tests.move    # 7 unit tests
├── web/                          # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Landing — "A mind that outlives you."
│   │   ├── create/page.tsx       # Mint flow (persona + dormancy preset)
│   │   ├── agents/page.tsx       # Roster with Active/Dormant pills
│   │   ├── agent/[id]/
│   │   │   ├── page.tsx          # Role-aware chat (owner / heir / stranger)
│   │   │   ├── legacy/page.tsx   # Owner-only inheritance management
│   │   │   └── memories/page.tsx # Memory ledger
│   │   ├── settings/page.tsx     # BYOK OpenAI key
│   │   └── api/chat/route.ts     # Edge streaming proxy
│   ├── components/               # ChatInterface, HeirManager, DormancyControl, …
│   └── lib/
│       ├── inheritance.ts        # role + dormancy computation
│       ├── contract.ts           # Move tx builders
│       └── memory.ts             # extract/embed/encrypt/persist pipeline
├── scripts/publish.sh
├── .env.example
└── .github/workflows/ci.yml
```

---

## 🚀 Quickstart (for submission)

### 0. Prereqs

- Node 20+
- Sui CLI: <https://docs.sui.io/guides/developer/getting-started/sui-install>
- A Sui wallet with some SUI for gas (Suiet / Slush / Sui Wallet)
- Tatum API key: <https://tatum.io>
- OpenAI API key: <https://platform.openai.com/api-keys>

### 1. Publish the Move package to Sui mainnet (≈30 seconds)

```bash
sui client switch --env mainnet
./scripts/publish.sh
```

Look for `Published Objects` in the output, copy the **PackageID**.

> Run the test suite first if you want extra confidence:
> ```bash
> cd move && sui move test
> # 7 tests should pass — mint defaults, memory + visibility, ping,
> # heir round-trip, duplicate/missing aborts, dormancy bounds,
> # is_dormant_at logic.
> ```

### 2. Configure & run the web app

```bash
cd web
cp ../.env.example .env.local
```

Edit `.env.local`:
- `TATUM_API_KEY` — your Tatum mainnet key
- `NEXT_PUBLIC_AGENT_PACKAGE_ID` — the PackageID from step 1

Then:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>:
1. Connect wallet
2. `/settings` → paste your OpenAI key (BYOK, never leaves your browser)
3. `/create` → mint your first agent. Pick a dormancy threshold —
   **"5 minutes (demo)"** is great for showing the unlock during a
   walk-through.
4. Chat for a turn or two — memories pile up live.
5. `/agent/{id}/legacy` → add an heir wallet (use a second wallet you
   control for the demo).
6. Stop chatting and wait the threshold. Switch wallets to the heir.
   Open the same agent. Memorial mode unlocks.

### 3. Deploy to Vercel (≈5 minutes)

1. Push the repo to GitHub.
2. <https://vercel.com/new> → import.
3. Set **Root Directory** to `web`.
4. Add the same env vars as `.env.local` in **Project Settings**.
5. Deploy.


---

## 🔐 Security notes

- **MVP encryption.** AES keys are derived from the agent object id via
  PBKDF2. This binds the key to on-chain identity but means anyone who
  can read the on-chain object can derive it. v2 should switch to Seal
  threshold encryption keyed to recipient pubkeys.
- **BYOK OpenAI.** The key lives only in `localStorage` and is
  forwarded to `/api/chat` per-request via a header. Server never logs
  it.
- **Walrus content is public.** That's why every memory is encrypted
  before upload.
- **Heirs cannot mutate.** The frontend hides write affordances in heir
  mode, and the contract's `add_memory` / `update_persona` /
  `set_index_blob` only succeed when the caller owns the object — Sui's
  ownership model enforces this for free.
- **`.env.local` is in `.gitignore`.** Don't move it.

---

## 🧪 Verifying everything works

```bash
# Move tests
cd move && sui move test
# Expected: 7 passing tests

# TypeScript strict
cd web && npm run typecheck
# Expected: no output (clean)

# Production build
npm run build
# Expected: 8 routes, all green
```

CI runs steps 2 + 3 on every push (`.github/workflows/ci.yml`).

---

## 🗺️ What's next (post-submission)

- **Drop in the official MemWal SDK** once a hosted relayer ships.
- **Seal integration** so the AES key stops being derivable from the
  object id (real privacy, even from the chain reader).
- **Multi-sig override** so a quorum of heirs can unlock without
  waiting for dormancy (useful for accidents).
- **Memorial page** — a public read-only landing for grieving family
  members to access without wallets.
- **Multi-provider chat.** Claude, Gemini, local Ollama — same memory
  vault, swappable brain.
- **NemoClaw / OpenClaw plugins** so existing agent frameworks can
  plug in Heirloom as their memory backend.

---

## 🙏 Credits

Built solo for the [Tatum × Walrus Hackathon](https://tatum.io/sui-hackathon).

Architecture inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal). Powered by
[Walrus](https://www.walrus.xyz/), [Sui](https://sui.io/),
[Tatum](https://tatum.io/), and OpenAI.

For everyone who has ever wished they'd asked one more question.
