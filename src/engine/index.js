// Public engine API (contracts/engine-actions.md). The UI and the AI use only these.
export { createMatch, cloneState, findUnit, LANES, START_LIFE, TURN_LIMIT } from './state.js';
export { legalActions, applyAction, actionKey, attackableLanes, playBlocker, IllegalActionError } from './actions.js';
export { chosenTargetOf, targetCandidates, playerRef, isPlayerRef, refPlayer } from './effects.js';
export { effectiveCost, canPay } from './rules.js';
export { registerCards, card, allCards } from './db.js';

export function isGameOver(s) {
  return { over: s.phase === 'GAME_OVER', winner: s.winner, reason: s.endReason };
}
