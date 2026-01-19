import { initRemaining, pickSuit } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit } from './modules/cardHandler.js';
import { getFirstPlayingSeat, disableSeat, moveLeft, moveRight } from './modules/seatManager.js';
import { initCombinedChart } from './modules/charting.js';
import { buildTable, updateSplitButtonVisibility } from './modules/uiManager.js';
import { setInputTarget } from './modules/inputHandler.js';

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
  counts: { HiLo: { rc: 0 }, APC: { rc: 0 }, Zen: { rc: 0 }, OmegaII: { rc: 0 }},
  map: {
    HiLo: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1},
    APC:  {'A':0,'2':1,'3':1,'4':2,'5':3,'6':2,'7':2,'8':1,'9':-3,'10':-4},
    Zen: {'A':-1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':1,'8':0,'9':0,'10':-2},
    OmegaII: {'A':-2,'2':1,'3':1,'4':2,'5':3,'6':2,'7':1,'8':-1,'9':-1,'10':-2}
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
// Initialize the state.remaining counts for a fresh shoe
buildTable(state);
initCombinedChart();
initRemaining(state);