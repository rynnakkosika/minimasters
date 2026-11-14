import { test, assert, assertEqual, assertThrows } from './runner.js';
import { blankMatch, giveCard, placeUnit, act, deckOf } from './helpers.js';
import { createMatch, applyAction, legalActions, isGameOver, IllegalActionError } from '../src/engine/index.js';

const DECK = deckOf(['ahjo-kipinasoturi', 'ahjo-hiilikoira', 'ahjo-laavanlyoja', 'ahjo-kekale', 'ahjo-pajan-oppipoika',
  'ahjo-kipinasoturi', 'ahjo-hiilikoira', 'ahjo-laavanlyoja', 'ahjo-kekale', 'ahjo-pajan-oppipoika'], 'ahjo-lahde', 10);

test('engine: match starts in mulligan with 4-card hands and 20 life', () => {
  const s = createMatch({ seed: 3, decks: [DECK, DECK] });
  assertEqual(s.phase, 'MULLIGAN');
  for (const pl of s.players) {
    assertEqual(pl.hand.length, 4);
    assertEqual(pl.life, 20);
    assertEqual(pl.deck.length, 16);
  }
});

test('engine: mulligan only once, then the first player starts without drawing', () => {
  let s = createMatch({ seed: 3, decks: [DECK, DECK], firstPlayer: 0 });
  s = act(s, { type: 'mulligan', player: 0, keep: false });
  assertEqual(s.players[0].hand.length, 4);
  assert(!legalActions(s, 0).some((a) => a.type === 'mulligan'), 'second mulligan not allowed');
  s = act(s, { type: 'mulligan', player: 1, keep: true });
  assertEqual(s.phase, 'MAIN');
  assertEqual(s.turn, 1);
  assertEqual(s.players[0].hand.length, 4, 'no draw on turn 1');
  s = act(s, { type: 'endTurn', player: 0 });
  assertEqual(s.activePlayer, 1);
  assertEqual(s.players[1].hand.length, 5, 'second player draws');
});

test('engine: sources give permanent energy, one per turn', () => {
  let s = blankMatch({ energy: 0 });
  s.players[0].resources = { ahjo: 0, kallio: 0, usva: 0 };
  const a = giveCard(s, 0, 'ahjo-lahde');
  const b = giveCard(s, 0, 'kallio-lahde');
  s = act(s, { type: 'playResource', player: 0, uid: a });
  assertEqual(s.players[0].energyMax, 1);
  assertEqual(s.players[0].energy, 1);
  assertEqual(s.players[0].resources.ahjo, 1);
  assert(!legalActions(s, 0).some((x) => x.type === 'playResource' && x.uid === b), 'only one source per turn');
  s = act(s, { type: 'endTurn', player: 0 });
  s = act(s, { type: 'endTurn', player: 1 });
  assertEqual(s.players[0].energy, 1, 'energy refills to max');
});

test('engine: cards need energy and a source of their element', () => {
  let s = blankMatch({ energy: 1 });
  s.players[0].resources = { ahjo: 0, kallio: 1, usva: 0 };
  giveCard(s, 0, 'ahjo-kipinasoturi');
  assert(!legalActions(s, 0).some((a) => a.type === 'playUnit'), 'no Forge source');
  s.players[0].resources.ahjo = 1;
  assert(legalActions(s, 0).some((a) => a.type === 'playUnit'), 'now playable');
  giveCard(s, 0, 'ahjo-laavanlyoja');
  assertEqual(legalActions(s, 0).filter((a) => a.type === 'playUnit').length, 3, 'only the 1-cost card, 3 lanes');
});

test('engine: units go to empty lanes only', () => {
  let s = blankMatch();
  placeUnit(s, 0, 1, 'kallio-kivikilpi');
  giveCard(s, 0, 'ahjo-kipinasoturi');
  const lanes = legalActions(s, 0).filter((a) => a.type === 'playUnit').map((a) => a.lane);
  assertEqual(lanes, [0, 2]);
});

