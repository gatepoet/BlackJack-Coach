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
    HiLo: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1,'J':-1,'Q':-1,'K':-1},
    APC:  {'A':0,'2':1,'3':1,'4':2,'5':3,'6':2,'7':2,'8':1,'9':-3,'10':-4,'J':-4,'Q':-4,'K':-4},
    Zen: {'A':-1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':1,'8':0,'9':0,'10':-2,'J':-2,'Q':-2,'K':-2},
    OmegaII: {'A':-2,'2':1,'3':1,'4':2,'5':3,'6':2,'7':1,'8':-1,'9':-1,'10':-2,'J':-2,'Q':-2,'K':-2}
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
  order: ['dealer', '7', '6', '5', '4', '3', '2', '1'],
  // Session/hand tracking (runtime)
  lastBetUnits: 0,
  lastBetDollar: 0,
  handSettled: false,
  // Wong state persistence tracking (advisory system)
  currentHandWongState: null,   // wong state active during the current hand
  lastWongState: null,          // wong state from previous hand
  wongExitStreak: 0,            // consecutive "exit" hands
  wongEnterStreak: 0,           // consecutive "enter" hands
  wongAdvisoryMessage: ''       // user-facing advisory text
};

// ── Bankroll tier configuration for adaptive betting ────────────────────────
// Tiered approach: small bankrolls use conservative Kelly fractions and
// capped multipliers to minimize ruin risk while preserving growth potential.
export const BANKROLL_TIERS = [
  { max: 200,   kellyFrac: 0.25, baseMult: 1.5, maxTC: 4,  floorPct: 0.05 },
  { max: 300,   kellyFrac: 0.25, baseMult: 1.5, maxTC: 4,  floorPct: 0.05 },
  { max: 500,   kellyFrac: 0.33, baseMult: 2.0, maxTC: 5,  floorPct: 0.03 },
  { max: 1000,  kellyFrac: 0.40, baseMult: 2.5, maxTC: 6,  floorPct: 0.02 },
  { max: 5000,  kellyFrac: 0.50, baseMult: 3.0, maxTC: 7,  floorPct: 0.01 },
  { max: Infinity, kellyFrac: 0.50, baseMult: 3.0, maxTC: 7,  floorPct: 0.005 }
];

/**
 * Return tier parameters for the given bankroll.
 * Always returns a valid tier object.
 */
export function getTierParams(bankroll) {
  const tier = BANKROLL_TIERS.find(t => bankroll <= t.max);
  return tier || BANKROLL_TIERS[BANKROLL_TIERS.length - 1];
}

/**
 * Compute dynamic minimum bet floor as percentage of bankroll.
 * Ensures meaningful exposure on very small bankrolls while respecting
 * table minimums via ceil() to nearest unit.
 */
export function getBetFloor(bankroll, betUnit) {
  const params = getTierParams(bankroll);
  const floorDollars = bankroll * params.floorPct;
  return Math.max(1, Math.ceil(floorDollars / betUnit));
}

// ── Session management ───────────────────────────────────────────────────────
export const SESSION_CONFIG = {
  stopLossPercent: 0.30,   // Exit session if down 30% from session high
  winGoalPercent: 0.50,    // Exit session if up 50% from session start
  maxSessionHands: 200     // Hard cap to prevent fatigue
};

let sessionState = {
  active: false,
  bankroll: 0,      // Session starting bankroll (portion of total)
  handsPlayed: 0,
  highWater: 0,
  exitReason: null
};

// Export for ES module imports
export const session = sessionState;

Object.defineProperty(globalThis, 'session', {
  get: () => sessionState,
  set: v => { sessionState = v; },
  configurable: true
});

export function startSession(totalBankroll, fraction = 1.0) {
  sessionState.active = true;
  sessionState.bankroll = totalBankroll * fraction;
  sessionState.startBR = sessionState.bankroll;
  sessionState.handsPlayed = 0;
  sessionState.highWater = sessionState.bankroll;
  sessionState.exitReason = null;
  console.log(`[Session] Started: $${sessionState.bankroll.toFixed(2)}`);
}

