// Main menu. On the very first launch it offers the tutorial (FR-019, T050).
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { confirmDialog, showOverlay, closeOverlay } from '../components/tooltip.js';

function offerTutorial(app) {
  const answer = (start) => {
    closeOverlay();
    app.profile.tutorialDone = true; // offered once; the menu button stays for later
    app.saveSettings();
    if (start) app.go('tutorial');
  };
  showOverlay([
    h('h2', {}, t('menu.tutorial')),
    h('p', { class: 'dialog-text' }, t('menu.tutorialOffer')),
    h('div', { class: 'row' },
      h('button', { onclick: () => answer(false) }, t('menu.tutorialSkip')),
      h('button', { class: 'primary', onclick: () => answer(true) }, t('menu.tutorialStart'))),
  ], { dismissable: false });
}

export function renderMenu(root, app) {
  const inProgress = app.hasRunInProgress();
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
        h('button', { class: inProgress ? '' : 'primary', onclick: startNew }, t('menu.newRun')),
        h('button', { onclick: () => app.go('friend') }, t('menu.friend')),
        h('button', { onclick: () => app.go('tutorial') }, t('menu.tutorial')),
        h('button', { onclick: () => app.go('rules') }, t('menu.rules')),
        h('div', { class: 'menu-row' },
          h('button', { onclick: () => app.go('collection') }, t('menu.collection')),
          h('button', { onclick: () => app.go('records') }, t('menu.records')),
          h('button', { onclick: () => app.go('settings') }, t('menu.settings'))))));
  if (!app.profile.tutorialDone && !inProgress) offerTutorial(app);
}
