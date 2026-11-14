// Win conditions and play requirements.
import { card } from './db.js';
import { emit } from './state.js';

export function endGame(ctx, winner, reason) {
  const s = ctx.s;
  s.phase = 'GAME_OVER';
  s.winner = winner;
  s.endReason = reason;
  emit(ctx, 'gameOver', { winner, reason });
}

/** Ends the game if a player is at 0 life. Returns true when over. */
export function checkGameOver(ctx) {
  const s = ctx.s;
  if (s.phase === 'GAME_OVER') return true;
  const lost = s.players.map((pl) => pl.life <= 0);
  if (!lost[0] && !lost[1]) return false;
  const winner = lost[0] && lost[1] ? null : lost[0] ? 1 : 0;
  endGame(ctx, winner, 'life');
  return true;
}

export function isOver(s) {
  return s.phase === 'GAME_OVER';
}

export function effectiveCost(inst) {
  return Math.max(0, card(inst.cardId).cost + (inst.costMod || 0));
}

/** A card needs at least one source of its own element in play (neutral cards need none). */
export function hasElement(player, element) {
  return element === 'neutral' || (player.resources[element] || 0) > 0;
}

export function canPay(player, inst) {
  const def = card(inst.cardId);
  return effectiveCost(inst) <= player.energy && hasElement(player, def.element);
}
