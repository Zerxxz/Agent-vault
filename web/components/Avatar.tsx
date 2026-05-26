"use client";

import clsx from "clsx";

// Renders an agent's avatar field, which may be either:
//   - a URL (new agents minted via the image picker), or
//   - a single emoji (older agents minted before we switched).
//
// One component so chat bubbles, list cards, and detail headers all
// stay visually consistent.

export function isAvatarUrl(value: string | undefined | null): boolean {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function Avatar({
  src,
  size = 40,
  rounded = "full",
  className,
}: {
  src: string | undefined | null;
  size?: number;
  rounded?: "full" | "lg";
  className?: string;
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";

  if (isAvatarUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt="Agent avatar"
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className={clsx(
          radius,
          "shrink-0 select-none border border-white/10 bg-white/5 object-cover",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  // Legacy emoji fallback.
  return (
    <span
      className={clsx(
        radius,
        "inline-flex shrink-0 items-center justify-center border border-white/10 bg-white/5 leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.55),
      }}
    >
      {src ?? "🤖"}
    </span>
  );
}
