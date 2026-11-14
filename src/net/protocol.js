// Friend play protocol (specs/002-friend-play/contracts/net-protocol.md). Pure: no network, no DOM.
// The engine is deterministic, so the devices share only the match seed and then the actions.
// The host (player 0) is the referee: it checks every guest action against legalActions and
// sends each applied action back with its sequence number; the guest applies actions only in
// that order, its own included, so simultaneous mulligans can never split the two states.
import { allCards } from '../engine/db.js';
import { createMatch, applyAction, legalActions, actionKey } from '../engine/index.js';
import { openBoosterCards } from '../run/booster.js';
import { deckFromPool, deckList } from '../run/deckbuilder.js';

export const PROTOCOL_VERSION = 1;
export const HOST = 0;
export const GUEST = 1;

// 6-character game codes without look-alike characters (no O/0, I/1, L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return s;
}

export function normalizeCode(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function isValidCode(code) {
  return code.length === 6 && [...code].every((c) => CODE_CHARS.includes(c));
}

/** Invite link: the game's own address with ?peli=CODE. */
export function inviteLink(base, code) {
  const u = new URL(base);
  u.search = '';
  u.hash = '';
  u.searchParams.set('peli', code);
  return u.toString();
}

/** The code in an invite link, or '' if there is none. */
export function codeFromUrl(url) {
  try {
    const code = normalizeCode(new URL(url).searchParams.get('peli'));
    return isValidCode(code) ? code : '';
  } catch {
    return '';
  }
}

/** A separate booster seed per player, derived from the match seed. */
export function mixSeed(seed, p) {
  let x = (seed ^ Math.imul(p + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * Both players' boosters and decks, by the run's own rule (every opened card plus sources).
 * Same seed → same decks on every device.
 */
export function friendDecks(seed) {
  return [HOST, GUEST].map((p) => {
    const booster = openBoosterCards(mixSeed(seed, p), allCards());
    const built = deckFromPool(booster);
    return { booster, built, deck: deckList(built) };
  });
}

export function createFriendMatch(seed) {
  const decks = friendDecks(seed >>> 0).map((d) => d.deck);
  return createMatch({ seed: seed >>> 0, decks, firstPlayer: (seed >>> 0) & 1 });
}

/** Rebuilds a match from its seed and action history. Throws if the history is not legal. */
export function replay(seed, log) {
  let s = createFriendMatch(seed);
  for (const a of log) s = applyAction(s, a).state;
  return s;
}

/**
 * The host's check of a guest action: only the guest's own, currently legal actions pass.
 * Returns the engine's own copy of the action (unknown fields dropped) or null.
 */
export function sanitizeGuestAction(state, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.player !== GUEST || typeof raw.type !== 'string') return null;
  let key;
  try {
    key = actionKey(raw);
  } catch {
    return null;
  }
  return legalActions(state, GUEST).find((a) => actionKey(a) === key) || null;
}

const isMsg = (m) => m && typeof m === 'object' && typeof m.t === 'string';

/**
 * Host side: one message from the guest.
 * Returns { action } to apply (and then broadcast as 'act'), { reply } to send, or {} to ignore.
 */
export function hostHandle(state, msg, seed) {
  if (!isMsg(msg)) return {};
  switch (msg.t) {
    case 'propose': {
      const action = sanitizeGuestAction(state, msg.action);
      return action ? { action } : { reply: { t: 'reject' } };
    }
    case 'resync':
      return { reply: { t: 'sync', seed, log: state.log } };
    default:
      return {};
  }
}

/** The message the host sends after applying any action: n = its index in the log. */
export function actMessage(stateAfter, action) {
  return { t: 'act', n: stateAfter.log.length - 1, action };
}

/**
 * Guest side: one message from the host, for the guest's current state.
 * Returns { action } to apply, { rebuild } (a whole new state), { rejected: true },
 * { reply } (ask for a resync) or {}.
 */
export function guestHandle(state, msg) {
  if (!isMsg(msg)) return {};
  switch (msg.t) {
    case 'act': {
      if (msg.n !== state.log.length || !msg.action || typeof msg.action !== 'object') return { reply: { t: 'resync' } };
      const key = actionKey(msg.action);
      const legal = legalActions(state, msg.action.player).find((a) => actionKey(a) === key);
      return legal ? { action: legal } : { reply: { t: 'resync' } };
    }
    case 'reject':
      return { rejected: true };
    case 'sync':
      try {
        return { rebuild: replay(msg.seed, Array.isArray(msg.log) ? msg.log : []) };
      } catch {
        return {};
      }
    default:
      return {};
  }
}
