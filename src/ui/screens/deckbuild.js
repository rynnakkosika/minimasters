// Deck building: tap to move cards in or out, +/- for sources, auto-build, play (FR-007 … FR-011).
import { h, mount } from '../dom.js';
import { t, cardName } from '../../data/i18n.js';
import { card } from '../../engine/db.js';
import { validateDeck, autoBuild, deckSize, setDeck, ELEMENTS, MAX_DECK } from '../../run/index.js';
import { elementGlyph } from '../components/card.js';
import { renderCurve } from '../components/energy-curve.js';
import { showCardDetail } from '../components/tooltip.js';

function cardRow(id, onTap) {
  const d = card(id);
  return h('li', { class: `card-row el-${d.element} rarity-${d.rarity}` },
    h('button', { class: 'row-main', onclick: onTap },
      h('span', { class: 'card-cost' }, d.cost),
      h('span', { class: 'row-name' }, cardName(id)),
      h('span', { class: 'row-meta' }, d.type === 'unit' ? `${d.power}/${d.health}` : t(`type.${d.type}`))),
    h('button', { class: 'row-info', 'aria-label': t('match.info'), onclick: () => showCardDetail(id) }, 'i'));
}

/** Pool cards not currently in the deck (respecting duplicates). */
function remaining(pool, deckCards) {
  const left = pool.slice();
  for (const id of deckCards) {
    const i = left.indexOf(id);
    if (i >= 0) left.splice(i, 1);
  }
  return left;
}

const byCost = (a, b) => card(a).cost - card(b).cost || cardName(a).localeCompare(cardName(b));

export function renderDeckbuild(root, app) {
  let deck = structuredClone(app.run.deck);

  function save() {
    app.setRun(setDeck(app.run, deck));
    draw();
  }

  function draw() {
    const pool = app.run.pool;
    const check = validateDeck(pool, deck);
    const size = deckSize(deck);
    const rest = remaining(pool, deck.cards).sort(byCost);
    mount(root,
      h('section', { class: 'screen deckbuild' },
        h('header', { class: 'screen-head' },
          h('h2', {}, t('deck.title')),
          h('span', { class: `deck-count${check.ok ? ' ok' : ''}` }, t('deck.count', { count: size }))),
        renderCurve(deck),
        h('p', { class: 'hint' }, t('deck.tapHint')),
        h('h3', {}, t('deck.basics')),
        h('div', { class: 'basics' },
          ELEMENTS.map((e) =>
            h('div', { class: `basic el-${e}` },
              h('span', { class: 'basic-name' }, elementGlyph(e), ' ', t(`element.${e}`)),
              h('button', { 'aria-label': '-', disabled: !deck.basics[e], onclick: () => { deck.basics[e]--; save(); } }, '−'),
              h('span', { class: 'basic-n' }, deck.basics[e]),
              h('button', { 'aria-label': '+', disabled: size >= MAX_DECK, onclick: () => { deck.basics[e]++; save(); } }, '+')))),
        h('h3', {}, t('deck.deck'), ` (${deck.cards.length})`),
        h('ul', { class: 'card-list in-deck' },
          deck.cards.slice().sort(byCost).map((id) =>
            cardRow(id, () => { deck.cards.splice(deck.cards.indexOf(id), 1); save(); }))),
        h('h3', {}, t('deck.pool'), ` (${rest.length})`),
        h('ul', { class: 'card-list' },
          rest.map((id) => cardRow(id, () => { if (size < MAX_DECK) { deck.cards.push(id); save(); } }))),
        h('footer', { class: 'action-bar sticky' },
          check.ok ? null : h('p', { class: 'error' }, check.errors.map((e) => t(e.key, { ...e.params, card: e.params.card ? cardName(e.params.card) : '' })).join(' ')),
          h('div', { class: 'row' },
            h('button', { onclick: () => { deck = autoBuild(pool); save(); } }, t('deck.auto')),
            h('button', { class: 'primary', disabled: !check.ok, onclick: () => app.go('intro') }, t('deck.play'))))));
  }
  draw();
}
