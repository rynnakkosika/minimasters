// Combat: each attacker strikes its own lane; the opposing unit defends automatically (research R4).
import { card } from './db.js';
import { emit, other, hasKw, LANES } from './state.js';
import { runEffects, damageUnit, damagePlayer, healPlayer, processDeaths } from './effects.js';
import { checkGameOver } from './rules.js';

/** The defender for a lane: the opposing unit, else an adjacent Sentinel that hasn't guarded yet. */
function defenderFor(oppLanes, lane) {
  if (oppLanes[lane]) return oppLanes[lane];
  for (const adj of [lane - 1, lane + 1]) {
    const u = adj >= 0 && adj < LANES ? oppLanes[adj] : null;
    if (u && hasKw(u, 'vartija') && !u.guardUsed) {
      u.guardUsed = true;
      return u;
    }
  }
  return null;
}

export function resolveCombat(ctx, p, lanes) {
  const s = ctx.s;
  const me = s.players[p];
  const opp = s.players[other(p)];
  for (const lane of [...lanes].sort((a, b) => a - b)) {
    if (s.phase === 'GAME_OVER') return;
    const a = me.lanes[lane];
    if (!a) continue;
    a.hidden = false;
    emit(ctx, 'attackDeclared', { player: p, uid: a.uid, lane });
    runEffects(ctx, card(a.cardId), 'onAttack', { owner: p, uid: a.uid, lane });
    if (s.phase === 'GAME_OVER' || me.lanes[lane] !== a) continue;

    const d = defenderFor(opp.lanes, lane);
    if (d) {
      emit(ctx, 'blocked', { uid: d.uid, attacker: a.uid });
      const aPow = a.power;
      const dPow = d.power;
      const remaining = d.health - d.damage;
      const wasShielded = d.shielded;
      let dealt = damageUnit(ctx, d.uid, aPow);
      if (hasKw(a, 'lapaisy') && !wasShielded && aPow > remaining) {
        dealt = remaining + damagePlayer(ctx, other(p), aPow - remaining);
      }
      if (hasKw(a, 'imu')) healPlayer(ctx, p, dealt);
      const back = damageUnit(ctx, a.uid, dPow);
      if (hasKw(d, 'imu')) healPlayer(ctx, other(p), back);
    } else {
      const dealt = damagePlayer(ctx, other(p), a.power);
      if (hasKw(a, 'imu')) healPlayer(ctx, p, dealt);
    }
    processDeaths(ctx);
    checkGameOver(ctx);
  }
}
