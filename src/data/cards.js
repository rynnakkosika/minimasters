// Loads and validates the card data (contracts/card-schema.md) and registers it with the engine.
import setCore from '../../data/cards/set-core.json' with { type: 'json' };
import keywords from '../../data/cards/keywords.json' with { type: 'json' };
import { registerCards } from '../engine/db.js';
import { DICTS, cardText, t } from './i18n.js';

export const TYPES = ['resource', 'unit', 'spell'];
export const ELEMENTS = ['ahjo', 'kallio', 'usva', 'neutral'];
export const RARITIES = ['basic', 'common', 'uncommon', 'rare', 'mythic', 'token'];
export const BOOSTER_RARITIES = ['common', 'uncommon', 'rare', 'mythic'];
export const TRIGGERS = ['onPlay', 'onDeath', 'onAttack', 'onDamaged', 'startOfTurn', 'endOfTurn'];
export const OPS = ['damage', 'heal', 'draw', 'discard', 'buff', 'debuff', 'destroy', 'bounce', 'summon',
  'gainEnergy', 'shield', 'moveLane', 'copyToHand', 'reduceCost'];
export const TARGETS = ['self', 'opponent', 'thisUnit', 'chosenEnemyUnit', 'chosenFriendlyUnit', 'chosenAnyUnit',
  'chosenEnemyAny', 'opposingUnit', 'adjacentFriendly', 'allEnemyUnits', 'allFriendlyUnits', 'allUnits', 'randomEnemyUnit'];
export const MAX_KEYWORDS = 8;
export const MAX_TEXT_CHARS = 90; // about three lines on the card face

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

/** Returns a list of human-readable errors; an empty list means the data is valid. */
export function validateCards(defs, kws = keywords, dicts = DICTS) {
  const errors = [];
  if (kws.length > MAX_KEYWORDS) errors.push(`keywords.json has ${kws.length} keywords (max ${MAX_KEYWORDS})`);
  const kwIds = new Set(kws.map((k) => k.id));
  for (const k of kws) {
    for (const [loc, d] of Object.entries(dicts)) {
      if (!(k.nameKey in d) || !(k.descKey in d)) errors.push(`keyword ${k.id}: missing ${loc} text`);
    }
  }
  const ids = new Set(defs.map((d) => d.id));
  const seen = new Set();
  for (const c of defs) {
    const e = (msg) => errors.push(`${c.id || '?'}: ${msg}`);
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) e('id must be kebab-case');
    if (seen.has(c.id)) e('duplicate id');
    seen.add(c.id);
    if (!TYPES.includes(c.type)) e(`bad type ${c.type}`);
    if (!ELEMENTS.includes(c.element)) e(`bad element ${c.element}`);
    if (!RARITIES.includes(c.rarity)) e(`bad rarity ${c.rarity}`);
    if (!isInt(c.cost, 0, 8)) e('cost must be an integer 0–8');
    if (c.type === 'resource' && c.cost !== 0) e('resources cost 0');
    if (c.type === 'unit') {
      if (!isInt(c.power, 0, 12) || !isInt(c.health, 1, 12)) e('unit needs power 0–12 and health 1–12');
    } else if (c.power !== undefined || c.health !== undefined) {
      e('only units have power/health');
    }
    for (const k of c.keywords || []) if (!kwIds.has(k)) e(`unknown keyword ${k}`);
    if (c.type !== 'unit' && (c.keywords || []).length) e('only units have keywords');
    const chosen = new Set();
    for (const ef of c.effects || []) {
      if (!TRIGGERS.includes(ef.trigger)) e(`bad trigger ${ef.trigger}`);
      if (!OPS.includes(ef.op)) e(`bad op ${ef.op}`);
      if (!TARGETS.includes(ef.target)) e(`bad target ${ef.target}`);
      if (c.type === 'spell' && ef.trigger !== 'onPlay') e('spells only have onPlay effects');
      if (ef.target && ef.target.startsWith('chosen')) {
        chosen.add(ef.target);
        if (ef.trigger !== 'onPlay') e('chosen targets only work with onPlay');
      }
      if (ef.op === 'summon' && !ids.has(ef.cardId)) e(`summon refers to unknown card ${ef.cardId}`);
    }
    if (chosen.size > 1) e('a card may have only one kind of chosen target');
    for (const [loc, d] of Object.entries(dicts)) {
      if (!(c.nameKey in d)) e(`missing ${loc} name ${c.nameKey}`);
      const text = cardText(c, loc);
      if (text.length > MAX_TEXT_CHARS) e(`${loc} text too long (${text.length} > ${MAX_TEXT_CHARS}): ${text}`);
    }
  }
  return errors;
}

/** Whole-word, case-insensitive check of names and texts against the originality deny list (R7). */
export function forbiddenHits(defs, terms, dicts = DICTS) {
  const hits = [];
  const clean = terms.map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  for (const c of defs) {
    for (const loc of Object.keys(dicts)) {
      const name = dicts[loc]?.[c.nameKey] ?? t(c.nameKey, {}, loc);
      const hay = `${name} ${cardText(c, loc)}`.toLowerCase();
      for (const term of clean) {
        const re = new RegExp(`(^|[^\\p{L}])${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u');
        if (re.test(hay)) hits.push(`${c.id} (${loc}): "${term}"`);
      }
    }
  }
  return hits;
}

export const CARDS = setCore;
export const KEYWORDS = keywords;

/** Registers the bundled set. Invalid cards are dropped and reported. */
export function loadCards() {
  registerCards(setCore); // register first so cardText() can resolve summon names
  const errors = validateCards(setCore);
  if (errors.length) {
    console.warn('Card data errors:', errors);
    const bad = new Set(errors.map((m) => m.split(':')[0]));
    registerCards(setCore.filter((c) => !bad.has(c.id)));
  }
  return errors;
}
