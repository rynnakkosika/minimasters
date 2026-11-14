import { test, assert, assertEqual, report } from './runner.js';
import './helpers.js';
import { allCards, card } from '../src/engine/db.js';
import { openBoosterCards, boosterProblems } from '../src/run/booster.js';

test('booster: 10 000 boosters follow the composition rules (FR-003, FR-004)', () => {
  const cards = allCards();
  let mythics = 0;
  for (let seed = 1; seed <= 10000; seed++) {
    const ids = openBoosterCards(seed, cards);
    assertEqual(ids.length, 10, `seed ${seed} size`);
    const r = ids.map((id) => card(id).rarity);
    assertEqual(r.slice(0, 6).every((x) => x === 'common'), true, `seed ${seed} commons`);
    assertEqual(r.slice(6, 9).every((x) => x === 'uncommon'), true, `seed ${seed} uncommons`);
    assert(r[9] === 'rare' || r[9] === 'mythic', `seed ${seed} rare slot`);
    if (r[9] === 'mythic') mythics++;
    assert(!r.includes('basic') && !r.includes('token'), `seed ${seed} no sources or tokens`);
    assertEqual(boosterProblems(ids), [], `seed ${seed}`);
  }
  report(`Booster: mythic in rare slot ${(mythics / 100).toFixed(1)} % (target 12.5 %)`);
  assert(mythics > 1000 && mythics < 1500);
});

test('booster: same seed gives the same booster, different seeds vary', () => {
  const cards = allCards();
  assertEqual(openBoosterCards(77, cards), openBoosterCards(77, cards));
  const distinct = new Set();
  for (let s = 1; s <= 50; s++) distinct.add(openBoosterCards(s, cards).join());
  assert(distinct.size >= 48);
});
