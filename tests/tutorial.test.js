import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { applyAction, legalActions, playerRef } from '../src/engine/index.js';
import { buildTutorialMatch, createTutorial, tutorialAiAction, STEPS, OPPONENT_LIFE } from '../src/ui/tutorial/script.js';

/** Plays the scripted path exactly as a player following the coach would. */
function scriptedMove(s, tut) {
  const legal = legalActions(s, 0).filter((a) => a.type !== 'concede');
  return legal.find((a) => tut.allow(a, s));
}

function runOpponent(s) {
  for (let i = 0; i < 20 && s.phase === 'MAIN' && s.activePlayer === 1; i++) s = applyAction(s, tutorialAiAction(s, i)).state;
  return s;
}

test('tutorial: starts on your turn with the fixed hand', () => {
  const s = buildTutorialMatch();
  assertEqual([s.phase, s.activePlayer, s.turn], ['MAIN', 0, 1]);
  assertEqual(s.players[0].hand.map((c) => c.cardId), ['ahjo-lahde', 'ahjo-kipinasoturi', 'ahjo-kekale', 'ahjo-hiilikoira']);
  assertEqual(s.players[1].life, OPPONENT_LIFE);
});

test('tutorial: every scripted step can be completed and teaches one rule at a time', () => {
  let s = buildTutorialMatch();
  const tut = createTutorial();
  const seen = [];
  for (let guard = 0; guard < 100 && tut.scripted; guard++) {
    seen.push(tut.current.key);
    if (tut.current.continue) {
      tut.continue();
      continue;
    }
    if (s.activePlayer === 1) {
      s = runOpponent(s);
      continue;
    }
    const a = scriptedMove(s, tut);
    assert(a, `no legal move for step ${tut.current.key} on turn ${s.turn}`);
    tut.onPlayerAction(a, s);
    s = applyAction(s, a).state;
    s = runOpponent(s);
  }
  assert(!tut.scripted, 'script finished');
  assertEqual([...new Set(seen)], STEPS.map((x) => x.key));
  assertEqual(s.phase, 'MAIN', 'match continues in free play');
  assert(s.players[1].life < OPPONENT_LIFE, 'your attacks hit');
});

test('tutorial: off-script moves are refused, conceding is always possible', () => {
  const s = buildTutorialMatch();
  const tut = createTutorial();
  tut.continue(); // past the welcome
  assert(!tut.allow({ type: 'endTurn', player: 0 }, s), 'ending the turn early');
  const spell = s.players[0].hand.find((c) => c.cardId === 'ahjo-kekale');
  assert(!tut.allow({ type: 'playSpell', player: 0, uid: spell.uid, targets: [playerRef(1)] }, s), 'wrong card');
  assert(tut.allow({ type: 'concede', player: 0 }, s));
});

test('tutorial: the scripted opponent puts its creature in front of yours', () => {
  let s = buildTutorialMatch();
  const tut = createTutorial();
  tut.continue();
  for (let i = 0; i < 3; i++) {
    const a = scriptedMove(s, tut);
    tut.onPlayerAction(a, s);
    s = applyAction(s, a).state;
  }
  s = runOpponent(s); // turn 2: source only
  assertEqual(s.players[1].lanes.filter(Boolean).length, 0);
  const myLane = s.players[0].lanes.findIndex(Boolean);
  for (let i = 0; i < 2; i++) {
    const a = scriptedMove(s, tut);
    tut.onPlayerAction(a, s);
    s = applyAction(s, a).state;
  }
  s = runOpponent(s); // turn 4
  assertEqual(s.players[1].lanes[myLane]?.cardId, 'kallio-sammalpeikko');
});
