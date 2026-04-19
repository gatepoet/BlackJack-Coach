// Constants and shared state for BlackJack Coach
export const SHOE_DECKS = 8;
export const TOTAL_CARDS = SHOE_DECKS * 52;

export const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

let acesLeftVal = 0;
Object.defineProperty(globalThis, 'acesLeft', {
  get: () => acesLeftVal,
  set: v => { acesLeftVal = v; },
  configurable: true,
});

// Strategy constants
export const EDGE_PER_TC = 0.005;
export const VAR = 1.329;
let RA_FACTOR_VAL = 0.5;
Object.defineProperty(globalThis, 'RA_FACTOR', {
  get: () => RA_FACTOR_VAL,
  set: v => { RA_FACTOR_VAL = v; },
  configurable: true,
});

// State object - all mutable game state lives here
export const state = {
  remaining: {},
  aceRC: 0,
  cardsDealt: 0,
  insuranceResolved: false,
  lastAddedCard: null,
  counts: { HiLo: { rc: 0 }, APC: { rc: 0 }, Zen: { rc: 0 }, OmegaII: { rc: 0 } },
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
