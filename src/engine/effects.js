// Effect primitives (contracts/card-schema.md), damage, deaths and keyword effects.
import { card } from './db.js';
import { emit, findUnit, unitsOf, other, rndInt, makeUnit, newInstance, drawCards, hasKw, MAX_HAND, LANES } from './state.js';
import { checkGameOver } from './rules.js';

export const playerRef = (p) => `player:${p}`;
export const isPlayerRef = (ref) => typeof ref === 'string' && ref.startsWith('player:');
export const refPlayer = (ref) => Number(ref.slice(7));

/** The chosen-target kind a card needs when played, or null. */
export function chosenTargetOf(def) {
  const ef = (def.effects || []).find((e) => e.trigger === 'onPlay' && e.target.startsWith('chosen'));
  return ef ? ef.target : null;
}

/** Valid refs for a chosen target, seen from player p. Hidden enemy units can't be chosen. */
export function targetCandidates(s, p, kind) {
  const enemy = unitsOf(s, other(p)).filter((x) => !x.unit.hidden).map((x) => x.unit.uid);
  const own = unitsOf(s, p).map((x) => x.unit.uid);
  switch (kind) {
    case 'chosenEnemyUnit':
      return enemy;
    case 'chosenFriendlyUnit':
      return own;
    case 'chosenAnyUnit':
      return [...enemy, ...own];
    case 'chosenEnemyAny':
      return [...enemy, playerRef(other(p))];
    default:
      return [];
  }
}

export function damagePlayer(ctx, p, amount) {
  if (amount <= 0) return 0;
  ctx.s.players[p].life -= amount;
  emit(ctx, 'damageDealt', { target: playerRef(p), amount });
  return amount;
}

export function healPlayer(ctx, p, amount) {
  if (amount <= 0) return 0;
  ctx.s.players[p].life += amount;
  emit(ctx, 'healed', { target: playerRef(p), amount });
  return amount;
}

/** Damages a unit; a bulwark (shield) absorbs the whole hit. Returns the damage actually dealt. */
export function damageUnit(ctx, uid, amount) {
  const found = findUnit(ctx.s, uid);
  if (!found || amount <= 0) return 0;
  const u = found.unit;
  if (u.shielded) {
    u.shielded = false;
    emit(ctx, 'shieldBroken', { uid });
    return 0;
  }
  u.damage += amount;
  emit(ctx, 'damageDealt', { target: uid, amount });
  if (u.damage < u.health) {
    runEffects(ctx, card(u.cardId), 'onDamaged', { owner: found.owner, uid, lane: found.lane });
  }
  return amount;
}

function removeUnit(s, found) {
  s.players[found.owner].lanes[found.lane] = null;
}

/** Removes dead units, then runs their death effects (and Resonance). Repeats until stable. */
export function processDeaths(ctx) {
  const s = ctx.s;
  for (let guard = 0; guard < 20; guard++) {
    const dead = [];
    for (const p of [0, 1]) {
      for (const x of unitsOf(s, p)) if (x.unit.damage >= x.unit.health) dead.push(x);
    }
    if (!dead.length) return;
    for (const x of dead) {
      removeUnit(s, x);
      if (!x.unit.token) s.players[x.owner].discard.push(x.unit.cardId);
      emit(ctx, 'unitDied', { uid: x.unit.uid, cardId: x.unit.cardId, player: x.owner, lane: x.lane });
    }
    for (const x of dead) {
      const def = card(x.unit.cardId);
      const source = { owner: x.owner, uid: null, lane: x.lane };
      runEffects(ctx, def, 'onDeath', source, null, false);
      if ((def.keywords || []).includes('kaiku')) {
        const kind = chosenTargetOf(def);
        let ref = null;
        if (kind) {
          const cands = targetCandidates(s, x.owner, kind);
          ref = cands.length ? cands[rndInt(s, cands.length)] : null;
        }
        runEffects(ctx, def, 'onPlay', source, ref, false);
      }
      if (checkGameOver(ctx)) return;
    }
  }
}

function resolveTargets(ctx, ef, source, chosenRef) {
  const s = ctx.s;
  const p = source.owner;
  const units = (list) => list.map((x) => ({ unit: x.unit.uid }));
  switch (ef.target) {
    case 'self':
      return [{ player: p }];
    case 'opponent':
      return [{ player: other(p) }];
    case 'thisUnit':
      return source.uid != null && findUnit(s, source.uid) ? [{ unit: source.uid }] : [];
    case 'chosenEnemyUnit':
    case 'chosenFriendlyUnit':
    case 'chosenAnyUnit':
    case 'chosenEnemyAny':
      if (chosenRef == null) return [];
      if (isPlayerRef(chosenRef)) return [{ player: refPlayer(chosenRef) }];
      return findUnit(s, chosenRef) ? [{ unit: chosenRef }] : [];
    case 'opposingUnit': {
      const u = source.lane != null ? s.players[other(p)].lanes[source.lane] : null;
      return u ? [{ unit: u.uid }] : [];
    }
    case 'adjacentFriendly':
      return units(unitsOf(s, p).filter((x) => source.lane != null && Math.abs(x.lane - source.lane) === 1));
    case 'allEnemyUnits':
      return units(unitsOf(s, other(p)));
    case 'allFriendlyUnits':
      return units(unitsOf(s, p));
    case 'allUnits':
      return units([...unitsOf(s, p), ...unitsOf(s, other(p))]);
    case 'randomEnemyUnit': {
      const list = unitsOf(s, other(p));
      return list.length ? [{ unit: list[rndInt(s, list.length)].unit.uid }] : [];
    }
    default:
      return [];
  }
}

