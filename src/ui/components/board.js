// One player's row of three lanes.
import { h } from '../dom.js';
import { t } from '../../data/i18n.js';
import { renderCard } from './card.js';

/**
 * opts.laneState(lane) → { selectable, targetable, attacking, ready } ; opts.onLane(lane) ; opts.onUnit(unit, lane)
 */
export function renderLanes(s, p, opts = {}) {
  const lanes = s.players[p].lanes;
  return h('div', { class: `lanes lanes-p${p}${opts.top ? ' lanes-top' : ''}` },
    lanes.map((u, lane) => {
      const st = opts.laneState ? opts.laneState(lane, u) : {};
      const cls = ['lane'];
      if (st.selectable) cls.push('selectable');
      if (st.attacking) cls.push('attack-selected');
      if (st.ready) cls.push('ready');
      return h('div', {
        class: cls.join(' '),
        dataset: { lane, laneOwner: p },
        'aria-label': t('match.lane', { n: lane + 1 }),
        onclick: () => (u ? opts.onUnit && opts.onUnit(u, lane) : opts.onLane && opts.onLane(lane)),
      }, u ? renderCard(u.cardId, { size: 'board', unit: u, targetable: st.targetable, selected: st.attacking }) : null);
    }));
}
