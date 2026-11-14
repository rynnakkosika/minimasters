// Run state machine (data-model.md → Run):
// OPENING_BOOSTER → READY → IN_MATCH → OPENING_BOOSTER | COMPLETED_VICTORY | COMPLETED_DEFEAT
// There is no deck building: the deck is always every opened card plus sources (deckFromPool).
import { withRng } from '../engine/rng.js';
import { allCards } from '../engine/db.js';
import { createMatch } from '../engine/state.js';
import { openBoosterCards } from './booster.js';
import { emptyDeck, validateDeck, deckList, deckFromPool } from './deckbuilder.js';
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
    // played: how often the player played each card; damage: damage dealt by each of the player's cards.
    stats: { played: {}, damage: {}, matches: 0 },
    startedAt: now.toISOString(),
  };
}

/** Adds the player's (player 0) card plays and damage from a batch of engine events to the run stats. */
export function recordEvents(run, events) {
  const r = clone(run);
  r.stats ??= { played: {}, damage: {}, matches: 0 };
  for (const e of events) {
    if (e.type === 'cardPlayed' && e.player === 0) r.stats.played[e.cardId] = (r.stats.played[e.cardId] || 0) + 1;
    if (e.type === 'damageDealt' && e.sourceOwner === 0 && e.sourceCard) {
      r.stats.damage[e.sourceCard] = (r.stats.damage[e.sourceCard] || 0) + e.amount;
    }
  }
  return r;
}

/** Collection after opening cards: adds ids not seen before, keeps the order of first sight (FR-023). */
export function markSeen(seen, cardIds) {
  const out = seen.slice();
  for (const id of cardIds) if (!out.includes(id)) out.push(id);
  return out;
}

/** The run's best card: most damage dealt, then most played. */
export function bestCard(run) {
  const s = run.stats || { played: {}, damage: {} };
  const ids = new Set([...Object.keys(s.played), ...Object.keys(s.damage)]);
  let best = null;
  let bestKey = [-1, -1];
  for (const id of ids) {
    const key = [s.damage[id] || 0, s.played[id] || 0];
    if (key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) {
      best = id;
      bestKey = key;
    }
  }
  return best;
}

export function openBooster(run) {
  if (run.status !== 'OPENING_BOOSTER') throw new Error(`cannot open a booster in ${run.status}`);
  const r = clone(run);
  const seed = withRng(r, (rng) => rng.seed());
  const booster = { seed, cards: openBoosterCards(seed, allCards()) };
  r.boosters.push(booster);
  r.pool.push(...booster.cards);
  r.deck = deckFromPool(r.pool);
  r.status = 'READY';
  return { run: r, booster };
}

export function startMatch(run) {
  if (run.status !== 'READY') throw new Error(`cannot start a match in ${run.status}`);
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
  r.stats ??= { played: {}, damage: {}, matches: 0 };
  r.stats.matches++;
  if (winner === null) {
    r.status = 'READY';
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
