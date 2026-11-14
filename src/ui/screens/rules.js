// In-game rules (FR-012): a screen from the main menu and an overlay from the pause menu.
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { KEYWORDS } from '../../data/cards.js';
import { showOverlay, closeOverlay } from '../components/tooltip.js';

const SECTIONS = ['goal', 'turn', 'energy', 'lanes', 'units', 'spells', 'deck', 'run'];

function rulesBody() {
  return [
    SECTIONS.map((key) =>
      h('section', { class: 'rules-section' },
        h('h3', {}, t(`rules.${key}.title`)),
        h('p', {}, t(`rules.${key}.text`)))),
    h('section', { class: 'rules-section' },
      h('h3', {}, t('rules.keywords.title')),
      h('dl', { class: 'kw-list' },
        KEYWORDS.map((k) => [h('dt', {}, t(k.nameKey)), h('dd', {}, t(k.descKey))]))),
  ];
}

export function renderRules(root, app) {
  mount(root,
    h('section', { class: 'screen rules' },
      h('header', { class: 'screen-head' }, h('h2', {}, t('rules.title'))),
      rulesBody(),
      h('footer', { class: 'action-bar sticky' },
        h('button', { class: 'primary', onclick: () => app.go('menu') }, t('common.back')))));
}

/** Rules as an overlay; `back` reopens whatever was open before (the pause menu). */
export function showRules(back = closeOverlay) {
  showOverlay([
    h('h2', {}, t('rules.title')),
    h('div', { class: 'rules-scroll' }, rulesBody()),
    h('button', { class: 'primary', onclick: () => back() }, t('common.back')),
  ]);
}
