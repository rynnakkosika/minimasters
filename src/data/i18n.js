// Localisation: Finnish and English; every other device language falls back to English (FR-027).
import fi from '../../data/i18n/fi.json' with { type: 'json' };
import en from '../../data/i18n/en.json' with { type: 'json' };
import { card as cardDef } from '../engine/db.js';

export const DICTS = { fi, en };
let locale = 'en';

export function pickLocale(lang) {
  return String(lang || '').toLowerCase().startsWith('fi') ? 'fi' : 'en';
}

export function setLocale(lang) {
  locale = DICTS[lang] ? lang : pickLocale(lang);
  return locale;
}

export function getLocale() {
  return locale;
}

export function t(key, params = {}, loc = locale) {
  const dict = DICTS[loc] || en;
  let s = dict[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function has(key, loc = locale) {
  return key in (DICTS[loc] || en);
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Rules text for one effect, e.g. "Pelattaessa: 1 vahinkoa: valittu vihollinen". */
export function effectText(effect, isSpell, loc = locale) {
  const specific = `effect.${effect.op}.${effect.target}`;
  let key = has(specific, loc) ? specific : `effect.${effect.op}`;
  const amount = effect.amount ?? 0;
  if (typeof amount === 'number' && amount > 1 && has(`${key}.plural`, loc)) key = `${key}.plural`;
  const params = {
    amount: typeof amount === 'object' ? '' : amount,
    power: typeof amount === 'object' ? amount.power ?? 0 : 0,
    health: typeof amount === 'object' ? amount.health ?? 0 : 0,
    target: t(`target.${effect.target}`, {}, loc),
    card: effect.cardId ? cardName(effect.cardId, loc) : '',
  };
  const body = t(key, params, loc);
  if (isSpell && effect.trigger === 'onPlay') return capitalize(body);
  return `${t(`trigger.${effect.trigger}`, {}, loc)}: ${body}`;
}

export function cardName(id, loc = locale) {
  const def = cardDef(id);
  return t(def ? def.nameKey : `card.${id}`, {}, loc);
}

/** Generated rules text: keywords first, then effects. Same source as the engine, so text = behaviour. */
export function cardText(def, loc = locale) {
  const parts = [];
  if (def.keywords && def.keywords.length) {
    parts.push(def.keywords.map((k) => t(`kw.${k}`, {}, loc)).join(', '));
  }
  for (const e of def.effects || []) parts.push(effectText(e, def.type === 'spell', loc));
  return parts.join('. ') + (parts.length ? '.' : '');
}
