"use client";

import clsx from "clsx";

// Hosted avatar set (Avataaars). Used at mint time and stored on-chain
// as the agent's `avatar` URL string. Display sites render via the
// shared <Avatar /> helper so legacy emoji avatars keep working too.
export const AVATAR_OPTIONS: string[] = [
  "https://i.imgur.com/6VhQE0q.png",
  "https://i.imgur.com/ZXss3Mm.png",
  "https://i.imgur.com/oAOTg0T.png",
  "https://i.imgur.com/SAJZ05F.png",
  "https://i.imgur.com/v5lGgz0.png",
  "https://i.imgur.com/r8TCftH.png",
  "https://i.imgur.com/puCtCS0.png",
  "https://i.imgur.com/SSomJ37.png",
  "https://i.imgur.com/sxzx2dU.png",
  "https://i.imgur.com/C6BgEaK.png",
  "https://i.imgur.com/j6YYndW.png",
  "https://i.imgur.com/240wlPE.png",
  "https://i.imgur.com/866nPO4.png",
  "https://i.imgur.com/4VSdjLd.png",
  "https://i.imgur.com/xh9kn2X.png",
  "https://i.imgur.com/WmSTXli.png",
];

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0];

// Component name kept as `EmojiPicker` so the existing import in
// PersonaBuilder doesn't need to change.
export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {AVATAR_OPTIONS.map((src) => {
        const selected = value === src;
        return (
          <button
            key={src}
            type="button"
            onClick={() => onChange(src)}
            aria-pressed={selected}
            className={clsx(
              "group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border p-1 transition",
              selected
                ? "border-violet-400 bg-violet-500/15 shadow-[0_0_24px_-6px_rgba(167,139,250,0.6)]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Avatar option"
              className="h-full w-full rounded-lg object-cover"
              loading="lazy"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}
