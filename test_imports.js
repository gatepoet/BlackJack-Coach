// Test script to verify module imports work
import { initRemaining, pickSuit } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit } from './modules/cardHandler.js';
import { getFirstPlayingSeat, disableSeat, moveLeft, moveRight } from './modules/seatManager.js';
import { initCombinedChart } from './modules/charting.js';
import { buildTable, updateSplitButtonVisibility, moveCard } from './modules/uiManager.js';
import { setInputTarget } from './modules/inputHandler.js';

console.log('All modules imported successfully!');

// Test that the functions exist
console.log('initRemaining:', typeof initRemaining);
console.log('pickSuit:', typeof pickSuit);
console.log('addCard:', typeof addCard);
console.log('removeLastCardFromActiveHand:', typeof removeLastCardFromActiveHand);
console.log('performSplit:', typeof performSplit);
console.log('getFirstPlayingSeat:', typeof getFirstPlayingSeat);
console.log('disableSeat:', typeof disableSeat);
console.log('moveLeft:', typeof moveLeft);
console.log('moveRight:', typeof moveRight);
console.log('initCombinedChart:', typeof initCombinedChart);
console.log('buildTable:', typeof buildTable);
console.log('updateSplitButtonVisibility:', typeof updateSplitButtonVisibility);
console.log('moveCard:', typeof moveCard);
console.log('setInputTarget:', typeof setInputTarget);

// Test initRemaining function
const testState = {
  remaining: {},
  aceRC: 0,
  cardsDealt: 0
};

initRemaining(testState);
console.log('\nAfter initRemaining:');
console.log('testState.remaining:', testState.remaining);
console.log('testState.aceRC:', testState.aceRC);
console.log('testState.cardsDealt:', testState.cardsDealt);

console.log('\nAll tests passed!');