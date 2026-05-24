"use client";

import { motion } from "framer-motion";

// Hero illustration: a glowing brain-orb with three orbiting nodes.
// Pure CSS + Framer Motion, no external libs.

export function AgentVisual({ avatar = "🧠" }: { avatar?: string }) {
  return (
    <div className="relative h-[420px] w-72">
      {/* Soft glow halo */}
      <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-[120px]" />

      {/* Central orb */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-full w-full items-center justify-center"
      >
        <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/20 via-white/5 to-cyan-500/20 shadow-glow-lg backdrop-blur-xl">
          {/* Inner shine */}
          <div className="absolute left-8 top-8 h-12 w-12 rounded-full bg-white/15 blur-2xl" />

          {/* Avatar */}
          <span className="text-7xl drop-shadow-[0_0_20px_rgba(167,139,250,0.6)]">
            {avatar}
          </span>

          {/* Bottom inner glow */}
          <div className="absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/30 blur-2xl" />
        </div>
      </motion.div>

      {/* Orbiting "memory" nodes */}
      {Array.from({ length: 3 }).map((_, i) => {
        const radius = 130;
        const delay = i * 1.3;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 size-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            style={{
              x: -4,
              y: -4,
            }}
            animate={{
              x: [
                Math.cos(0) * radius - 4,
                Math.cos(Math.PI / 2) * radius - 4,
                Math.cos(Math.PI) * radius - 4,
                Math.cos((3 * Math.PI) / 2) * radius - 4,
                Math.cos(2 * Math.PI) * radius - 4,
              ],
              y: [
                Math.sin(0) * radius - 4,
                Math.sin(Math.PI / 2) * radius - 4,
                Math.sin(Math.PI) * radius - 4,
                Math.sin((3 * Math.PI) / 2) * radius - 4,
                Math.sin(2 * Math.PI) * radius - 4,
              ],
            }}
            transition={{
              duration: 8,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}

      {/* Sparkle particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`s-${i}`}
          className="absolute size-1 rounded-full bg-violet-300"
          style={{
            top: `${20 + (i * 11) % 60}%`,
            left: `${(i % 2 === 0 ? -8 : 92) + (i % 3) * 2}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -30],
          }}
          transition={{
            duration: 3 + (i % 3),
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
