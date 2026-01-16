// cardHandler.js - Handles card operations and DOM updates
// This module depends on state being passed to its functions

import { pickSuit } from './deck.js';

// Add a card to the specified hand
function addCard(state, val, target) {
  // Validate inputs
  if (!state || !val || !target) {
    console.error('addCard: Missing required parameters');
    return;
  }
  const suit = pickSuit(state, val);
  
  // Validate card value exists in map
  if (!state.map || !state.map.HiLo || !state.map.HiLo[val]) {
    console.error(`addCard: Invalid card value "${val}"`);
    return;
  }
  
  // Update remaining cards
  if (state.remaining && state.remaining[val] && state.remaining[val][suit] !== undefined) {
    state.remaining[val][suit]--;
    if (state.remaining[val][suit] < 0) state.remaining[val][suit] = 0;
  }
  
  // Update counts for card counting systems
  Object.keys(state.counts).forEach(countingSystem => {
    if (state.map && state.map[countingSystem]) {
      state.counts[countingSystem].rc += state.map[countingSystem][val];
    }
  }); 
  
  // Update ace side count
  if (val === 'A' && state.aceRC !== undefined) {
    state.aceRC -= 1;
  }
  
  // Add the card to the DOM
  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class="corner top-left">${val === '10' ? 'T' : val}</span>
    <span class="corner bottom-right">${val === '10' ? 'T' : val}</span>
    <span class="suit top-right">${state.symMap ? state.symMap[suit] : suit} </span>
    <span class="suit bottom-left">${state.symMap ? state.symMap[suit] : suit}</span>
  `;

  // Find container - handle split hands vs regular hands
  let container;
  if (target.match(/[AB]$/)) {
    container = document.getElementById(`hand-${target}`);
  } else if (state.handContainers && state.handContainers[target]) {
    container = state.handContainers[target];
  }
  
  if (container) {
    container.appendChild(mini);
  }
  
  // Update hands array
  if (!state.hands) state.hands = {};
  if (!state.hands[target]) state.hands[target] = [];
  state.hands[target].push({ value: val, element: mini });
  
  // Track last added card for UI focus
  if (state.lastAddedCard !== undefined) {
    state.lastAddedCard = mini;
  }
}

// Remove the last card from the active hand
function removeLastCardFromActiveHand(state) {
  if (!state || !state.inputTarget) {
    console.error('removeLastCardFromActiveHand: Missing state or inputTarget');
    return;
  }
  
  const target = state.inputTarget;
  const hand = state.hands && state.hands[target];
  if (!hand || hand.length === 0) {
    console.warn(`removeLastCardFromActiveHand: No cards in hand ${target}`);
    return;
  }
  
  const card = hand.pop();
  const suit = card.element && card.element.dataset.suit ? card.element.dataset.suit : null;
  
  // Update counts
  if (state.counts && state.map) {
    Object.keys(state.counts).forEach(countingSystem => {
      if (state.map[countingSystem] && card.value) {
        state.counts[countingSystem].rc -= state.map[countingSystem][card.value];
      }
    });
  }
  
  // Update ace side count
  if (card.value === 'A' && state.aceRC !== undefined) {
    state.aceRC += 1;
  }

  // Return card to remaining deck
  if (suit && card.value && state.remaining && state.remaining[card.value]) {
    state.remaining[card.value][suit]++;
    if (state.remaining[card.value][suit] < 0) state.remaining[card.value][suit] = 0;
  }
  
  // Remove from DOM
  if (card.element) {
    card.element.remove();
  }
  
  // Clear lastAddedCard if hand is empty
  if (state.lastAddedCard !== undefined && hand.length === 0) {
    state.lastAddedCard = null;
  }
}

// Perform a split operation
function performSplit(state, baseSeat) {
  if (!state || !baseSeat) {
    console.error('performSplit: Missing required parameters');
    return;
  }
  
  const hand = state.hands && state.hands[baseSeat];
  if (!hand || hand.length !== 2 || hand[0].value !== hand[1].value) {
    console.warn(`performSplit: Cannot split hand at ${baseSeat}`);
    return;
  }
  
  // Check if already split
  if (state.splitContainers && state.splitContainers[baseSeat] && 
      state.splitContainers[baseSeat].style.display !== 'none') {
    console.warn(`performSplit: Hand ${baseSeat} is already split`);
    return;
  }

  const cardA = hand[0];
  const cardB = hand[1];

  // Create split hands
  if (!state.hands) state.hands = {};
  state.hands[baseSeat + 'A'] = [cardA];
  state.hands[baseSeat + 'B'] = [cardB];
  delete state.hands[baseSeat];

  // Hide main hand, show split containers
  if (state.handContainers && state.handContainers[baseSeat]) {
    state.handContainers[baseSeat].style.display = 'none';
  }
  
  if (state.splitContainers && state.splitContainers[baseSeat]) {
    state.splitContainers[baseSeat].style.display = 'flex';
  }

  // Update card elements
  if (cardA.element) {
    cardA.element.dataset.seat = baseSeat + 'A';
    const aContainer = document.getElementById(`hand-${baseSeat}A`);
    if (aContainer) aContainer.appendChild(cardA.element);
  }
  
  if (cardB.element) {
    cardB.element.dataset.seat = baseSeat + 'B';
    const bContainer = document.getElementById(`hand-${baseSeat}B`);
    if (bContainer) bContainer.appendChild(cardB.element);
  }
}

// Export functions
export { addCard, removeLastCardFromActiveHand, performSplit };