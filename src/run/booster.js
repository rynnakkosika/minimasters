// Booster generation (FR-003, FR-004, research R6).
import { createRng } from '../engine/rng.js';
import { card } from '../engine/db.js';

export const SLOTS = { common: 6, uncommon: 3, rare: 1 };
export const MYTHIC_CHANCE = 1 / 8;
export const BOOSTER_SIZE = 10;
const MAX_REROLLS = 50;

function byRarity(cards) {
  const out = { common: [], uncommon: [], rare: [], mythic: [] };
  for (const c of cards) if (out[c.rarity]) out[c.rarity].push(c.id);
  return out;
}

/** Picks n distinct ids (with repeats only if the list is too short). */
function pickN(rng, ids, n) {
  const shuffled = rng.shuffle(ids);
  const out = [];
  for (let i = 0; i < n; i++) out.push(shuffled[i % shuffled.length]);
  return out;
}

/** Checks FR-004: ≥ 5 units, ≥ 2 elements, ≥ 4 cards costing 3 or less. */
export function boosterProblems(ids) {
  const defs = ids.map(card);
  const problems = [];
  if (defs.filter((d) => d.type === 'unit').length < 5) problems.push('units');
  if (new Set(defs.map((d) => d.element).filter((e) => e !== 'neutral')).size < 2) problems.push('elements');
  if (defs.filter((d) => d.cost <= 3).length < 4) problems.push('cheap');
  return problems;
}

function roll(rng, pools) {
  const rareSlot = pools.mythic.length && rng.next() < MYTHIC_CHANCE ? 'mythic' : 'rare';
  return [
    ...pickN(rng, pools.common, SLOTS.common),
    ...pickN(rng, pools.uncommon, SLOTS.uncommon),
    ...pickN(rng, pools[rareSlot].length ? pools[rareSlot] : pools.rare, 1),
  ];
}

/** Last resort: swap commons for cheap units until the rules hold. */
function repair(rng, ids, pools) {
  const cheapUnits = pools.common.filter((id) => card(id).type === 'unit' && card(id).cost <= 3);
  const out = ids.slice();
  for (let i = 0; i < SLOTS.common && boosterProblems(out).length; i++) {
    const def = card(out[i]);
    if (def.type === 'unit' && def.cost <= 3) continue;
    out[i] = rng.pick(cheapUnits);
  }
  return out;
}

/** Opens one booster from the given card list with the given seed. Returns 10 card ids. */
export function openBoosterCards(seed, cards) {
  const rng = createRng(seed);
  const pools = byRarity(cards);
  let ids = roll(rng, pools);
  for (let i = 0; i < MAX_REROLLS && boosterProblems(ids).length; i++) ids = roll(rng, pools);
  if (boosterProblems(ids).length) ids = repair(rng, ids, pools);
  return ids;
}
