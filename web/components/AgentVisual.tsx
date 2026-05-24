"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Hero illustration: the AgentVault mascot (walrus secret agent)
// floating with ambient particles, glow halo, and orbiting dots.

export function AgentVisual() {
  return (
    <div className="relative h-[460px] w-80">
      {/* Soft radial glow behind the mascot */}
      <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[80px]" />

      {/* Floating mascot image */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-full w-full items-center justify-center"
      >
        {/* Glass circle behind the mascot for depth */}
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-b from-white/[0.06] to-violet-500/[0.04] backdrop-blur-xl" />

        {/* Mascot image */}
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 drop-shadow-[0_0_40px_rgba(139,92,246,0.4)]"
        >
          <Image
            src="/mascot.png"
            alt="AgentVault mascot — a walrus in a suit"
            width={280}
            height={280}
            priority
            className="select-none"
          />
        </motion.div>

        {/* Pulsing ring effect */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/30"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
          transition={{
            duration: 3,
            delay: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20"
        />
      </motion.div>

      {/* Orbiting "memory" dots */}
      {Array.from({ length: 4 }).map((_, i) => {
        const radius = 155;
        const delay = i * 2;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 size-2.5 rounded-full shadow-[0_0_12px_rgba(167,139,250,0.9)]"
            style={{
              x: -5,
              y: -5,
              background:
                i % 2 === 0
                  ? "rgb(167, 139, 250)" // violet
                  : "rgb(34, 211, 238)", // cyan
            }}
            animate={{
              x: [
                Math.cos(0) * radius - 5,
                Math.cos(Math.PI / 2) * radius - 5,
                Math.cos(Math.PI) * radius - 5,
                Math.cos((3 * Math.PI) / 2) * radius - 5,
                Math.cos(2 * Math.PI) * radius - 5,
              ],
              y: [
                Math.sin(0) * radius - 5,
                Math.sin(Math.PI / 2) * radius - 5,
                Math.sin(Math.PI) * radius - 5,
                Math.sin((3 * Math.PI) / 2) * radius - 5,
                Math.sin(2 * Math.PI) * radius - 5,
              ],
            }}
            transition={{
              duration: 10,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}

      {/* Floating sparkle particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute size-1 rounded-full"
          style={{
            top: `${15 + (i * 12) % 70}%`,
            left: `${(i % 2 === 0 ? -5 : 88) + (i % 4) * 3}%`,
            background: i % 3 === 0 ? "#e879f9" : i % 3 === 1 ? "#a78bfa" : "#67e8f9",
          }}
          animate={{
            opacity: [0, 1, 0],
            y: [0, -25 - (i % 3) * 10],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2.5 + (i % 3),
            delay: i * 0.35,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
