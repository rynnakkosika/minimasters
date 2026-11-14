// Validates the card set: node tools/validate-cards.mjs
import { readFileSync } from 'node:fs';
import { CARDS, validateCards, forbiddenHits, BOOSTER_RARITIES } from '../src/data/cards.js';
import { registerCards } from '../src/engine/db.js';

registerCards(CARDS);
const terms = readFileSync(new URL('./forbidden-terms.txt', import.meta.url), 'utf8').split(/\r?\n/);
const errors = validateCards(CARDS);
const hits = forbiddenHits(CARDS, terms);

const booster = CARDS.filter((c) => BOOSTER_RARITIES.includes(c.rarity));
const table = {};
for (const c of booster) {
  table[c.element] ??= { common: 0, uncommon: 0, rare: 0, mythic: 0, total: 0 };
  table[c.element][c.rarity]++;
  table[c.element].total++;
}
console.log(`Booster cards: ${booster.length} (release target ≥ 120)`);
console.table(table);

for (const e of errors) console.log(`ERROR  ${e}`);
for (const h of hits) console.log(`DENY   ${h}`);
console.log(errors.length || hits.length ? `\n${errors.length} errors, ${hits.length} deny-list hits` : '\nAll cards valid.');
process.exit(errors.length || hits.length ? 1 : 0);
