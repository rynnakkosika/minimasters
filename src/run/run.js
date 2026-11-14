// Run state machine (data-model.md → Run):
// OPENING_BOOSTER → DECKBUILDING → IN_MATCH → OPENING_BOOSTER | COMPLETED_VICTORY | COMPLETED_DEFEAT
import { withRng } from '../engine/rng.js';
import { allCards } from '../engine/db.js';
import { createMatch } from '../engine/state.js';
import { openBoosterCards } from './booster.js';
import { emptyDeck, validateDeck, deckList } from './deckbuilder.js';
import { opponentAt, opponentDeck } from './ladder.js';

export const RUN_LENGTH = 7;

const clone = (x) => structuredClone(x);

export function newRun(seed, now = new Date()) {
  return {
    version: 1,
    id: `run-${seed >>> 0}`,
    seed: seed >>> 0,
    rng: seed >>> 0,
    status: 'OPENING_BOOSTER',
    pool: [],
    deck: emptyDeck(),
    wins: 0,
    opponentIndex: 0,
    opponentId: null,
    boosters: [],
    match: null,
    startedAt: now.toISOString(),
  };
}

export function openBooster(run) {
  if (run.status !== 'OPENING_BOOSTER') throw new Error(`cannot open a booster in ${run.status}`);
  const r = clone(run);
  const seed = withRng(r, (rng) => rng.seed());
  const booster = { seed, cards: openBoosterCards(seed, allCards()) };
  r.boosters.push(booster);
  r.pool.push(...booster.cards);
  r.status = 'DECKBUILDING';
  return { run: r, booster };
}

export function setDeck(run, deck) {
  const r = clone(run);
  r.deck = clone(deck);
  return r;
}

export function startMatch(run) {
  if (run.status !== 'DECKBUILDING') throw new Error(`cannot start a match in ${run.status}`);
  const check = validateDeck(run.pool, run.deck);
  if (!check.ok) throw new Error(`invalid deck: ${check.errors.map((e) => e.key).join(', ')}`);
  const r = clone(run);
  const opp = opponentAt(r.opponentIndex);
  const [deckSeed, matchSeed, coin] = withRng(r, (rng) => [rng.seed(), rng.seed(), rng.next()]);
  r.opponentId = opp.id;
  r.match = createMatch({
    seed: matchSeed,
    decks: [deckList(r.deck), opponentDeck(opp, deckSeed)],
    firstPlayer: coin < 0.5 ? 0 : 1,
  });
  r.status = 'IN_MATCH';
  return r;
}

export function updateMatch(run, matchState) {
  const r = clone(run);
  r.match = matchState;
  return r;
}

/** Applies the finished match's result. A draw (turn limit tie) replays the match with the same decks. */
export function finishMatch(run) {
  if (run.status !== 'IN_MATCH' || !run.match || run.match.phase !== 'GAME_OVER') {
    throw new Error('match is not over');
  }
  const winner = run.match.winner;
  let r = clone(run);
  if (winner === null) {
    r.status = 'DECKBUILDING';
    r.match = null;
    return startMatch(r);
  }
  r.match = null;
  if (winner === 0) {
    r.wins++;
    r.opponentIndex++;
    r.status = r.wins >= RUN_LENGTH ? 'COMPLETED_VICTORY' : 'OPENING_BOOSTER';
  } else {
    r.status = 'COMPLETED_DEFEAT';
  }
  return r;
}
