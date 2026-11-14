// Opponent order and deck generation from recipes (FR-006).
import opponents from '../../data/opponents.json' with { type: 'json' };
import { createRng } from '../engine/rng.js';
import { allCards } from '../engine/db.js';
import { BASIC_ID } from './deckbuilder.js';

export const OPPONENTS = opponents.slice().sort((a, b) => a.tier - b.tier);

/** Opponent for the given ladder position; beyond the list the last one repeats. */
export function opponentAt(index) {
  return OPPONENTS[Math.min(index, OPPONENTS.length - 1)];
}

/** Builds the opponent's deck (card id list) from its recipe with the given seed. */
export function opponentDeck(opp, seed) {
  const rng = createRng(seed);
  const r = opp.deckRecipe;
  const cards = allCards();
  const out = [];
  for (const rarity of ['common', 'uncommon', 'rare', 'mythic']) {
    const pool = cards.filter((c) => c.rarity === rarity && r.elements.includes(c.element)).map((c) => c.id);
    for (let i = 0; i < (r[rarity] || 0) && pool.length; i++) out.push(rng.pick(pool));
  }
  for (let i = 0; i < r.basics; i++) out.push(BASIC_ID[r.elements[i % r.elements.length]]);
  return out;
}
