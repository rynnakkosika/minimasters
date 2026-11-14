// Overlay with a large card and plain-language keyword explanations (FR-020), plus generic dialogs.
import { h, mount, clear } from '../dom.js';
import { card } from '../../engine/db.js';
import { t } from '../../data/i18n.js';
import { renderCard } from './card.js';

const overlay = () => document.getElementById('overlay');

export function closeOverlay() {
  const el = overlay();
  el.hidden = true;
  clear(el);
}

export function showOverlay(content, { dismissable = true } = {}) {
  const el = overlay();
  mount(el, h('div', { class: 'dialog', onclick: (e) => e.stopPropagation() }, content));
  el.hidden = false;
  el.onclick = dismissable ? closeOverlay : null;
}

export function showCardDetail(cardId, unit = null) {
  const def = card(cardId);
  const notes = (def.keywords || []).map((k) =>
    h('p', { class: 'kw-note' }, h('b', {}, t(`kw.${k}`)), ' – ', t(`kw.${k}.desc`)));
  if (unit && unit.sick) notes.push(h('p', { class: 'kw-note' }, t('match.sick')));
  showOverlay([
    renderCard(cardId, { size: 'big', unit }),
    h('div', { class: 'kw-notes' }, notes),
    h('button', { class: 'primary', onclick: closeOverlay }, t('common.close')),
  ]);
}

/** Simple yes/no dialog. Resolves to true or false. */
export function confirmDialog(text) {
  return new Promise((resolve) => {
    const done = (v) => {
      closeOverlay();
      resolve(v);
    };
    showOverlay([
      h('p', { class: 'dialog-text' }, text),
      h('div', { class: 'row' },
        h('button', { onclick: () => done(false) }, t('common.no')),
        h('button', { class: 'primary', onclick: () => done(true) }, t('common.yes'))),
    ], { dismissable: false });
  });
}
