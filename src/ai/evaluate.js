// Static evaluation of a match state from one player's point of view.
import { card } from '../engine/db.js';

const KW_VALUE = { kiire: 0.3, lapaisy: 0.6, vartija: 0.6, suoja: 0.8, kasvu: 1.2, imu: 0.8, piilo: 0.5, kaiku: 0.5 };
const WIN = 1e6;

export function unitValue(u) {
  const def = card(u.cardId);
  let v = u.power * 1.0 + Math.max(0, u.health - u.damage) * 0.8 + (u.shielded ? 1 : 0);
  for (const k of def.keywords || []) v += KW_VALUE[k] || 0;
  if ((def.effects || []).some((e) => e.trigger === 'startOfTurn')) v += 1;
  return v;
}

function boardValue(pl) {
  return pl.lanes.reduce((sum, u) => sum + (u ? unitValue(u) : 0), 0);
}

export function evaluate(s, me, w) {
  if (s.phase === 'GAME_OVER') {
    if (s.winner === me) return WIN - s.turn; // prefer faster wins
    if (s.winner === null) return 0;
    return -WIN + s.turn;
  }
  const a = s.players[me];
  const b = s.players[1 - me];
  // Life matters more when it is low: being at 3 is much worse than at 13.
  const lifeScore = (life) => life + Math.max(0, 8 - life) * 1.5;
  const energyW = w.energy * (a.energyMax < 6 ? 1.5 : 0.2);
  // Drawing from an empty deck loses, so extra draws become a liability near the end of the deck.
  const deckRisk = (pl) => Math.max(0, 3 - pl.deck.length) * 3;
  return (
    -deckRisk(a) +
    deckRisk(b) +
    w.myLife * lifeScore(a.life) -
    w.oppLife * lifeScore(b.life) +
    w.board * (boardValue(a) - boardValue(b)) +
    w.hand * (a.hand.length - b.hand.length) +
    energyW * (a.energyMax - b.energyMax)
  );
}
