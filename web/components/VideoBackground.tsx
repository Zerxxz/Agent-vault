// Hybrid background — sits behind <AuroraBackground/> in layout.tsx and
// adds cinematic motion via a looping MP4. The aurora blobs render on
// top with `mix-blend-mode: screen`, so their violet/cyan tint composites
// over the video instead of replacing it.
//
// Tuning history:
//   - v1 stacked an inner vignette + 60% opacity + 1.5px blur on top
//     of AuroraBackground's own vignette, which made the video
//     basically invisible. v2 strips both and trusts AuroraBackground
//     to do the corner darkening alone.

export function VideoBackground() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
      // z-0 keeps the video above the body's solid bg-color but below
      // AuroraBackground (also z-0, rendered later in DOM = on top).
      className="bg-video fixed inset-0 z-0 h-full w-full object-cover"
      // Slight desaturate so the brand's violet/cyan tints (added by
      // the aurora layer) read clearly on top of whatever the video
      // shows.
      style={{ filter: "saturate(0.85) brightness(0.95)" }}
    >
      <source src="/bg.mp4" type="video/mp4" />
    </video>
  );
}
