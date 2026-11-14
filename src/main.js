// Entry point: loads data, picks the language and routes between screens.
import { loadCards } from './data/cards.js';
import { setLocale } from './data/i18n.js';
import { newRun, openBooster } from './run/index.js';
import { closeOverlay } from './ui/components/tooltip.js';
import { renderMenu } from './ui/screens/menu.js';
import { renderBooster } from './ui/screens/booster.js';
import { renderDeckbuild } from './ui/screens/deckbuild.js';
import { renderMatch } from './ui/screens/match.js';
import { renderOpponentIntro } from './ui/screens/opponent-intro.js';
import { renderResult } from './ui/screens/result.js';
import { renderRunSummary } from './ui/screens/run-summary.js';

const SETTINGS_KEY = 'mm.settings.v1';
// Records live here until the versioned profile save (US4/US5) takes them over.
const RECORDS_KEY = 'mm.records.v1';
const EMPTY_RECORDS = { bestRunWins: 0, runsCompleted: 0, runsWon: 0, matchesPlayed: 0 };

function loadRecords() {
  try {
    return { ...EMPTY_RECORDS, ...JSON.parse(localStorage.getItem(RECORDS_KEY) || '{}') };
  } catch {
    return { ...EMPTY_RECORDS };
  }
}

function loadSettings() {
  try {
    return { animSpeed: 1, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { animSpeed: 1 };
  }
}

function randomSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

const SCREENS = {
  menu: renderMenu,
  booster: renderBooster,
  deck: renderDeckbuild,
  intro: renderOpponentIntro,
  match: renderMatch,
  result: renderResult,
  summary: renderRunSummary,
};
const root = document.getElementById('app');

const app = {
  run: null,
  screen: 'menu',
  settings: loadSettings(),
  records: loadRecords(),
  lastRunWasRecord: false,

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(app.settings));
    } catch {
      /* storage unavailable: settings last for this session only */
    }
  },

  setRun(run) {
    app.run = run;
  },

  /** Called once when a run ends: updates the records and shows the summary. */
  finishRun() {
    const r = app.records;
    const run = app.run;
    app.lastRunWasRecord = run.wins > r.bestRunWins;
    r.bestRunWins = Math.max(r.bestRunWins, run.wins);
    r.runsCompleted++;
    if (run.status === 'COMPLETED_VICTORY') r.runsWon++;
    r.matchesPlayed += run.stats?.matches || 0;
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(r));
    } catch {
      /* storage unavailable */
    }
    app.go('summary');
  },

  go(screen) {
    closeOverlay();
    app.screen = screen;
    if (history.state?.screen !== screen) history.pushState({ screen }, '');
    window.scrollTo(0, 0);
    SCREENS[screen](root, app);
  },

  startNewRun() {
    app.run = newRun(randomSeed());
    app.openNextBooster();
  },

  openNextBooster() {
    app.run = openBooster(app.run).run;
    app.go('booster');
  },

  resume() {
    const st = app.run?.status;
    if (st === 'OPENING_BOOSTER') app.openNextBooster();
    else if (st === 'DECKBUILDING') app.go('deck');
    else if (st === 'IN_MATCH') app.go('match');
    else if (st?.startsWith('COMPLETED')) app.go('summary');
    else app.go('menu');
  },
};

// Android back button / browser back: never leave a match by accident, otherwise go to the menu.
window.addEventListener('popstate', () => {
  if (app.screen === 'match') {
    history.pushState({ screen: 'match' }, '');
    document.querySelector('.match-top .icon-btn')?.click();
  } else if (app.screen !== 'menu') {
    app.go('menu');
  }
});

document.documentElement.lang = setLocale(navigator.language);
loadCards();
history.replaceState({ screen: 'menu' }, '');
app.go('menu');

// Exposed for debugging in the browser console only.
window.__app = app;
