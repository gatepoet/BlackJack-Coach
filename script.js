import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const SHOE_DECKS = 8;
const TOTAL_CARDS = SHOE_DECKS * 52;
const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

// Single state object to hold all mutable data
const state = {
  remaining: {},
  aceRC: 0,                  // Ace side-count
  cardsDealt: 0,
  insuranceResolved: false,
  lastAddedCard: null,
  counts: { WongHalves: { rc: 0 }},
  map: {
    WongHalves: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':1,'8':0.5,'9':-0.5,'10':-1}
  },
  YOUR_SEAT: '1',
  inputTarget: '1',
  activeSplit: null,
  disabledSeats: new Set(),
  useCompDep: false,
  useHeatSim: false,
  indexSystem: 'Basic',
  useKelly: true,
  hands: { dealer: [] },
  handContainers: {},
  splitContainers: {},
  splitButtons: {},
  rankOrder: ['A','2','3','4','5','6','7','8','9','10','J','Q','K'],
  suitMap: {'s':'spades','d':'diamonds','x':'hearts','c':'clubs'},
  symMap: {'spades':'♠','hearts':'♥','diamonds':'♦','clubs':'♣'},
  straightTriples: [
    ['A','2','3'],['2','3','4'],['3','4','5'],['4','5','6'],['5','6','7'],
    ['6','7','8'],['7','8','9'],['8','9','10'],['9','10','J'],['10','J','Q'],
    ['J','Q','K'],['Q','K','A']
  ],
  order: ['dealer', '7', '6', '5', '4', '3', '2', '1']
};

// Import modules
const { initRemaining, pickSuit } = require('./modules/deck');
const { addCard, removeLastCardFromActiveHand, performSplit } = require('./modules/cardHandler');
const { getFirstPlayingSeat, disableSeat, moveLeft, moveRight } = require('./modules/seatManager');
const { initCombinedChart } = require('./modules/charting');
const { buildTable, updateSplitButtonVisibility } = require('./modules/uiManager');
const { setInputTarget } = require('./modules/inputHandler');

// Initialize the state.remaining counts for a fresh shoe
initRemaining();

// Function to calculate true count
function calculateTrueCount() {
  const runningCount = state.counts.WongHalves.rc;
  const decksRemaining = SHOE_DECKS - (state.cardsDealt / 52);
  return decksRemaining > 0 ? runningCount / decksRemaining : 0;
}

// Function to update UI elements
function updateUI() {
  // Update counts display
  const rcElement = document.getElementById('wongHalvesRC');
  const tcElement = document.getElementById('wongHalvesTC2');
  
  if (rcElement) {
    rcElement.textContent = state.counts.WongHalves.rc.toFixed(1);
  }
  
  if (tcElement) {
    const trueCount = calculateTrueCount();
    tcElement.textContent = trueCount.toFixed(2);
  }
  
  // Update decks left
  const decksLeftElement = document.getElementById('decksLeft');
  if (decksLeftElement) {
    const decksRemaining = SHOE_DECKS - (state.cardsDealt / 52);
    decksLeftElement.textContent = decksRemaining.toFixed(2);
  }
  
  // Update penetration
  const penetrationElement = document.getElementById('penetration');
  if (penetrationElement) {
    const penetration = (state.cardsDealt / TOTAL_CARDS) * 100;
    penetrationElement.textContent = penetration.toFixed(1) + '%';
  }
  
  // Update RA (running average)
  const raElement = document.getElementById('ra');
  if (raElement) {
    raElement.textContent = state.aceRC.toFixed(2);
  }
  
  // Update RoR (Risk of Ruin)
  const rorElement = document.getElementById('ror');
  if (rorElement) {
    // Simple RoR calculation based on running count and decks
    const trueCount = calculateTrueCount();
    const ror = 100 * Math.min(1, Math.max(0, 0.5 - 0.05 * trueCount));
    rorElement.textContent = ror.toFixed(2) + '%';
  }
}