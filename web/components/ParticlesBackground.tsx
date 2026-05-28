"use client";

// Particles.js-driven star/snow background.
//
// Why particles.js (vincentgarreau, 2018) rather than tsparticles? The
// config the user picked maps 1:1 to the legacy library's schema, so
// pasting it in works as-is. We dynamically import the library client-
// side because it touches `window` and `document` at module top level,
// which would crash Next's SSR pass.

import { useEffect } from "react";

// Library attaches its constructor + the live instance array to the
// global. We type just what we use.
declare global {
  interface Window {
    particlesJS?: (id: string, options: unknown) => void;
    pJSDom?: Array<{
      pJS?: {
        fn?: { vendors?: { destroypJS?: () => void } };
      };
    }>;
  }
}

// Config straight from the user. White circles, fairly dense (400),
// drifting bottom — combined with our dark navy base it reads as a
// quiet snow / star field.
const PARTICLES_CONFIG = {
  particles: {
    number: { value: 400, density: { enable: true, value_area: 800 } },
    color: { value: "#fff" },
    shape: {
      type: "circle",
      stroke: { width: 0, color: "#000000" },
      polygon: { nb_sides: 5 },
      image: { src: "img/github.svg", width: 100, height: 100 },
    },
    opacity: {
      value: 0.5,
      random: true,
      anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
    },
    size: {
      value: 10,
      random: true,
      anim: { enable: false, speed: 40, size_min: 0.1, sync: false },
    },
    line_linked: {
      enable: false,
      distance: 500,
      color: "#ffffff",
      opacity: 0.4,
      width: 2,
    },
    move: {
      enable: true,
      speed: 6,
      direction: "bottom",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: { enable: false, rotateX: 600, rotateY: 1200 },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: { enable: true, mode: "bubble" },
      onclick: { enable: true, mode: "repulse" },
      resize: true,
    },
    modes: {
      grab: { distance: 400, line_linked: { opacity: 0.5 } },
      bubble: {
        distance: 400,
        size: 4,
        duration: 0.3,
        opacity: 1,
        speed: 3,
      },
      repulse: { distance: 200, duration: 0.4 },
      push: { particles_nb: 4 },
      remove: { particles_nb: 2 },
    },
  },
  retina_detect: true,
};

export function ParticlesBackground() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // particles.js mutates `window` on import — must be client-only.
      await import("particles.js");
      if (cancelled || !window.particlesJS) return;
      window.particlesJS("particles-js", PARTICLES_CONFIG);
    })();

    return () => {
      cancelled = true;
      // Tear the canvas down on unmount so Fast Refresh / route changes
      // don't leak multiple overlapping pJS instances.
      if (Array.isArray(window.pJSDom)) {
        for (const p of window.pJSDom) {
          try {
            p.pJS?.fn?.vendors?.destroypJS?.();
          } catch {
            // pJS sometimes throws on its own teardown when the canvas
            // was already detached — safe to swallow.
          }
        }
        window.pJSDom.length = 0;
      }
    };
  }, []);

  return (
    <div
      id="particles-js"
      aria-hidden="true"
      className="fixed inset-0 -z-10 bg-[#050816]"
    />
  );
}
