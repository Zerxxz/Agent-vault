// Hybrid background — sits behind <AuroraBackground/> in layout.tsx and
// adds cinematic motion via a looping MP4. The aurora blobs render on
// top with `mix-blend-mode: screen`, so their violet/cyan tint composites
// over the video instead of replacing it.
//
// Design goals:
//   - Lightweight (single ~650 KB asset, served from /public)
//   - Accessible: respects `prefers-reduced-motion` (CSS hides the
//     video so users on that setting see only the aurora)
//   - Resilient: explicit `playsInline` + `muted` so autoplay works
//     across iOS Safari, Chrome mobile, and desktop browsers
//   - Quiet: a heavy radial vignette on top guarantees text contrast
//     without depending on the underlying video frame

export function VideoBackground() {
  return (
    <div className="bg-video fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="h-full w-full object-cover opacity-60"
        // Slight blur softens compression noise and pushes the video
        // visually further back behind the aurora.
        style={{ filter: "blur(1.5px) saturate(1.05) brightness(0.85)" }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* Vignette so the corners fade into the dark navy base, the same
          radial used by AuroraBackground for visual continuity. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(5,8,22,0.55)_65%,_rgba(5,8,22,0.95)_100%)]" />
    </div>
  );
}
