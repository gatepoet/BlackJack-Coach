// Module: strategy - Decision engine, betting calculations, and updateAll
import { state, suits, SHOE_DECKS, TOTAL_CARDS, EDGE_PER_TC, VAR } from './state.js';
import { updateCombinedChart } from './charting.js';

// Composition-dependent overrides (empty - can be extended)
const compOverrides = {};

const i18 = {
  // Insurance
  'INSvA': { index: 3,  zen: 5,  apc: 3,  omega: 6,  action: 'INSURE', class: 'adv-insure' },

  // ==================== HARD DOUBLES (9–11) ====================
  '9v2':  { index: 1,  zen: 2,  apc: 0,  omega: 1,  action: 'DOUBLE', class: 'adv-double' },
  '9v3':  { index: 0,  zen: 0,  apc: 0,  omega: 0,  action: 'DOUBLE', class: 'adv-double' },
  '9v4':  { index: -1,  zen: -1, apc: 0,  omega: -1, action: 'DOUBLE', class: 'adv-double' },
  '9v5':  { index: -2, zen: -2, apc: 0,  omega: -2, action: 'DOUBLE', class: 'adv-double' },
  '9v6':  { index: -3, zen: -3, apc: 0,  omega: -3, action: 'DOUBLE', class: 'adv-double' },
  '9v7':  { index: 3,  zen: 7,  apc: 4,  omega: 4,  action: 'DOUBLE', class: 'adv-double' },

  '10v2':  { index: 4, zen: 6, apc: 3, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  '10v3':  { index: 3, zen: 5, apc: 2, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  '10v4':  { index: 2, zen: 3, apc: 1, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  '10v5':  { index: 1, zen: 2, apc: 0, omega: -1, action: 'DOUBLE', class: 'adv-double' },
  '10v6':  { index: 0, zen: 1, apc: 0, omega: -2, action: 'DOUBLE', class: 'adv-double' },
  '10v9':  { index: 4, zen: 6, apc: 3, omega: 5, action: 'DOUBLE', class: 'adv-double' },
  '10v10': { index: 4, zen: 7, apc: 3, omega: 6, action: 'DOUBLE', class: 'adv-double' },
  '10vA':  { index: 4, zen: 5, apc: 2, omega: 7, action: 'DOUBLE', class: 'adv-double' },

  '11v2':  { index: 1, zen: 2, apc: 1, omega: 3, action: 'DOUBLE', class: 'adv-double' },
  '11v3':  { index: 1, zen: 2, apc: 0, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  '11v4':  { index: 1, zen: 1, apc: 0, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  '11v5':  { index: 0, zen: 1, apc: 0, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  '11v6':  { index: 0, zen: 0, apc: 0, omega: -1, action: 'DOUBLE', class: 'adv-double' },
  '11v10': { index: 1, zen: 2, apc: -1, omega: -5, action: 'DOUBLE', class: 'adv-double' },
  '11vA':  { index: 1, zen: 2, apc: -1, omega: 2, action: 'DOUBLE', class: 'adv-double' },

  // ==================== HARD STANDS (12–17) ====================
  '12v2': { index: 3, zen: 6, apc: 3, omega: 5, action: 'STAND', class: 'adv-stand' },
  '12v3': { index: 2, zen: 3, apc: 3, omega: 2, action: 'STAND', class: 'adv-stand' },
  '12v4': { index: 0, zen: 1, apc: 1, omega: 0, action: 'STAND', class: 'adv-stand' },
  '12v5': { index: -2, zen: -2, apc: -1, omega: -2, action: 'STAND', class: 'adv-stand' },
  '12v6': { index: -1, zen: -1, apc: 0, omega: -2, action: 'STAND', class: 'adv-stand' },

  '13v2': { index: -1, zen: -2, apc: -1, omega: -1, action: 'STAND', class: 'adv-stand' },

  '14v10': { index: 6, zen: 9, apc: 6, omega: 3, action: 'STAND', class: 'adv-stand' },
  '14vA':  { index: 5, zen: 7, apc: 4, omega: 4, action: 'STAND', class: 'adv-stand' },

  '15v9':  { index: 5, zen: 8, apc: 9, omega: -4, action: 'STAND', class: 'adv-stand' },
  '15v10': { index: 4, zen: 12, apc: 3, omega: 6, action: 'STAND', class: 'adv-stand' },
  '15vA':  { index: 2, zen: 3, apc: 2, omega: 3, action: 'STAND', class: 'adv-stand' },

  '16v9':  { index: 5, zen: 8, apc: 0, omega: 7, action: 'STAND', class: 'adv-stand' },
  '16v10': { index: 0, zen: 0, apc: 0, omega: 0, action: 'STAND', class: 'adv-stand' },
  '16vA':   { index: 3, zen: -1, apc: 6, omega: 3, action: 'STAND', class: 'adv-stand' },

  '17vA':  { index: -6, zen: -6, apc: -1, omega: -6, action: 'STAND', class: 'adv-stand' },

  // ==================== SOFT DOUBLES ====================
  'A2v5': { index: 2, zen: 3, apc: 1, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  'A2v6': { index: 1, zen: 2, apc: 0, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A3v5': { index: 1, zen: 2, apc: 0, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A3v6': { index: 0, zen: 1, apc: 0, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  'A4v4': { index: 2, zen: 3, apc: 1, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A4v5': { index: 1, zen: 2, apc: 0, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  'A4v6': { index: 0, zen: 1, apc: 0, omega: -1, action: 'DOUBLE', class: 'adv-double' },
  'A5v4': { index: 1, zen: 2, apc: 0, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  'A5v5': { index: 0, zen: 1, apc: 0, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A5v6': { index: -1, zen: 0, apc: -1, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  'A6v3': { index: 1, zen: 2, apc: -3, omega: 4, action: 'DOUBLE', class: 'adv-double' },
  'A6v4': { index: 0, zen: 1, apc: 0, omega: 3, action: 'DOUBLE', class: 'adv-double' },
  'A6v5': { index: -1, zen: 0, apc: -1, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  'A6v6': { index: -2, zen: -1, apc: -2, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A7v2': { index: 3, zen: 4, apc: 1, omega: 3, action: 'DOUBLE', class: 'adv-double' },
  'A7v3': { index: 2, zen: 3, apc: 0, omega: 2, action: 'DOUBLE', class: 'adv-double' },
  'A7v4': { index: 1, zen: 2, apc: 0, omega: 1, action: 'DOUBLE', class: 'adv-double' },
  'A7v5': { index: 0, zen: 1, apc: 0, omega: 0, action: 'DOUBLE', class: 'adv-double' },
  'A7v6': { index: -1, zen: 0, apc: -1, omega: -1, action: 'DOUBLE', class: 'adv-double' },

  // ==================== PAIR SPLITS ====================
  'pair2v10': { index: -2, zen: -3, apc: -2, omega: -6, action: 'SPLIT', class: 'adv-split' },
  'pair3v8':  { index: 4, zen: 6, apc: 3, omega: 4, action: 'SPLIT', class: 'adv-split' },
  'pair4v5':  { index: 1, zen: 2, apc: 1, omega: -1, action: 'SPLIT', class: 'adv-split' },
  'pair4v6':  { index: 0, zen: 1, apc: -2, omega: -2, action: 'SPLIT', class: 'adv-split' },
  'pair6v5':  { index: 0, zen: 1, apc: -2, omega: -1, action: 'SPLIT', class: 'adv-split' },
  'pair7v10': { index: -1, zen: -1, apc: 0, omega: -6, action: 'SPLIT', class: 'adv-split' },
  'pair8v6':  { index: 2, zen: 3, apc: 2, omega: 0, action: 'SPLIT', class: 'adv-split' },
  'pair9v7':  { index: 3, zen: 5, apc: 2, omega: 5, action: 'SPLIT', class: 'adv-split' },
  'pair10v5': { index: 5, zen: 10, apc: 5, omega: 9, action: 'SPLIT', class: 'adv-split' },
  'pair10v6': { index: 4, zen: 9, apc: 6, omega: 8, action: 'SPLIT', class: 'adv-split' },

  // ==================== SURRENDER (STAND deviation from SURRENDER) ====================
  '15vs10': { index: 4, zen: 0, apc: 0, omega: 6, action: 'STAND', class: 'adv-stand' },
  '15vsA':  { index: 2, zen: 3, apc: 2, omega: 3, action: 'STAND', class: 'adv-stand' },
  '16vs9':  { index: 1, zen: 1, apc: 2, omega: 1, action: 'STAND', class: 'adv-stand' },
  '16vs10': { index: 0, zen: -5, apc: 0, omega: 0, action: 'STAND', class: 'adv-stand' },
  '16vsA':  { index: 3, zen: -1, apc: 6, omega: 3, action: 'STAND', class: 'adv-stand' }
};

// Helper for basic surrender (8-deck S17)
function basicActionWouldBeSurr(total, dValStr) {
  return (total === 15 || total === 16) && (dValStr === '10' || dValStr === 'A');
}

export function getNonAceValue(hand) {
  const nonAces = hand.filter(c => c.value !== 'A').map(c => c.value);
  if (nonAces.length === 0) return null; // AA pair
  if (nonAces.length === 1) return nonAces[0];
  // For multi non-ace soft (rare, e.g., A+multi), use total-11 as proxy key
  const nonAceTotal = nonAces.reduce((sum, v) => sum + (['10','J','Q','K'].includes(v) ? 10 : +v), 0);
  return nonAceTotal.toString(); // e.g., '7' for A+2+5
}

function getOmegaRamp(tc) {
  if (tc <= 0) return 1;
  if (tc < 2) return 2;
  if (tc < 3) return 4;
  if (tc < 4) return 6;
  if (tc < 5) return 8;
  return 12; // +5+
}

function computeTotal(hand) {
  if (!hand || hand.length === 0) return { total: 0, bust: false, soft: false };
  let total = 0, aces = 0;
  for (const c of hand) {
    const v = c.value === 'A' ? 11 : (['10','J','Q','K'].includes(c.value) ? 10 : +c.value);
    total += v;
    if (c.value === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, bust: total > 21, soft: aces > 0 && total <= 21 };
}

function getComposition(hand) {
  if (!state.useCompDep) return null;
  const values = hand.map(c => c.value).sort();
  const nonAces = values.filter(v => v !== 'A').join('-');
  const aces = values.filter(v => v === 'A').length;
  return aces ? `${nonAces}-A${aces}` : nonAces; // Updated for aces in comp
}

export function computePPEV(pPerfect=25, pColored=12, pMixed=6) {
  let t = 0;
  state.rankOrder.forEach(r => suits.forEach(s => t += state.remaining[r][s] || 0));
  if (t < 5) return -1;
  const denom = t * (t - 1);
  let totalPair = 0, perfect = 0, colored = 0;
  state.rankOrder.forEach(r => {
    let numR = 0, numRed = 0, numBlack = 0, perfRed = 0, perfBlack = 0;
    ['hearts', 'diamonds'].forEach(s => {
      let ns = state.remaining[r][s] || 0;
      numR += ns; numRed += ns; perfRed += ns * (ns - 1);
    });
    ['spades', 'clubs'].forEach(s => {
      let ns = state.remaining[r][s] || 0;
      numR += ns; numBlack += ns; perfBlack += ns * (ns - 1);
    });
    totalPair += numR * (numR - 1);
    colored += numRed * (numRed - 1) - perfRed + numBlack * (numBlack - 1) - perfBlack;
    perfect += perfRed + perfBlack;
  });
  let mixed = totalPair - perfect - colored;
  let num = perfect * pPerfect + colored * pColored + mixed * pMixed;
  return num / denom - 1;
}

export function compute21p3EV(pays = {suited3:100, sf:40, three:30, str:10, flush:5}) {
  let t = 0;
  state.rankOrder.forEach(r => suits.forEach(s => t += state.remaining[r][s] || 0));
  if (t < 5) return -1;
  const denom = t * (t - 1) * (t - 2);
  let pSuited3 = 0;
  state.rankOrder.forEach(r => suits.forEach(s => {
    let ns = state.remaining[r][s] || 0;
    pSuited3 += ns * (ns - 1) * (ns - 2);
  }));
  let pSF = 0;
  state.straightTriples.forEach(triple => suits.forEach(s => {
    let p1 = state.remaining[triple[0]][s] || 0;
    let p2 = state.remaining[triple[1]][s] || 0;
    let p3 = state.remaining[triple[2]][s] || 0;
    pSF += p1 * p2 * p3 * 6;
  }));
  let pThree = 0;
  state.rankOrder.forEach(r => {
    let nr = 0; suits.forEach(s => nr += state.remaining[r][s] || 0);
    pThree += nr * (nr - 1) * (nr - 2);
  });
  let pRegThree = pThree - pSuited3;
  let pTotStr = 0;
  state.straightTriples.forEach(triple => {
    let n1 = 0, n2 = 0, n3 = 0;
    suits.forEach(s => {
      n1 += state.remaining[triple[0]][s] || 0;
      n2 += state.remaining[triple[1]][s] || 0;
      n3 += state.remaining[triple[2]][s] || 0;
    });
    pTotStr += n1 * n2 * n3 * 6;
  });
  let pStr = pTotStr - pSF;
  let pTotFlush = 0;
  suits.forEach(s => {
    let ns = 0; state.rankOrder.forEach(r => ns += state.remaining[r][s] || 0);
    pTotFlush += ns * (ns - 1) * (ns - 2);
  });
  let pFlush = pTotFlush - pSF - pSuited3;
  let num = pSuited3 * pays.suited3 + pSF * pays.sf + pRegThree * pays.three + pStr * pays.str + pFlush * pays.flush;
  return num / denom - 1;
}

export function getPlayAdvice(tcHiLo, tcZen, tcAPC, tcOmegaII) {
  const dealerCard = state.hands.dealer[0]?.value || null;
  const hand = state.activeSplit ? state.hands[state.activeSplit] : state.hands[state.YOUR_SEAT];
  if (!dealerCard || !hand || hand.length < 2) return 'Waiting for your hand...';
  const label = state.activeSplit ? ` Split ${state.activeSplit.slice(-1)}` : '';
  const upcard = dealerCard;
  const dValStr = (['10','J','Q','K'].includes(upcard) ? '10' : upcard);
  const dNum = upcard === 'A' ? 11 : (['10','J','Q','K'].includes(upcard) ? 10 : +upcard);

  const comp = getComposition(hand);
  if (comp && compOverrides[comp]?.[dValStr]) {
    const action = compOverrides[comp][dValStr];
    const cls = {
      'HIT': 'adv-hit',
      'STAND': 'adv-stand',
      'DOUBLE': 'adv-double',
      'SPLIT': 'adv-split',
      'SURRENDER': 'adv-surrender'
    }[action] || 'adv-hit';
    return `<span class="${cls}">${action}</span>${label}`;
  }

  let total = 0, aces = 0;
  const isPair = hand.length === 2 && hand[0].value === hand[1].value;
  let pairVal = null;
  if (isPair) pairVal = hand[0].value;
  for (const c of hand) {
    const v = c.value === 'A' ? 11 : (['10','J','Q','K'].includes(c.value) ? 10 : +c.value);
    total += v;
    if (c.value === 'A') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  const soft = aces > 0 && total <= 21 && !isPair;

  const systemKey = state.indexSystem?.toLowerCase().replace(' ', '').replace('ii', 'i') || 'index'; // Fixed
  let tcEffective = systemKey === 'zen' ? tcZen : systemKey === 'apc' ? tcAPC : systemKey === 'omega' ? tcOmegaII : tcHiLo;

  let key;
  if (isPair) {
    key = `pair${pairVal === 'A' ? 'A' : (['10','J','Q','K'].includes(pairVal) ? 10 : +pairVal)}v${dValStr}`;
  } else if (soft) {
    const nonAce = getNonAceValue(hand);
    const nonAceStr = nonAce === 'A' ? 'A' : (['10','J','Q','K'].includes(nonAce) ? '10' : +nonAce);
    key = `A${nonAceStr}v${dValStr}`;
  } else {
    key = `${total}v${dValStr}`;
  }
  let entry = i18[key];
  if (entry && tcEffective >= (entry[systemKey] || entry.index)) {
    return `<span class="${entry.class}">${entry.action}</span>${label}`;
  }

  // Surr logic unchanged
  const possibleSurrHands = [
    {total: 15, up: ['10', 'A']},
    {total: 16, up: ['9', '10', 'A']},
    {total: 14, up: ['10']},
    {total: 17, up: ['A']}
  ];
  const isSurrCandidate = possibleSurrHands.some(h => h.total === total && h.up.includes(dValStr || upcard));
  if (isSurrCandidate) {
    const surrKey = `${total}vs${dValStr}`;
    entry = i18[surrKey];
    const surrIndex = entry ? (entry[systemKey] || entry.index) : 999;
    if (basicActionWouldBeSurr(total, dValStr) || (total === 14 && dValStr === '10') || (total === 17 && upcard === 'A')) {
      if (tcEffective >= surrIndex) {
        return `<span class="adv-stand">STAND</span>${label}`;
      }
      return `<span class="adv-surrender">SURRENDER</span>${label}`;
    }
  }

  // Basic fallback
  if (isPair) {
    const pVal = pairVal;
    if (pVal === 'A' || pVal === '8') return `<span class="adv-split">SPLIT</span>${label}`;
    if (['10','J','Q','K'].includes(pVal)) return `<span class="adv-stand">STAND</span>${label}`;
    if (pVal === '9') return (dNum >= 2 && dNum <= 6 || dNum === 8 || dNum === 9) ? `<span class="adv-split">SPLIT</span>${label}` : `<span class="adv-stand">STAND</span>${label}`;
    if (pVal === '7') return (dNum >= 2 && dNum <= 7) ? `<span class="adv-split">SPLIT</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
    if (pVal === '6') return (dNum >= 2 && dNum <= 6) ? `<span class="adv-split">SPLIT</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
    if (pVal === '5') return (dNum >= 2 && dNum <= 9) ? `<span class="adv-double">DOUBLE</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
    if (pVal === '4') return (dNum >= 5 && dNum <= 6) ? `<span class="adv-split">SPLIT</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
    if (pVal === '3' || pVal === '2') return (dNum >= 2 && dNum <= 7) ? `<span class="adv-split">SPLIT</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
    return `<span class="adv-hit">HIT</span>${label}`;
  }

  if (soft) {
    const softTotal = total;
    if (softTotal <= 17 && softTotal !== 18 && softTotal !== 19 && softTotal !== 20) return `<span class="adv-hit">HIT</span>${label}`; // A2-A6
    if (softTotal === 18) { // A7
      if (dNum >= 3 && dNum <= 6) return `<span class="adv-double">DOUBLE</span>${label}`;
      if (dNum === 7 || dNum === 8) return `<span class="adv-stand">STAND</span>${label}`;
      return `<span class="adv-hit">HIT</span>${label}`;
    }
    if (softTotal === 19 || softTotal === 20) return `<span class="adv-stand">STAND</span>${label}`; // Expanded A8/A9 STAND
    return `<span class="adv-stand">STAND</span>${label}`; // 21
  }

  // Hard totals unchanged
  if (total <= 8) return `<span class="adv-hit">HIT</span>${label}`;
  if (total === 9) return (dNum <= 3 || dNum === 2) ? `<span class="adv-hit">HIT</span>${label}` : `<span class="adv-double">DOUBLE</span>${label}`;
  if (total === 10) return (dNum <= 9 && dNum >= 2) ? `<span class="adv-double">DOUBLE</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
  if (total === 11) return (upcard !== 'A') ? `<span class="adv-double">DOUBLE</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
  if (total === 12) return (dNum >= 4 && dNum <= 6) ? `<span class="adv-stand">STAND</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
  if (total >= 13 && total <= 16) return (dNum >= 2 && dNum <= 6) ? `<span class="adv-stand">STAND</span>${label}` : `<span class="adv-hit">HIT</span>${label}`;
  return `<span class="adv-stand">STAND</span>${label}`;
}

// Precompute RoR table for fast lookup
let rorTable = null;

export function precomputeRoRTable() {
  console.log("Building RoR table...");
  const table = {};
  const v = VAR;
  const eptc = 0.005;

  for (let tc = -5; tc <= 10; tc += 0.5) {
    table[tc] = {};
    for (let units = 10; units <= 1000; units += 10) {
      const edge = Math.max(0, tc * eptc);
      const ror = edge <= 0 ? 100 : Math.min(99.99, 100 * Math.exp(-2 * edge * units / v));
      table[tc][units] = parseFloat(ror.toFixed(2));
    }
  }
  rorTable = table;
  console.log("RoR table ready (2000 entries)");
}

// Fast lookup
export function getCurrentRoR(bankroll, betUnit, edge) {
  if (!rorTable) return "—";
  if (edge <= 0) return "100%";

  const units = Math.max(10, Math.floor(bankroll / betUnit / 10) * 10);
  const tc = edge / 0.005;
  const tcKey = Math.round(tc * 2) / 2;

  const clampedTC = Math.max(-5, Math.min(10, tcKey));
  const row = rorTable[clampedTC];
  if (!row) return ">50%";

  const ror = row[units] ?? row[1000];
  return ror < 1 ? "<1%" : ror + "%";
}

// The big updateAll function - orchestrates all state updates and UI refreshes
export function updateAll() {
  let total_rem = 0;
  let rankTotals = state.rankOrder.map(r => {
    let tot = 0;
    suits.forEach(s => tot += state.remaining[r][s] || 0);
    total_rem += tot;
    return tot;
  });
  const decksLeft = Math.max(total_rem / 52, 0.01);
  let tcHiLo = decksLeft > 0.01 ? state.counts.HiLo.rc / decksLeft : 0;
  let tcAPC = decksLeft > 0.01 ? state.counts.APC.rc / decksLeft : 0;
  let tcZen = decksLeft > 0.01 ? state.counts.Zen.rc / decksLeft : 0;
  let tcOmegaII = decksLeft > 0.01 ? state.counts.OmegaII.rc / decksLeft : 0;
  let aceTC = decksLeft > 0.01 ? state.aceRC / decksLeft : 0;
  const pen = ((1 - total_rem / TOTAL_CARDS) * 100).toFixed(2);

  // Count aces in remaining deck
  state.acesLeft = 0;
  suits.forEach(s => state.acesLeft += state.remaining['A'][s] || 0);

  document.getElementById('penetration').textContent = pen + '%';
  document.getElementById('decksLeft').textContent = decksLeft.toFixed(2);
  document.getElementById('hiLoRC').textContent = state.counts.HiLo.rc;
  document.getElementById('hiLoTC').textContent = tcHiLo.toFixed(2);
  document.getElementById('hiLoTC2').textContent = tcHiLo.toFixed(2);
  document.getElementById('apcTC').textContent = tcAPC.toFixed(2);
  document.getElementById('zenTC').textContent = tcZen.toFixed(2);
  document.getElementById('omegaIITC').textContent = tcOmegaII.toFixed(2);
  document.getElementById('aceTC').textContent = aceTC.toFixed(2);

  const expAces = 32 * decksLeft;
  const ra = expAces > 0 ? (state.acesLeft / expAces) - 1 : 0;
  document.getElementById('ra').textContent = ra.toFixed(2);
  document.getElementById('ra').className = ra >= 0 ? '' : 'negative';

  let wongState = 'neutral';
  if (tcAPC >= 1.0 || ra >= 0.5) {
    wongState = "enter";
  } else if (tcAPC <= -1.0 || ra <= -0.5) {
    wongState = "exit";
  } else {
    wongState = "neutral";
  }
  const advice = document.getElementById('advice');
  advice.className = `wong-${wongState}`;

  const dealerUp = state.hands.dealer[0]?.value;
  if (dealerUp === 'A' && !state.insuranceResolved) {
    let tensLeft = 0;
    ['10','J','Q','K'].forEach(r => suits.forEach(s => tensLeft += state.remaining[r][s] || 0));
    const pBJ = total_rem > 0 ? tensLeft / total_rem : 0.3077;
    let insEV = pBJ - 0.5 + globalThis.RA_FACTOR * ra + 0.005 * aceTC;
    const take = insEV > 0;
    
    document.getElementById('insAdvice').textContent = take ? `TAKE INSURANCE (+${(insEV*100).toFixed(1)}%)` : 'NO INSURANCE';
    document.getElementById('insAdvice').style.color = take ? '#22c55e' : '#ef4444';
    document.getElementById('insuranceBox').style.display = 'flex';
  } else {
    document.getElementById('insuranceBox').style.display = 'none';
  }

  let tcEffective;
  switch (state.indexSystem) {
    case 'Zen': tcEffective = tcZen; break;
    case 'APC': tcEffective = tcAPC; break;
    case 'Omega II': tcEffective = tcOmegaII; break;
    default: tcEffective = tcHiLo; break;
  }

  const bankroll = parseFloat(document.getElementById('bankroll').value) || 10000;
  const betUnit = parseFloat(document.getElementById('betUnit').value) || 25;
  const mikkiMultiplier = parseFloat(document.getElementById('mikkiMultiplier').value) || 3;

  // === 1. Calculate your REAL edge ===
  const rawEdgeFromCount = EDGE_PER_TC * Math.max(0, tcEffective);           // e.g. +3 TC → +1.5%
  const raEdgeBonus      = EDGE_PER_TC * globalThis.RA_FACTOR * Math.max(0, -ra);      // ace-poor = extra edge
  const aceSideBonus     = 0.005 * aceTC;                                   // fine-tuning from ace side-count
  let edge = rawEdgeFromCount + raEdgeBonus + aceSideBonus;

  // === 2. Base units according to your chosen system ===
  let finalUnits;
  let heatLevel = 'Cool';
  let heatColor = '#94a3b8';

  if (state.useKelly) {
    const kellyFraction = 0.5;
    finalUnits = (edge / VAR) * kellyFraction * (bankroll / betUnit);
  } else if (state.indexSystem === 'Omega II') {
    finalUnits = getOmegaRamp(tcEffective);
  } else {
    finalUnits = tcEffective <= 0 ? 1 : mikkiMultiplier * tcEffective + 1;
  }

  // RA adjustment
  const raMultiplier = ra > 0.5 ? 0.80 : ra < -0.5 ? 1.20 : 1;
  finalUnits *= raMultiplier;

  // === HEAT SIMULATION (camouflage + visual feedback) ===
  if (state.useHeatSim) {
    // This affects your actual bet (cover)
    const heatFactor = Math.max(0.5, Math.min(2.0, 1 + (1 - Math.abs(tcEffective))));
    const variance = 0.7 + Math.random() * 0.6; // 0.7–1.3
    finalUnits *= heatFactor * variance;

    // This is just for the UI label/color
    if (heatFactor < 0.8) {
      heatLevel = 'Cool';
      heatColor = '#3b82f6';
    } else if (heatFactor < 0.95) {
      heatLevel = 'Warm';
      heatColor = '#f59e0b';
    } else {
      heatLevel = 'Hot';
      heatColor = '#ef4444';
    }
  } else {
    // No heat sim → always Cool (clean play)
    heatLevel = 'Cool';
    heatColor = '#94a3b8';
  }

  // === FINAL CLAMPING (only once!) ===
  const maxUnits = Math.floor(bankroll / betUnit);
  finalUnits = Math.max(1, Math.round(finalUnits));        // never $0
  finalUnits = Math.min(finalUnits, maxUnits);
  finalUnits = Math.min(finalUnits, 120);                  // optional hard cap

  const betDollar = finalUnits * betUnit;

  // === DISPLAY ===
  document.getElementById('mainBet').innerHTML = 
    `${finalUnits}x ($${betDollar.toLocaleString()})`;

  const heatEl = document.getElementById('heatLevel');
  heatEl.textContent = heatLevel;
  heatEl.style.color = heatColor;
  // Consolidated kellyFrac
  document.getElementById('kellyFrac').textContent = state.useKelly ? '0.5 Kelly' : state.indexSystem === 'Omega II' ? 'Omega II' : 'Basic';

  const suitOrder = ['spades', 'clubs', 'hearts', 'diamonds'];
  let suitTotals = { spades: 0, clubs: 0, hearts: 0, diamonds: 0 };
  suits.forEach(suit => {
    state.rankOrder.forEach(r => suitTotals[suit] += state.remaining[r][suit] || 0);
  });
  updateCombinedChart(rankTotals, suitTotals);
  
  const ppPays = { perfect: parseFloat(document.getElementById('ppPerfect').value) || 25, colored: parseFloat(document.getElementById('ppColored').value) || 12, mixed: parseFloat(document.getElementById('ppMixed').value) || 6 };
  let evPP = computePPEV(ppPays.perfect, ppPays.colored, ppPays.mixed);
  if (evPP < -0.5) evPP = 0;
  document.getElementById('ppEV').textContent = (evPP * 100).toFixed(1) + '%';
  document.getElementById('ppAdvice').textContent = evPP > 0 ? 'BET!' : 'No';
  document.getElementById('ppAdvice').style.color = evPP > 0 ? '#22c55e' : '#ef4444';

  const p3Pays = { suited3: parseFloat(document.getElementById('p3Suited3').value) || 100, sf: parseFloat(document.getElementById('p3SF').value) || 40, three: parseFloat(document.getElementById('p3Three').value) || 30, str: parseFloat(document.getElementById('p3Str').value) || 10, flush: parseFloat(document.getElementById('p3Flush').value) || 5 };
  let evP3 = compute21p3EV(p3Pays);
  if (evP3 < -0.5) evP3 = 0;
  document.getElementById('p3EV').textContent = (evP3 * 100).toFixed(1) + '%';
  document.getElementById('p3Advice').textContent = evP3 > 0 ? 'BET!' : 'No';
  document.getElementById('p3Advice').style.color = evP3 > 0 ? '#22c55e' : '#ef4444';

  const PP_VAR = 18, P3_VAR = 13.6;
  const sideBankFrac = 0.15;
  const sideBank = bankroll * sideBankFrac;

  let ppMult = evPP > 0 ? Math.max(1, Math.min(12, Math.floor((evPP / PP_VAR) * sideBank / betUnit * 0.5))) : 0;
  let p3Mult = evP3 > 0 ? Math.max(1, Math.min(12, Math.floor((evP3 / P3_VAR) * sideBank / betUnit * 0.5))) : 0;

  document.getElementById('ppBet').textContent = evPP > 0 ? `${ppMult}x ($${ppMult * betUnit})` : 'No Bet';
  document.getElementById('p3Bet').textContent = evP3 > 0 ? `${p3Mult}x ($${p3Mult * betUnit})` : 'No Bet';

  // updateSplitButtonVisibility() - needs import from uiManager
  
  Object.keys(state.hands).forEach(target => {
    if (state.hands[target].length === 0) return;
    const baseTarget = target.replace(/[AB]$/, '');
    const container = document.getElementById(`hand-${target}`) || state.handContainers[baseTarget];
    let totalEl = container.querySelector('.hand-total');
    const {total, bust, soft} = computeTotal(state.hands[target]);
    const color = bust ? '#ef4444' : total===21 ? 'rgb(0 255 245)' : total >=17 ? '#22c55e' : '#ffd43f';
    if (!totalEl) {
      totalEl = document.createElement('div');
      totalEl.className = 'hand-total';
      totalEl.style.color = color;
      container.insertAdjacentElement('afterbegin', totalEl);
    }
    totalEl.style.color = color;
    totalEl.textContent = `Total: ${total}`;
  });
  document.getElementById('advice').innerHTML = getPlayAdvice(tcHiLo, tcZen, tcAPC, tcOmegaII);
}

// Register updateAll globally so other modules can trigger it after card operations
window.updateAll = updateAll;
