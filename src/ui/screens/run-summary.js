// End of a run (US2): wins, best card, boosters opened and the personal record.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { bestCard, RUN_LENGTH } from '../../run/index.js';
import { renderCard } from '../components/card.js';
import { renderProgress } from '../components/progress.js';
import { showCardDetail } from '../components/tooltip.js';

export function renderRunSummary(root, app) {
  const run = app.run;
  const won = run.status === 'COMPLETED_VICTORY';
  const best = bestCard(run);
  const rec = app.records;
  const isRecord = app.lastRunWasRecord;
  const stat = (label, value) => h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, label), h('span', { class: 'stat-value' }, value));
  mount(root,
    h('section', { class: `screen summary ${won ? 'victory' : 'defeat'}` },
      h('h1', { class: won ? 'win' : 'loss' }, won ? t('summary.victory') : t('summary.defeat')),
      renderProgress(run.wins, { lost: !won }),
      h('div', { class: 'stats' },
        stat(t('summary.wins'), `${run.wins} / ${RUN_LENGTH}`),
        stat(t('summary.boosters'), run.boosters.length),
        stat(t('summary.record'), `${rec.bestRunWins} / ${RUN_LENGTH}`)),
      isRecord ? h('p', { class: 'record-badge' }, t('summary.newRecord')) : null,
      h('h3', {}, t('summary.best')),
      best ? h('div', { class: 'best-card' }, renderCard(best, { size: 'mini', onclick: () => showCardDetail(best) })) : h('p', {}, t('summary.bestNone')),
      h('footer', { class: 'action-bar' },
        h('button', { onclick: () => app.go('menu') }, t('summary.menu')),
        h('button', { class: 'primary', onclick: () => app.startNewRun() }, t('summary.newRun')))));
}
