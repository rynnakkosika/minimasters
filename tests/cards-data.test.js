import { test, assert, assertEqual } from './runner.js';
import { CARDS, KEYWORDS, validateCards, forbiddenHits, MAX_KEYWORDS, MAX_TEXT_CHARS, loadCards } from '../src/data/cards.js';
import { cardText } from '../src/data/i18n.js';

loadCards();

// Reads tools/forbidden-terms.txt with fs in Node and fetch in the browser.
const TERMS_URL = new URL('../tools/forbidden-terms.txt', import.meta.url);
async function denyList() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { readFileSync } = await import('node:fs');
    return readFileSync(TERMS_URL, 'utf8').split(/\r?\n/);
  }
  return (await (await fetch(TERMS_URL)).text()).split(/\r?\n/);
}

test('cards: the bundled set passes validation', () => {
  assertEqual(validateCards(CARDS), []);
});

test('cards: at most 8 keywords in the whole game', () => {
  assert(KEYWORDS.length <= MAX_KEYWORDS);
});

test('cards: every rules text fits in three lines (fi + en)', () => {
  for (const c of CARDS) {
    for (const loc of ['fi', 'en']) {
      assert(cardText(c, loc).length <= MAX_TEXT_CHARS, `${c.id} ${loc}`);
    }
  }
});

test('cards: no name or text hits the originality deny list', async () => {
  assertEqual(forbiddenHits(CARDS, await denyList()), []);
});

test('cards: validation catches broken cards', () => {
  const bad = [
    { id: 'x-unit', nameKey: 'card.ahjo-kekale', type: 'unit', element: 'ahjo', cost: 2, rarity: 'common', keywords: ['lentava'], effects: [] },
    { id: 'x-spell', nameKey: 'nope', type: 'spell', element: 'fire', cost: 9, rarity: 'common', power: 2, keywords: [], effects: [] },
  ];
  const errors = validateCards(bad);
  assert(errors.some((e) => e.includes('power')), 'unit without stats');
  assert(errors.some((e) => e.includes('unknown keyword')), 'keyword');
  assert(errors.some((e) => e.includes('bad element')), 'element');
  assert(errors.some((e) => e.includes('cost')), 'cost');
  assert(errors.some((e) => e.includes('missing fi name')), 'name');
});

test('cards: deny list matches whole words only', () => {
  const fake = [{ id: 'x', nameKey: 'card.x', type: 'spell', element: 'ahjo', cost: 1, rarity: 'common', keywords: [], effects: [] }];
  const dicts = { fi: { 'card.x': 'Tappara' }, en: { 'card.x': 'Tap the card' } };
  const hits = forbiddenHits(fake, ['Tap'], dicts);
  assertEqual(hits.length, 1);
});
