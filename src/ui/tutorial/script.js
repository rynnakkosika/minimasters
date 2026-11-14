// Tutorial match (US3): fixed hands and decks, a scripted opponent for the first turns,
// and one rule per step. Pure logic, no DOM, so it can be tested in Node.
import { createMatch } from '../../engine/state.js';
import { startTurn } from '../../engine/turn.js';
import { legalActions } from '../../engine/actions.js';
import { chooseAction } from '../../ai/index.js';

export const TUTORIAL_SEED = 20261114;
export const OPPONENT_LIFE = 14;

const PLAYER_HAND = ['ahjo-lahde', 'ahjo-kipinasoturi', 'ahjo-kekale', 'ahjo-hiilikoira'];
const PLAYER_DECK = ['kallio-lahde', 'ahjo-lahde', 'ahjo-laavanlyoja', 'ahjo-lahde', 'kallio-vuorenvartija', 'ahjo-raivotar',
  'kallio-lahde', 'ahjo-lahde', 'ahjo-hehkulisko', 'ahjo-kipinasoturi', 'ahjo-lahde', 'kallio-juurten-voima',
  'ahjo-sulattaja', 'ahjo-lahde', 'ahjo-kekale', 'kallio-lahde'];
const OPP_HAND = ['kallio-lahde', 'kallio-sammalpeikko', 'kallio-lahde', 'kallio-vuorenvartija'];
const OPP_DECK = ['kallio-lahde', 'kallio-kivikilpi', 'kallio-lahde', 'kallio-sammalpeikko', 'kallio-lahdevesi',
  'kallio-lahde', 'kallio-kivikilpi', 'kallio-graniittijatti', 'kallio-lahde', 'kallio-sammalpeikko', 'kallio-lahde',
  'kallio-kivikilpi', 'kallio-lahde', 'kallio-vuorenvartija', 'kallio-lahde', 'kallio-lahde'];

/** The opponent plays these units on its scripted turns, into the lane of your first creature. */
const OPP_UNIT_BY_TURN = { 4: 'kallio-sammalpeikko', 6: 'kallio-vuorenvartija' };
const SCRIPTED_UNTIL_TURN = 6;
export const FREE_PLAY_AI = { searchDepth: 1, searchWidth: 6, blunderRate: 0.4, rollout: false };

export function buildTutorialMatch() {
  const s = createMatch({ seed: TUTORIAL_SEED, decks: [[...PLAYER_HAND, ...PLAYER_DECK], [...OPP_HAND, ...OPP_DECK]], firstPlayer: 0 });
  const inst = (id) => ({ uid: s.nextUid++, cardId: id, costMod: 0 });
  s.players[0].hand = PLAYER_HAND.map(inst);
  s.players[0].deck = PLAYER_DECK.map(inst);
  s.players[1].hand = OPP_HAND.map(inst);
  s.players[1].deck = OPP_DECK.map(inst);
  s.players[1].life = OPPONENT_LIFE;
  for (const pl of s.players) pl.mulliganDone = true;
  startTurn({ s, ev: [] }, 0);
  return s;
}

const handCard = (s, uid) => s.players[0].hand.find((c) => c.uid === uid)?.cardId;
const playsCard = (type, cardId) => (a, s) => a.type === type && handCard(s, a.uid) === cardId;

/**
 * Steps. `expect(action, stateBefore)` – the only move accepted; steps without `expect` wait for the
 * coach button. `highlight` is shown while idle, `highlightAfterSelect` after the card is chosen.
 */
export const STEPS = [
  { key: 'tut.welcome', continue: true },
  { key: 'tut.source', expect: playsCard('playResource', 'ahjo-lahde'), highlight: 'hand:ahjo-lahde', highlightAfterSelect: 'button:play' },
  { key: 'tut.unit', expect: playsCard('playUnit', 'ahjo-kipinasoturi'), highlight: 'hand:ahjo-kipinasoturi', highlightAfterSelect: 'myLanes' },
  { key: 'tut.tired', expect: (a) => a.type === 'endTurn', highlight: 'button:endTurn' },
  { key: 'tut.draw', expect: playsCard('playResource', 'kallio-lahde'), highlight: 'hand:kallio-lahde', highlightAfterSelect: 'button:play' },
  { key: 'tut.attack', expect: (a) => a.type === 'declareAttackers', highlight: 'button:attack', highlightAfterSelect: 'button:confirmAttack' },
  { key: 'tut.defender', expect: playsCard('playResource', 'ahjo-lahde'), highlight: 'hand:ahjo-lahde', highlightAfterSelect: 'button:play' },
  {
    key: 'tut.spell',
    expect: (a, s) => playsCard('playSpell', 'ahjo-kekale')(a, s) && typeof a.targets?.[0] === 'number' && s.players[1].lanes.some((u) => u && u.uid === a.targets[0]),
    highlight: 'hand:ahjo-kekale',
    highlightAfterSelect: 'enemyLanes',
  },
  { key: 'tut.keyword', expect: playsCard('playUnit', 'ahjo-hiilikoira'), highlight: 'hand:ahjo-hiilikoira', highlightAfterSelect: 'myLanes' },
  { key: 'tut.attackBoth', expect: (a) => a.type === 'declareAttackers', highlight: 'button:attack', highlightAfterSelect: 'button:confirmAttack' },
  { key: 'tut.free', continue: true },
];

export function createTutorial() {
  return {
    step: 0,
    get current() {
      return STEPS[this.step] || null;
    },
    get scripted() {
      return this.step < STEPS.length;
    },
    /** Human actions: only the scripted one while the script runs (concede is always allowed). */
    allow(action, s) {
      if (action.type === 'concede' || !this.scripted) return true;
      const st = this.current;
      return !!st.expect && st.expect(action, s);
    },
    onPlayerAction(action, before) {
      if (this.scripted && this.current.expect && this.current.expect(action, before)) this.step++;
    },
    continue() {
      if (this.scripted && this.current.continue) this.step++;
    },
  };
}

/** The opponent: scripted for the first turns, then a weak AI. */
export function tutorialAiAction(s, step) {
  if (s.turn > SCRIPTED_UNTIL_TURN) return chooseAction(s, 1, FREE_PLAY_AI, TUTORIAL_SEED + step);
  const pl = s.players[1];
  const legal = legalActions(s, 1);
  if (!pl.resourcePlayed) {
    const a = legal.find((x) => x.type === 'playResource');
    if (a) return a;
  }
  const want = OPP_UNIT_BY_TURN[s.turn];
  if (want) {
    const myLane = s.players[0].lanes.findIndex((u) => u);
    const plays = legal.filter((x) => x.type === 'playUnit' && pl.hand.find((c) => c.uid === x.uid)?.cardId === want);
    const a = plays.find((x) => x.lane === myLane) || plays[0];
    if (a) return a;
  }
  return { type: 'endTurn', player: 1 };
}

