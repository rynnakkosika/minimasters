// Friend play protocol (specs/002-friend-play): codes, decks from the seed, host validation,
// sequence numbers, resync and a full match between two simulated devices.
import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { applyAction, legalActions } from '../src/engine/index.js';
import { chooseAction } from '../src/ai/index.js';
import { validateDeck } from '../src/run/deckbuilder.js';
import {
  PROTOCOL_VERSION, makeCode, normalizeCode, isValidCode, inviteLink, codeFromUrl, mixSeed, friendDecks,
  createFriendMatch, replay, sanitizeGuestAction, hostHandle, guestHandle, actMessage,
} from '../src/net/protocol.js';
import { createRng } from '../src/engine/rng.js';

const wire = (m) => JSON.parse(JSON.stringify(m)); // what a data channel delivers

/** A match past both mulligans. */
function started(seed) {
  let s = createFriendMatch(seed);
  s = applyAction(s, { type: 'mulligan', player: 0, keep: true }).state;
  return applyAction(s, { type: 'mulligan', player: 1, keep: true }).state;
}

test('net: codes are 6 characters without look-alikes and normalise', () => {
  const rng = createRng(5);
  for (let i = 0; i < 200; i++) {
    const c = makeCode(() => rng.next());
    assert(isValidCode(c), c);
    assert(!/[O0I1L]/.test(c), c);
  }
  assertEqual(normalizeCode(' ab-c d2 3x9 '), 'ABCD23');
  assertEqual(normalizeCode(null), '');
});

test('net: invite link carries the code and reads back', () => {
  const link = inviteLink('https://example.org/mm/index.html?x=1#menu', 'ABC234');
  assertEqual(link, 'https://example.org/mm/index.html?peli=ABC234');
  assertEqual(codeFromUrl(link), 'ABC234');
  assertEqual(codeFromUrl('https://example.org/?peli=abc234'), 'ABC234');
  assertEqual(codeFromUrl('https://example.org/'), '');
  assertEqual(codeFromUrl('https://example.org/?peli=OOO'), '');
  assertEqual(codeFromUrl('not a url'), '');
});

test('net: decks come from the seed, differ per player and are legal', () => {
  for (const seed of [1, 42, 123456789, 0xffffffff]) {
    const a = friendDecks(seed);
    const b = friendDecks(seed);
    assertEqual(a, b, 'same seed, same decks');
    assert(JSON.stringify(a[0].booster) !== JSON.stringify(a[1].booster), 'each player opens a different booster');
    for (const d of a) {
      assertEqual(d.booster.length, 10);
      assert(validateDeck(d.booster, d.built).ok, 'deck is legal');
      assert(d.deck.length >= 20, `deck size ${d.deck.length}`);
    }
  }
  assert(mixSeed(7, 0) !== mixSeed(7, 1));
});

test('net: same seed gives identical matches; the first player is fair', () => {
  assertEqual(createFriendMatch(99), createFriendMatch(99));
  let host = 0;
  for (let seed = 0; seed < 200; seed++) if (createFriendMatch(seed).firstPlayer === 0) host++;
  assert(host > 70 && host < 130, `host starts ${host}/200`);
});

test('net: host accepts a legal guest action and returns the engine copy', () => {
  let s = started(3);
  if (s.activePlayer === 0) s = applyAction(s, { type: 'endTurn', player: 0 }).state;
  const r = hostHandle(s, wire({ t: 'propose', action: { type: 'endTurn', player: 1, extra: 'x' } }), 3);
  assertEqual(r.action, { type: 'endTurn', player: 1 });
  assert(!('extra' in r.action), 'unknown fields dropped');
});

test('net: host rejects wrong player, illegal, out-of-turn and garbage messages', () => {
  let s = started(3);
  if (s.activePlayer === 1) s = applyAction(s, { type: 'endTurn', player: 1 }).state;
  const before = JSON.stringify(s);
  const bad = [
    { t: 'propose', action: { type: 'endTurn', player: 0 } }, // in the host's name
    { t: 'propose', action: { type: 'endTurn', player: 1 } }, // not the guest's turn
    { t: 'propose', action: { type: 'playUnit', player: 1, uid: 9999, lane: 0 } },
    { t: 'propose', action: { type: 'mulligan', player: 1, keep: false } }, // mulligan already done
    { t: 'propose', action: { type: 'hack', player: 1 } },
    { t: 'propose', action: null },
    { t: 'propose', action: [1, 2] },
    { t: 'propose' },
  ];
  for (const m of bad) assertEqual(hostHandle(s, wire(m), 3), { reply: { t: 'reject' } }, JSON.stringify(m));
  for (const m of [null, 'x', 42, {}, { t: 'whatever' }, { t: 'act', n: 0, action: { type: 'endTurn', player: 1 } }]) {
    assertEqual(hostHandle(s, m, 3), {}, `ignored ${JSON.stringify(m)}`);
  }
  assertEqual(JSON.stringify(s), before, 'state unchanged');
  assertEqual(sanitizeGuestAction(s, { type: 'concede', player: 1 }), { type: 'concede', player: 1 }, 'guest can always concede');
});

