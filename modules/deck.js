// deck.js - Handles deck initialization and card distribution
export const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

/**
 * Initialize remaining cards in the deck
 * @param {Object} state - The global state object
 * @param {Array} providedRankOrder - Array of rank values (e.g., ['A','2','3',...])
 * @param {number} [deckCount=8] - Number of decks in the shoe
 */
function initRemaining(state, providedRankOrder, deckCount = 8) {
  // Validate inputs
  if (!state || !providedRankOrder || !Array.isArray(providedRankOrder)) {
    console.error('initRemaining: Invalid parameters');
    return state;
  }
  
  const rankOrder = providedRankOrder;
  
  // Initialize remaining cards structure
  if (!state.remaining) {
    state.remaining = {};
  }
  
  // Clear and reinitialize for all ranks
  rankOrder.forEach(rank => {
    state.remaining[rank] = {};
    suits.forEach(suit => {
      state.remaining[rank][suit] = deckCount;
    });
  });
  
  // Initialize ace side count if not present
  if (state.aceRC === undefined) {
    state.aceRC = 0;
  }
  
  return state;
}

/**
 * Pick a random suit for a given rank based on remaining cards
 * @param {Object} state - The global state object
 * @param {string} rank - Card rank (e.g., 'A', '2', 'K')
 * @returns {string} Chosen suit
 */
function pickSuit(state, rank) {
  // Validate inputs
  if (!state || !state.remaining || !rank) {
    console.error('pickSuit: Invalid parameters');
    return suits[0];
  }
  
  const remainingForRank = state.remaining[rank];
  if (!remainingForRank) {
    console.warn(`pickSuit: Unknown rank "${rank}"`);
    return suits[0];
  }
  
  // Calculate total remaining cards for this rank
  let total = 0;
  suits.forEach(s => total += (remainingForRank[s] || 0));
  
  if (total === 0) {
    console.warn(`pickSuit: No cards remaining for rank "${rank}"`);
    return suits[0];
  }
  
  // Weighted random selection based on remaining counts
  const rand = Math.random() * total;
  let currentRand = 0;
  for (const suit of suits) {
    currentRand += (remainingForRank[suit] || 0);
    if (rand <= currentRand) {
      return suit;
    }
  }
  
  // Fallback
  return suits[0];
}

// Export functions
export { initRemaining, pickSuit };