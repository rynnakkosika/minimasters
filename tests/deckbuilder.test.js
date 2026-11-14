import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { allCards, card } from '../src/engine/db.js';
import { openBoosterCards } from '../src/run/booster.js';
import { validateDeck, deckFromPool, deckSize, basicCount, deckList, MIN_DECK } from '../src/run/deckbuilder.js';
import { newRun, openBooster, startMatch, finishMatch } from '../src/run/run.js';

const POOL = openBoosterCards(5, allCards());

test('deck: every opened card goes into the deck, no deck building (FR-007)', () => {
  const cards = allCards();
  for (let seed = 1; seed <= 300; seed++) {
    const pool = [];
    for (let b = 0; b < 1 + (seed % 7); b++) pool.push(...openBoosterCards(seed * 10 + b, cards));
    const deck = deckFromPool(pool);
    assertEqual(deck.cards.slice().sort(), pool.slice().sort(), `seed ${seed}: all cards`);
    assert(validateDeck(pool, deck).ok, `seed ${seed}: valid`);
    assert(deckSize(deck) >= MIN_DECK, `seed ${seed}: at least 20`);
    for (const id of deck.cards) {
      const el = card(id).element;
      assert(el === 'neutral' || deck.basics[el] > 0, `seed ${seed}: ${id} has a source`);
    }
  }
});

test('deck: sources are added automatically, about 0.8 per card', () => {
  const one = deckFromPool(POOL);
  assertEqual(deckSize(one), 20, 'one booster: 10 cards + 10 sources');
  const pool = [...POOL, ...openBoosterCards(6, allCards()), ...openBoosterCards(7, allCards())];
  const three = deckFromPool(pool);
  assertEqual(basicCount(three), 24, 'three boosters: 30 cards + 24 sources');
});

test('deck: sources follow the element counts', () => {
  const pool = ['ahjo-kipinasoturi', 'ahjo-hiilikoira', 'ahjo-kekale', 'ahjo-laavanlyoja', 'ahjo-tuhkasusi',
    'ahjo-hiiltaja', 'ahjo-pajamestari', 'ahjo-tulikarpanen', 'usva-sumukettu', 'usva-kuiskaaja'];
  const deck = deckFromPool(pool);
  assertEqual(deck.basics.kallio, 0);
  assert(deck.basics.ahjo > deck.basics.usva && deck.basics.usva >= 1);
});

test('deck: validation still rejects foreign or too small decks', () => {
  const foreign = { cards: [...POOL, 'usva-varjo'], basics: { ahjo: 10, kallio: 0, usva: 0 } };
  assert(validateDeck(POOL, foreign).errors.some((e) => e.key === 'deck.err.notInPool'));
  const small = { cards: POOL.slice(0, 5), basics: { ahjo: 5, kallio: 0, usva: 0 } };
  assert(validateDeck(POOL, small).errors.some((e) => e.key === 'deck.err.tooFew'));
  const noSources = { cards: Array(3).fill(POOL).flat().slice(0, 20), basics: { ahjo: 0, kallio: 0, usva: 0 } };
  assert(validateDeck(Array(3).fill(POOL).flat(), noSources).errors.some((e) => e.key === 'deck.err.noResources'));
});

test('run: booster → straight to the match → result', () => {
  let run = newRun(42, new Date(0));
  assertEqual(run.status, 'OPENING_BOOSTER');
  const opened = openBooster(run);
  run = opened.run;
  assertEqual(run.status, 'READY');
  assertEqual(run.deck.cards.length, 10);
  run = startMatch(run);
  assertEqual(run.status, 'IN_MATCH');
  assertEqual(run.match.players[0].deck.length + run.match.players[0].hand.length, deckList(run.deck).length);
  run.match.phase = 'GAME_OVER';
  run.match.winner = 0;
  run = finishMatch(run);
  assertEqual([run.status, run.wins, run.opponentIndex], ['OPENING_BOOSTER', 1, 1]);
  run = openBooster(run).run;
  assertEqual(run.deck.cards.length, 20, 'second booster joins the deck');
});
