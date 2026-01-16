
import { initRemaining } from './modules/deck.js';

const state = {
  remaining: {},
  aceRC: 0,
  cardsDealt: 0
};

initRemaining(state);

console.log("State after initRemaining:");
console.log(JSON.stringify({
  aceRC: state.aceRC,
  cardsDealt: state.cardsDealt,
  remainingKeys: Object.keys(state.remaining || {}).length
}, null, 2));