function conditionMet(s, ef, source) {
  const c = ef.condition;
  if (!c) return true;
  const pl = s.players[source.owner];
  if (c.if === 'lifeBelow') return pl.life < c.value;
  if (c.if === 'controlsElement') return (pl.resources[c.value] || 0) > 0;
  if (c.if === 'laneEmpty') return source.lane != null && !s.players[other(source.owner)].lanes[source.lane];
  return true;
}

function returnToHand(ctx, found) {
  const s = ctx.s;
  removeUnit(s, found);
  emit(ctx, 'cardBounced', { uid: found.unit.uid, player: found.owner });
  if (found.unit.token) return;
  const pl = s.players[found.owner];
  if (pl.hand.length >= MAX_HAND) pl.discard.push(found.unit.cardId);
  else pl.hand.push(newInstance(s, found.unit.cardId));
}

function applyOp(ctx, ef, target, source) {
  const s = ctx.s;
  const amount = ef.amount ?? 0;
  if (target.player != null) {
    const p = target.player;
    switch (ef.op) {
      case 'damage':
        return damagePlayer(ctx, p, amount);
      case 'heal':
        return healPlayer(ctx, p, amount);
      case 'draw':
        return drawCards(ctx, p, amount);
      case 'discard': {
        const pl = s.players[p];
        for (let i = 0; i < amount && pl.hand.length; i++) {
          const [inst] = pl.hand.splice(rndInt(s, pl.hand.length), 1);
          pl.discard.push(inst.cardId);
          emit(ctx, 'cardDiscarded', { player: p, cardId: inst.cardId });
        }
        return;
      }
      case 'gainEnergy':
        s.players[p].energy += amount;
        emit(ctx, 'energyChanged', { player: p, amount });
        return;
      case 'summon': {
        const lane = s.players[p].lanes.findIndex((u) => !u);
        if (lane < 0) return;
        const u = makeUnit(s, p, ef.cardId);
        s.players[p].lanes[lane] = u;
        emit(ctx, 'unitSummoned', { player: p, uid: u.uid, lane, cardId: ef.cardId });
        return;
      }
      case 'reduceCost':
        for (const inst of s.players[p].hand) inst.costMod = (inst.costMod || 0) - amount;
        return;
      case 'copyToHand':
        if (ef.cardId && s.players[p].hand.length < MAX_HAND) s.players[p].hand.push(newInstance(s, ef.cardId));
        return;
      default:
        return;
    }
  }
  const found = findUnit(s, target.unit);
  if (!found) return;
  const u = found.unit;
  switch (ef.op) {
    case 'damage':
      return damageUnit(ctx, u.uid, amount);
    case 'heal':
      u.damage = Math.max(0, u.damage - amount);
      emit(ctx, 'healed', { target: u.uid, amount });
      return;
    case 'buff':
      u.power += amount.power || 0;
      u.health += amount.health || 0;
      emit(ctx, 'buffed', { uid: u.uid, power: amount.power || 0, health: amount.health || 0 });
      return;
    case 'debuff':
      u.power = Math.max(0, u.power - (amount.power || 0));
      u.health -= amount.health || 0;
      emit(ctx, 'buffed', { uid: u.uid, power: -(amount.power || 0), health: -(amount.health || 0) });
      return;
    case 'destroy':
      u.damage = Math.max(u.damage, u.health);
      return;
    case 'bounce':
      return returnToHand(ctx, found);
    case 'shield':
      u.shielded = true;
      emit(ctx, 'shielded', { uid: u.uid });
      return;
    case 'moveLane': {
      const lanes = s.players[found.owner].lanes;
      const free = [];
      for (let l = 0; l < LANES; l++) if (!lanes[l]) free.push(l);
      if (!free.length) return;
      const to = free[rndInt(s, free.length)];
      lanes[found.lane] = null;
      lanes[to] = u;
      emit(ctx, 'unitMoved', { uid: u.uid, from: found.lane, to });
      return;
    }
    case 'copyToHand': {
      const pl = s.players[source.owner];
      if (pl.hand.length < MAX_HAND) pl.hand.push(newInstance(s, u.cardId));
      return;
    }
    default:
      return;
  }
}

/**
 * Runs every effect of `def` with the given trigger. source = { owner, uid, lane }.
 * Deaths are processed after each effect unless the caller does it (resolveDeaths = false).
 */
export function runEffects(ctx, def, trigger, source, chosenRef = null, resolveDeaths = true) {
  if (!def) return;
  for (const ef of def.effects || []) {
    if (ef.trigger !== trigger) continue;
    if (ctx.s.phase === 'GAME_OVER') return;
    if (!conditionMet(ctx.s, ef, source)) continue;
    for (const target of resolveTargets(ctx, ef, source, chosenRef)) applyOp(ctx, ef, target, source);
    if (resolveDeaths) processDeaths(ctx);
    checkGameOver(ctx);
  }
}

export { hasKw };
