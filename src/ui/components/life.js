// Player bar: life, energy, sources per element, deck and discard sizes.
import { h } from '../dom.js';
import { t } from '../../data/i18n.js';
import { elementGlyph } from './card.js';

export function renderPlayerBar(s, p, { name, showHand = false, targetable = false, onclick = null } = {}) {
  const pl = s.players[p];
  const active = s.phase === 'MAIN' && s.activePlayer === p;
  return h('div', { class: `player-bar${active ? ' active' : ''}${targetable ? ' targetable' : ''}`, dataset: { player: p }, onclick },
    h('span', { class: 'pname' }, name),
    h('span', { class: 'life', title: 'life' }, '♥ ', pl.life),
    h('span', { class: 'energy', title: t('match.energy') }, '⚡ ', `${pl.energy}/${pl.energyMax}`),
    h('span', { class: 'sources' },
      ['ahjo', 'kallio', 'usva'].filter((e) => pl.resources[e] > 0).map((e) =>
        h('span', { class: `el-chip el-${e}` }, `${elementGlyph(e)}${pl.resources[e]}`))),
    h('span', { class: 'counts' }, showHand ? `✋${pl.hand.length} ` : '', `▤${pl.deck.length}`));
}
