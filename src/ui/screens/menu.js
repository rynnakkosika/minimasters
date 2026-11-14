// Main menu.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { confirmDialog } from '../components/tooltip.js';

export function renderMenu(root, app) {
  const inProgress = app.run && !app.run.status.startsWith('COMPLETED');
  const startNew = async () => {
    if (inProgress && !(await confirmDialog(t('menu.confirmNew')))) return;
    app.startNewRun();
  };
  mount(root,
    h('section', { class: 'screen menu' },
      h('h1', { class: 'logo' }, h('span', { class: 'logo-glyphs' }, '▲■●'), t('app.title')),
      h('p', { class: 'tagline' }, t('menu.tagline')),
      h('div', { class: 'menu-buttons' },
        inProgress ? h('button', { class: 'primary', onclick: () => app.resume() }, t('menu.continue')) : null,
        h('button', { class: inProgress ? '' : 'primary', onclick: startNew }, t('menu.newRun')))));
}
