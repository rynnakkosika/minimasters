// Entry point: loads data and saves, picks the language and routes between screens.
import { loadCards } from './data/cards.js';
import { setLocale, t } from './data/i18n.js';
import { newRun, openBooster, markSeen } from './run/index.js';
import { createStore } from './storage/save.js';
import { h } from './ui/dom.js';
import { closeOverlay } from './ui/components/tooltip.js';
import { renderMenu } from './ui/screens/menu.js';
import { renderBooster } from './ui/screens/booster.js';
import { renderMatch } from './ui/screens/match.js';
import { renderOpponentIntro } from './ui/screens/opponent-intro.js';
import { renderResult } from './ui/screens/result.js';
import { renderRunSummary } from './ui/screens/run-summary.js';
import { renderTutorial } from './ui/screens/tutorial.js';
import { renderRules } from './ui/screens/rules.js';
import { renderCollection } from './ui/screens/collection.js';
import { renderRecords } from './ui/screens/records.js';
import { renderSettings } from './ui/screens/settings.js';
import { renderFriend, leaveFriendGame } from './ui/screens/friend.js';
import { codeFromUrl } from './net/protocol.js';

function randomSeed() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

const SCREENS = {
  menu: renderMenu,
  booster: renderBooster,
  intro: renderOpponentIntro,
  match: renderMatch,
  result: renderResult,
  summary: renderRunSummary,
  tutorial: renderTutorial,
  rules: renderRules,
  collection: renderCollection,
  records: renderRecords,
  settings: renderSettings,
  friend: renderFriend,
};
const root = document.getElementById('app');
const store = createStore();
const profile = store.loadProfile();
store.saveProfile(profile); // completes the one-time move from the old settings/records keys

/** Short non-blocking notice at the bottom of the screen. */
function toast(text) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

let warnedFull = false;
function reportSaveProblem() {
  if (store.problem === 'full' && !warnedFull) {
    warnedFull = true;
    toast(t('save.full'));
  }
}

const app = {
  run: null,
  screen: 'menu',
  profile,
  settings: profile.settings,
  records: profile.records,
  lastRunWasRecord: false,
  toast,

  saveSettings() {
    store.saveProfile(profile);
    reportSaveProblem();
  },

  /** Every change to the run goes through here, so the save is always current (FR-022). */
  setRun(run) {
    app.run = run;
    if (run && !run.status.startsWith('COMPLETED')) store.saveRun(run);
    reportSaveProblem();
  },

  hasRunInProgress() {
    return !!app.run && !app.run.status.startsWith('COMPLETED');
  },

  /** Called once when a run ends: updates the records, removes the run save, shows the summary. */
  finishRun() {
    const r = profile.records;
    const run = app.run;
    app.lastRunWasRecord = run.wins > r.bestRunWins;
    r.bestRunWins = Math.max(r.bestRunWins, run.wins);
    r.runsCompleted++;
    if (run.status === 'COMPLETED_VICTORY') r.runsWon++;
    r.matchesPlayed += run.stats?.matches || 0;
    store.clearRun();
    store.saveProfile(profile);
    reportSaveProblem();
    app.go('summary');
  },

  go(screen) {
    closeOverlay();
    if (app.screen.startsWith('friend')) leaveFriendGame(); // leaving a friend game closes its connection
    app.screen = screen;
    if (history.state?.screen !== screen) history.pushState({ screen }, '');
    window.scrollTo(0, 0);
    SCREENS[screen](root, app);
  },

  startNewRun() {
    store.clearRun();
    app.setRun(newRun(randomSeed()));
    app.openNextBooster();
  },

  openNextBooster() {
    const { run, booster } = openBooster(app.run);
    app.setRun(run);
    profile.collectionSeen = markSeen(profile.collectionSeen, booster.cards);
    app.saveSettings();
    app.go('booster');
  },

  resume() {
    const st = app.run?.status;
    if (st === 'OPENING_BOOSTER') app.go('result');
    else if (st === 'READY') app.go('intro');
    else if (st === 'IN_MATCH') app.go('match');
    else app.go('menu');
  },
};

// Android back button / browser back: never leave a match by accident, otherwise go to the menu.
window.addEventListener('popstate', () => {
  if (app.screen === 'match' || app.screen === 'tutorial' || app.screen === 'friend-match') {
    history.pushState({ screen: app.screen }, '');
    document.querySelector('.match-top .icon-btn')?.click();
  } else if (app.screen !== 'menu') {
    app.go('menu');
  }
});

// Save once more when the app goes to the background (Android pause, tab switch, closing).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && app.hasRunInProgress()) store.saveRun(app.run);
});

document.documentElement.lang = setLocale(profile.settings.locale || navigator.language);
loadCards();
app.run = store.loadRun();
// An invite link (?peli=CODE) opens "Play with a friend" with the code filled in (specs/002-friend-play).
app.invite = codeFromUrl(location.href) || null;
history.replaceState({ screen: 'menu' }, '', app.invite ? location.pathname : undefined);
app.go('menu');
if (app.invite) app.go('friend');
if (store.problem === 'corrupt') toast(t('save.corrupt'));

// Offline support for the web version (the Android app ships the files inside the APK).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Exposed for debugging in the browser console only.
window.__app = app;
