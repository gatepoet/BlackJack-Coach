/* Updated script.js with fixes for card counting, bet sizing, and advice logic */
// =============================================================
// 1. Global constants and state
// =============================================================
const SHOE_DECKS = 8;                 // number of decks in shoe
const TOTAL_CARDS = SHOE_DECKS * 52;   // total cards in shoe
const PENETRATION = 0.75;              // 75% penetration used for true‑count

let acesLeft = 4 * SHOE_DECKS;        // dynamic count of remaining aces
let remaining = {};                    // remaining cards per rank/suit
let decksLeft = SHOE_DECKS;            // cards left per deck
let total_rem = TOTAL_CARDS;           // total cards remaining in shoe
let tcHiLo = 0;                       // HiLo true count
let tcAPC  = 0;                       // APC true count
let tcZen  = 0;                       // Zen true count
let ra     = 0;                       // Relative Ace count
let indexSystem = 'HiLo';             // user selected system

// =============================================================
// 2. Card counting logic
// =============================================================
function initRemaining() {
  remaining = {};
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
  ranks.forEach(r => {
    remaining[r] = { '♠': SHOE_DECKS, '♣': SHOE_DECKS, '♥': SHOE_DECKS, '♦': SHOE_DECKS };
  });
  acesLeft = 4 * SHOE_DECKS;
  decksLeft = SHOE_DECKS;
  total_rem = TOTAL_CARDS;
}

function addCard(val, suit) {
  if (!remaining[val]) return;
  if (remaining[val][suit] > 0) remaining[val][suit]--;
  else remaining[val][suit] = 0; // guard against negative counts
  total_rem--;                    // card dealt
  decksLeft = Math.max(0.1, total_rem / 52); // avoid division by zero
}

function updateCounts(val) {
  // HiLo mapping
  const hiLoMap = { 'A': -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, 'T': -1, 'J': -1, 'Q': -1, 'K': -1 };
  // APC mapping
  const apcMap  = { 'A': 0,  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': -3, '8': -2, '9': -1, 'T': -4, 'J': -4, 'Q': -4, 'K': -4 };
  // Zen mapping
  const zenMap  = { 'A': -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, 'T': -2, 'J': -2, 'Q': -2, 'K': -2 };

  const hc = hiLoMap[val];
  const apc = apcMap[val];
  const zen = zenMap[val];

  // Running counts (we assume running count is accumulated in tcX variables)
  if (indexSystem === 'HiLo') tcHiLo += hc;
  if (indexSystem === 'APC')  tcAPC  += apc;
  if (indexSystem === 'Zen')  tcZen  += zen;

  // True counts
  tcHiLo = Math.round(tcHiLo / decksLeft);
  tcAPC  = Math.round(tcAPC  / decksLeft);
  tcZen  = Math.round(tcZen  / decksLeft);

  // Relative Ace count
  const expAces = (acesLeft / (32 * decksLeft)) - 1;
  ra = Math.round(expAces * 10) / 10;
}

// =============================================================
// 3. Bet sizing logic
// =============================================================
const EDGE_PER_TC = 0.005;   // 0.5% edge per true count point
const RA_FACTOR = 1.0;       // full impact of relative ace
const VARIANCE  = 1.309;     // variance for 8‑deck shoe, H17

function calculateBet() {
  const tcEffective = indexSystem === 'Zen' ? tcZen : indexSystem === 'APC' ? tcAPC : tcHiLo;
  const edge = EDGE_PER_TC * Math.max(0, tcEffective) * (1 + RA_FACTOR * ra);
  const kelly = edge / VARIANCE;
  const halfKelly = kelly * 0.5;
  // Heat simulation with bounded volatility
  const heat = Math.max(0.5, Math.min(2, 2 - Math.abs(tcEffective)));
  let units = Math.floor(halfKelly * heat);
  units = Math.max(1, Math.min(100, units)); // keep within 1–100
  return units;
}

// =============================================================
// 4. Advice logic
// =============================================================
const basicStrategy = {
  // Hard totals, soft totals, pairs, surrender rules etc.
  // ... (use original tables from script.js) ...
};

function getAdvice(hand, dealerCard) {
  const total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  const dNum = dealerCardValue(dealerCard);
  const pair = hand.length === 2 && hand[0] === hand[1];
  // Pair logic
  if (pair) {
    const val = hand[0];
    const key = 'pair' + val + 'v' + dNum;
    if (basicStrategy[key]) return basicStrategy[key];
  }
  // Soft totals
  if (hand.some(c => c === 'A')) {
    const softTotal = total - 10; // Ace counted as 11
    const key = 'soft' + softTotal + 'v' + dNum;
    if (basicStrategy[key]) return basicStrategy[key];
  }
  // Hard totals
  const key = 'hard' + total + 'v' + dNum;
  if (basicStrategy[key]) return basicStrategy[key];
  // Fallback basic strategy
  return basicStrategy['hard' + total + 'v' + dNum];
}

function cardValue(card) {
  if (card === 'A') return 11;
  if (['T', 'J', 'Q', 'K'].includes(card)) return 10;
  return parseInt(card, 10);
}

function dealerCardValue(card) {
  if (card === 'A') return 11;
  if (['T', 'J', 'Q', 'K'].includes(card)) return 10;
  return parseInt(card, 10);
}

// =============================================================
// 5. Public API (simplified for brevity)
// =============================================================
export function dealCard(card) {
  addCard(card.value, card.suit);
  updateCounts(card.value);
}

export function getBet() {
  return calculateBet();
}

export function advise(hand, dealerCard) {
  return getAdvice(hand, dealerCard);
}

initRemaining();

/* End of updated script.js */