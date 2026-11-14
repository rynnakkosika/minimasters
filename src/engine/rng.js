// Seeded random number generator (mulberry32). The whole state is one uint32,
// so it can be saved inside the match state and restored mid-sequence.

/** One mulberry32 step. Returns the float in [0, 1) and the next state. */
export function step(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next };
}

/** Mutable generator object for code that owns its own sequence (AI, booster). */
export function createRng(seed) {
  let s = seed >>> 0;
  const rng = {
    next() {
      const r = step(s);
      s = r.next;
      return r.value;
    },
    int(min, max) {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    pick(arr) {
      return arr[Math.floor(rng.next() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    seed() {
      return Math.floor(rng.next() * 4294967296) >>> 0;
    },
    getState() {
      return s;
    },
  };
  return rng;
}

/** Runs fn with a generator over obj.rng and writes the advanced state back. */
export function withRng(obj, fn) {
  const rng = createRng(obj.rng);
  const out = fn(rng);
  obj.rng = rng.getState();
  return out;
}
