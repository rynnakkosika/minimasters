// The human player's hand. Playable cards are highlighted (FR-013).
import { h } from '../dom.js';
import { renderCard } from './card.js';
import { effectiveCost, playBlocker } from '../../engine/index.js';

export function renderHand(s, p, { selectedUid = null, onCard } = {}) {
  const hand = s.players[p].hand;
  return h('div', { class: 'hand' },
    hand.map((inst) =>
      renderCard(inst.cardId, {
        size: 'hand',
        cost: effectiveCost(inst),
        playable: !playBlocker(s, p, inst),
        selected: inst.uid === selectedUid,
        onclick: () => onCard && onCard(inst),
      })));
}
