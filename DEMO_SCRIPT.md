# 🎬 Demo Video Script — 90 seconds

> Goal: a single-take screen recording (with a face-cam intro) that
> earns a tear in 30 seconds and ends with a clear call-to-action.
> Total target length: **75–90 seconds**.

---

## Tools

- **Screen recorder:** [Loom](https://loom.com/) or `OBS Studio`
- **Two wallets ready:**
  - **Wallet A** — owner of an agent named "Aria" (or your real
    grandmother's name, your call) with 5–8 pre-seeded memories.
  - **Wallet B** — listed as an heir on Aria.
- **Dormancy preset:** mint Aria with the **5-minute demo** preset so
  the unlock happens during the recording. (Or pre-record the wait.)
- **Tabs:**
  - AgentVault tab signed in as Wallet A
  - A second window/profile signed in as Wallet B
  - <https://suiscan.xyz> open at Aria's object id

---

## Beat sheet

### 0:00 – 0:08 · Hook (face-cam, talking head)
> "When my friend's dad died, the worst part wasn't the absence. It
> was the questions she never got to ask. AgentVault tries to fix
> that — on chain."

**On screen:** title card "🧠 AgentVault" with tagline
*"A mind that outlives you."*

### 0:08 – 0:18 · The pitch (voice-over, landing page)
> "Mint an agent's persona as an NFT on Sui. The memories live on
> Walrus. List the wallets of people you love. The Move contract
> watches for your silence."

**On screen:** scroll the landing page. Pause on "The promise" block,
then the dead-man's gate diagram.

### 0:18 – 0:35 · Owner — training Aria
> "I've been talking to Aria for a week. Watch the bottom-right corner."

1. Open `/agent/{id}` as Wallet A
2. Type: *"Tell my kids: when you're stuck on a hard problem, write
   the smallest version that's still real, then build outward."*
3. Hit Send.

Narrate as the response streams:
> "Aria responds. Then in the background, she distills the memory,
> embeds it, encrypts it locally, pushes it to Walrus, and signs a
> single Sui transaction adding the blob id to her NFT."

Toast appears: *"Remembered 1 heir-visible thing."*

### 0:35 – 0:48 · The dormancy gate
> "Now look at the Legacy page."

Click "Legacy →" → `/agent/{id}/legacy`.

> "Two heirs listed. Dormancy: 5 minutes. I'll close this tab and
> wait."

**Cut to:** a 5-minute timer overlay or jump-cut to "5 minutes
later…" card.

### 0:48 – 1:08 · Heir — the unlock
> "Switching to my heir wallet."

Open the second window with Wallet B → `/agent/{id}`.

The page loads with a **gold-amber "Memorial mode" banner**.

> "Memorial mode. Aria has been silent. Her memories — the
> heir-visible ones — are now mine to read."

Type: *"What did Aria tell you about getting stuck on hard problems?"*

The model responds, weaving in the memory we wrote in beat 3.

> "Pulled from Walrus. Decrypted in my browser. Spoken in Aria's
> voice. And nothing I do here writes new memories. The soul stays
> as Aria wrote it."

### 1:08 – 1:20 · Why this matters (face-cam)
> "Cloud accounts get deleted. Voicemails are 30 seconds long. A
> printed will only opens once. AgentVault lets the people you love
> ask one more question — and one more after that — for as long as
> they need to."

**On screen:** B-roll — split into three:
- Aria's chat (from beat 3)
- The blob_ids on Suiscan
- The 70-line `agent.move` source

### 1:20 – 1:30 · Call to action
> "Try it at **agent-vault.vercel.app**. Open source on GitHub. Built
> solo in 14 days. Walrus, Sui, Tatum — three protocols, one
> inheritance."

**On screen:** end card with the URL, the GitHub link, a small
"Tatum × Walrus Hackathon" badge, and the words *"A mind that
outlives you."*

---

## Recording tips

- **One take is fine.** Authenticity beats production value.
- **Speak slightly slower than feels natural.** Memorial scenes work
  better with breath in them.
- **No music in the technical sections.** You want the words to land.
- **Subtitle the whole thing** — judges watch on mute first.
- **Upload to YouTube as Unlisted.**

## Submission checklist

- [ ] Recording uploaded to YouTube (Unlisted)
- [ ] Thumbnail = the gold "Memorial mode" banner moment
- [ ] Title: `AgentVault — A mind that outlives you · Tatum × Walrus Hackathon`
- [ ] Description includes GitHub link + live demo + Move PackageID
- [ ] Captions / subtitles uploaded
- [ ] `SUBMISSION.md` updated with the live URL + PackageID + video link
