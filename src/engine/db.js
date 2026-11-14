// Card definition registry used by the engine. Filled once by src/data/cards.js (or by tests).
const DB = new Map();

export function registerCards(defs) {
  DB.clear();
  for (const d of defs) DB.set(d.id, d);
}

export function card(id) {
  return DB.get(id);
}

export function allCards() {
  return [...DB.values()];
}
