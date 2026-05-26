// Walrus.xyz-inspired mesh aurora background.
//
// Built from a base black layer with three stacked radial-gradient
// "meshes" that drift slowly. Each mesh sits in its own absolutely-
// positioned div so we can give them independent, long-running
// transforms — one ~40s, one ~55s, one ~75s — which adds up to a
// soft, never-quite-repeating motion that reads as cinematic instead
// of looped.
//
// Layer order (bottom to top):
//   - Solid black fill (so the meshes never reveal a flash of body bg)
//   - Mesh A: large violet + indigo lobes
//   - Mesh B: cyan + magenta accents (sized smaller, drifts opposite)
//   - Mesh C: warm amber tint near the bottom (memorial/inheritance feel)
//   - Vignette so corners fade into the dark base

export function AuroraBackground() {
  return (
    <div className="aurora fixed inset-0 -z-10 overflow-hidden bg-[#050816]">
      <div
        className="absolute inset-[-10%] animate-aurora-1"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 55% 45% at 18% 25%, rgba(139, 92, 246, 0.55), transparent 65%)",
            "radial-gradient(ellipse 65% 50% at 82% 18%, rgba(34, 211, 238, 0.45), transparent 65%)",
            "radial-gradient(ellipse 60% 50% at 75% 75%, rgba(232, 121, 249, 0.45), transparent 65%)",
          ].join(", "),
          filter: "blur(40px)",
        }}
      />

      <div
        className="absolute inset-[-15%] animate-aurora-2"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 40% 35% at 50% 50%, rgba(168, 85, 247, 0.35), transparent 70%)",
            "radial-gradient(ellipse 50% 40% at 25% 75%, rgba(99, 102, 241, 0.4), transparent 70%)",
            "radial-gradient(ellipse 45% 35% at 88% 60%, rgba(56, 189, 248, 0.3), transparent 70%)",
          ].join(", "),
          filter: "blur(60px)",
          mixBlendMode: "screen",
        }}
      />

      <div
        className="absolute inset-[-12%] animate-aurora-3"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 65% 35% at 50% 95%, rgba(251, 191, 36, 0.18), transparent 70%)",
          filter: "blur(50px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Vignette → guarantees text contrast at the edges regardless
          of where the meshes happen to be drifting. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(5,8,22,0.45)_70%,_rgba(5,8,22,0.92)_100%)]" />
    </div>
  );
}
