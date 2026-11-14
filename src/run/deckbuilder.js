// Deck validation and "Build for me" (FR-007, FR-010).
import { card } from '../engine/db.js';

export const MIN_DECK = 20;
export const MAX_DECK = 30;
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

/** Errors are { key, params } so the UI can translate them. */
export function validateDeck(pool, deck) {
  const errors = [];
  const size = deckSize(deck);
  if (size < MIN_DECK) errors.push({ key: 'deck.err.tooFew', params: { count: size } });
  if (size > MAX_DECK) errors.push({ key: 'deck.err.tooMany', params: { count: size } });
  const have = counts(pool);
  for (const [id, n] of counts(deck.cards)) {
    if ((have.get(id) || 0) < n) errors.push({ key: 'deck.err.notInPool', params: { card: id } });
  }
  if (basicCount(deck) === 0) errors.push({ key: 'deck.err.noResources', params: {} });
  return { ok: errors.length === 0, errors };
}

const RARITY_VALUE = { common: 1, uncommon: 1.5, rare: 2.2, mythic: 3 };

/** Rough card strength used by auto-build. */
export function cardValue(id) {
  const d = card(id);
  const base = RARITY_VALUE[d.rarity] || 1;
  const body = d.type === 'unit' ? (d.power + d.health) / (d.cost + 1) : 1.2;
  return base + body + (d.keywords || []).length * 0.3 + (d.effects || []).length * 0.4;
}

/**
 * Builds a playable deck from the pool: the strongest one or two elements, then sources.
 * Sources make up roughly 40–55 % of the deck.
 */
export function autoBuild(pool) {
  const playable = pool.filter((id) => card(id) && card(id).type !== 'resource');
  const score = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  const count = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  for (const id of playable) {
    const e = card(id).element;
    if (e in score) {
      score[e] += cardValue(id);
      count[e]++;
    }
  }
  const order = ELEMENTS.slice().sort((a, b) => score[b] - score[a]);
  let chosen = [order[0]];
  if (count[order[0]] < 12 && count[order[1]] > 0) chosen.push(order[1]);
  let cards = playable.filter((id) => chosen.includes(card(id).element) || card(id).element === 'neutral');
  if (cards.length < 10) {
    cards = playable.slice();
    chosen = ELEMENTS.filter((e) => count[e] > 0);
  }
  cards.sort((a, b) => cardValue(b) - cardValue(a));
  cards = cards.slice(0, 17);

  const n = cards.length;
  const total = Math.min(MAX_DECK, Math.max(MIN_DECK, n + Math.max(MIN_DECK - n, Math.ceil(n * 0.8))));
  const nBasics = total - n;
  const perElement = Object.fromEntries(ELEMENTS.map((e) => [e, cards.filter((id) => card(id).element === e).length]));
  const used = ELEMENTS.filter((e) => perElement[e] > 0);
  const basics = { ahjo: 0, kallio: 0, usva: 0 };
  if (!used.length) basics.ahjo = nBasics;
  // Every used element gets at least one source; the rest follow the card counts.
  for (const e of used) basics[e] = 1;
  const spare = nBasics - used.length;
  const weightSum = used.reduce((s, e) => s + perElement[e], 0);
  for (const e of used) basics[e] += Math.floor((spare * perElement[e]) / weightSum);
  // Rounding leftovers go to the elements with the most cards.
  let rest = nBasics - basicCount({ basics });
  for (const e of used.slice().sort((a, b) => perElement[b] - perElement[a])) {
    if (rest <= 0) break;
    basics[e]++;
    rest--;
  }
  return { cards, basics };
}
