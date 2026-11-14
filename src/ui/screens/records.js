// Records (US5, FR-023).
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { RUN_LENGTH } from '../../run/index.js';
import { collectionCards } from './collection.js';

export function renderRecords(root, app) {
  const r = app.profile.records;
  const seen = new Set(app.profile.collectionSeen);
  const total = collectionCards().length;
  const stat = (label, value) => h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-value' }, value));
  mount(root,
    h('section', { class: 'screen records' },
      h('header', { class: 'screen-head' }, h('h2', {}, t('records.title'))),
      h('div', { class: 'stats stats-2' },
        stat(t('records.bestRun'), `${r.bestRunWins} / ${RUN_LENGTH}`),
        stat(t('records.runsWon'), r.runsWon),
        stat(t('records.runsCompleted'), r.runsCompleted),
        stat(t('records.matches'), r.matchesPlayed),
        stat(t('records.collection'), `${collectionCards().filter((c) => seen.has(c.id)).length} / ${total}`)),
      h('footer', { class: 'action-bar sticky' },
        h('button', { class: 'primary', onclick: () => app.go('menu') }, t('common.back')))));
}
