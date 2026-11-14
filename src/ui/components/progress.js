// Run progress: one pip per match, filled for wins, highlighted for the current one.
import { h } from '../dom.js';
import { RUN_LENGTH } from '../../run/index.js';

export function renderProgress(wins, { current = wins, lost = false } = {}) {
  return h('div', { class: 'progress', 'aria-label': `${wins} / ${RUN_LENGTH}` },
    Array.from({ length: RUN_LENGTH }, (_, i) => {
      const cls = ['pip'];
      if (i < wins) cls.push('won');
      else if (i === current) cls.push(lost ? 'lost' : 'current');
      return h('span', { class: cls.join(' ') }, i < wins ? '✓' : lost && i === current ? '✕' : i + 1);
    }));
}

/** Placeholder portrait until the art exists: initials on the opponent's element colours. */
export function renderPortrait(opp, name) {
  const [a, b = a] = opp.deckRecipe.elements;
  const initials = name.split(/\s+/).slice(-1)[0].slice(0, 1);
  return h('div', { class: 'portrait', style: { background: `linear-gradient(135deg, var(--${a}), var(--${b}-2))` } }, initials);
}
