import { test, assert, assertEqual } from './runner.js';
import { blankMatch, giveCard, placeUnit, act } from './helpers.js';
import { legalActions, playerRef } from '../src/engine/index.js';

test('effects: damage to a chosen enemy player', () => {
  let s = blankMatch();
  const c = giveCard(s, 0, 'ahjo-kekale');
  s = act(s, { type: 'playSpell', player: 0, uid: c, targets: [playerRef(1)] });
  assertEqual(s.players[1].life, 18);
  assertEqual(s.players[0].discard, ['ahjo-kekale']);
});

test('effects: damage to all enemy units', () => {
  let s = blankMatch();
  placeUnit(s, 1, 0, 'ahjo-kipinasoturi');
  placeUnit(s, 1, 1, 'kallio-vuorenvartija');
  placeUnit(s, 0, 0, 'ahjo-kipinasoturi');
  const c = giveCard(s, 0, 'ahjo-tulimyrsky');
  s = act(s, { type: 'playSpell', player: 0, uid: c });
  assertEqual(s.players[1].lanes[0], null);
  assertEqual(s.players[1].lanes[1].damage, 2);
  assert(s.players[0].lanes[0], 'own unit untouched');
});

test('effects: heal self and gain energy', () => {
  let s = blankMatch({ energy: 1 });
  s.players[0].life = 10;
  const c = giveCard(s, 0, 'kallio-lahdevesi');
  s = act(s, { type: 'playSpell', player: 0, uid: c });
  assertEqual(s.players[0].life, 13);
  assertEqual(s.players[0].energy, 1);
});

test('effects: draw and discard', () => {
  let s = blankMatch();
  const thief = giveCard(s, 0, 'usva-varjovaras');
  giveCard(s, 1, 'ahjo-kekale');
  giveCard(s, 1, 'ahjo-kekale');
  s = act(s, { type: 'playUnit', player: 0, uid: thief, lane: 0 });
  assertEqual(s.players[1].hand.length, 1);
  const seer = giveCard(s, 0, 'usva-unennakija');
  const hand = s.players[0].hand.length;
  s = act(s, { type: 'playUnit', player: 0, uid: seer, lane: 1 });
  assertEqual(s.players[0].hand.length, hand); // -1 played, +1 drawn
});

test('effects: buff + shield on a chosen friendly unit', () => {
  let s = blankMatch();
  const u = placeUnit(s, 0, 0, 'ahjo-kipinasoturi');
  const c = giveCard(s, 0, 'kallio-juurten-voima');
  s = act(s, { type: 'playSpell', player: 0, uid: c, targets: [u.uid] });
  const after = s.players[0].lanes[0];
  assertEqual([after.power, after.health, after.shielded], [3, 2, true]);
});

test('effects: debuff can kill', () => {
  let s = blankMatch();
  const u = placeUnit(s, 1, 0, 'ahjo-laavanlyoja');
  const c = giveCard(s, 0, 'usva-kylma-kosketus');
  s = act(s, { type: 'playSpell', player: 0, uid: c, targets: [u.uid] });
  assertEqual(s.players[1].lanes[0].power, 1);
  const c2 = giveCard(s, 0, 'usva-kylma-kosketus');
  s = act(s, { type: 'playSpell', player: 0, uid: c2, targets: [u.uid] });
  assertEqual(s.players[1].lanes[0], null);
});

test('effects: destroy and bounce', () => {
  let s = blankMatch();
  const a = placeUnit(s, 1, 0, 'kallio-graniittijatti');
  const b = placeUnit(s, 1, 1, 'kallio-kivikilpi');
  s = act(s, { type: 'playSpell', player: 0, uid: giveCard(s, 0, 'usva-unohdus'), targets: [a.uid] });
  assertEqual(s.players[1].lanes[0], null);
  const hand1 = s.players[1].hand.length;
  s = act(s, { type: 'playSpell', player: 0, uid: giveCard(s, 0, 'usva-sumuhuntu'), targets: [b.uid] });
  assertEqual(s.players[1].lanes[1], null);
  assertEqual(s.players[1].hand.length, hand1 + 1);
});

