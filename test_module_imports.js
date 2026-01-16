// Test script to verify ES module imports are working
import { initRemaining, pickSuit } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit } from './modules/cardHandler.js';
import { setInputTarget } from './modules/inputHandler.js';
import { buildTable, updateSplitButtonVisibility, moveCard } from './modules/uiManager.js';

console.log('All imports successful!');
console.log('deck.js exports:', typeof initRemaining, typeof pickSuit);
console.log('cardHandler.js exports:', typeof addCard, typeof removeLastCardFromActiveHand, typeof performSplit);
console.log('inputHandler.js exports:', typeof setInputTarget);
console.log('uiManager.js exports:', typeof buildTable, typeof updateSplitButtonVisibility, typeof moveCard);