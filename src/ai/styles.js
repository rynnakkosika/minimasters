// Evaluation weights per opponent style (research R5).
export const STYLE_WEIGHTS = {
  aggro: { myLife: 0.6, oppLife: 1.5, board: 0.9, hand: 0.4, energy: 0.6 },
  control: { myLife: 1.3, oppLife: 0.8, board: 1.2, hand: 0.8, energy: 0.6 },
  midrange: { myLife: 1.0, oppLife: 1.0, board: 1.0, hand: 0.6, energy: 0.6 },
  swarm: { myLife: 0.8, oppLife: 1.2, board: 1.3, hand: 0.4, energy: 0.6 },
  tempo: { myLife: 0.9, oppLife: 1.2, board: 1.1, hand: 0.7, energy: 0.6 },
};

export const DEFAULT_PARAMS = { style: 'midrange', searchDepth: 2, searchWidth: 16, blunderRate: 0, rollout: true, timeLimitMs: 300 };

export function weightsFor(style) {
  return STYLE_WEIGHTS[style] || STYLE_WEIGHTS.midrange;
}