test('effects: on-death summon of a token', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'usva-peilikuva'); // 2/1
  placeUnit(s, 1, 0, 'ahjo-kipinasoturi'); // 2/1
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  const token = s.players[0].lanes.find((u) => u);
  assertEqual(token.cardId, 'usva-varjo');
  assertEqual(s.players[0].discard, ['usva-peilikuva'], 'tokens are not discarded, the original is');
});

test('effects: on-death damage to the opponent', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'ahjo-sulattaja');
  placeUnit(s, 1, 0, 'kallio-graniittijatti');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[1].life, 18);
});

test('effects: chosen-target card cannot be played without a target', () => {
  const s = blankMatch();
  giveCard(s, 0, 'usva-unohdus');
  assert(!legalActions(s, 0).some((a) => a.type === 'playSpell'));
});

test('keywords: Swift attacks at once, Overrun hits through', () => {
  let s = blankMatch();
  placeUnit(s, 1, 0, 'ahjo-kipinasoturi'); // 2/1
  const c = giveCard(s, 0, 'ahjo-hehkulisko'); // 5/4 Swift Overrun
  s = act(s, { type: 'playUnit', player: 0, uid: c, lane: 0 });
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[1].life, 16);
  assertEqual(s.players[1].lanes[0], null);
});

test('keywords: Sentinel guards an adjacent empty lane once', () => {
  let s = blankMatch();
  placeUnit(s, 1, 1, 'kallio-kivikilpi'); // 1/3 Sentinel
  placeUnit(s, 0, 0, 'ahjo-kipinasoturi');
  placeUnit(s, 0, 2, 'ahjo-kipinasoturi');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0, 2] });
  assertEqual(s.players[1].life, 18, 'second attacker gets through');
  assertEqual(s.players[1].lanes[1].damage, 2);
});

test('keywords: Bulwark blocks the first hit', () => {
  let s = blankMatch();
  placeUnit(s, 1, 0, 'kallio-kristallikilpikonna');
  placeUnit(s, 0, 0, 'ahjo-laavanlyoja');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  const t = s.players[1].lanes[0];
  assertEqual([t.damage, t.shielded], [0, false]);
  assertEqual(s.players[1].life, 20, 'no overrun through a bulwark');
});

test('keywords: Growth grows at the start of the owner turn', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'kallio-sammalpeikko');
  s = act(s, { type: 'endTurn', player: 0 });
  s = act(s, { type: 'endTurn', player: 1 });
  const u = s.players[0].lanes[0];
  assertEqual([u.power, u.health], [2, 3]);
});

test('keywords: Drain heals by combat damage', () => {
  let s = blankMatch();
  s.players[0].life = 10;
  placeUnit(s, 0, 0, 'usva-sumun-kuningatar'); // 4/6 Veiled Drain
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[0].life, 14);
  assertEqual(s.players[1].life, 16);
});

test('keywords: Veiled cannot be targeted until it attacks', () => {
  let s = blankMatch();
  const fox = placeUnit(s, 1, 0, 'usva-sumukettu');
  giveCard(s, 0, 'usva-unohdus');
  assert(!legalActions(s, 0).some((a) => a.type === 'playSpell'), 'hidden');
  fox.hidden = false;
  assert(legalActions(s, 0).some((a) => a.type === 'playSpell' && a.targets[0] === fox.uid), 'revealed');
});

test('keywords: Resonance repeats the on-play effect on death', () => {
  let s = blankMatch();
  placeUnit(s, 1, 1, 'kallio-kivikilpi');
  placeUnit(s, 1, 2, 'kallio-kivikilpi');
  const ship = placeUnit(s, 0, 0, 'usva-aavelaiva');
  const before = s.players[1].hand.length;
  ship.damage = 3;
  placeUnit(s, 1, 0, 'ahjo-kipinasoturi'); // 2 damage kills the ship
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[1].lanes.filter((u) => u).length, 1, 'one of the two Stoneshields bounced');
  assertEqual(s.players[1].hand.length, before + 2, 'bounced card + the draw of the next turn');
});

test('effects: on-attack effect fires', () => {
  let s = blankMatch();
  placeUnit(s, 0, 0, 'ahjo-raivotar');
  s = act(s, { type: 'declareAttackers', player: 0, lanes: [0] });
  assertEqual(s.players[1].life, 15);
});
