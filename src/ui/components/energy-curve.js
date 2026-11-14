// Energy curve (cards per cost) and element split of a deck (FR-009).
import { h } from '../dom.js';
import { card } from '../../engine/db.js';
import { t } from '../../data/i18n.js';
import { elementGlyph } from './card.js';

export function renderCurve(deck) {
  const buckets = Array(8).fill(0); // 0..6, 7+
  const elements = { ahjo: 0, kallio: 0, usva: 0 };
  for (const id of deck.cards) {
    const d = card(id);
    buckets[Math.min(7, d.cost)]++;
    if (d.element in elements) elements[d.element]++;
  }
  const max = Math.max(1, ...buckets);
  return h('div', { class: 'curve', 'aria-label': t('deck.curve') },
    h('div', { class: 'curve-bars' },
      buckets.map((n, cost) =>
        h('div', { class: 'curve-col' },
          h('span', { class: 'curve-n' }, n || ''),
          h('div', { class: 'curve-bar', style: { height: `${(n / max) * 100}%` } }),
          h('span', { class: 'curve-cost' }, cost === 7 ? '7+' : cost)))),
    h('div', { class: 'curve-elements' },
      Object.entries(elements).map(([e, n]) =>
        h('span', { class: `el-chip el-${e}` }, `${elementGlyph(e)} ${n} + ${deck.basics[e] || 0}`))));
}
