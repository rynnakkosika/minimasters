// Match screen: the human is always player 0, the AI player 1.
import { h, mount } from '../dom.js';
import { t, cardName } from '../../data/i18n.js';
import { card } from '../../engine/db.js';
import {
  applyAction, attackableLanes, playBlocker, chosenTargetOf, targetCandidates,
  playerRef, isGameOver,
} from '../../engine/index.js';
import { chooseAction } from '../../ai/index.js';
import { opponentAt, updateMatch, finishMatch } from '../../run/index.js';
import { renderLanes } from '../components/board.js';
import { renderHand } from '../components/hand.js';
import { renderPlayerBar } from '../components/life.js';
import { renderCard } from '../components/card.js';
import { showCardDetail, showOverlay, closeOverlay, confirmDialog } from '../components/tooltip.js';
import { createAnimator, SPEEDS } from '../anim.js';

const ME = 0;
const AI = 1;
const BLOCKER_KEY = {
  needsElement: 'match.needsElement',
  needsEnergy: 'match.needsEnergy',
  resourceDone: 'match.resourceDone',
  noLane: 'match.noLane',
  noTarget: 'match.noTarget',
};

export function renderMatch(root, app) {
  const opp = opponentAt(app.run.opponentIndex);
  const anim = createAnimator(() => app.settings.animSpeed);
  let s = app.run.match;
  // ui.mode: idle | pickLane | pickTarget | attack | busy
  let ui = { mode: 'idle', selected: null, lane: null, attackers: [], message: '' };
  let aiStep = s.log.length;

  const myTurn = () => s.phase === 'MAIN' && s.activePlayer === ME;
  const selectedInst = () => s.players[ME].hand.find((c) => c.uid === ui.selected) || null;

  function reset(message = '') {
    ui = { mode: 'idle', selected: null, lane: null, attackers: [], message };
  }

  async function perform(action) {
    if (ui.mode === 'busy') return;
    ui.mode = 'busy';
    const { state, events } = applyAction(s, action);
    s = state;
    app.setRun(updateMatch(app.run, s));
    draw();
    await anim.play(events, ME);
    reset();
    draw();
    await afterAction();
  }

  async function afterAction() {
    if (s.phase === 'GAME_OVER') return showResult();
    if (s.phase === 'MULLIGAN' && !s.players[ME].mulliganDone) return showMulligan();
    if (needsAi()) await runAi();
  }

  function needsAi() {
    if (s.phase === 'GAME_OVER') return false;
    if (s.phase === 'MULLIGAN') return !s.players[AI].mulliganDone;
    return s.activePlayer === AI;
  }

  async function runAi() {
    ui.mode = 'busy';
    draw();
    while (needsAi()) {
      await anim.wait(450);
      const a = chooseAction(s, AI, { style: opp.style, ...opp.aiParams }, (app.run.seed ^ (aiStep++ * 2654435761)) >>> 0);
      const { state, events } = applyAction(s, a);
      s = state;
      app.setRun(updateMatch(app.run, s));
      draw();
      await anim.play(events, ME);
    }
    reset();
    draw();
    await afterAction();
  }

  // ---- input -------------------------------------------------------------

  function onHandCard(inst) {
    if (!myTurn() || ui.mode === 'busy') return showCardDetail(inst.cardId);
    if (ui.selected === inst.uid && ui.mode !== 'attack') {
      reset();
      return draw();
    }
    const blocker = playBlocker(s, ME, inst);
    const def = card(inst.cardId);
    reset();
    ui.selected = inst.uid;
    if (blocker) {
      ui.message = t(BLOCKER_KEY[blocker] || 'match.noTarget', { element: t(`element.${def.element}`) });
    } else if (def.type === 'unit') {
      ui.mode = 'pickLane';
      ui.message = t('match.pickLane');
    } else if (chosenTargetOf(def)) {
      ui.mode = 'pickTarget';
      ui.message = t('match.pickTarget');
    } else {
      ui.message = cardName(inst.cardId);
    }
    draw();
  }

  function playSelected(extra = {}) {
    const inst = selectedInst();
    if (!inst) return;
    const def = card(inst.cardId);
    const type = def.type === 'resource' ? 'playResource' : def.type === 'unit' ? 'playUnit' : 'playSpell';
    perform({ type, player: ME, uid: inst.uid, ...extra });
  }

  function onMyLane(lane) {
    if (ui.mode !== 'pickLane' || s.players[ME].lanes[lane]) return;
    const def = card(selectedInst().cardId);
    if (chosenTargetOf(def)) {
      ui.lane = lane;
      ui.mode = 'pickTarget';
      ui.message = t('match.pickTarget');
      return draw();
    }
    playSelected({ lane });
  }

  function candidates() {
    const inst = selectedInst();
    if (!inst || ui.mode !== 'pickTarget') return [];
    return targetCandidates(s, ME, chosenTargetOf(card(inst.cardId)));
  }

  function onTarget(ref) {
    if (!candidates().includes(ref)) return false;
    const extra = { targets: [ref] };
    if (ui.lane != null) extra.lane = ui.lane;
    playSelected(extra);
    return true;
  }

  function onUnit(u, owner) {
    if (ui.mode === 'pickTarget' && onTarget(u.uid)) return;
    if (ui.mode === 'attack' && owner === ME) {
      const lane = s.players[ME].lanes.indexOf(u);
      if (!attackableLanes(s, ME).includes(lane)) return;
      ui.attackers = ui.attackers.includes(lane) ? ui.attackers.filter((l) => l !== lane) : [...ui.attackers, lane];
      return draw();
    }
    showCardDetail(u.cardId, u);
  }

  function startAttack() {
    reset(t('match.pickAttackers'));
    ui.mode = 'attack';
    ui.attackers = attackableLanes(s, ME);
    draw();
  }

  // ---- overlays ----------------------------------------------------------

  function showMulligan() {
    const keep = (k) => {
      closeOverlay();
      perform({ type: 'mulligan', player: ME, keep: k });
    };
    showOverlay([
      h('h2', {}, t('match.mulliganTitle')),
      h('p', {}, t('match.mulliganText')),
      h('div', { class: 'mulligan-hand' }, s.players[ME].hand.map((c) => renderCard(c.cardId, { size: 'mini' }))),
      h('div', { class: 'row' },
        h('button', { onclick: () => keep(false) }, t('match.redraw')),
        h('button', { class: 'primary', onclick: () => keep(true) }, t('match.keep'))),
    ], { dismissable: false });
  }

  function showPause() {
    const speedLabel = (v) => (v === 0 ? '⏭' : `${v}×`);
    showOverlay([
      h('h2', {}, t('match.pause')),
      h('button', { onclick: () => {
        const i = SPEEDS.indexOf(app.settings.animSpeed);
        app.settings.animSpeed = SPEEDS[(i + 1) % SPEEDS.length];
        app.saveSettings();
        showPause();
      } }, t('match.speed', { speed: speedLabel(app.settings.animSpeed) })),
      h('button', { onclick: async () => {
        closeOverlay();
        if (await confirmDialog(`${t('match.concede')}?`)) perform({ type: 'concede', player: ME });
      } }, t('match.concede')),
      h('button', { class: 'primary', onclick: closeOverlay }, t('match.resume')),
    ]);
  }

  function showResult() {
    const r = isGameOver(s);
    const title = r.winner === ME ? t('match.won') : r.winner === null ? t('match.draw') : t('match.lost');
    showOverlay([
      h('h2', { class: r.winner === ME ? 'win' : 'loss' }, title),
      h('p', {}, t(`match.reason.${r.reason}`)),
      h('button', { class: 'primary', onclick: () => {
        closeOverlay();
        const next = finishMatch(app.run);
        app.setRun(next);
        if (next.status === 'IN_MATCH') app.go('match');
        else if (next.status === 'OPENING_BOOSTER') app.openNextBooster();
        else app.go('menu');
      } }, t('match.next')),
    ], { dismissable: false });
  }

  // ---- render ------------------------------------------------------------

  function draw() {
    const cands = candidates();
    const attackable = ui.mode === 'attack' ? attackableLanes(s, ME) : [];
    const inst = selectedInst();
    const canPlayNoTarget = inst && myTurn() && ui.mode === 'idle' && !playBlocker(s, ME, inst) &&
      card(inst.cardId).type !== 'unit' && !chosenTargetOf(card(inst.cardId));
    const canAttack = myTurn() && ui.mode !== 'busy' && attackableLanes(s, ME).length > 0;

    let prompt = ui.message;
    if (!prompt) prompt = s.phase === 'MAIN' ? (myTurn() ? t('match.yourTurn') : t('match.opponentTurn')) : '';

    let buttons;
    if (ui.mode === 'attack') {
      buttons = [
        h('button', { onclick: () => { reset(); draw(); } }, t('match.cancel')),
        h('button', { class: 'primary', disabled: !ui.attackers.length, onclick: () => perform({ type: 'declareAttackers', player: ME, lanes: ui.attackers.slice().sort() }) },
          t('match.attackConfirm', { count: ui.attackers.length })),
      ];
    } else if (ui.mode === 'pickLane' || ui.mode === 'pickTarget' || (inst && ui.mode === 'idle')) {
      buttons = [
        h('button', { onclick: () => { reset(); draw(); } }, t('match.cancel')),
        inst ? h('button', { onclick: () => showCardDetail(inst.cardId) }, t('match.info')) : null,
        canPlayNoTarget ? h('button', { class: 'primary', onclick: () => playSelected() }, t('match.play')) : null,
      ];
    } else {
      buttons = [
        h('button', { class: canAttack ? 'attack' : '', disabled: !canAttack, onclick: startAttack }, t('match.attack')),
        h('button', { class: 'primary', disabled: !myTurn() || ui.mode === 'busy', onclick: () => perform({ type: 'endTurn', player: ME }) }, t('match.endTurn')),
      ];
    }
    const enemyPlayerTargetable = cands.includes(playerRef(AI));

    mount(root,
      h('section', { class: `screen match mode-${ui.mode}` },
        h('div', { class: 'match-top' },
          h('button', { class: 'icon-btn', 'aria-label': t('match.pause'), onclick: showPause }, '❚❚'),
          renderPlayerBar(s, AI, { name: t(opp.nameKey), targetable: enemyPlayerTargetable, onclick: () => enemyPlayerTargetable && onTarget(playerRef(AI)) })),
        renderLanes(s, AI, {
          laneState: (lane, u) => ({ targetable: u && cands.includes(u.uid) }),
          onUnit: (u) => onUnit(u, AI),
        }),
        h('div', { class: 'midline' }, h('span', { class: 'turn' }, t('match.turn', { turn: Math.max(1, s.turn) })), h('span', { class: 'prompt' }, prompt)),
        renderLanes(s, ME, {
          laneState: (lane, u) => ({
            selectable: ui.mode === 'pickLane' && !u,
            targetable: u && cands.includes(u.uid),
            attacking: ui.mode === 'attack' && ui.attackers.includes(lane) && attackable.includes(lane),
          }),
          onLane: onMyLane,
          onUnit: (u) => onUnit(u, ME),
        }),
        renderPlayerBar(s, ME, { name: t('match.you') }),
        renderHand(s, ME, { selectedUid: ui.selected, onCard: onHandCard }),
        h('footer', { class: 'action-bar match-actions' }, buttons)));
  }

  draw();
  afterAction();
}
