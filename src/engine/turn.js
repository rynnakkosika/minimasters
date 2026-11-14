// Turn structure: DRAW → MAIN → (COMBAT) → END. Attacking ends the turn.
import { card } from './db.js';
import { emit, other, unitsOf, drawCards, hasKw, TURN_LIMIT } from './state.js';
import { runEffects } from './effects.js';
import { checkGameOver, endGame } from './rules.js';

export function startTurn(ctx, p) {
  const s = ctx.s;
  s.turn++;
  s.activePlayer = p;
  s.phase = 'MAIN';
  const pl = s.players[p];
  pl.turnsTaken++;
  pl.resourcePlayed = false;
  pl.energy = pl.energyMax;
  for (const q of [0, 1]) for (const x of unitsOf(s, q)) x.unit.guardUsed = false;
  for (const x of unitsOf(s, p)) x.unit.sick = false;
  emit(ctx, 'turnStarted', { player: p, turn: s.turn });

  for (const x of unitsOf(s, p)) {
    if (s.players[p].lanes[x.lane] !== x.unit) continue;
    if (hasKw(x.unit, 'kasvu')) {
      x.unit.power++;
      x.unit.health++;
      emit(ctx, 'buffed', { uid: x.unit.uid, power: 1, health: 1 });
    }
    runEffects(ctx, card(x.unit.cardId), 'startOfTurn', { owner: p, uid: x.unit.uid, lane: x.lane });
    if (s.phase === 'GAME_OVER') return;
  }
  // The first player skips the draw on the very first turn.
  if (s.turn > 1) drawCards(ctx, p, 1);
  checkGameOver(ctx);
}

export function endTurn(ctx) {
  const s = ctx.s;
  const p = s.activePlayer;
  for (const x of unitsOf(s, p)) {
    runEffects(ctx, card(x.unit.cardId), 'endOfTurn', { owner: p, uid: x.unit.uid, lane: x.lane });
    if (s.phase === 'GAME_OVER') return;
  }
  const [a, b] = s.players;
  if (a.turnsTaken >= TURN_LIMIT && b.turnsTaken >= TURN_LIMIT) {
    const winner = a.life === b.life ? null : a.life > b.life ? 0 : 1;
    endGame(ctx, winner, 'turnLimit');
    return;
  }
  startTurn(ctx, other(p));
}
