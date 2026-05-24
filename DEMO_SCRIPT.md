# 🎬 Demo Video Script — 90 seconds

> Goal: a single-take screen recording (with a face-cam intro) that
> hooks the judge in 10 seconds and ends with a clear call-to-action.
> Total target length: **75–90 seconds**.

---

## Tools

- **Screen recorder:** [Loom](https://loom.com/) or `OBS Studio`
- **Tabs ready before recording:**
  - Wallet (Suiet / Slush / Sui Wallet)
  - AgentVault tab (with at least one agent that already has 3-4
    memories — record a "Take 0" the night before to seed it)
  - <https://suiscan.xyz> for the on-chain reveal
- **Pre-flight:** `/settings` → paste your OpenAI key. Mint one agent
  named "Aria" so the demo isn't from cold-start.

---

## Beat sheet

### 0:00 – 0:08 · Hook (face-cam, talking head)
> "AI agents have a memory problem. Every chat starts from scratch.
> Every provider holds your context hostage. AgentVault fixes that —
> on-chain."

**On screen:** title card "🧠 AgentVault" with tagline
*"Your AI agent. Owned forever."*

### 0:08 – 0:18 · The pitch (voice-over, landing page)
> "Mint your agent's persona as an NFT on Sui. The memories live on
> Walrus, encrypted, signed by you, portable across any model."

**On screen:** scroll the landing page slowly. Highlight the orbiting
brain visual and the 3-step "How it works" block.

### 0:18 – 0:35 · Live demo — chatting with Aria
> "I already minted Aria yesterday. She knows I'm a solo founder
> shipping AgentVault for the Tatum × Walrus hackathon. Let's see."

1. Click "My agents" → click Aria
2. Type: *"What did I tell you about deadlines?"*
3. Hit Send

Narrate as the response streams:
> "She's pulling top-K relevant memories from Walrus, decrypting them
> in my browser, and stitching them into the system prompt. The model
> knows what I told her three days ago."

### 0:35 – 0:55 · The magic — memory committing on-chain
> "Now watch the bottom-right corner."

After Aria's reply finishes, the toast pops up:
*"Remembered 2 new things."*

> "She just extracted two atomic facts from this conversation,
> encrypted them, uploaded each blob to Walrus, and signed a Sui
> transaction adding both blob ids to Aria's NFT. Want proof?"

Click "Inspect →" → memories page slides in.

> "Here's the full ledger. Every memory carries its blob id. Click any
> blob id..."

Pop open a new tab to suiscan, paste the agent NFT id, point at the
`memory_refs` field.

> "...and there it is. On chain. Forever."

### 0:55 – 1:10 · Why this matters (face-cam)
> "Same NFT works in Claude. Same NFT works in your own custom agent.
> The brain isn't trapped. That's MemWal's vision. AgentVault is the
> first product that makes it tangible."

**On screen:** quick split-screen:
- (a) Aria in AgentVault
- (b) Memory blob ids on Suiscan
- (c) The `agent.move` source on GitHub

### 1:10 – 1:30 · Call to action
> "Try it at **agentvault.vercel.app**. Open source on GitHub. Built
> solo, 14 days, ready to ship. Tatum, Walrus, Sui — three protocols,
> one product."

**On screen:** end card with the URL, the GitHub link, the hackathon
badge.

---

## Recording tips

- **One take is fine.** Authenticity beats production value.
- **Speak slightly slower than feels natural.**
- **No music in the technical sections.**
- **Subtitle the whole thing** — judges watch on mute first.
- **Upload to YouTube as Unlisted.**

## Submission checklist

- [ ] Recording uploaded to YouTube (Unlisted)
- [ ] Thumbnail set to a frame showing memories committing on-chain
- [ ] Title: `AgentVault — Tatum × Walrus Hackathon Submission`
- [ ] Description includes GitHub link + live demo link + Move PackageID
- [ ] Captions / subtitles uploaded
