// Three drifting blurred blobs in violet / cyan / magenta. Pure CSS,
// no JS, kept off the main thread.

export function AuroraBackground() {
  return (
    <div className="aurora">
      <div
        className="aurora-blob animate-aurora-1"
        style={{
          top: "-15%",
          left: "-10%",
          width: "70vw",
          height: "70vw",
          background:
            "radial-gradient(circle, rgb(139, 92, 246) 0%, transparent 65%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora-2"
        style={{
          top: "10%",
          right: "-20%",
          width: "55vw",
          height: "55vw",
          background:
            "radial-gradient(circle, rgb(34, 211, 238) 0%, transparent 65%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora-3"
        style={{
          bottom: "-25%",
          left: "20%",
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle, rgb(217, 70, 239) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(5,8,22,0.55)_70%,_rgba(5,8,22,0.95)_100%)]" />
    </div>
  );
}
