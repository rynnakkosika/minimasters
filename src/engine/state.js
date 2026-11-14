// Match state creation and small shared helpers. The state is plain JSON (data-model.md → MatchState).
import { step } from './rng.js';
import { card } from './db.js';

export const LANES = 3;
export const START_LIFE = 20;
export const HAND_SIZE = 4;
export const MAX_HAND = 10;
export const TURN_LIMIT = 25; // per player (FR-016)

export const other = (p) => 1 - p;

/** Random float from the state's own generator; advances state.rng. */
export function rnd(s) {
  const r = step(s.rng);
  s.rng = r.next;
  return r.value;
}

export function rndInt(s, n) {
  return Math.floor(rnd(s) * n);
}

export function shuffleInPlace(s, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rndInt(s, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function emit(ctx, type, data = {}) {
  ctx.ev.push({ type, ...data });
}

export function newInstance(s, cardId) {
  return { uid: s.nextUid++, cardId, costMod: 0 };
}

function newPlayer() {
  return {
    life: START_LIFE,
    energy: 0,
    energyMax: 0,
    resources: { ahjo: 0, kallio: 0, usva: 0 },
    resourcePlayed: false,
    deck: [],
    hand: [],
    discard: [],
    sources: [],
    lanes: Array(LANES).fill(null),
    mulliganDone: false,
    turnsTaken: 0,
    fatigue: 0, // how many times this player has drawn from an empty deck
  };
}

/**
 * Creates a match in the MULLIGAN phase. decks: [cardId[], cardId[]].
 * Everything random comes from `seed`, so the same inputs always give the same match.
 */
export function createMatch({ seed, decks, firstPlayer = 0 }) {
  const s = {
    version: 1,
    rng: seed >>> 0,
    nextUid: 1,
    turn: 0,
    activePlayer: firstPlayer,
    firstPlayer,
    phase: 'MULLIGAN',
    players: [newPlayer(), newPlayer()],
    winner: null,
    endReason: null,
    log: [],
  };
  const ctx = { s, ev: [] };
  for (const p of [0, 1]) {
    s.players[p].deck = shuffleInPlace(s, decks[p].map((id) => newInstance(s, id)));
    drawCards(ctx, p, HAND_SIZE);
  }
  return s;
}

export function cloneState(s) {
  return structuredClone(s);
}

/** Draws n cards. Each draw from an empty deck deals growing damage: 1, 2, 3 … (fatigue). */
export function drawCards(ctx, p, n) {
  const pl = ctx.s.players[p];
  for (let i = 0; i < n; i++) {
    const inst = pl.deck.shift();
    if (!inst) {
      pl.fatigue++;
      pl.life -= pl.fatigue;
      emit(ctx, 'fatigue', { player: p, amount: pl.fatigue });
      emit(ctx, 'damageDealt', { target: `player:${p}`, amount: pl.fatigue });
      continue;
    }
    if (pl.hand.length >= MAX_HAND) {
      pl.discard.push(inst.cardId);
      emit(ctx, 'cardBurned', { player: p, cardId: inst.cardId });
    } else {
      pl.hand.push(inst);
      emit(ctx, 'cardDrawn', { player: p, uid: inst.uid });
    }
  }
}

export function makeUnit(s, owner, cardId, uid = s.nextUid++) {
  const def = card(cardId);
  const kw = def.keywords || [];
  return {
    uid,
    cardId,
    owner,
    power: def.power,
    health: def.health,
    damage: 0,
    sick: !kw.includes('kiire'),
    shielded: kw.includes('suoja'),
    hidden: kw.includes('piilo'),
    token: def.rarity === 'token',
    guardUsed: false,
  };
}

export function findUnit(s, uid) {
  for (const owner of [0, 1]) {
    const lane = s.players[owner].lanes.findIndex((u) => u && u.uid === uid);
    if (lane >= 0) return { unit: s.players[owner].lanes[lane], owner, lane };
  }
  return null;
}

export function unitsOf(s, p) {
  const out = [];
  s.players[p].lanes.forEach((u, lane) => {
    if (u) out.push({ unit: u, owner: p, lane });
  });
  return out;
}

export function hasKw(unit, kw) {
  const def = card(unit.cardId);
  return !!def && (def.keywords || []).includes(kw);
}
