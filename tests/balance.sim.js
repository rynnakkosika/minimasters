// Balance simulation (T045): plays whole runs with an AI "player" and reports how the ladder behaves.
// Usage: node tests/balance.sim.js --runs 200 [--player-depth 2 --player-blunder 0.1]
// Targets: SC-002 (matches 5–10 min) and SC-006 (opponent 1 > 75 %, full run 5–15 %).
import './helpers.js';
import { applyAction } from '../src/engine/index.js';
import { chooseAction } from '../src/ai/index.js';
import { card } from '../src/engine/db.js';
import { newRun, openBooster, setDeck, autoBuild, startMatch, finishMatch, opponentAt, OPPONENTS } from '../src/run/index.js';

// Rough real-time cost of a turn with animations: the human thinks, the AI plays quickly.
const SECONDS_PER_PLAYER_TURN = 22;
const SECONDS_PER_AI_TURN = 7;

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : fallback;
}

export function playMatch(run, playerParams, seed) {
  const opp = opponentAt(run.opponentIndex);
  let s = run.match;
  for (let i = 0; i < 2000 && s.phase !== 'GAME_OVER'; i++) {
    const p = s.phase === 'MULLIGAN' ? (s.players[0].mulliganDone ? 1 : 0) : s.activePlayer;
    const params = p === 0 ? playerParams : { style: opp.style, ...opp.aiParams };
    s = applyAction(s, chooseAction(s, p, params, (seed * 7919 + i) >>> 0)).state;
  }
  return s;
}

function mainElement(deck) {
  const n = {};
  for (const id of deck.cards) n[card(id).element] = (n[card(id).element] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
}

export function simulateRun(seed, playerParams) {
  let run = newRun(seed);
  const matches = [];
  while (!run.status.startsWith('COMPLETED')) {
    if (run.status === 'OPENING_BOOSTER') {
      run = openBooster(run).run;
      run = setDeck(run, autoBuild(run.pool));
      run = startMatch(run);
    }
    const s = playMatch(run, playerParams, seed * 31 + matches.length);
    run = structuredClone(run);
    run.match = s;
    matches.push({
      opponent: run.opponentIndex,
      winner: s.winner,
      reason: s.endReason,
      turns: s.players[0].turnsTaken + s.players[1].turnsTaken,
      minutes: (s.players[0].turnsTaken * SECONDS_PER_PLAYER_TURN + s.players[1].turnsTaken * SECONDS_PER_AI_TURN) / 60,
      element: mainElement(run.deck),
    });
    run = finishMatch(run);
    if (matches.length > 40) break; // safety against endless draws
  }
  return { run, matches };
}

export function report(results) {
  const per = OPPONENTS.map(() => ({ played: 0, won: 0 }));
  const minutes = [];
  const reasons = {};
  const elements = {};
  let completed = 0;
  for (const { run, matches } of results) {
    if (run.status === 'COMPLETED_VICTORY') completed++;
    for (const m of matches) {
      per[m.opponent].played++;
      if (m.winner === 0) per[m.opponent].won++;
      minutes.push(m.minutes);
      reasons[m.reason] = (reasons[m.reason] || 0) + 1;
      elements[m.element] ??= { played: 0, won: 0 };
      elements[m.element].played++;
      if (m.winner === 0) elements[m.element].won++;
    }
  }
  minutes.sort((a, b) => a - b);
  const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(0)} %` : '–');
  const inRange = minutes.filter((m) => m >= 5 && m <= 10).length;
  const lines = [];
  lines.push(`Runs: ${results.length}, completed (7/7): ${pct(completed, results.length)}  [target 5–15 %]`);
  per.forEach((x, i) => lines.push(`  vs ${String(i + 1).padStart(1)} ${OPPONENTS[i].id.padEnd(16)} win ${pct(x.won, x.played).padStart(5)} of ${x.played}${i === 0 ? '  [target > 75 %]' : ''}`));
  lines.push(`Match length: median ${minutes[minutes.length >> 1]?.toFixed(1)} min, 5–10 min: ${pct(inRange, minutes.length)}, max ${minutes[minutes.length - 1]?.toFixed(1)} min  [target 80 % in 5–10, none > 15]`);
  lines.push(`End reasons: ${JSON.stringify(reasons)}`);
  lines.push(`Main element win rates: ${Object.entries(elements).map(([e, x]) => `${e} ${pct(x.won, x.played)} (${x.played})`).join(', ')}`);
  return { text: lines.join('\n'), completedRate: completed / results.length, firstWinRate: per[0].won / Math.max(1, per[0].played) };
}

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('balance.sim.js')) {
  const runs = arg('runs', 200);
  const playerParams = { searchDepth: arg('player-depth', 2), searchWidth: 12, blunderRate: arg('player-blunder', 0.1), rollout: true };
  const t0 = Date.now();
  const results = [];
  for (let seed = 1; seed <= runs; seed++) results.push(simulateRun(seed, playerParams));
  console.log(`Player model: ${JSON.stringify(playerParams)}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(report(results).text);
}
