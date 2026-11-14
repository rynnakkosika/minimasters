import { test, assert, assertEqual } from './runner.js';
import './helpers.js';
import { createStore, memoryStorage, migrate, RUN_KEY, PROFILE_KEY, defaultProfile } from '../src/storage/save.js';
import { newRun, openBooster, startMatch, updateMatch } from '../src/run/index.js';
import { applyAction } from '../src/engine/index.js';
import { chooseAction } from '../src/ai/index.js';

function midMatchRun(seed = 21, steps = 25) {
  let run = openBooster(newRun(seed)).run;
  run = startMatch(run);
  let s = run.match;
  for (let i = 0; i < steps && s.phase !== 'GAME_OVER'; i++) s = applyAction(s, nextAction(s, i)).state;
  return updateMatch(run, s);
}

function nextAction(s, i) {
  const p = s.phase === 'MULLIGAN' ? (s.players[0].mulliganDone ? 1 : 0) : s.activePlayer;
  return chooseAction(s, p, { searchDepth: 1 }, 1000 + i);
}

test('save: run with a live match survives save and load unchanged', () => {
  const store = createStore(memoryStorage());
  const run = midMatchRun();
  assert(store.saveRun(run));
  assertEqual(JSON.stringify(store.loadRun()), JSON.stringify(run));
});

test('save: a match resumed from a save plays out exactly like an uninterrupted one (SC-007)', () => {
  const store = createStore(memoryStorage());
  const run = midMatchRun(33, 30);
  store.saveRun(run);
  const loaded = store.loadRun();
  let a = run.match;
  let b = loaded.match;
  for (let i = 0; i < 300 && a.phase !== 'GAME_OVER'; i++) {
    a = applyAction(a, nextAction(a, i)).state;
    b = applyAction(b, nextAction(b, i)).state;
  }
  assertEqual(JSON.stringify(b), JSON.stringify(a));
});

test('save: corrupt run save is discarded without touching the profile', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  const profile = { ...defaultProfile(), tutorialDone: true };
  store.saveProfile(profile);
  storage.setItem(RUN_KEY, '{not json');
  assertEqual(store.loadRun(), null);
  assertEqual(store.problem, 'corrupt');
  assertEqual(storage.getItem(RUN_KEY), null, 'bad save removed');
  assertEqual(store.loadProfile().tutorialDone, true);
});

test('save: a save from a newer version is not loaded', () => {
  const storage = memoryStorage();
  storage.setItem(RUN_KEY, JSON.stringify({ version: 99, run: { status: 'IN_MATCH' } }));
  assertEqual(createStore(storage).loadRun(), null);
});

test('save: migration chain runs each step in order', () => {
  const migrations = { 1: (d) => ({ ...d, version: 2, a: 1 }), 2: (d) => ({ ...d, version: 3, b: d.a + 1 }) };
  assertEqual(migrate({ version: 1 }, migrations, 3), { version: 3, a: 1, b: 2 });
  let threw = false;
  try {
    migrate({ version: 1 }, {}, 2);
  } catch {
    threw = true;
  }
  assert(threw, 'missing step throws');
});

test('save: full storage reports a problem instead of crashing', () => {
  const store = createStore(memoryStorage(200));
  assertEqual(store.saveRun(midMatchRun()), false);
  assertEqual(store.problem, 'full');
});

test('save: clearRun removes the run, profile defaults fill missing fields', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.saveRun(newRun(1));
  store.clearRun();
  assertEqual(store.loadRun(), null);
  storage.setItem(PROFILE_KEY, JSON.stringify({ version: 1, records: { bestRunWins: 4 } }));
  const p = store.loadProfile();
  assertEqual(p.records.bestRunWins, 4);
  assertEqual(p.records.runsCompleted, 0);
  assertEqual(p.settings.animSpeed, 1);
});

test('save: old settings and records keys are folded into the new profile', () => {
  const storage = memoryStorage();
  storage.setItem('mm.settings.v1', JSON.stringify({ animSpeed: 2 }));
  storage.setItem('mm.records.v1', JSON.stringify({ bestRunWins: 3, runsCompleted: 5 }));
  const p = createStore(storage).loadProfile();
  assertEqual([p.settings.animSpeed, p.records.bestRunWins, p.records.runsCompleted], [2, 3, 5]);
});

test('save: no personal data in the saves', () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  store.saveRun(midMatchRun());
  store.saveProfile(defaultProfile());
  const text = (storage.getItem(RUN_KEY) + storage.getItem(PROFILE_KEY)).toLowerCase();
  for (const word of ['email', 'name"', 'device', 'userid', 'ip']) assert(!text.includes(`"${word}`), word);
});

test('save: a v1 run waiting in the old deck builder loads as READY with the automatic deck', () => {
  const storage = memoryStorage();
  const run = openBooster(newRun(8)).run;
  const old = { ...run, status: 'DECKBUILDING', deck: { cards: run.pool.slice(0, 3), basics: { ahjo: 17, kallio: 0, usva: 0 } } };
  storage.setItem(RUN_KEY, JSON.stringify({ version: 1, run: old }));
  const loaded = createStore(storage).loadRun();
  assertEqual(loaded.status, 'READY');
  assertEqual(loaded.deck.cards.length, 10);
});
