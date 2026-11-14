// One-off generator for the full release set (tasks T059–T061): adds 90 booster cards
// (30 per element) and one token to data/cards/set-core.json and their names to fi/en.
// Kept in tools/ as a record of the design; re-running it is a no-op for ids that exist.
import { readFileSync, writeFileSync } from 'node:fs';

// [id, fi name, en name, type, cost, rarity, power, health, keywords, effects]
// effects: [trigger, op, target, amount?, cardId?]
const U = 'unit';
const S = 'spell';
const c = 'common';
const u = 'uncommon';
const r = 'rare';
const m = 'mythic';

const CARDS = [
  // ---- Ahjo: fast, aggressive, direct damage ----
  ['ahjo-tulikarpanen', 'Tulikärpänen', 'Firefly', U, 1, c, 1, 1, ['kiire'], []],
  ['ahjo-kipinanheitto', 'Kipinänheitto', 'Spark Toss', S, 1, c, 0, 0, [], [['onPlay', 'damage', 'chosenEnemyAny', 1], ['onPlay', 'draw', 'self', 1]]],
  ['ahjo-palkeenpolkija', 'Palkeenpolkija', 'Bellows Treader', U, 2, c, 2, 3, [], []],
  ['ahjo-ahjonvahti', 'Ahjonvahti', 'Forge Watch', U, 2, c, 3, 2, [], []],
  ['ahjo-liekkitera', 'Liekkiterä', 'Flameblade', S, 1, c, 0, 0, [], [['onPlay', 'buff', 'chosenFriendlyUnit', { power: 2, health: 0 }]]],
  ['ahjo-tuhkasusi', 'Tuhkasusi', 'Ash Wolf', U, 3, c, 3, 2, ['kiire'], []],
  ['ahjo-laavakivi', 'Laavakivi', 'Lava Rock', S, 3, c, 0, 0, [], [['onPlay', 'damage', 'chosenEnemyUnit', 3]]],
  ['ahjo-pajamestari', 'Pajamestari', 'Smithmaster', U, 3, c, 2, 3, [], [['onPlay', 'buff', 'adjacentFriendly', { power: 1, health: 1 }]]],
  ['ahjo-kipinakehra', 'Kipinäkehrä', 'Spark Spinner', U, 2, c, 1, 2, [], [['onAttack', 'damage', 'randomEnemyUnit', 1]]],
  ['ahjo-hiiltaja', 'Hiiltäjä', 'Charrer', U, 4, c, 4, 3, ['lapaisy'], []],
  ['ahjo-roihuraakki', 'Roihuraakki', 'Blaze Brute', U, 4, c, 5, 2, ['kiire'], []],
  ['ahjo-kuumeinen-isku', 'Kuumeinen isku', 'Feverish Strike', S, 2, c, 0, 0, [], [['onPlay', 'damage', 'opponent', 3]]],
  ['ahjo-savuhaukka', 'Savuhaukka', 'Smoke Hawk', U, 3, c, 2, 2, ['kiire'], [['onPlay', 'damage', 'opponent', 1]]],
  ['ahjo-valimon-jatti', 'Valimon jätti', 'Foundry Giant', U, 5, c, 5, 5, ['lapaisy'], []],
  ['ahjo-kekalekaarti', 'Kekälekaarti', 'Ember Guard', U, 2, c, 2, 2, [], [['onDeath', 'damage', 'randomEnemyUnit', 1]]],
  ['ahjo-liekkiaalto', 'Liekkiaalto', 'Flame Wave', S, 3, u, 0, 0, [], [['onPlay', 'damage', 'allEnemyUnits', 1], ['onPlay', 'damage', 'opponent', 1]]],
  ['ahjo-sotarumpali', 'Sotarumpali', 'War Drummer', U, 3, u, 2, 2, [], [['onPlay', 'buff', 'allFriendlyUnits', { power: 1, health: 0 }]]],
  ['ahjo-kaartin-kapteeni', 'Kaartin kapteeni', 'Guard Captain', U, 4, u, 3, 4, ['kiire'], [['onAttack', 'buff', 'thisUnit', { power: 1, health: 0 }]]],
  ['ahjo-polttava-katse', 'Polttava katse', 'Searing Gaze', S, 2, u, 0, 0, [], [['onPlay', 'damage', 'chosenEnemyUnit', 4]]],
  ['ahjo-tulihenki', 'Tulihenki', 'Fire Spirit', U, 3, u, 3, 1, ['kaiku'], [['onPlay', 'damage', 'chosenEnemyAny', 1]]],
  ['ahjo-kipinasade', 'Kipinäsade', 'Spark Rain', S, 2, u, 0, 0, [], [['onPlay', 'damage', 'allUnits', 1]]],
  ['ahjo-laavapeikko', 'Laavapeikko', 'Lava Troll', U, 5, u, 5, 4, [], [['onDamaged', 'damage', 'opponent', 1]]],
  ['ahjo-liekinkantaja', 'Liekinkantaja', 'Flamebearer', U, 2, u, 2, 1, [], [['onDeath', 'damage', 'randomEnemyUnit', 2]]],
  ['ahjo-sepan-vasara', 'Sepän vasara', 'Smith’s Hammer', S, 3, u, 0, 0, [], [['onPlay', 'buff', 'chosenFriendlyUnit', { power: 3, health: 0 }], ['onPlay', 'draw', 'self', 1]]],
  ['ahjo-tuhkalintu', 'Tuhkalintu', 'Ash Bird', U, 4, r, 3, 3, ['kiire', 'kaiku'], [['onPlay', 'damage', 'opponent', 2]]],
  ['ahjo-purkaus', 'Purkaus', 'Eruption', S, 5, r, 0, 0, [], [['onPlay', 'damage', 'allEnemyUnits', 3], ['onPlay', 'damage', 'opponent', 2]]],
  ['ahjo-liekkiruhtinas', 'Liekkiruhtinas', 'Flame Prince', U, 5, r, 5, 4, ['lapaisy'], [['onAttack', 'damage', 'allEnemyUnits', 1]]],
  ['ahjo-pajan-golem', 'Pajan golem', 'Forge Golem', U, 6, r, 6, 6, ['kiire', 'lapaisy'], []],
  ['ahjo-kipinatar', 'Kipinätär', 'Spark Matron', U, 3, r, 2, 3, [], [['startOfTurn', 'damage', 'opponent', 1]]],
  ['ahjo-tulen-ruhtinatar', 'Tulen ruhtinatar', 'Empress of Fire', U, 7, m, 7, 6, ['kiire', 'lapaisy'], [['onPlay', 'damage', 'chosenEnemyAny', 3]]],

  // ---- Kallio: sturdy, defensive, growth and healing ----
  ['kallio-kivipaasi', 'Kivipaasi', 'Standing Stone', U, 1, c, 0, 3, ['vartija'], []],
  ['kallio-jakalatee', 'Jäkälätee', 'Lichen Tea', S, 2, c, 0, 0, [], [['onPlay', 'heal', 'self', 2], ['onPlay', 'draw', 'self', 1]]],
  ['kallio-karhunpentu', 'Karhunpentu', 'Bear Cub', U, 2, c, 2, 3, [], []],
  ['kallio-mantyvahti', 'Mäntyvahti', 'Pine Warden', U, 2, c, 1, 4, ['vartija'], []],
  ['kallio-kasvupyrahdys', 'Kasvupyrähdys', 'Growth Spurt', S, 1, c, 0, 0, [], [['onPlay', 'buff', 'chosenFriendlyUnit', { power: 1, health: 2 }]]],
  ['kallio-kallion-hirvi', 'Kallion hirvi', 'Crag Elk', U, 3, c, 3, 4, [], []],
  ['kallio-kivikuori', 'Kivikuori', 'Stone Shell', S, 1, c, 0, 0, [], [['onPlay', 'shield', 'chosenFriendlyUnit'], ['onPlay', 'heal', 'self', 1]]],
  ['kallio-sammalkarhu', 'Sammalkarhu', 'Moss Bear', U, 4, c, 3, 5, ['kasvu'], []],
  ['kallio-louhija', 'Louhija', 'Quarry Worker', U, 3, c, 2, 3, [], [['onPlay', 'draw', 'self', 1]]],
  ['kallio-juurikas', 'Juurikas', 'Rootling', U, 2, c, 1, 3, [], [['onDeath', 'heal', 'self', 3]]],
  ['kallio-paasikilpi', 'Paasikilpi', 'Slab Shield', U, 4, c, 2, 4, ['vartija', 'suoja'], []],
  ['kallio-kivilohkare', 'Kivilohkare', 'Boulder', S, 3, c, 0, 0, [], [['onPlay', 'damage', 'chosenEnemyUnit', 3]]],
  ['kallio-ikitammi', 'Ikitammi', 'Ancient Oak', U, 5, c, 3, 7, ['vartija', 'kasvu'], []],
  ['kallio-vuorivuohi', 'Vuorivuohi', 'Mountain Goat', U, 2, c, 2, 2, [], [['onPlay', 'heal', 'self', 2]]],
  ['kallio-kalliokotka', 'Kalliokotka', 'Crag Eagle', U, 4, c, 4, 4, [], []],
  ['kallio-juurten-verkko', 'Juurten verkko', 'Root Web', S, 3, u, 0, 0, [], [['onPlay', 'buff', 'allFriendlyUnits', { power: 0, health: 2 }], ['onPlay', 'heal', 'self', 2]]],
  ['kallio-kivimuuri', 'Kivimuuri', 'Stone Wall', U, 2, u, 0, 6, ['vartija'], []],
  ['kallio-metsanhenki', 'Metsänhenki', 'Forest Spirit', U, 3, u, 2, 3, [], [['startOfTurn', 'heal', 'adjacentFriendly', 2]]],
  ['kallio-vuorenpeikko', 'Vuorenpeikko', 'Mountain Troll', U, 5, u, 4, 6, ['suoja'], []],
  ['kallio-maan-syli', 'Maan syli', 'Earth’s Embrace', S, 2, u, 0, 0, [], [['onPlay', 'heal', 'self', 5]]],
  ['kallio-ruskokarhu', 'Ruskokarhu', 'Brown Bear', U, 4, u, 4, 5, [], [['onPlay', 'buff', 'adjacentFriendly', { power: 1, health: 1 }]]],
  ['kallio-kivisoturi', 'Kivisoturi', 'Stone Fighter', U, 3, u, 3, 3, ['suoja'], []],
  ['kallio-hedelmallinen-maa', 'Hedelmällinen maa', 'Fertile Ground', S, 1, u, 0, 0, [], [['onPlay', 'gainEnergy', 'self', 2]]],
  ['kallio-kalliolinnake', 'Kalliolinnake', 'Rock Fortress', U, 4, u, 1, 8, ['vartija'], []],
  ['kallio-ikihirvi', 'Ikihirvi', 'Elder Elk', U, 5, r, 5, 6, ['kasvu'], [['onPlay', 'heal', 'self', 3]]],
  ['kallio-kivikuningas', 'Kivikuningas', 'Stone King', U, 6, r, 5, 7, ['vartija', 'suoja'], []],
  ['kallio-maanjaristys', 'Maanjäristys', 'Earthquake', S, 5, r, 0, 0, [], [['onPlay', 'damage', 'allUnits', 3]]],
  ['kallio-elamanpuu', 'Elämänpuu', 'Tree of Life', U, 4, r, 0, 6, ['vartija'], [['startOfTurn', 'heal', 'self', 2]]],
  ['kallio-metsan-aiti', 'Metsän äiti', 'Forest Mother', U, 3, r, 2, 4, [], [['onPlay', 'summon', 'self', undefined, 'kallio-taimi']]],
  ['kallio-vuorten-henki', 'Vuorten henki', 'Spirit of the Mountains', U, 6, m, 6, 8, ['vartija', 'kasvu'], [['onPlay', 'buff', 'allFriendlyUnits', { power: 2, health: 2 }]]],
  ['kallio-taimi', 'Taimi', 'Sapling', U, 1, 'token', 1, 1, ['kasvu'], []],

  // ---- Usva: elusive, card draw, bounce and weakening ----
  ['usva-usvalepakko', 'Usvalepakko', 'Mist Bat', U, 1, c, 2, 1, ['piilo'], []],
  ['usva-ajatusvarkaus', 'Ajatusvarkaus', 'Thought Theft', S, 2, c, 0, 0, [], [['onPlay', 'discard', 'opponent', 1], ['onPlay', 'draw', 'self', 1]]],
  ['usva-kuiskaaja', 'Kuiskaaja', 'Whisperer', U, 2, c, 1, 2, [], [['onPlay', 'draw', 'self', 1]]],
  ['usva-varjokissa', 'Varjokissa', 'Shadow Cat', U, 2, c, 2, 2, ['piilo'], []],
  ['usva-sumuverho', 'Sumuverho', 'Mist Veil', S, 1, c, 0, 0, [], [['onPlay', 'bounce', 'chosenFriendlyUnit'], ['onPlay', 'draw', 'self', 1]]],
  ['usva-jaatava-tuuli', 'Jäätävä tuuli', 'Freezing Wind', S, 3, c, 0, 0, [], [['onPlay', 'debuff', 'allEnemyUnits', { power: 1, health: 1 }]]],
  ['usva-sumusoturi', 'Sumusoturi', 'Mist Warrior', U, 3, c, 3, 3, ['piilo'], []],
  ['usva-uninen-pollo', 'Uninen pöllö', 'Sleepy Owl', U, 3, c, 2, 3, [], [['onPlay', 'debuff', 'chosenEnemyUnit', { power: 2, health: 0 }]]],
  ['usva-kalvas-haamu', 'Kalvas haamu', 'Pale Ghost', U, 2, c, 2, 1, ['kaiku'], [['onPlay', 'damage', 'randomEnemyUnit', 1]]],
  ['usva-varjoisku', 'Varjoisku', 'Shadow Strike', S, 3, c, 0, 0, [], [['onPlay', 'damage', 'chosenEnemyUnit', 3]]],
  ['usva-sumuhirvio', 'Sumuhirviö', 'Mist Beast', U, 4, c, 4, 4, ['piilo'], []],
  ['usva-unohdettu', 'Unohdettu', 'The Forgotten', U, 3, c, 3, 2, [], [['onDeath', 'draw', 'self', 1]]],
  ['usva-tuulenhenki', 'Tuulenhenki', 'Wind Spirit', U, 4, c, 3, 3, [], [['onPlay', 'bounce', 'chosenEnemyUnit']]],
  ['usva-imija', 'Imijä', 'Leech', U, 3, c, 2, 3, ['imu'], []],
  ['usva-usvavalas', 'Usvavalas', 'Mist Whale', U, 5, c, 4, 6, ['piilo'], []],
  ['usva-ajatustenlukija', 'Ajatustenlukija', 'Mind Reader', U, 3, u, 2, 2, [], [['onPlay', 'discard', 'opponent', 1], ['onPlay', 'draw', 'self', 1]]],
  ['usva-yohaukka', 'Yöhaukka', 'Night Hawk', U, 2, u, 2, 2, ['piilo'], [['onAttack', 'draw', 'self', 1]]],
  ['usva-unettomuus', 'Unettomuus', 'Sleeplessness', S, 2, u, 0, 0, [], [['onPlay', 'debuff', 'chosenEnemyUnit', { power: 3, health: 0 }], ['onPlay', 'draw', 'self', 1]]],
  ['usva-varjojen-kutsu', 'Varjojen kutsu', 'Call of Shadows', S, 3, u, 0, 0, [], [['onPlay', 'summon', 'self', undefined, 'usva-varjo'], ['onPlay', 'summon', 'self', undefined, 'usva-varjo']]],
  ['usva-verenimija', 'Verenimijä', 'Bloodsucker', U, 4, u, 3, 4, ['imu', 'piilo'], []],
  ['usva-unikutoja', 'Unikutoja', 'Dream Spinner', U, 5, u, 3, 4, [], [['startOfTurn', 'draw', 'self', 1]]],
  ['usva-hamara-tuuli', 'Hämärä tuuli', 'Dusk Wind', S, 2, u, 0, 0, [], [['onPlay', 'bounce', 'chosenEnemyUnit']]],
  ['usva-kummitus', 'Kummitus', 'Haunt', U, 3, u, 2, 2, ['kaiku'], [['onPlay', 'discard', 'opponent', 1]]],
  ['usva-sumuvartija', 'Sumuvartija', 'Mist Sentinel', U, 3, u, 1, 5, ['vartija', 'piilo'], []],
  ['usva-unohduksen-virta', 'Unohduksen virta', 'River of Oblivion', S, 6, r, 0, 0, [], [['onPlay', 'bounce', 'allEnemyUnits']]],
  ['usva-sielujen-paimen', 'Sielujen paimen', 'Shepherd of Souls', U, 5, r, 3, 5, ['kaiku'], [['onPlay', 'draw', 'self', 2]]],
  ['usva-painajainen', 'Painajainen', 'Nightmare', U, 5, r, 5, 4, ['piilo'], [['onAttack', 'discard', 'opponent', 1]]],
  ['usva-varjomestari', 'Varjomestari', 'Shadow Master', U, 4, r, 3, 4, ['piilo'], [['onPlay', 'summon', 'self', undefined, 'usva-varjo']]],
  ['usva-jainen-sydan', 'Jäinen sydän', 'Frozen Heart', S, 4, r, 0, 0, [], [['onPlay', 'debuff', 'chosenEnemyUnit', { power: 4, health: 4 }]]],
  ['usva-unien-valtias', 'Unien valtias', 'Lord of Dreams', U, 7, m, 5, 7, ['piilo', 'imu'], [['onPlay', 'bounce', 'allEnemyUnits']]],
];

