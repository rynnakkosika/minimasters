import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { allCards } from '../src/engine/db.js';
import { openBoosterCards } from '../src/run/booster.js';
import { validateDeck, autoBuild, deckSize, basicCount, deckList } from '../src/run/deckbuilder.js';
import { newRun, openBooster, setDeck, startMatch, finishMatch } from '../src/run/run.js';

const POOL = openBoosterCards(5, allCards());

test('deck: too small and too large decks are rejected (FR-007)', () => {
  const small = { cards: POOL.slice(0, 5), basics: { ahjo: 14, kallio: 0, usva: 0 } };
  assertEqual(validateDeck(POOL, small).errors.map((e) => e.key), ['deck.err.tooFew']);
  const big = { cards: POOL.slice(), basics: { ahjo: 21, kallio: 0, usva: 0 } };
  assertEqual(validateDeck(POOL, big).errors.map((e) => e.key), ['deck.err.tooMany']);
  const ok = { cards: POOL.slice(), basics: { ahjo: 5, kallio: 5, usva: 5 } };
  assertEqual(validateDeck(POOL, ok).ok, true);
});

test('deck: only cards from the pool, sources are unlimited', () => {
  const foreign = { cards: [...POOL, 'usva-varjo'], basics: { ahjo: 10, kallio: 0, usva: 0 } };
  assert(validateDeck(POOL, foreign).errors.some((e) => e.key === 'deck.err.notInPool'));
  const twice = { cards: [POOL[0], POOL[0], ...POOL.slice(1)], basics: { ahjo: 10, kallio: 0, usva: 0 } };
  const dupInPool = POOL.filter((id) => id === POOL[0]).length > 1;
  assertEqual(validateDeck(POOL, twice).ok, dupInPool);
  const manyBasics = { cards: [], basics: { ahjo: 10, kallio: 10, usva: 10 } };
  assertEqual(validateDeck(POOL, manyBasics).ok, true);
});

test('deck: a deck without sources is rejected', () => {
  const pool = Array(3).fill(POOL).flat();
  const deck = { cards: pool.slice(0, 20), basics: { ahjo: 0, kallio: 0, usva: 0 } };
  assert(validateDeck(pool, deck).errors.some((e) => e.key === 'deck.err.noResources'));
});

test('deck: auto-build always gives a valid deck with 40–55 % sources (FR-010)', () => {
  const cards = allCards();
  for (let seed = 1; seed <= 300; seed++) {
    const boosters = 1 + (seed % 7);
    const pool = [];
    for (let b = 0; b < boosters; b++) pool.push(...openBoosterCards(seed * 10 + b, cards));
    const deck = autoBuild(pool);
    const check = validateDeck(pool, deck);
    assert(check.ok, `seed ${seed}: ${JSON.stringify(check.errors)}`);
    const ratio = basicCount(deck) / deckSize(deck);
    assert(ratio >= 0.4 && ratio <= 0.55, `seed ${seed}: source ratio ${ratio.toFixed(2)}`);
    for (const id of deck.cards) {
      const el = cards.find((c) => c.id === id).element;
      assert(el === 'neutral' || deck.basics[el] > 0, `seed ${seed}: ${id} has no source`);
    }
  }
});

test('run: booster → deck → match → result', () => {
  let run = newRun(42, new Date(0));
  assertEqual(run.status, 'OPENING_BOOSTER');
  const opened = openBooster(run);
  run = opened.run;
  assertEqual(opened.booster.cards.length, 10);
  assertEqual(run.pool.length, 10);
  assertEqual(run.status, 'DECKBUILDING');
  run = setDeck(run, autoBuild(run.pool));
  run = startMatch(run);
  assertEqual(run.status, 'IN_MATCH');
  assertEqual(run.match.phase, 'MULLIGAN');
  assertEqual(run.match.players[0].deck.length + run.match.players[0].hand.length, deckList(run.deck).length);
  run.match.phase = 'GAME_OVER';
  run.match.winner = 0;
  run = finishMatch(run);
  assertEqual([run.status, run.wins, run.opponentIndex], ['OPENING_BOOSTER', 1, 1]);
});

test('run: invalid deck cannot start a match', () => {
  let run = openBooster(newRun(1)).run;
  let threw = false;
  try {
    startMatch(run);
  } catch {
    threw = true;
  }
  assert(threw);
});
