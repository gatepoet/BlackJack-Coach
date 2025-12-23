const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

// Initialize remaining cards in the deck
defaultState = { remaining: {}, aceRC: 0 };
let rankOrder = [];

function initRemaining(state, providedRankOrder) {
  Object.assign(defaultState, state);
  rankOrder = providedRankOrder;
  defaultState.remaining = {};
  rankOrder.forEach(rank => {
    defaultState.remaining[rank] = {}
    suits.forEach(suit => defaultState.remaining[rank][suit] = 8);
  });
  return defaultState;
}

// Pick a random suit for a given rank
function pickSuit(rank) {
  let total = 0;
  suits.forEach(s => total += defaultState.remaining[rank][s] || 0);
  if (total === 0) return suits[0];
  const rand = Math.random() * total;
  let currentRand = 0;
  for (const suit of suits) {
    currentRand += defaultState.remaining[rank][suit] || 0;
    if (rand <= currentRand) return suit;
  }
  return suits[0];
}

// Export functions
module.exports = { initRemaining, pickSuit };