const setPath = new URL('../data/cards/set-core.json', import.meta.url);
const set = JSON.parse(readFileSync(setPath, 'utf8'));
const have = new Set(set.map((x) => x.id));
const dicts = { fi: new URL('../data/i18n/fi.json', import.meta.url), en: new URL('../data/i18n/en.json', import.meta.url) };
const fi = JSON.parse(readFileSync(dicts.fi, 'utf8'));
const en = JSON.parse(readFileSync(dicts.en, 'utf8'));

let added = 0;
for (const [id, nameFi, nameEn, type, cost, rarity, power, health, keywords, effects] of CARDS) {
  if (have.has(id)) continue;
  const card = { id, nameKey: `card.${id}`, type, element: id.split('-')[0], cost, rarity };
  if (type === 'unit') Object.assign(card, { power, health });
  card.keywords = keywords;
  card.effects = effects.map(([trigger, op, target, amount, cardId]) => ({
    trigger, op, ...(amount !== undefined ? { amount } : {}), target, ...(cardId ? { cardId } : {}),
  }));
  card.art = `art/${id}.webp`;
  set.push(card);
  fi[`card.${id}`] = nameFi;
  en[`card.${id}`] = nameEn;
  added++;
}

writeFileSync(setPath, JSON.stringify(set, null, 1).replace(/\n {2,}/g, ' ').replace(/\[\s+/g, '[').replace(/\s+\]/g, ']') + '\n');
writeFileSync(dicts.fi, JSON.stringify(fi, null, 2) + '\n');
writeFileSync(dicts.en, JSON.stringify(en, null, 2) + '\n');
console.log(`added ${added} cards, set now ${set.length}`);