test('engine: illegal actions are rejected', () => {
  const s = blankMatch();
  assertThrows(() => applyAction(s, { type: 'endTurn', player: 1 }));
  assertThrows(() => applyAction(s, { type: 'playUnit', player: 0, uid: 999, lane: 0 }));
  let err = null;
  try {
    applyAction(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  } catch (e) {
    err = e;
  }
  assert(err instanceof IllegalActionError);
});

test('engine: new units are tired unless Swift', () => {
  let s = blankMatch();
  const a = giveCard(s, 0, 'ahjo-kipinasoturi');
  const b = giveCard(s, 0, 'ahjo-hiilikoira');
  s = act(s, { type: 'playUnit', player: 0, uid: a, lane: 0 });
  s = act(s, { type: 'playUnit', player: 0, uid: b, lane: 1 });
  const attacks = legalActions(s, 0).filter((x) => x.type === 'declareAttackers').map((x) => x.lanes);
  assertEqual(attacks, [[1]]);
});

test('engine: unblocked attacker hits the player and the turn ends', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'ahjo-laavanlyoja');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[1].life, 17);
  assertEqual(s.activePlayer, 1);
});

test('engine: opposing unit defends automatically, damage both ways', () => {
  let s = blankMatch();
  placeUnit(s, 0, 2, 'ahjo-laavanlyoja'); // 3/3
  placeUnit(s, 1, 2, 'kallio-vuorenvartija'); // 2/5
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [2] });
  assertEqual(s.players[1].life, 20);
  assertEqual(s.players[1].lanes[2].damage, 3);
  assertEqual(s.players[0].lanes[2].damage, 2);
});

test('engine: dead units go to the discard pile', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'ahjo-kipinasoturi'); // 2/1
  placeUnit(s, 1, 0, 'ahjo-kipinasoturi');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[0].lanes[0], null);
  assertEqual(s.players[1].lanes[0], null);
  assertEqual(s.players[0].discard, ['ahjo-kipinasoturi']);
});

test('engine: life at 0 ends the game', () => {
  let s = blankMatch();
  s.players[1].life = 2;
  placeUnit(s, 0, 0, 'ahjo-kipinasoturi');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(isGameOver(s), { over: true, winner: 0, reason: 'life' });
  assertEqual(legalActions(s, 0), []);
});

test('engine: drawing from an empty deck loses', () => {
  let s = blankMatch();
  s.players[1].deck = [];
  s = act(s, { type: 'endTurn', player: 0 });
  assertEqual(isGameOver(s), { over: true, winner: 0, reason: 'decked' });
});

test('engine: conceding loses', () => {
  let s = blankMatch();
  s = act(s, { type: 'concede', player: 0 });
  assertEqual(isGameOver(s), { over: true, winner: 1, reason: 'concede' });
});

test('engine: turn limit decides by life, tie gives no winner', () => {
  let s = blankMatch();
  s.players[0].turnsTaken = 25;
  s.players[1].turnsTaken = 25;
  s.players[0].life = 12;
  s.players[1].life = 9;
  const won = act(s, { type: 'endTurn', player: 0 });
  assertEqual(isGameOver(won), { over: true, winner: 0, reason: 'turnLimit' });
  s.players[1].life = 12;
  const tie = act(s, { type: 'endTurn', player: 0 });
  assertEqual(isGameOver(tie), { over: true, winner: null, reason: 'turnLimit' });
});

test('engine: applyAction does not mutate its input', () => {
  const s = blankMatch();
  const before = JSON.stringify(s);
  placeUnit(s, 0, 0, 'ahjo-kipinasoturi');
  const snap = JSON.stringify(s);
  act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assert(before !== snap);
  assertEqual(JSON.stringify(s), snap);
});

function playout(seed) {
  let s = createMatch({ seed, decks: [DECK, DECK] });
  const log = [];
  for (let i = 0; i < 400 && s.phase !== 'GAME_OVER'; i++) {
    const p = s.phase === 'MULLIGAN' ? (s.players[0].mulliganDone ? 1 : 0) : s.activePlayer;
    const acts = legalActions(s, p).filter((a) => a.type !== 'concede');
    const a = acts[(i * 7 + seed) % acts.length];
    log.push(a);
    s = applyAction(s, a).state;
  }
  return { s, log };
}

test('engine: same seed and actions give an identical match (determinism)', () => {
  const a = playout(11);
  const b = playout(11);
  assertEqual(JSON.stringify(a.s), JSON.stringify(b.s));
  // Replaying the logged actions on a fresh match reproduces the final state.
  let r = createMatch({ seed: 11, decks: [DECK, DECK] });
  for (const act0 of a.log) r = applyAction(r, act0).state;
  assertEqual(JSON.stringify(r), JSON.stringify(a.s));
});
