// Module: deck - Deck management (pickSuit, initRemaining)
import { state, suits, SHOE_DECKS } from './state.js';

export function pickSuit(rank) {
  let total = 0;
  suits.forEach(s => total += state.remaining[rank][s] || 0);
  if (total === 0) return suits[0];
  let rand = Math.random() * total;
  for (let suit of suits) {
    rand -= state.remaining[rank][suit] || 0;
    if (rand <= 0) return suit;
  }
  return suits[0];
}

export function initRemaining() {
  state.remaining = {};
  state.rankOrder.forEach(rank => {
    state.remaining[rank] = {};
    suits.forEach(suit => state.remaining[rank][suit] = SHOE_DECKS);
  });
  state.aceRC = 0;
}