export function endSession(reason) {
  sessionState.active = false;
  sessionState.exitReason = reason;
  console.log(`[Session] Ended: ${reason}`);
  return reason;
}

/**
 * Update session state after a hand result.
 * @param {number} netWin — net change in session bankroll from this hand
 * @returns {'CONTINUE'|'EXIT_SESSION'} 
 */
export function updateSession(netWin) {
  if (!sessionState.active) return 'CONTINUE';
  
  sessionState.handsPlayed++;
  sessionState.bankroll += netWin;
  
  // Stop-loss: down 30% from session high water
  const lossThreshold = sessionState.highWater * (1 - SESSION_CONFIG.stopLossPercent);
  if (sessionState.bankroll <= lossThreshold) {
    endSession('STOP_LOSS');
    return 'EXIT_SESSION';
  }
  
  // Win-goal: up 50% from session start
  const winTarget = sessionState.startBR * (1 + SESSION_CONFIG.winGoalPercent);
  if (sessionState.bankroll >= winTarget) {
    endSession('WIN_GOAL');
    return 'EXIT_SESSION';
  }
  
  // Max hands reached
  if (sessionState.handsPlayed >= SESSION_CONFIG.maxSessionHands) {
    endSession('MAX_HANDS');
    return 'EXIT_SESSION';
  }
  
  sessionState.highWater = Math.max(sessionState.highWater, sessionState.bankroll);
  return 'CONTINUE';
}

// ── Wong streak tracking for actionable advisories ───────────────────────────
/**
 * Update consecutive-hand counters for Wong exit/enter states.
 * Call once per completed hand with the wongState that was active
 * during that hand's decision-making.
 *
 * Generates user-facing advisory based on streak thresholds:
 *   exit ×3 → "WONG OUT: Consider leaving shoe"
 *   exit ×2 → "WARNING: Unfavorable count — bet minimum"
 *   enter ×2 → "Positive count — increase buy-in if appropriate"
 */
export function updateWongStreak(handWongState) {
  if (!handWongState) return; // No hand data available

  const { lastWongState, wongExitStreak, wongEnterStreak } = state;

  if (handWongState === lastWongState) {
    // Same regime persists — increment appropriate streak
    if (handWongState === 'exit') state.wongExitStreak = (state.wongExitStreak || 0) + 1;
    else if (handWongState === 'enter') state.wongEnterStreak = (state.wongEnterStreak || 0) + 1;
  } else {
    // Regime changed — reset both, start new streak at 1
    state.wongExitStreak = handWongState === 'exit' ? 1 : 0;
    state.wongEnterStreak = handWongState === 'enter' ? 1 : 0;
  }

  state.lastWongState = handWongState;

  // Generate advisory message
  let advisory = '';
  if (state.wongExitStreak >= 3) {
    advisory = `WONG OUT: Count negative for ${state.wongExitStreak} hands — consider leaving shoe after this hand`;
  } else if (state.wongExitStreak >= 2) {
    advisory = `WARNING: Unfavorable count (${state.wongExitStreak} hands) — bet minimum, prepare to Wong out`;
  } else if (state.wongEnterStreak >= 2) {
    advisory = `POSITIVE: Count favorable for ${state.wongEnterStreak} hands — consider increasing buy-in`;
  }
  state.wongAdvisoryMessage = advisory;

  // Notify UI update callback
  if (typeof window.updateWongAdvisory === 'function') {
    try { window.updateWongAdvisory(); } catch (e) {}
  }
}

/**
 * Clear the current-hand wong state marker.
 * Called at hand settlement to prevent double-counting.
 */
export function clearCurrentHandWongState() {
  state.currentHandWongState = null;
}

// Peak reference for drawdown protection (not yet in use)
let peakBankrollVal = 10000;
Object.defineProperty(globalThis, 'peakBankroll', {
  get: () => peakBankrollVal,
  set: v => { peakBankrollVal = v; },
  configurable: true
});

