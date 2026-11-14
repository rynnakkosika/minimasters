// AI entry point (contracts/engine-actions.md → chooseAction). Always returns a legal action.
import { createRng } from '../engine/rng.js';
import { DEFAULT_PARAMS, weightsFor } from './styles.js';
import { searchBest, candidateActions } from './policy.js';

/** Mulligan: keep a hand that has 1–3 sources and something castable. */
function mulliganChoice(s, p) {
  const hand = s.players[p].hand;
  const sources = hand.filter((c) => c.cardId.endsWith('-lahde')).length;
  return { type: 'mulligan', player: p, keep: sources >= 1 && sources <= 3 };
}

export function chooseAction(s, p, aiParams = {}, rngSeed = 1) {
  const params = { ...DEFAULT_PARAMS, ...aiParams };
  const rng = createRng(rngSeed);
  if (s.phase === 'MULLIGAN') return mulliganChoice(s, p);
  const acts = candidateActions(s, p);
  if (!acts.length) return { type: 'concede', player: p };
  if (params.blunderRate > 0 && rng.next() < params.blunderRate) {
    // A "blunder" is a random but still sensible move: never end the turn while a source is unplayed.
    const nonEnd = acts.filter((a) => a.type !== 'endTurn');
    return rng.pick(nonEnd.length ? nonEnd : acts);
  }
  const best = searchBest(s, p, params, weightsFor(params.style), rng);
  return best ? best.action : acts[0];
}

export { evaluate, unitValue } from './evaluate.js';
