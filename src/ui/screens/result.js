// After a won match (run continues): progress and the next opponent, then the next booster.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { opponentAt, RUN_LENGTH } from '../../run/index.js';
import { renderProgress } from '../components/progress.js';

export function renderResult(root, app) {
  const run = app.run;
  const next = opponentAt(run.opponentIndex);
  mount(root,
    h('section', { class: 'screen result' },
      h('h1', { class: 'win' }, t('result.win')),
      renderProgress(run.wins),
      h('p', { class: 'big-number' }, t('result.progress', { wins: run.wins, total: RUN_LENGTH })),
      h('p', { class: 'hint' }, t('result.nextOpponent', { name: t(next.nameKey) })),
      h('footer', { class: 'action-bar' },
        h('button', { class: 'primary', onclick: () => app.openNextBooster() }, t('result.next')))));
}
