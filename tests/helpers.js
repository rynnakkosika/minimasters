// Shared test helpers: register the card set and build hand-crafted match states.
import { CARDS } from '../src/data/cards.js';
import { registerCards } from '../src/engine/db.js';
import { createMatch, applyAction } from '../src/engine/index.js';
import { makeUnit, newInstance } from '../src/engine/state.js';

registerCards(CARDS);

export function deckOf(ids, basic = 'ahjo-lahde', basics = 10) {
  return [...ids, ...Array(basics).fill(basic)];
}

/** A match past the mulligan, player 0 to act, with empty hands and boards unless filled in. */
export function blankMatch({ seed = 1, energy = 10 } = {}) {
  const filler = Array(20).fill('ahjo-kipinasoturi');
  let s = createMatch({ seed, decks: [filler, filler], firstPlayer: 0 });
  s = applyAction(s, { type: 'mulligan', player: 0, keep: true }).state;
  s = applyAction(s, { type: 'mulligan', player: 1, keep: true }).state;
  for (const pl of s.players) {
    pl.hand = [];
    pl.energy = energy;
    pl.energyMax = energy;
    pl.resources = { ahjo: 3, kallio: 3, usva: 3 };
  }
  return s;
}

export function giveCard(s, p, cardId) {
  const inst = newInstance(s, cardId);
  s.players[p].hand.push(inst);
  return inst.uid;
}

export function placeUnit(s, p, lane, cardId, { sick = false } = {}) {
  const u = makeUnit(s, p, cardId);
  u.sick = sick;
  s.players[p].lanes[lane] = u;
  return u;
}

export function act(s, action) {
  return applyAction(s, action).state;
}
