// Search-based move choice: try each legal action on a copy of the state, look a few actions
// further within the same turn, and keep the best-scoring line (research R5).
import { legalActions, applyAction } from '../engine/actions.js';
import { card } from '../engine/db.js';
import { evaluate } from './evaluate.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Candidate actions without concede, deduplicated (identical cards in hand give identical results). */
export function candidateActions(s, p) {
  const seen = new Set();
  const out = [];
  for (const a of legalActions(s, p)) {
    if (a.type === 'concede') continue;
    const inst = a.uid != null ? s.players[p].hand.find((c) => c.uid === a.uid) : null;
    const key = JSON.stringify([a.type, inst ? inst.cardId : null, a.lane ?? null, a.targets ?? null, a.lanes ?? null, a.keep ?? null]);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/** Cheap ordering so that a narrow search still sees the promising moves first. */
function quickScore(s, p, a) {
  if (a.type === 'playResource') return 50;
  if (a.type === 'declareAttackers') return 20 + a.lanes.length;
  if (a.type === 'endTurn') return 0;
  const inst = s.players[p].hand.find((c) => c.uid === a.uid);
  return inst ? 10 + card(inst.cardId).cost : 5;
}

export function searchBest(s, me, params, weights, rng) {
  const deadline = now() + params.timeLimitMs;
  let nodes = 0;

  // Greedy completion of the rest of the turn, so a line that has not attacked yet is not
  // compared unfairly with a line that already did (the horizon effect).
  function finishTurn(state) {
    for (let i = 0; i < 8 && state.phase === 'MAIN' && state.activePlayer === me; i++) {
      let best = null;
      let bestV = -Infinity;
      for (const a of candidateActions(state, me)) {
        nodes++;
        const next = applyAction(state, a).state;
        const v = evaluate(next, me, weights);
        if (v > bestV) {
          bestV = v;
          best = next;
        }
      }
      if (!best) break;
      state = best;
    }
    return evaluate(state, me, weights);
  }

  function value(state, depth) {
    if (state.phase !== 'MAIN' || state.activePlayer !== me) return evaluate(state, me, weights);
    if (depth === 0 || now() > deadline) return params.rollout ? finishTurn(state) : evaluate(state, me, weights);
    let best = -Infinity;
    const acts = candidateActions(state, me)
      .sort((x, y) => quickScore(state, me, y) - quickScore(state, me, x))
      .slice(0, params.searchWidth);
    for (const a of acts) {
      nodes++;
      const v = value(applyAction(state, a).state, depth - 1);
      if (v > best) best = v;
      if (now() > deadline) break;
    }
    return best;
  }

  const acts = candidateActions(s, me).sort((x, y) => quickScore(s, me, y) - quickScore(s, me, x));
  if (!acts.length) return null;
  let bestAct = acts[acts.length - 1];
  let bestVal = -Infinity;
  for (const a of acts) {
    nodes++;
    // Tiny random tie-break so equal lines don't always resolve the same way.
    const v = value(applyAction(s, a).state, params.searchDepth - 1) + rng.next() * 1e-3;
    if (v > bestVal) {
      bestVal = v;
      bestAct = a;
    }
    if (now() > deadline) break;
  }
  return { action: bestAct, value: bestVal, nodes };
}
