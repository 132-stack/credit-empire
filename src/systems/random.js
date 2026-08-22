export function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function rand(seed) { return mulberry32(seed)(); }
export function range(rng, min, max) { return min + rng() * (max - min); }
export function weighted(rng, items) {
  const total = items.reduce((a, x) => a + x.weight, 0);
  let n = rng() * total;
  for (const x of items) { n -= x.weight; if (n <= 0) return x.value; }
  return items.at(-1).value;
}
export function round2(n) { return Math.round(n * 100) / 100; }