test('net: nothing passes after the game is over', () => {
  let s = started(3);
  s = applyAction(s, { type: 'concede', player: 0 }).state;
  assertEqual(sanitizeGuestAction(s, { type: 'concede', player: 1 }), null);
});

test('net: guest applies acts only in sequence and asks for a resync otherwise', () => {
  const s = createFriendMatch(11);
  const a = { type: 'mulligan', player: 0, keep: false };
  const after = applyAction(s, a).state;
  const msg = wire(actMessage(after, a));
  assertEqual(msg.n, 0);
  assertEqual(guestHandle(s, msg), { action: a });
  assertEqual(guestHandle(after, msg), { reply: { t: 'resync' } }, 'duplicate');
  assertEqual(guestHandle(s, { t: 'act', n: 0, action: { type: 'endTurn', player: 0 } }), { reply: { t: 'resync' } }, 'illegal for the guest state');
  assertEqual(guestHandle(s, { t: 'reject' }), { rejected: true });
  assertEqual(guestHandle(s, null), {});
});

test('net: resync rebuilds the host state from seed and log', () => {
  let h = createFriendMatch(21);
  for (const a of [{ type: 'mulligan', player: 1, keep: false }, { type: 'mulligan', player: 0, keep: true }]) h = applyAction(h, a).state;
  const r = hostHandle(h, { t: 'resync' }, 21);
  assertEqual(r.reply.t, 'sync');
  const g = guestHandle(createFriendMatch(21), wire(r.reply));
  assertEqual(g.rebuild, h);
  assertEqual(replay(21, h.log), h);
  assertEqual(guestHandle(createFriendMatch(21), { t: 'sync', seed: 21, log: [{ type: 'endTurn', player: 0 }] }), {}, 'bad history ignored');
  assertEqual(PROTOCOL_VERSION, 1);
});

/**
 * Two devices that only exchange JSON messages. Both players are driven by the AI; the guest's
 * choices travel as proposals and come back as acts, exactly like the UI does it. Messages are
 * delivered in random interleavings to exercise the simultaneous mulligan.
 */
function playOverWire(seed) {
  const rng = createRng(seed ^ 0xabc);
  let host = createFriendMatch(seed);
  let guest = createFriendMatch(seed);
  const toHost = [];
  const toGuest = [];
  let guestWaiting = false;
  let rejects = 0;
  const hostApply = (a) => {
    host = applyAction(host, a).state;
    toGuest.push(wire(actMessage(host, a)));
  };
  for (let step = 0; step < 5000 && host.phase !== 'GAME_OVER'; step++) {
    const choice = rng.next();
    if (choice < 0.3 && toHost.length) {
      const r = hostHandle(host, toHost.shift(), seed);
      if (r.action) hostApply(r.action);
      if (r.reply) toGuest.push(wire(r.reply));
    } else if (choice < 0.6 && toGuest.length) {
      const r = guestHandle(guest, toGuest.shift());
      if (r.action) {
        if (r.action.player === 1) guestWaiting = false;
        guest = applyAction(guest, r.action).state;
      }
      if (r.rejected) {
        rejects++;
        guestWaiting = false;
      }
      if (r.rebuild) guest = r.rebuild;
      if (r.reply) toHost.push(wire(r.reply));
    } else if (choice < 0.8) {
      // the host player acts on its own state
      const mine = legalActions(host, 0).filter((a) => a.type !== 'concede');
      if (mine.length) hostApply(chooseAction(host, 0, { style: 'aggro' }, (seed + step) >>> 0));
    } else if (!guestWaiting) {
      // the guest player decides on the guest's state and proposes
      const mine = legalActions(guest, 1).filter((a) => a.type !== 'concede');
      if (mine.length) {
        toHost.push(wire({ t: 'propose', action: chooseAction(guest, 1, { style: 'control' }, (seed * 7 + step) >>> 0) }));
        guestWaiting = true;
      }
    }
  }
  // deliver what is still in flight
  while (toGuest.length) {
    const r = guestHandle(guest, toGuest.shift());
    if (r.action) guest = applyAction(guest, r.action).state;
    if (r.rebuild) guest = r.rebuild;
  }
  return { host, guest, rejects };
}

test('net: full matches over the wire end identical on both devices', () => {
  for (const seed of [1, 2, 3, 77, 2024]) {
    const { host, guest } = playOverWire(seed);
    assertEqual(host.phase, 'GAME_OVER', `seed ${seed} finished`);
    assertEqual(JSON.stringify(guest), JSON.stringify(host), `seed ${seed}: identical states`);
    assertEqual(replay(seed, host.log), host, `seed ${seed}: replay matches`);
  }
});
