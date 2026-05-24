"use client";

import clsx from "clsx";

const PRESET = [
  "🤖",
  "🧠",
  "👽",
  "🦊",
  "🐙",
  "🦉",
  "🐉",
  "🦄",
  "🌙",
  "⭐",
  "🌌",
  "🔮",
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PRESET.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={clsx(
            "flex aspect-square items-center justify-center rounded-xl border text-2xl transition",
            value === e
              ? "border-violet-400 bg-violet-500/15 shadow-[0_0_24px_-6px_rgba(167,139,250,0.6)]"
              : "border-white/10 bg-white/[0.02] hover:border-white/20",
          )}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
