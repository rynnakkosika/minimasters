// Card face. Sizes: 'hand', 'board', 'big', 'mini' (booster grid and lists).
import { h } from '../dom.js';
import { card } from '../../engine/db.js';
import { t, cardText, cardName } from '../../data/i18n.js';

const GLYPH = { ahjo: '▲', kallio: '■', usva: '●', neutral: '◆' };

export function elementGlyph(element) {
  return GLYPH[element] || GLYPH.neutral;
}

/** Placeholder art until the illustrations exist: element gradient + a large glyph. */
function art(def) {
  return h('div', { class: `card-art el-${def.element}`, 'aria-hidden': 'true' }, h('span', {}, elementGlyph(def.element)));
}

/**
 * opts: { size, unit, cost, playable, selected, targetable, onclick, faceDown }
 * `unit` is a board unit (current power/health/damage/status); `cost` overrides the printed cost.
 */
export function renderCard(cardId, opts = {}) {
  const def = card(cardId);
  const size = opts.size || 'hand';
  const cls = ['card', `card-${size}`, `el-${def.element}`, `rarity-${def.rarity}`];
  if (opts.playable) cls.push('playable');
  if (opts.selected) cls.push('selected');
  if (opts.targetable) cls.push('targetable');
  if (opts.faceDown) {
    return h('button', { class: `${cls.join(' ')} face-down`, onclick: opts.onclick, 'aria-label': t('booster.tapToReveal') },
      h('span', { class: 'card-back' }, '✦'));
  }
  const u = opts.unit;
  if (u) {
    if (u.sick) cls.push('sick');
    if (u.shielded) cls.push('shielded');
    if (u.hidden) cls.push('hidden-unit');
  }
  const cost = opts.cost ?? def.cost;
  const text = size === 'board' ? (def.keywords || []).map((k) => t(`kw.${k}`)).join(', ') : cardText(def);
  const power = u ? u.power : def.power;
  const health = u ? u.health - u.damage : def.health;
  const hurt = u && u.damage > 0;
  const buffed = u && (u.power > def.power || u.health > def.health);

  return h(opts.onclick ? 'button' : 'div', { class: cls.join(' '), onclick: opts.onclick, dataset: u ? { uid: u.uid } : {} },
    def.type !== 'resource' && size !== 'board' ? h('span', { class: 'card-cost' }, cost) : null,
    h('span', { class: 'card-name' }, cardName(cardId)),
    size === 'board' ? null : art(def),
    size === 'mini' ? null : h('span', { class: 'card-type' }, `${t(`type.${def.type}`)} · ${t(`element.${def.element}`)}`),
    text && size !== 'mini' ? h('span', { class: 'card-text' }, text) : null,
    def.type === 'unit'
      ? h('span', { class: 'card-stats' },
          h('span', { class: `stat-power${buffed ? ' up' : ''}` }, power),
          h('span', { class: `stat-health${hurt ? ' hurt' : ''}${buffed ? ' up' : ''}` }, health))
      : null,
    u && u.shielded ? h('span', { class: 'badge badge-shield', title: t('kw.suoja') }, '⛨') : null,
    u && u.hidden ? h('span', { class: 'badge badge-hidden', title: t('match.hiddenUnit') }, '◌') : null,
  );
}
