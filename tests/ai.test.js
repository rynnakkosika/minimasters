import { test, assert, report } from './runner.js';
import { deckOf, blankMatch, placeUnit, giveCard } from './helpers.js';
import { createMatch, applyAction, legalActions, actionKey, playerRef } from '../src/engine/index.js';
import { chooseAction } from '../src/ai/index.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const FORGE = ['ahjo-kipinasoturi', 'ahjo-hiilikoira', 'ahjo-pajan-oppipoika', 'ahjo-laavanlyoja', 'ahjo-kekale',
  'ahjo-tulimyrsky', 'ahjo-raivotar', 'ahjo-sulattaja', 'ahjo-hehkulisko', 'ahjo-kipinasoturi', 'ahjo-hiilikoira'];
const ROCK = ['kallio-kivikilpi', 'kallio-sammalpeikko', 'kallio-vuorenvartija', 'kallio-lahdevesi', 'kallio-graniittijatti',
  'kallio-juurten-voima', 'kallio-kristallikilpikonna', 'kallio-kalliolahde', 'kallio-ikimetsan-vanhus', 'kallio-kivikilpi', 'kallio-sammalpeikko'];
const MIST = ['usva-sumukettu', 'usva-varjovaras', 'usva-unennakija', 'usva-kylma-kosketus', 'usva-peilikuva',
  'usva-sumuhuntu', 'usva-unohdus', 'usva-hamarankutoja', 'usva-aavelaiva', 'usva-sumukettu', 'usva-peilikuva'];
const DECKS = [deckOf(FORGE, 'ahjo-lahde', 9), deckOf(ROCK, 'kallio-lahde', 9), deckOf(MIST, 'usva-lahde', 9)];

export function aiMatch(seed, params = [{}, {}], decks = [DECKS[seed % 3], DECKS[(seed + 1) % 3]]) {
  let s = createMatch({ seed, decks, firstPlayer: seed % 2 });
  let decisions = 0;
  let time = 0;
  let maxTime = 0;
  for (let i = 0; i < 1000 && s.phase !== 'GAME_OVER'; i++) {
    const p = s.phase === 'MULLIGAN' ? (s.players[0].mulliganDone ? 1 : 0) : s.activePlayer;
    const t0 = now();
    const a = chooseAction(s, p, params[p], seed * 1000 + i);
    const dt = now() - t0;
    time += dt;
    maxTime = Math.max(maxTime, dt);
    decisions++;
    const legal = legalActions(s, p).map(actionKey);
    if (!legal.includes(actionKey(a))) throw new Error(`illegal AI action ${actionKey(a)}`);
    s = applyAction(s, a).state;
  }
  return { s, decisions, avgMs: time / decisions, maxMs: maxTime };
}

test('ai: every move is legal and AI-vs-AI matches finish', () => {
  let totalAvg = 0;
  let worst = 0;
  const N = 60;
  const turns = [];
  for (let seed = 1; seed <= N; seed++) {
    const r = aiMatch(seed);
    assert(r.s.phase === 'GAME_OVER', `match ${seed} did not finish`);
    totalAvg += r.avgMs;
    worst = Math.max(worst, r.maxMs);
    turns.push(r.s.turn);
  }
  const avg = totalAvg / N;
  turns.sort((a, b) => a - b);
  report(`AI: ${N} matches, avg decision ${avg.toFixed(1)} ms, worst ${worst.toFixed(0)} ms, ` +
    `turns median ${turns[N >> 1]} (min ${turns[0]}, max ${turns[N - 1]})`);
  assert(avg < 300, `average decision ${avg.toFixed(1)} ms`);
});

test('ai: takes lethal when it is available', () => {
  const s = blankMatch();
  s.players[1].life = 2;
  giveCard(s, 0, 'ahjo-kekale');
  const a = chooseAction(s, 0, { searchDepth: 1 }, 5);
  assert(a.type === 'playSpell' && a.targets[0] === playerRef(1), JSON.stringify(a));
});

test('ai: attacks into an empty lane rather than ending the turn', () => {
  const s = blankMatch();
  s.players[0].hand = [];
  placeUnit(s, 0, 0, 'ahjo-laavanlyoja');
  const a = chooseAction(s, 0, { searchDepth: 1 }, 5);
  assert(a.type === 'declareAttackers' && a.lanes.includes(0), JSON.stringify(a));
});

// Forge and Bedrock mirrors: Mist mirrors currently stall until a deck runs out (balance item T045/T062).
test('ai: the searching AI beats a random player in mirror matches', () => {
  let wins = 0;
  const N = 40;
  for (let seed = 100; seed < 100 + N; seed++) {
    const r = aiMatch(seed, [{ searchDepth: 2, searchWidth: 16 }, { blunderRate: 1 }], [DECKS[seed % 2], DECKS[seed % 2]]);
    if (r.s.winner === 0) wins++;
  }
  report(`AI strength: search beat random ${wins}/${N}`);
  assert(wins >= N * 0.65, `search AI won only ${wins}/${N}`);
});
