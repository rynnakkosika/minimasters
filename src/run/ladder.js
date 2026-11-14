// Opponent order and decks (FR-006). Opponents play by the same Minimasters rule as you: the
// n-th opponent opens n boosters, keeps the cards of its own elements and plays them all.
// Difficulty comes from how well the AI plays, not from better cards.
import opponents from '../../data/opponents.json' with { type: 'json' };
import { createRng } from '../engine/rng.js';
import { allCards, card } from '../engine/db.js';
import { openBoosterCards } from './booster.js';
import { deckFromPool, deckList } from './deckbuilder.js';

export const OPPONENTS = opponents.slice().sort((a, b) => a.tier - b.tier);

/** Opponent for the given ladder position; beyond the list the last one repeats. */
export function opponentAt(index) {
  return OPPONENTS[Math.min(index, OPPONENTS.length - 1)];
}

/** The opponent's opened cards: `boosters` boosters, only its own elements. */
export function opponentPool(opp, seed) {
  const rng = createRng(seed);
  const cards = allCards();
  const { elements, boosters } = opp.deckRecipe;
  const pool = [];
  for (let i = 0; i < boosters; i++) pool.push(...openBoosterCards(rng.seed(), cards));
  return pool.filter((id) => elements.includes(card(id).element));
}

/** The opponent's deck (card id list): its pool plus sources, like yours. */
export function opponentDeck(opp, seed) {
  return deckList(deckFromPool(opponentPool(opp, seed)));
}
