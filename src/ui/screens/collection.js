// Collection (US5): every booster card; ones you have opened are shown, the rest as silhouettes.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { allCards } from '../../engine/db.js';
import { BOOSTER_RARITIES } from '../../data/cards.js';
import { renderCard, elementGlyph } from '../components/card.js';
import { showCardDetail } from '../components/tooltip.js';

const FILTERS = ['all', 'ahjo', 'kallio', 'usva'];
const ORDER = { ahjo: 0, kallio: 1, usva: 2, neutral: 3 };

export function collectionCards() {
  return allCards()
    .filter((c) => BOOSTER_RARITIES.includes(c.rarity))
    .sort((a, b) => ORDER[a.element] - ORDER[b.element] || a.cost - b.cost || a.id.localeCompare(b.id));
}

export function renderCollection(root, app) {
  let filter = 'all';
  const seen = new Set(app.profile.collectionSeen);

  function draw() {
    const all = collectionCards();
    const shown = all.filter((c) => filter === 'all' || c.element === filter);
    const seenCount = all.filter((c) => seen.has(c.id)).length;
    mount(root,
      h('section', { class: 'screen collection' },
        h('header', { class: 'screen-head' },
          h('h2', {}, t('collection.title')),
          h('span', { class: 'hint' }, t('collection.count', { seen: seenCount, total: all.length }))),
        h('div', { class: 'filters', role: 'tablist' },
          FILTERS.map((f) => h('button', {
            class: `filter${f === filter ? ' active' : ''}${f === 'all' ? '' : ` el-${f}`}`,
            role: 'tab',
            'aria-selected': f === filter ? 'true' : 'false',
            onclick: () => { filter = f; draw(); },
          }, f === 'all' ? t('collection.all') : `${elementGlyph(f)} ${t(`element.${f}`)}`))),
        h('div', { class: 'booster-grid' },
          shown.map((c) => seen.has(c.id)
            ? renderCard(c.id, { size: 'mini', onclick: () => showCardDetail(c.id) })
            : h('div', { class: `card card-mini silhouette el-${c.element}`, 'aria-label': t('collection.unknown') },
                h('span', { class: 'card-cost' }, c.cost), h('span', { class: 'silhouette-mark' }, '?')))),
        h('footer', { class: 'action-bar sticky' },
          h('button', { class: 'primary', onclick: () => app.go('menu') }, t('common.back')))));
  }
  draw();
}
