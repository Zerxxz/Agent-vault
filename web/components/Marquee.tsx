"use client";

// A horizontal scrolling band, walrus.xyz "Trust the Tusk" style:
//   - Single track translates 0% → -50% on a linear infinite loop
//   - Content is rendered TWICE inside the track; at -50% the second
//     copy is exactly where the first was, so the loop is seamless
//   - Mascot images are interspersed between text phrases for a
//     branded rhythm
//   - prefers-reduced-motion pauses the animation (handled in CSS)

import Image from "next/image";

const PHRASE = "HEIRLOOM \u2014 A MIND THAT OUTLIVES YOU";

/** How many copies of the phrase to render in ONE half of the track.
 *  Higher = wider track, shallower scroll demand on smaller screens. */
const PHRASE_REPEAT = 4;

export function Marquee() {
  return (
    <section
      aria-label="Heirloom — A mind that outlives you"
      className="marquee-strip relative w-full overflow-hidden border-y border-white/10 bg-black/30 py-6 backdrop-blur-md"
    >
      <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap will-change-transform">
        {/* Two identical halves so the loop has no visible seam. */}
        <MarqueeHalf />
        <MarqueeHalf ariaHidden />
      </div>
    </section>
  );
}

function MarqueeHalf({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-12"
      aria-hidden={ariaHidden || undefined}
    >
      {Array.from({ length: PHRASE_REPEAT }).map((_, i) => (
        <div key={i} className="flex shrink-0 items-center gap-12">
          <span className="font-display text-3xl tracking-[0.22em] gradient-text md:text-5xl">
            {PHRASE}
          </span>
          <Image
            src="/mascot.png"
            alt=""
            width={56}
            height={84}
            className="h-10 w-auto select-none drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] md:h-12"
            priority={false}
          />
        </div>
      ))}
    </div>
  );
}
