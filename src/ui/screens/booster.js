// Booster opening: cards are revealed one tap at a time, or all at once (FR-002).
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { renderCard } from '../components/card.js';
import { showCardDetail } from '../components/tooltip.js';

export function renderBooster(root, app) {
  const run = app.run;
  const booster = run.boosters[run.boosters.length - 1];
  const revealed = new Set();

  function draw() {
    const all = revealed.size === booster.cards.length;
    mount(root,
      h('section', { class: 'screen booster' },
        h('header', { class: 'screen-head' },
          h('h2', {}, t('booster.title'), run.wins ? ` ${run.boosters.length}` : ''),
          h('p', { class: 'hint' }, all ? '' : t('booster.tapToReveal'))),
        h('div', { class: 'booster-grid' },
          booster.cards.map((id, i) =>
            revealed.has(i)
              ? renderCard(id, { size: 'mini', onclick: () => showCardDetail(id) })
              : renderCard(id, { size: 'mini', faceDown: true, onclick: () => { revealed.add(i); draw(); } }))),
        h('footer', { class: 'action-bar' },
          all ? null : h('button', { onclick: () => { booster.cards.forEach((_, i) => revealed.add(i)); draw(); } }, t('booster.revealAll')),
          h('button', { class: 'primary', disabled: !all, onclick: () => app.go('deck') }, t('booster.toDeck')))));
  }
  draw();
}
