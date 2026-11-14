// The run's deck. As in the Minimasters format, there is no deck building: every card you have
// opened goes into the deck, and free sources are added automatically (FR-007, FR-010).
import { card } from '../engine/db.js';

export const MIN_DECK = 20;
export const SOURCE_RATIO = 0.7; // sources per card: 10 cards → 7 sources (topped up to 20 cards in all)
export const ELEMENTS = ['ahjo', 'kallio', 'usva'];
export const BASIC_ID = { ahjo: 'ahjo-lahde', kallio: 'kallio-lahde', usva: 'usva-lahde' };

export function emptyDeck() {
  return { cards: [], basics: { ahjo: 0, kallio: 0, usva: 0 } };
}

export function basicCount(deck) {
  return ELEMENTS.reduce((n, e) => n + (deck.basics[e] || 0), 0);
}

export function deckSize(deck) {
  return deck.cards.length + basicCount(deck);
}

/** Expands a deck into the card id list the engine plays with. */
export function deckList(deck) {
  const out = [...deck.cards];
  for (const e of ELEMENTS) for (let i = 0; i < (deck.basics[e] || 0); i++) out.push(BASIC_ID[e]);
  return out;
}

function counts(ids) {
  const m = new Map();
  for (const id of ids) m.set(id, (m.get(id) || 0) + 1);
  return m;
}

/** Safety check before a match. Errors are { key, params } so they can be translated. */
export function validateDeck(pool, deck) {
  const errors = [];
  const size = deckSize(deck);
  if (size < MIN_DECK) errors.push({ key: 'deck.err.tooFew', params: { count: size } });
  const have = counts(pool);
  for (const [id, n] of counts(deck.cards)) {
    if ((have.get(id) || 0) < n) errors.push({ key: 'deck.err.notInPool', params: { card: id } });
  }
  if (basicCount(deck) === 0) errors.push({ key: 'deck.err.noResources', params: {} });
  return { ok: errors.length === 0, errors };
}

/**
 * The deck for a pool: all opened cards, plus sources split by how many cards each element has.
 * Every element in the pool gets at least one source.
 */
export function deckFromPool(pool) {
  const cards = pool.filter((id) => card(id) && card(id).type !== 'resource');
  const n = cards.length;
  const nBasics = Math.max(MIN_DECK - n, Math.round(n * SOURCE_RATIO));
  const perElement = Object.fromEntries(ELEMENTS.map((e) => [e, cards.filter((id) => card(id).element === e).length]));
  const used = ELEMENTS.filter((e) => perElement[e] > 0);
  const basics = { ahjo: 0, kallio: 0, usva: 0 };
  if (!used.length) {
    basics.ahjo = nBasics;
    return { cards, basics };
  }
  for (const e of used) basics[e] = 1;
  const spare = nBasics - used.length;
  for (const e of used) basics[e] += Math.floor((spare * perElement[e]) / n);
  // Rounding leftovers go to the elements with the most cards.
  let rest = nBasics - basicCount({ basics });
  for (const e of used.slice().sort((a, b) => perElement[b] - perElement[a])) {
    if (rest <= 0) break;
    basics[e]++;
    rest--;
  }
  return { cards, basics };
}

/** @deprecated Old name, kept until src/net (friend play) switches to deckFromPool. */
export const autoBuild = deckFromPool;
