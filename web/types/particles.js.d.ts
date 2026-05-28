// particles.js (vincentgarreau, 2018) ships no types and isn't on
// DefinitelyTyped. We don't import any of its named exports — the
// library's only side effect is attaching `particlesJS` and `pJSDom`
// to `window` — so an opaque module declaration is enough to satisfy
// the dynamic import.
declare module "particles.js";
