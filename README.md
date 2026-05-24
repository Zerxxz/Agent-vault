# 🧠 AgentVault

> Portable AI agents with verifiable memory. Submission for the
> **Tatum × Walrus Hackathon** (Build on Sui with Walrus, May 23 – Jun 6).

AgentVault turns every AI agent into something you actually own. Mint a
persona on Sui, talk to it like you'd talk to ChatGPT or Claude, and watch
the memories pile up — encrypted, on Walrus, signed into a Move object.
Switch models, switch wallets, switch devices: the brain comes with you.

**Core idea.** Inspired by Mysten Labs' [MemWal SDK](https://github.com/MystenLabs/MemWal),
AgentVault implements the same portable-memory pattern (Walrus storage +
Sui ownership + semantic recall) but skips the relayer dependency so it
ships in 14 days. Production drops in `@mysten-incubation/memwal` once
hosted relayer infra matures.

---

## How it integrates the stack

| Layer        | Used for                                                       |
| ------------ | -------------------------------------------------------------- |
| **Walrus**   | Encrypted memory blobs (one per atomic memory)                  |
| **Sui Move** | `AgentNFT` object — persona, blob_id list, version, ownership   |
| **Tatum**    | All Sui RPC traffic from the Next.js app + wallet calls         |
| **OpenAI**   | Chat (`gpt-4o-mini`) + embeddings (`text-embedding-3-small`)    |

```
┌─────────────────────────────────────────────┐
│         Next.js App (Browser)               │
│                                             │
│  Chat → /api/chat (OpenAI streaming)        │
│        │                                    │
│        ↓                                    │
│   ┌─────────────────────────┐               │
│   │  Memory Engine          │               │
│   │  • extract (LLM)        │               │
│   │  • embed (OpenAI)       │               │
│   │  • AES-GCM encrypt      │               │
│   │  • cosine search local  │               │
│   └────────┬─────────┬──────┘               │
└────────────┼─────────┼──────────────────────┘
             ▼         ▼
       ┌─────────┐  ┌──────────────┐
       │ Walrus  │  │ Sui via Tatum│
       │ (blobs) │  │ AgentNFT     │
       └─────────┘  └──────────────┘
```

---

## Repo layout

```
.
├── move/
│   ├── Move.toml
│   ├── sources/agent.move        # AgentNFT + mint/add_memory/update
│   └── tests/agent_tests.move    # 4 unit tests
├── web/                          # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── create/page.tsx       # Mint agent (persona builder)
│   │   ├── agents/page.tsx       # List owned agents
│   │   ├── agent/[id]/
│   │   │   ├── page.tsx          # Chat interface
│   │   │   └── memories/page.tsx # Memory ledger
│   │   ├── settings/page.tsx     # BYOK OpenAI key
│   │   └── api/chat/route.ts     # Edge streaming proxy
│   ├── components/               # Header, ChatInterface, AgentVisual…
│   └── lib/                      # config, sui, walrus, crypto, memory…
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
sui client active-address     # ensure SUI is here for gas
./scripts/publish.sh
```

Look for `Published Objects` → copy the **PackageID**. You'll paste it
into `web/.env.local` next.

> Run the test suite first if you want extra confidence:
> ```bash
> cd move && sui move test
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

Open <http://localhost:3000>, connect your wallet, head to `/settings` to
paste your OpenAI key, then `/create` to mint an agent.

### 3. Deploy to Vercel (≈5 minutes)

1. Push the repo to GitHub.
2. <https://vercel.com/new> → import the repo.
3. Set **Root Directory** to `web`.
4. Add the same env vars as `.env.local` in **Project Settings**.
5. Deploy.

### 4. Submit

Open `SUBMISSION.md` — Devpost-ready template with placeholders for the
live URL, PackageID, and demo video link. Demo video script lives in
`DEMO_SCRIPT.md`.

---

## 🔐 Security notes (read before submitting!)

- **Encryption seed.** The MVP derives the per-agent AES key from the
  agent's object id via PBKDF2. This binds the key to the on-chain
  identity but means anyone who knows the object id (which is public)
  can derive it. v2 should use Seal threshold encryption keyed to the
  recipient's wallet pubkey instead.
- **BYOK OpenAI.** The user's API key is stored in `localStorage` and
  forwarded to `/api/chat` via a one-shot header. The server never
  persists it.
- **Never commit `.env.local`.** It's already in `.gitignore`.
- **Walrus content is public.** That's why we encrypt before uploading.

---

## 🧪 Verifying everything works

```bash
# Move tests
cd move && sui move test
# Expected: 4 passing tests

# TypeScript strict
cd web && npm run typecheck
# Expected: no output (clean)

# Production build
npm run build
# Expected: 7 routes, all green
```

CI runs steps 2 + 3 on every push (`.github/workflows/ci.yml`).

---

## 🗺️ What's next (post-submission)

- Swap the homegrown memory engine for `@mysten-incubation/memwal` once
  the team ships a hosted relayer (or self-host one).
- Switch encryption to Seal so agents can be safely transferred
  without leaking the key.
- Add NemoClaw / OpenClaw plugin support (zero-config recall hooks).
- Memory consolidation: roll older memories into the optional
  `index_blob` to keep on-chain `memory_refs` short.
- Multi-provider support: Claude, Gemini, local Ollama.

---

## 🙏 Credits

Built solo in 14 days for the [Tatum × Walrus Hackathon](https://tatum.io/sui-hackathon).

Architecture inspired by Mysten Labs'
[MemWal SDK](https://github.com/MystenLabs/MemWal) and the broader work
of the Walrus team on user-owned AI memory.

Powered by [Walrus](https://www.walrus.xyz/), [Sui](https://sui.io/),
[Tatum](https://tatum.io/), and OpenAI.
