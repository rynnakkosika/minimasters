// Shown before every match: who the opponent is and how they play (FR-006).
import { h, mount } from '../dom.js';
import { t } from '../../data/i18n.js';
import { opponentAt, startMatch, deckSize, basicCount, RUN_LENGTH } from '../../run/index.js';
import { renderProgress, renderPortrait } from '../components/progress.js';
import { elementGlyph } from '../components/card.js';
import { renderCurve } from '../components/energy-curve.js';

export function renderOpponentIntro(root, app) {
  const run = app.run;
  const opp = opponentAt(run.opponentIndex);
  const name = t(opp.nameKey);
  const replay = run.status === 'IN_MATCH';
  const fight = () => {
    if (!replay) app.setRun(startMatch(app.run));
    app.go('match');
  };
  mount(root,
    h('section', { class: 'screen intro' },
      h('h2', {}, t('intro.title', { n: run.wins + 1, total: RUN_LENGTH })),
      renderProgress(run.wins),
      renderPortrait(opp, name),
      h('h1', { class: 'opp-name' }, name),
      h('div', { class: 'opp-elements' },
        opp.deckRecipe.elements.map((e) => h('span', { class: `el-chip el-${e}` }, `${elementGlyph(e)} ${t(`element.${e}`)}`))),
      h('p', { class: 'opp-style' }, h('b', {}, `${t('intro.style')}: ${t(`style.${opp.style}`)}. `), t(opp.styleKey)),
      h('div', { class: 'your-deck' },
        h('h3', {}, t('intro.yourDeck', { cards: run.deck.cards.length, sources: basicCount(run.deck), total: deckSize(run.deck) })),
        renderCurve(run.deck)),
      h('footer', { class: 'action-bar' },
        h('button', { class: 'primary', onclick: fight }, t('intro.fight')))));
}
