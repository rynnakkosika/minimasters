import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { newRun, openBooster, setDeck, startMatch, finishMatch, recordEvents, bestCard, markSeen, autoBuild, OPPONENTS, opponentAt, opponentDeck, RUN_LENGTH } from '../src/run/index.js';
import { card } from '../src/engine/db.js';

/** Plays the run up to a match and forces the result. */
function toMatch(run) {
  run = openBooster(run).run;
  run = setDeck(run, autoBuild(run.pool));
  return startMatch(run);
}

function endMatch(run, winner, reason = 'life') {
  run = structuredClone(run);
  run.match.phase = 'GAME_OVER';
  run.match.winner = winner;
  run.match.endReason = reason;
  return finishMatch(run);
}

test('run: a win opens the next booster, the pool grows by 10', () => {
  let run = toMatch(newRun(9));
  run = endMatch(run, 0);
  assertEqual([run.status, run.wins, run.opponentIndex], ['OPENING_BOOSTER', 1, 1]);
  run = openBooster(run).run;
  assertEqual(run.pool.length, 20);
  assertEqual(run.status, 'DECKBUILDING');
});

test('run: seven wins complete the run (FR-005)', () => {
  let run = newRun(3);
  for (let i = 0; i < RUN_LENGTH; i++) {
    run = toMatch(run);
    assertEqual(run.opponentId, OPPONENTS[i].id, `opponent ${i + 1}`);
    run = endMatch(run, 0);
  }
  assertEqual(run.status, 'COMPLETED_VICTORY');
  assertEqual(run.wins, 7);
  assertEqual(run.boosters.length, 7);
  assertEqual(run.stats.matches, 7);
});

test('run: a loss or a concession ends the run', () => {
  const lost = endMatch(toMatch(newRun(4)), 1);
  assertEqual(lost.status, 'COMPLETED_DEFEAT');
  const conceded = endMatch(toMatch(newRun(4)), 1, 'concede');
  assertEqual(conceded.status, 'COMPLETED_DEFEAT');
});

test('run: a turn-limit draw replays the match with the same decks', () => {
  const run = toMatch(newRun(5));
  const again = endMatch(run, null, 'turnLimit');
  assertEqual(again.status, 'IN_MATCH');
  assertEqual(again.wins, 0);
  assertEqual(again.opponentId, run.opponentId);
  const count = (m, p) => m.players[p].deck.length + m.players[p].hand.length;
  assertEqual(count(again.match, 0), count(run.match, 0));
  assert(JSON.stringify(again.match) !== JSON.stringify(run.match), 'a fresh match');
});

test('run: opponents get harder and never easier (FR-006)', () => {
  assertEqual(OPPONENTS.length, 7);
  assertEqual(new Set(OPPONENTS.map((o) => o.id)).size, 7);
  for (let i = 1; i < OPPONENTS.length; i++) {
    const a = OPPONENTS[i - 1];
    const b = OPPONENTS[i];
    assert(b.tier > a.tier, `tier ${b.id}`);
    assert(b.aiParams.searchDepth >= a.aiParams.searchDepth, `depth ${b.id}`);
    assert(b.aiParams.blunderRate <= a.aiParams.blunderRate, `blunders ${b.id}`);
    const power = (o) => o.deckRecipe.uncommon + 2 * o.deckRecipe.rare + 3 * o.deckRecipe.mythic;
    assert(power(b) >= power(a), `deck strength ${b.id}`);
  }
  assertEqual(opponentAt(99).id, OPPONENTS[6].id);
});

test('run: opponent decks are 20–30 cards of their recipe elements', () => {
  for (const o of OPPONENTS) {
    const deck = opponentDeck(o, 123);
    assert(deck.length >= 20 && deck.length <= 30, `${o.id}: ${deck.length}`);
    for (const id of deck) assert(o.deckRecipe.elements.includes(card(id).element), `${o.id}: ${id}`);
  }
});

test('run: stats pick the card that dealt the most damage', () => {
  let run = newRun(1);
  run = recordEvents(run, [
    { type: 'cardPlayed', player: 0, cardId: 'ahjo-kekale' },
    { type: 'cardPlayed', player: 0, cardId: 'ahjo-kekale' },
    { type: 'cardPlayed', player: 1, cardId: 'usva-unohdus' },
    { type: 'damageDealt', amount: 5, sourceOwner: 0, sourceCard: 'ahjo-hehkulisko' },
    { type: 'damageDealt', amount: 9, sourceOwner: 1, sourceCard: 'kallio-graniittijatti' },
  ]);
  assertEqual(run.stats.played, { 'ahjo-kekale': 2 });
  assertEqual(bestCard(run), 'ahjo-hehkulisko');
});

test('run: opened cards are added to the collection once (FR-023)', () => {
  const seen = markSeen(['a', 'b'], ['b', 'c', 'c', 'd']);
  assertEqual(seen, ['a', 'b', 'c', 'd']);
  assertEqual(markSeen([], []), []);
});
