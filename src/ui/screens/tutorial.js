// Tutorial screen (US3, FR-019): the normal match view with a coach panel and a scripted opponent.
import { t } from '../../data/i18n.js';
import { buildTutorialMatch, createTutorial, tutorialAiAction } from '../tutorial/script.js';
import { renderMatchView } from './match.js';

export function renderTutorial(root, app) {
  const tut = createTutorial();
  renderMatchView(root, app, {
    state: buildTutorialMatch(),
    opponent: { name: t('tut.opponent'), style: 'midrange', aiParams: {} },
    refusedMessage: t('tut.follow'),
    save() {
      /* the tutorial is short and always starts from the beginning */
    },
    aiAction: tutorialAiAction,
    allow: (action, s) => tut.allow(action, s),
    onAction(action, before) {
      if (action.player === 0) tut.onPlayerAction(action, before);
    },
    onContinue: () => tut.continue(),
    coach(s) {
      if (!tut.scripted || s.phase === 'GAME_OVER') return null;
      if (s.activePlayer !== 0) return { text: t('tut.wait') };
      const st = tut.current;
      return {
        text: t(st.key),
        continueLabel: st.continue ? t('tut.continue') : null,
        highlight: st.highlight,
        highlightAfterSelect: st.highlightAfterSelect,
      };
    },
    finish() {
      app.profile.tutorialDone = true;
      app.saveSettings();
      app.toast(t('tut.done'));
      app.go('menu');
    },
  });
}
