// Action validation and application (contracts/engine-actions.md).
import { card } from './db.js';
import { emit, cloneState, shuffleInPlace, drawCards, makeUnit, other, HAND_SIZE, LANES } from './state.js';
import { chosenTargetOf, targetCandidates, runEffects } from './effects.js';
import { resolveCombat } from './combat.js';
import { startTurn, endTurn } from './turn.js';
import { checkGameOver, endGame, canPay, effectiveCost } from './rules.js';

export class IllegalActionError extends Error {}

export function actionKey(a) {
  return JSON.stringify([a.type, a.player, a.uid ?? null, a.lane ?? null, a.targets ?? null, a.lanes ?? null, a.keep ?? null]);
}

/** Lanes whose unit may attack this turn. */
export function attackableLanes(s, p) {
  const out = [];
  s.players[p].lanes.forEach((u, lane) => {
    if (u && !u.sick && u.power > 0) out.push(lane);
  });
  return out;
}

function subsets(items) {
  const out = [];
  for (let mask = 1; mask < 1 << items.length; mask++) out.push(items.filter((_, i) => mask & (1 << i)));
  return out;
}

/** Why a card in hand can't be played right now, or null if it can (used by the UI for hints). */
export function playBlocker(s, p, inst) {
  const pl = s.players[p];
  const def = card(inst.cardId);
  if (s.phase !== 'MAIN' || s.activePlayer !== p) return 'notYourTurn';
  if (def.type === 'resource') return pl.resourcePlayed ? 'resourceDone' : null;
  if (def.element !== 'neutral' && !(pl.resources[def.element] > 0)) return 'needsElement';
  if (effectiveCost(inst) > pl.energy) return 'needsEnergy';
  if (def.type === 'unit' && !pl.lanes.some((u) => !u)) return 'noLane';
  const kind = chosenTargetOf(def);
  if (kind && !targetCandidates(s, p, kind).length) return 'noTarget';
  return null;
}

export function legalActions(s, p) {
  if (s.phase === 'GAME_OVER') return [];
  const concede = { type: 'concede', player: p };
  const pl = s.players[p];
  if (s.phase === 'MULLIGAN') {
    if (pl.mulliganDone) return [concede];
    return [{ type: 'mulligan', player: p, keep: true }, { type: 'mulligan', player: p, keep: false }, concede];
  }
  if (s.activePlayer !== p || s.phase !== 'MAIN') return [concede];

  const out = [];
  for (const inst of pl.hand) {
    const def = card(inst.cardId);
    if (def.type === 'resource') {
      if (!pl.resourcePlayed) out.push({ type: 'playResource', player: p, uid: inst.uid });
      continue;
    }
    if (!canPay(pl, inst)) continue;
    const kind = chosenTargetOf(def);
    const targetSets = kind ? targetCandidates(s, p, kind).map((t) => [t]) : [undefined];
    if (def.type === 'unit') {
      for (let lane = 0; lane < LANES; lane++) {
        if (pl.lanes[lane]) continue;
        for (const targets of targetSets) out.push({ type: 'playUnit', player: p, uid: inst.uid, lane, ...(targets ? { targets } : {}) });
      }
    } else {
      for (const targets of targetSets) out.push({ type: 'playSpell', player: p, uid: inst.uid, ...(targets ? { targets } : {}) });
    }
  }
  for (const lanes of subsets(attackableLanes(s, p))) out.push({ type: 'declareAttackers', player: p, lanes });
  out.push({ type: 'endTurn', player: p });
  out.push(concede);
  return out;
}

function takeFromHand(pl, uid) {
  const i = pl.hand.findIndex((c) => c.uid === uid);
  return pl.hand.splice(i, 1)[0];
}

/** Applies a legal action to a copy of the state. Returns { state, events }; the input is untouched. */
export function applyAction(state, action) {
  const key = actionKey(action);
  if (!legalActions(state, action.player).some((a) => actionKey(a) === key)) {
    throw new IllegalActionError(`illegal action ${key}`);
  }
  const s = cloneState(state);
  const ctx = { s, ev: [] };
  const p = action.player;
  const pl = s.players[p];
  s.log.push(action);

  switch (action.type) {
    case 'mulligan': {
      if (!action.keep) {
        pl.deck.push(...pl.hand);
        pl.hand = [];
        shuffleInPlace(s, pl.deck);
        drawCards(ctx, p, HAND_SIZE);
        emit(ctx, 'mulligan', { player: p });
      }
      pl.mulliganDone = true;
      if (s.players.every((x) => x.mulliganDone)) startTurn(ctx, s.firstPlayer);
      break;
    }
    case 'playResource': {
      const inst = takeFromHand(pl, action.uid);
      const def = card(inst.cardId);
      pl.energyMax++;
      pl.energy++;
      pl.resources[def.element] = (pl.resources[def.element] || 0) + 1;
      pl.sources.push(inst.cardId);
      pl.resourcePlayed = true;
      emit(ctx, 'resourcePlayed', { player: p, uid: inst.uid, cardId: inst.cardId });
      break;
    }
    case 'playUnit': {
      const inst = takeFromHand(pl, action.uid);
      pl.energy -= effectiveCost(inst);
      const unit = makeUnit(s, p, inst.cardId, inst.uid);
      pl.lanes[action.lane] = unit;
      emit(ctx, 'cardPlayed', { player: p, uid: inst.uid, cardId: inst.cardId });
      emit(ctx, 'unitSummoned', { player: p, uid: unit.uid, lane: action.lane, cardId: inst.cardId });
      runEffects(ctx, card(inst.cardId), 'onPlay', { owner: p, uid: unit.uid, lane: action.lane }, action.targets?.[0] ?? null);
      break;
    }
    case 'playSpell': {
      const inst = takeFromHand(pl, action.uid);
      pl.energy -= effectiveCost(inst);
      pl.discard.push(inst.cardId);
      emit(ctx, 'cardPlayed', { player: p, uid: inst.uid, cardId: inst.cardId });
      runEffects(ctx, card(inst.cardId), 'onPlay', { owner: p, uid: null, lane: null }, action.targets?.[0] ?? null);
      break;
    }
    case 'declareAttackers':
      resolveCombat(ctx, p, action.lanes);
      if (s.phase !== 'GAME_OVER') endTurn(ctx);
      break;
    case 'endTurn':
      endTurn(ctx);
      break;
    case 'concede':
      endGame(ctx, other(p), 'concede');
      break;
    default:
      throw new IllegalActionError(`unknown action ${action.type}`);
  }
  checkGameOver(ctx);
  return { state: s, events: ctx.ev };
}
