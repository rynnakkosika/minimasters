// Plays engine events as short animations, one after another. Speed 1×, 2× or skip (FR-018).
import { h, delay } from './dom.js';
import { t, cardName } from '../data/i18n.js';
import { renderCard } from './components/card.js';

export const SPEEDS = [1, 2, 0]; // 0 = skip

export function createAnimator(getSpeed) {
  const speed = () => getSpeed();
  const wait = (ms) => (speed() === 0 ? Promise.resolve() : delay(ms / speed()));

  function targetEl(ref) {
    if (typeof ref === 'string' && ref.startsWith('player:')) {
      return document.querySelector(`[data-player="${ref.slice(7)}"] .life`);
    }
    return document.querySelector(`[data-uid="${ref}"]`);
  }

  function float(el, text, cls) {
    if (!el || speed() === 0) return;
    const r = el.getBoundingClientRect();
    const f = h('div', { class: `float ${cls}`, style: { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 3}px` } }, text);
    f.style.animationDuration = `${900 / speed()}ms`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900 / speed());
  }

  function flash(el, cls) {
    if (!el || speed() === 0) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 450 / speed());
  }

  function banner(content, ms) {
    if (speed() === 0) return Promise.resolve();
    const b = h('div', { class: 'banner' }, content);
    document.body.appendChild(b);
    return wait(ms).then(() => b.remove());
  }

  /** viewer = the human player's index; opponent plays are shown large so they are easy to follow (FR-015). */
  async function play(events, viewer = 0) {
    for (const e of events) {
      if (speed() === 0) return;
      switch (e.type) {
        case 'cardPlayed':
          if (e.player !== viewer) {
            await banner([h('div', { class: 'banner-label' }, t('ev.cardPlayed', { who: t('match.opponent'), card: cardName(e.cardId) })),
              renderCard(e.cardId, { size: 'big' })], 1100);
          }
          break;
        case 'resourcePlayed':
          if (e.player !== viewer) await banner(t('ev.resourcePlayed', { who: t('match.opponent') }), 600);
          break;
        case 'fatigue':
          await banner(t('ev.fatigue', { who: e.player === viewer ? t('match.you') : t('match.opponent'), amount: e.amount }), 700);
          break;
        case 'turnStarted':
          await banner(e.player === viewer ? t('match.yourTurn') : t('match.opponentTurn'), 650);
          break;
        case 'attackDeclared':
          flash(document.querySelector(`[data-uid="${e.uid}"]`) || document.querySelector(`[data-lane-owner="${e.player}"][data-lane="${e.lane}"]`), 'attacking');
          await wait(350);
          break;
        case 'damageDealt':
          float(targetEl(e.target), `-${e.amount}`, 'dmg');
          flash(targetEl(e.target), 'hit');
          await wait(250);
          break;
        case 'healed':
          float(targetEl(e.target), `+${e.amount}`, 'heal');
          await wait(200);
          break;
        case 'buffed':
          float(targetEl(e.uid), `${e.power >= 0 ? '+' : ''}${e.power}/${e.health >= 0 ? '+' : ''}${e.health}`, e.power >= 0 ? 'heal' : 'dmg');
          await wait(200);
          break;
        case 'shieldBroken':
          float(targetEl(e.uid), t('ev.shieldBroken'), 'info');
          await wait(250);
          break;
        case 'unitDied':
          await wait(150);
          break;
        default:
          break;
      }
    }
  }

  return { play, wait };
}
