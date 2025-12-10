const SHOE_DECKS = 8;
const TOTAL_CARDS = SHOE_DECKS * 52;
const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
let remaining = {};
let acesLeft = 32;
let cardsDealt = 0;
let insuranceResolved = false;
let lastAddedCard = null;

const counts = { HiLo: { rc: 0 }, APC: { rc: 0 }, Zen: { rc: 0 } };
const map = {
  HiLo: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1},
  APC:  {'A':0,'2':1,'3':1,'4':2,'5':3,'6':2,'7':2,'8':1,'9':-3,'10':-4},
  Zen: {'A':-1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':1,'8':0,'9':0,'10':-2}
};
['J','Q','K'].forEach(face => {
  for (let sys in map) {
    map[sys][face] = map[sys]['10'];
  }
});

const VAR = 1.309; // 8dk H17 variance
const EDGE_PER_TC = 0.005; // Edge per TC
const RA_FACTOR = 0.5; // Configurable RA multiplier (default 0.5, adjustable)

let YOUR_SEAT = '1';
let inputTarget = '1';
let activeSplit = null;
let disabledSeats = new Set(); // Seats to skip this hand
let useCompDep = false;
let useHeatSim = false;
let indexSystem = 'Basic'; // Basic, Zen, APC
let useKelly = true;
const hands = { dealer: [] };
for (let i = 1; i <= 7; i++) hands[i] = [];
const handContainers = {};
const splitContainers = {};
const splitButtons = {};

const rankOrder = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const suitMap = {'s':'spades','d':'diamonds','x':'hearts','c':'clubs'};
const symMap = {'spades':'♠','hearts':'♥','diamonds':'♦','clubs':'♣'};
const straightTriples = [
  ['A','2','3'], ['2','3','4'], ['3','4','5'], ['4','5','6'], ['5','6','7'],
  ['6','7','8'], ['7','8','9'], ['8','9','10'], ['9','10','J'], ['10','J','Q'],
  ['J','Q','K'], ['Q','K','A']
];
const order = ['dealer', '7', '6', '5', '4', '3', '2', '1'];

function getFirstPlayingSeat() {
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!disabledSeats.has(seatStr)) return seatStr;
  }
  return YOUR_SEAT; // Fallback to your seat if all disabled
}

function initRemaining() {
  remaining = {};
  rankOrder.forEach(rank => {
    remaining[rank] = {};
    suits.forEach(suit => remaining[rank][suit] = 8);
  });
  acesLeft = 32;
}

function pickSuit(rank) {
  let total = 0;
  suits.forEach(s => total += remaining[rank][s] || 0);
  if (total === 0) return suits[0];
  let rand = Math.random() * total;
  for (let suit of suits) {
    rand -= remaining[rank][suit] || 0;
    if (rand <= 0) return suit;
  }
  return suits[0];
}

function buildTable() {
  const table = document.getElementById('table');
  table.innerHTML = '';
  order.forEach(seat => {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class=\"seat-header\">
        <div class=\"seat-round ${seat==='dealer'?'dealer':'player'} ${seat===YOUR_SEAT?'your-seat':''}\" data-seat=\"${seat}\">
          ${seat === 'dealer' ? 'D' : seat}
        </div>
      </div>
      <div class=\"hand\" id=\"hand-${seat}\"></div>
      
      <div class=\"split-container\" id=\"split-${seat}\" style=\"display:none;\">
        <div class=\"split-hand\"><div class=\"split-label\">A</div><div class=\"hand\" id=\"hand-${seat}A\"></div></div>
        <div class=\"split-hand\"><div class=\"split-label\">B</div><div class=\"hand\" id=\"hand-${seat}B\"></div></div>
      </div>

      ${seat !== 'dealer' ? '<button class=\"split-btn\" id=\"splitBtn-'+seat+'\">SPLIT</button>' : ''}
    `;
    table.appendChild(col);

    handContainers[seat] = col.querySelector(`#hand-${seat}`);
    splitContainers[seat] = col.querySelector(`#split-${seat}`);
    if (seat !== 'dealer') splitButtons[seat] = col.querySelector('#splitBtn-'+seat);

    const header = col.querySelector('.seat-round');
    header.addEventListener('dblclick', (e) => { e.stopPropagation(); YOUR_SEAT = seat; document.querySelectorAll('.your-seat').forEach(x=>x.classList.remove('your-seat')); header.classList.add('your-seat'); });
    header.addEventListener('click', () => setInputTarget(seat));

    if (seat !== 'dealer') {
      splitButtons[seat].onclick = () => performSplit(seat);
      new Sortable(col.querySelector(`#hand-${seat}A`), { group: 'cards', animation: 150, onEnd: updateAll });
      new Sortable(col.querySelector(`#hand-${seat}B`), { group: 'cards', animation: 150, onEnd: updateAll });
    }
    new Sortable(handContainers[seat], { group: 'cards', animation: 150, onEnd: updateAll });
  });
}

function setInputTarget(t) {
  if (!t.match(/[AB]$/) && splitContainers[t] && splitContainers[t].style.display !== 'none') {
    const aHand = hands[t + 'A'];
    const bHand = hands[t + 'B'];
    if (bHand && bHand.length > 0) t = t + 'B';
    else if (aHand && aHand.length > 0) t = t + 'A';
  }

  inputTarget = t;
  // Skip disabled seats (only for base seats, not splits)
  const baseT = t.replace(/[AB]$/, '');
  if (!t.match(/[AB]$/) && disabledSeats.has(baseT)) {
    const baseIdx = order.indexOf(baseT);
    t = order[(baseIdx + order.length - 1) % order.length]; // Initial left shift
  }

  // Recursive skip if still disabled
  function skipDisabled(candidate) {
    const baseC = candidate.replace(/[AB]$/, '');
    if (candidate.match(/[AB]$/) || !disabledSeats.has(baseC)) return candidate;
    const cIdx = order.indexOf(baseC);
    const nextC = order[(cIdx + order.length - 1) % order.length];
    return skipDisabled(nextC);
  }
  t = skipDisabled(t);
  activeSplit = t.match(/[AB]$/) ? t : null;

  document.querySelectorAll('.seat-round').forEach(h => h.classList.remove('active'));
  document.querySelectorAll('.split-hand').forEach(h => h.classList.remove('active'));

  const base = t.replace(/[AB]$/, '');
  const header = document.querySelector(`.seat-round[data-seat=\"${base === 'dealer' ? 'dealer' : base}\"]`);
  if (header) header.classList.add('active');

  if (activeSplit) {
    const idx = activeSplit.endsWith('A') ? 1 : 2;
    const el = document.querySelector(`#split-${base} .split-hand:nth-child(${idx})`);
    if (el) el.classList.add('active');
  }

  updateSplitButtonVisibility();
}

function moveLeft(base, currentIdx) {
  if (activeSplit && activeSplit.endsWith('B')) {
    setInputTarget(base + 'A');
    return;
  }
  let nextIdx = currentIdx > 0 ? currentIdx - 1 : order.length - 1;
  let candidate = order[nextIdx];
  while (disabledSeats.has(candidate)) {
    nextIdx = nextIdx > 0 ? nextIdx - 1 : order.length - 1;
    candidate = order[nextIdx];
    if (nextIdx === currentIdx) break; // Full circle, stop
  }
  setInputTarget(candidate);
}

function moveRight(base, currentIdx) {
  if (activeSplit && activeSplit.endsWith('A')) {
    const bHand = hands[base + 'B'];
    if (bHand && bHand.length > 0) {
      setInputTarget(base + 'B');
      return;
    }
  }
  let nextIdx = (currentIdx + 1) % order.length;
  let candidate = order[nextIdx];
  while (disabledSeats.has(candidate)) {
    nextIdx = (nextIdx + 1) % order.length;
    candidate = order[nextIdx];
    if (nextIdx === currentIdx) break; // Full circle, stop
  }
  setInputTarget(candidate);
}

document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
    const c = keyMap[e.key];
    if (c) { e.preventDefault(); addCard(c); return; }
    const suitK = suitMap[e.key];
    if (suitK) { e.preventDefault(); setSuit(suitK); return; }
    if (e.key === 'Backspace') { e.preventDefault(); removeLastCardFromActiveHand(); return; }
    if (e.key === ' ') {
      e.preventDefault();
      const base = inputTarget.replace(/[AB]$/, '');
      const seatEl = document.querySelector(`.seat-round[data-seat=\"${base === 'dealer' ? 'dealer' : base}\"]`);
      if (disabledSeats.has(base)) {
        disabledSeats.delete(base);
        seatEl.classList.remove('disabled');
      } else {
        disabledSeats.add(base);
        seatEl.classList.add('disabled');
      }
      // Move to next seat
      const currentIdx = order.indexOf(base);
      moveLeft(base, currentIdx);
      return;
    }
    return;
  }
  e.preventDefault();

  let base = inputTarget.replace(/[AB]$/, '');
  let currentIdx = order.indexOf(base);

  if (e.key === 'ArrowRight') {
    moveRight(base, currentIdx);
  } else { 
    moveLeft(base, currentIdx);
  }
});

const keyMap = {1:'A',a:'A',A:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',0:'10',t:'10',T:'10','o':'J','p':'Q','[':'K'};

function setSuit(suit) {
  if (!lastAddedCard) return;
  const val = lastAddedCard.dataset.val;
  const oldSuit = lastAddedCard.dataset.suit;
  if (oldSuit === suit) return;
  remaining[val][oldSuit]++;
  if (remaining[val][oldSuit] < 0) remaining[val][oldSuit] = 0; // Guard for negative counts
  if ((remaining[val][suit] || 0) > 0) {
    remaining[val][suit]--;
    lastAddedCard.dataset.suit = suit;
    const sym = symMap[suit];
    lastAddedCard.querySelector('.top-right').textContent = sym;
    lastAddedCard.querySelector('.bottom-left').textContent = sym;
  }
  updateAll();
}

function addCard(val) {
  let target = inputTarget;

  if (!target.match(/[AB]$/) && splitContainers[target] && splitContainers[target].style.display !== 'none') {
    const a = hands[target + 'A'];
    const b = hands[target + 'B'];
    if (b && b.length > 0) target = target + 'B';
    else if (a && a.length > 0) target = target + 'A';
  }

  counts.HiLo.rc += map.HiLo[val];
  counts.APC.rc  += map.APC[val];
  counts.Zen.rc  += map.Zen[val];
  const suit = pickSuit(val);
  remaining[val][suit]--;
  if (remaining[val][suit] < 0) remaining[val][suit] = 0; // Guard for negative counts
  if (val === 'A') acesLeft--;
  cardsDealt++;

  const sym = symMap[suit];
  const displayVal = val === '10' ? 'T' : val;

  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class=\"corner top-left\">${displayVal}</span>
    <span class=\"corner bottom-right\" style=\"transform: rotate(180deg);\">${displayVal}</span>
    <span class=\"suit top-right\">${sym}</span>
    <span class=\"suit bottom-left\" style=\"transform: rotate(180deg);\">${sym}</span>
  `;

  const container = target.match(/[AB]$/)
    ? document.getElementById(`hand-${target}`)
    : handContainers[target];

  container.appendChild(mini);

  if (!hands[target]) hands[target] = [];
  hands[target].push({ value: val, element: mini });
  lastAddedCard = mini;

  let base = target.replace(/[AB]$/, '');

  // Ensure target not disabled before adding
  let addBase = target.replace(/[AB]$/, '');
  if (disabledSeats.has(addBase)) {
    const addIdx = order.indexOf(addBase);
    moveLeft(addBase, addIdx);
    target = inputTarget;
    addBase = target.replace(/[AB]$/, '');
  }

  // Auto-advance after 1st/2nd card for players or dealer's upcard
  if ((hands[target].length === 1 || hands[target].length === 2) && addBase !== 'dealer' || (addBase === 'dealer' && hands[target].length === 1)) {
    const currentIdx = order.indexOf(addBase);
    if (hands[target].length === 2 && addBase === '7') {
      // After last player (seat 7) second card: Jump to first playing seat
      setInputTarget(getFirstPlayingSeat());
    } else if (addBase === 'dealer' && hands[target].length === 1) {
      // After dealer upcard: Jump to first playing seat
      setInputTarget(getFirstPlayingSeat());
    } else {
      // Otherwise, move one to the left (previous seat), skipping disabled
      moveLeft(addBase, currentIdx);
    }
  }
  updateAll();
}

function removeLastCardFromActiveHand() {
  const target = inputTarget;
  const hand = hands[target];
  if (!hand || hand.length === 0) return;
  const card = hand.pop();
  const suit = card.element.dataset.suit;
  counts.HiLo.rc -= map.HiLo[card.value];
  counts.APC.rc  -= map.APC[card.value];
  counts.Zen.rc  -= map.Zen[card.value];
  remaining[card.value][suit]++;
  if (remaining[card.value][suit] < 0) remaining[card.value][suit] = 0; // Guard for negative counts
  if (card.value === 'A') acesLeft++;
  cardsDealt--;
  card.element.remove();
  if (hand.length === 0) lastAddedCard = null;
  updateAll();
}

function performSplit(baseSeat) {
  const hand = hands[baseSeat];
  if (!hand || hand.length !== 2 || hand[0].value !== hand[1].value || splitContainers[baseSeat].style.display !== 'none') return;

  const cardA = hand[0];
  const cardB = hand[1];

  hands[baseSeat + 'A'] = [cardA];
  hands[baseSeat + 'B'] = [cardB];
  delete hands[baseSeat];

  handContainers[baseSeat].style.display = 'none';
  splitContainers[baseSeat].style.display = 'flex';

  cardA.element.dataset.seat = baseSeat + 'A';
  cardB.element.dataset.seat = baseSeat + 'B';
  document.getElementById(`hand-${baseSeat}A`).appendChild(cardA.element);
  document.getElementById(`hand-${baseSeat}B`).appendChild(cardB.element);

  setInputTarget(baseSeat + 'A');
  updateAll();
}

function updateSplitButtonVisibility() {
  Object.keys(splitButtons).forEach(seat => {
    const btn = splitButtons[seat];
    btn.style.display = 'none';

    if (seat !== YOUR_SEAT) return;

    if (hands[seat]?.length === 2 && hands[seat][0].value === hands[seat][1].value && splitContainers[seat].style.display === 'none') {
      btn.style.display = 'block';
    }
  });
}

document.getElementById('nextHandBtn').onclick = () => {
  for (const s in hands) { hands[s].forEach(c => c.element.remove()); hands[s] = []; }
  document.querySelectorAll('.split-container').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.hand').forEach(h => h.style.display = 'flex');
  document.getElementById('insuranceBox').style.display = 'none';
  insuranceResolved = false;
  activeSplit = null;
  disabledSeats.clear();
  document.querySelectorAll('.seat-round').forEach(el => el.classList.remove('disabled'));  lastAddedCard = null;
  setInputTarget('1');
  updateAll();
};

document.getElementById('shuffleBtn').onclick = () => {
  if (!confirm('Start fresh 8-deck shoe?')) return;
  initRemaining();
  cardsDealt = 0;
  counts.HiLo.rc = 0;
  counts.APC.rc = 0;
  counts.Zen.rc = 0;
  document.querySelectorAll('.mini').forEach(m => m.remove());
  for (const s in hands) hands[s] = [];
  disabledSeats.clear();
  document.querySelectorAll('.seat-round').forEach(el => el.classList.remove('disabled'));  insuranceResolved = false;
  lastAddedCard = null;
  document.getElementById('insuranceBox').style.display = 'none';
  setInputTarget('1');
  updateAll();
};

document.getElementById('bjYes').onclick = () => { if (!insuranceResolved) addCard('10'); insuranceResolved = true; updateAll(); document.getElementById('insuranceBox').style.display = 'none'; };
document.getElementById('bjNo').onclick = () => {
  insuranceResolved = true;
  document.getElementById('insuranceBox').style.display = 'none';
  updateAll();
};

// Charts
const pieChart = new Chart(document.getElementById('pieChart'), {
  type: 'doughnut',
  data: { labels: rankOrder, datasets: [{ data: rankOrder.map(r => 32), backgroundColor: ['#ef4444','#f97316','#facc15','#a3e635','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#6366f1','#1e40af','#dc2626','#991b1b'] }] },
  options: { 
    responsive: true, 
    plugins: { 
      legend: { display: false },
      datalabels: {
        color: '#fff',
        font: { size: 10, weight: 'bold' },
        formatter: (value) => value
      }
    } 
  },
  plugins: [ChartDataLabels]
});

const suitChart = new Chart(document.getElementById('suitChart'), {
  type: 'doughnut',
  data: { labels: ['♠', '♣', '♥', '♦'], datasets: [{ data: [104,104,104,104], backgroundColor: ['#000','#009900ff','#dc2626','#0003c9'] }] },
  options: { 
    responsive: true, 
    plugins: { 
      legend: { display: false },
      datalabels: {
        color: '#fff',
        font: { size: 10, weight: 'bold' },
        formatter: (value) => value
      }
    } 
  },
  plugins: [ChartDataLabels]
});

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
  const bust = total > 21;
  const soft = aces > 0 && !bust;
  return { total, bust, soft };
}

function getComposition(hand) {
  if (!useCompDep) return null;
  const nonA = hand.map(c => c.value).filter(v => v !== 'A').sort().join('-');
  const aces = hand.filter(c => c.value === 'A').length;
  return aces ? nonA + '-A' + aces : nonA;
}

function computePPEV(pPerfect=25, pColored=12, pMixed=6) {
  let t = 0;
  rankOrder.forEach(r => suits.forEach(s => t += remaining[r][s] || 0));
  if (t < 5) return -1; // Guard for low counts
  const denom = t * (t - 1);
  let totalPair = 0, perfect = 0, colored = 0;
  rankOrder.forEach(r => {
    let numR = 0, numRed = 0, numBlack = 0, perfRed = 0, perfBlack = 0;
    ['hearts', 'diamonds'].forEach(s => {
      let ns = remaining[r][s] || 0;
      numR += ns; numRed += ns; perfRed += ns * (ns - 1);
    });
    ['spades', 'clubs'].forEach(s => {
      let ns = remaining[r][s] || 0;
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

function compute21p3EV(pays = {suited3:100, sf:40, three:30, str:10, flush:5}) {
  let t = 0;
  rankOrder.forEach(r => suits.forEach(s => t += remaining[r][s] || 0));
  if (t < 5) return -1; // Guard for low counts
  const denom = t * (t - 1) * (t - 2);
  let pSuited3 = 0;
  rankOrder.forEach(r => suits.forEach(s => {
    let ns = remaining[r][s] || 0;
    pSuited3 += ns * (ns - 1) * (ns - 2);
  }));
  let pSF = 0;
  straightTriples.forEach(triple => suits.forEach(s => {
    let p1 = remaining[triple[0]][s] || 0;
    let p2 = remaining[triple[1]][s] || 0;
    let p3 = remaining[triple[2]][s] || 0;
    pSF += p1 * p2 * p3 * 6;
  }));
  let pThree = 0;
  rankOrder.forEach(r => {
    let nr = 0; suits.forEach(s => nr += remaining[r][s] || 0);
    pThree += nr * (nr - 1) * (nr - 2);
  });
  let pRegThree = pThree - pSuited3;
  let pTotStr = 0;
  straightTriples.forEach(triple => {
    let n1 = 0, n2 = 0, n3 = 0;
    suits.forEach(s => {
      n1 += remaining[triple[0]][s] || 0;
      n2 += remaining[triple[1]][s] || 0;
      n3 += remaining[triple[2]][s] || 0;
    });
    pTotStr += n1 * n2 * n3 * 6;
  });
  let pStr = pTotStr - pSF;
  let pTotFlush = 0;
  suits.forEach(s => {
    let ns = 0; rankOrder.forEach(r => ns += remaining[r][s] || 0);
    pTotFlush += ns * (ns - 1) * (ns - 2);
  });
  let pFlush = pTotFlush - pSF - pSuited3;
  let totalWin = pSuited3 + pSF + pRegThree + pStr + pFlush;
  let num = pSuited3 * pays.suited3 + pSF * pays.sf + pRegThree * pays.three + pStr * pays.str + pFlush * pays.flush;
  return num / denom - 1;
}

function updateAll() {
  // Aggregates
  let total_rem = 0;
  let rankTotals = rankOrder.map(r => {
    let tot = 0;
    suits.forEach(s => tot += remaining[r][s] || 0);
    total_rem += tot;
    return tot;
  });
  const decksLeft = total_rem / 52; // Removed 0.25 cap
  const tcHiLo = counts.HiLo.rc / decksLeft;
  const tcAPC  = counts.APC.rc  / decksLeft;
  const tcZen = counts.Zen.rc / decksLeft;
  const pen = ((1 - total_rem / TOTAL_CARDS) * 100).toFixed(2); // Two decimal places

  document.getElementById('penetration').textContent = pen + '%';
  document.getElementById('decksLeft').textContent = decksLeft.toFixed(2);
  document.getElementById('hiLoRC').textContent = counts.HiLo.rc;
  document.getElementById('hiLoTC').textContent = tcHiLo.toFixed(2);
  document.getElementById('hiLoTC2').textContent = tcHiLo.toFixed(2);
  document.getElementById('apcTC').textContent = tcAPC.toFixed(2);
  document.getElementById('zenTC').textContent = tcZen.toFixed(2);

  // RA
  const expAces = 32 * decksLeft;
  const ra = expAces > 0 ? (acesLeft / expAces) - 1 : 0;
  const raEl = document.getElementById('ra');
  raEl.textContent = ra.toFixed(2);
  raEl.className = ra >= 0 ? '' : 'negative';

  const wong = document.getElementById('wongSignal');
  if (tcAPC >= 1.0 || ra >= 0.5) { wong.textContent = \"WONG IN — PLAY! (Edge Layer)\"; wong.className = \"wong-enter\"; }
  else if (tcAPC <= -1.0 || ra <= -0.5) { wong.textContent = \"WONG OUT — EXIT (Pre-Set Trigger)\"; wong.className = \"wong-exit\"; }
  else { wong.textContent = \"WONGING: Neutral (Comp Layer)\"; wong.className = \"wong-neutral\"; }

  // Exact Insurance
  const dealerUp = hands.dealer[0]?.value;
  if (dealerUp === 'A' && !insuranceResolved) {
    let tensLeft = 0;
    ['10','J','Q','K'].forEach(r => {
      rankOrder.forEach(rank => { if (rank === r) suits.forEach(s => tensLeft += remaining[rank][s] || 0); });
    });
    const pBJ = total_rem > 1 ? tensLeft / (total_rem - 1) : 0.3077;
    let insEV = pBJ - 0.5 + RA_FACTOR * ra; // Use configurable RA factor
    const take = insEV > 0;
    document.getElementById('insAdvice').textContent = take ? `TAKE INSURANCE (+${(insEV*100).toFixed(1)}%)` : 'NO INSURANCE';
    document.getElementById('insAdvice').style.color = take ? '#22c55e' : '#ef4444';
    document.getElementById('insuranceBox').style.display = 'flex';
  } else {
    document.getElementById('insuranceBox').style.display = 'none';
  }

  // Kelly Ramp or Original Mikki Ramp
  const bankroll = parseFloat(document.getElementById('bankroll').value) || 10000;
  const betUnit = parseFloat(document.getElementById('betUnit').value) || 25; // Fallback to default
  const mikkiMultiplier = parseFloat(document.getElementById('mikkiMultiplier').value) || 3; // New configurable input
  let units, betDollar;

  const tcEffective = indexSystem === 'Zen' ? tcZen : indexSystem === 'APC' ? tcAPC : Math.max(tcHiLo, tcZen, tcAPC); // Include APC
  if (useKelly) {
    const edge = EDGE_PER_TC * Math.max(0, tcEffective) * (1 + RA_FACTOR * ra); // Use configurable RA factor
    const fullKelly = edge / VAR;
    const halfKelly = fullKelly * 0.5;
    units = Math.max(1, Math.min(Math.floor(halfKelly * bankroll / betUnit), Math.floor(bankroll / betUnit))); // Cap by bankroll
    betDollar = units * betUnit;
  } else {
    // Configurable Mikki Ramp
    units = tcEffective <= 0 ? 1 : Math.min(100, Math.floor(mikkiMultiplier * tcEffective + 1));
    betDollar = units * betUnit;
    document.getElementById('kellyFrac').textContent = 'Mikki Ramp';
  }

  // Heat Sim (variance-based)
  let heatLevel = 'Cool';
  let heatColor = '#94a3b8';
  if (useHeatSim) {
    const heat = 1 + (VAR / VAR) * (1 - Math.abs(tcEffective)); // Simplified variance-based
    const variance = Math.random() * 0.6 + 0.7;
    units = Math.floor(units * heat * variance);
    betDollar = units * betUnit;
    heatLevel = heat < 0.8 ? 'Cool' : heat < 0.95 ? 'Warm' : 'Hot';
    heatColor = heat < 0.8 ? '#3b82f6' : heat < 0.95 ? '#f59e0b' : '#ef4444';
  }
  document.getElementById('mainBet').innerHTML = units + 'x<br>$' + betDollar;
  const heatEl = document.getElementById('heatLevel');
  heatEl.textContent = heatLevel;
  heatEl.style.color = heatColor;
  if (!useKelly) {
    document.getElementById('kellyFrac').textContent = 'Mikki Ramp';
  } else {
    document.getElementById('kellyFrac').textContent = '0.5 Kelly';
  }

  // Charts
  pieChart.data.labels = rankOrder;
  pieChart.data.datasets[0].data = rankTotals;
  pieChart.update('quiet');

  let suitTotals = { spades: 0, clubs: 0, hearts: 0, diamonds: 0 };
  suits.forEach(suit => {
    rankOrder.forEach(r => suitTotals[suit] += remaining[r][suit] || 0);
  });
  const suitOrder = ['spades', 'clubs', 'hearts', 'diamonds'];
  suitChart.data.datasets[0].data = suitOrder.map(s => suitTotals[s]);
  suitChart.update('quiet');

  // Side Bets
  const ppPays = { perfect: parseFloat(document.getElementById('ppPerfect').value) || 25, colored: parseFloat(document.getElementById('ppColored').value) || 12, mixed: parseFloat(document.getElementById('ppMixed').value) || 6 }; // New configurable inputs
  const evPP = computePPEV(ppPays.perfect, ppPays.colored, ppPays.mixed);
  document.getElementById('ppEV').textContent = (evPP * 100).toFixed(1) + '%';
  document.getElementById('ppAdvice').textContent = evPP > 0 ? 'BET!' : 'No';
  document.getElementById('ppAdvice').style.color = evPP > 0 ? '#22c55e' : '#ef4444';

  const p3Pays = { suited3: parseFloat(document.getElementById('p3Suited3').value) || 100, sf: parseFloat(document.getElementById('p3SF').value) || 40, three: parseFloat(document.getElementById('p3Three').value) || 30, str: parseFloat(document.getElementById('p3Str').value) || 10, flush: parseFloat(document.getElementById('p3Flush').value) || 5 }; // New configurable inputs
  const evP3 = compute21p3EV(p3Pays);
  document.getElementById('p3EV').textContent = (evP3 * 100).toFixed(1) + '%';
  document.getElementById('p3Advice').textContent = evP3 > 0 ? 'BET!' : 'No';
  document.getElementById('p3Advice').style.color = evP3 > 0 ? '#22c55e' : '#ef4444';

  updateSplitButtonVisibility();

  Object.keys(hands).forEach(target => {
    if (hands[target].length === 0) return;
    const baseTarget = target.replace(/[AB]$/, '');
    const container = document.getElementById(`hand-${target}`) || handContainers[baseTarget];
    let totalEl = container.querySelector('.hand-total');
    const {total, bust, soft} = computeTotal(hands[target]);
    const status = bust ? '(BUST)' : soft ? '(Soft)' : '';
    const color = bust ? '#ef4444' : total >=17 ? '#22c55e' : '#ffd43f';
    if (!totalEl) {
      totalEl = document.createElement('div');
      totalEl.className = 'hand-total';
      totalEl.style.color = color;
      container.appendChild(totalEl);
    }
    totalEl.style.color = color;
    totalEl.textContent = `Total: ${total} ${status}`;
  });
  document.getElementById('advice').innerHTML = getPlayAdvice(tcHiLo, tcZen, tcAPC);
}

// Toggles
document.getElementById('compDep').addEventListener('change', e => { useCompDep = e.target.checked; updateAll(); });
document.getElementById('heatSim').addEventListener('change', e => { useHeatSim = e.target.checked; updateAll(); });
document.getElementById('indexSet').addEventListener('change', e => { indexSystem = e.target.value; updateAll(); });
document.getElementById('useKelly').addEventListener('change', e => { useKelly = e.target.checked; updateAll(); });
document.getElementById('bankroll').addEventListener('input', updateAll);
document.getElementById('betUnit').addEventListener('input', updateAll);
// New listeners for configurables
document.getElementById('mikkiMultiplier').addEventListener('input', updateAll);
document.getElementById('raFactor').addEventListener('input', () => { RA_FACTOR = parseFloat(e.target.value) || 0.5; updateAll(); });
document.getElementById('ppPerfect').addEventListener('input', updateAll);
document.getElementById('ppColored').addEventListener('input', updateAll);
document.getElementById('ppMixed').addEventListener('input', updateAll);
document.getElementById('p3Suited3').addEventListener('input', updateAll);
document.getElementById('p3SF').addEventListener('input', updateAll);
document.getElementById('p3Three').addEventListener('input', updateAll);
document.getElementById('p3Str').addEventListener('input', updateAll);
document.getElementById('p3Flush').addEventListener('input', updateAll);

const i18 = {
  '16v10': {index: 0, action: 'STAND', class: 'adv-stand'},
  '15v10': {index: 4, action: 'STAND', class: 'adv-stand'},
  '11vA': {index: 1, action: 'DOUBLE', class: 'adv-double'},
  '10v10': {index: 4, action: 'DOUBLE', class: 'adv-double'},
  '10vA': {index: 4, action: 'DOUBLE', class: 'adv-double'},
  '9v2': {index: 1, action: 'DOUBLE', class: 'adv-double'},
  '9v7': {index: 3, action: 'DOUBLE', class: 'adv-double'},
  '12v2': {index: 3, action: 'STAND', class: 'adv-stand'},
  '12v3': {index: 2, action: 'STAND', class: 'adv-stand'},
  '12v4': {index: 0, action: 'STAND', class: 'adv-stand'},
  '12v5': {index: -2, action: 'STAND', class: 'adv-stand'},
  '12v6': {index: -1, action: 'STAND', class: 'adv-stand'},
  '13v2': {index: -1, action: 'STAND', class: 'adv-stand'},
  '13v3': {index: -2, action: 'STAND', class: 'adv-stand'},
  '16v9': {index: 5, action: 'STAND', class: 'adv-stand'},
  'pair10v5': {index: 5, action: 'SPLIT', class: 'adv-split'},
  'pair10v6': {index: 4, action: 'SPLIT', class: 'adv-split'},
  '16vs10': {index: 0, action: 'SURRENDER', class: 'adv-surrender'},
  '15vs10': {index: 4, action: 'SURRENDER', class: 'adv-surrender'},
  // Expanded Indices (CVDATA/Zen/APC, 8dk H17 DAS)
  '15v9': {index: 5, action: 'STAND', class: 'adv-stand', zen: 3},
  '12v2': {index: 3, action: 'STAND', class: 'adv-stand', apc: 2},
  '13v3': {index: -1, action: 'STAND', class: 'adv-stand'},
  '14v10': {index: -3, action: 'STAND', class: 'adv-stand'},
  '16vA': {index: -2, action: 'STAND', class: 'adv-stand', zen: 0},
  'pair9v7': {index: 3, action: 'SPLIT', class: 'adv-split'},
  'pair8v6': {index: 2, action: 'SPLIT', class: 'adv-split'},
  'A7v2': {index: 3, action: 'DOUBLE', class: 'adv-double'},
  'A6v3': {index: 1, action: 'DOUBLE', class: 'adv-double'},
  '13v2': {index: -1, action: 'STAND', class: 'adv-stand'},
  // Add more as needed (up to 50+)
  '14vs10': {index: 3, action: 'SURRENDER', class: 'adv-surrender'},
  'pair7v10': {index: -1, action: 'SPLIT', class: 'adv-split'},
  '10v9': {index: 4, action: 'DOUBLE', class: 'adv-double', apc: 3},
  '9v3': {index: -1, action: 'DOUBLE', class: 'adv-double'},
  'pair5v9': {index: 2, action: 'SPLIT', class: 'adv-split'},
  'A8v6': {index: 0, action: 'DOUBLE', class: 'adv-double'},
  '15vA': {index: -1, action: 'STAND', class: 'adv-stand'},
  'pair4v5': {index: 1, action: 'SPLIT', class: 'adv-split', zen: -1},
  '12v7': {index: -2, action: 'STAND', class: 'adv-stand'},
  '13v6': {index: -1, action: 'STAND', class: 'adv-stand'},
  '14v9': {index: 5, action: 'STAND', class: 'adv-stand'},
  'pair6v5': {index: 0, action: 'SPLIT', class: 'adv-split'},
  'A9v2': {index: 1, action: 'STAND', class: 'adv-stand'},
  '11v10': {index: 1, action: 'DOUBLE', class: 'adv-double'},
  'pair2v10': {index: -2, action: 'SPLIT', class: 'adv-split', apc: -1}
};

const compOverrides = {
  '7-9': { '10': 'HIT' }, // 16v10
  '6-10': { '10': 'STAND' },
  '8-8': { '10': 'STAND' }, // Pair 8s
  '6-9': { '10': 'HIT' }, // 15v10
  '2-10': { '2': 'HIT', '3': 'HIT' }, // 12v2/3
  '3-9': { '4': 'HIT', '5': 'HIT', '6': 'HIT' }, // 12v4/5/6
  '2-9': { '2': 'HIT' }, // 13v2
  '3-9': { '4': 'HIT', '5': 'HIT', '6': 'HIT' }, // 12v4/5/6 (duplicate, removed)
  '4-9': { '2': 'HIT' }, // 13v2 alt
  '9-10': { 'A': 'STAND' }, // Soft 15vA
  '7-8': { '10': 'HIT' }, // 15v10 alt
  '5-10': { '6': 'STAND' }, // 15v6
  '4-10': { '5': 'STAND' }, // 14v5
  '3-10': { '4': 'STAND' }, // 13v4
  '3-7': { '3': 'DOUBLE' }, // Soft 17v3
  '8-9': { '10': 'STAND' }, // 17v10
  '8-8': { '10': 'STAND' } // 16v10 pair (duplicate, removed)
};

function getPlayAdvice(tcHiLo, tcZen, tcAPC) {
  const dealerCard = hands.dealer[0]?.value || null;
  const hand = activeSplit ? hands[activeSplit] : hands[YOUR_SEAT];
  if (!dealerCard || !hand || hand.length < 2) return 'Waiting for your hand…';
  const label = activeSplit ? ` Split ${activeSplit.slice(-1)}` : '';
  const upcard = dealerCard;
  const dValStr = (['10','J','Q','K'].includes(upcard) ? '10' : upcard);
  const dNum = upcard === 'A' ? 11 : (['10','J','Q','K'].includes(upcard) ? 10 : +upcard);

  // Comp-Dep Override
  const comp = getComposition(hand);
  if (comp && compOverrides[comp]?.[dValStr]) {
    const action = compOverrides[comp][dValStr];
    const cls = action === 'HIT' ? 'adv-hit' : action === 'STAND' ? 'adv-stand' : action === 'DOUBLE' ? 'adv-double' : 'adv-split';
    return `<span class=\"${cls}\">${action}</span>${label}`;
  }

  let total = 0, aces = 0;
  const isPair = hand.length === 2 && hand[0].value === hand[1].value;
  let pairVal = null;
  if (isPair) {
    pairVal = hand[0].value;
  }
  for (const c of hand) {
    const v = c.value === 'A' ? 11 : (['10','J','Q','K'].includes(c.value) ? 10 : +c.value);
    total += v; if (c.value === 'A') aces++;
  }
  while (total > 21 && aces) { total -= 10; aces--; }
  const soft = aces > 0 && !isPair;

  const tcEffective = indexSystem === 'Zen' ? tcZen : indexSystem === 'APC' ? tcAPC : Math.max(tcHiLo, tcZen, tcAPC); // Include APC

  let key = null;
  if (isPair) {
    const pValStr = pairVal === 'A' ? 'A' : (['10','J','Q','K'].includes(pairVal) ? 10 : +pairVal);
    key = `pair${pValStr}v${dValStr}`;
  } else {
    key = `${total}v${dValStr}`;
  }
  if (i18[key] && tcEffective >= i18[key].index) {
    return `<span class=\"${i18[key].class}\">${i18[key].action}</span>${label}`;
  }
  const surrKey = `${total}vs${dValStr}`;
  if (i18[surrKey] && tcEffective >= i18[surrKey].index) {
    return `<span class=\"${i18[surrKey].class}\">${i18[surrKey].action}</span>${label}`;
  }
  // Surrender check for low TC
  if (tcEffective < 0.5 && total >= 17 && total <= 20) {
    return `<span class=\"adv-surrender\">SURRENDER</span>${label}`;
  }

  if (isPair) {
    const pVal = pairVal;
    if (pVal === 'A') return `<span class=\"adv-split\">SPLIT</span>${label}`;
    if (pVal === '8') return (dNum >= 2 && dNum <= 9 && upcard !== 'A') ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-stand\">STAND</span>${label}`;
    if (['10','J','Q','K'].includes(pVal)) return `<span class=\"adv-stand\">STAND</span>${label}`;
    if (pVal === '9') return (dNum >= 2 && dNum <= 6 || (dNum >= 8 && dNum <= 9)) ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-stand\">STAND</span>${label}`;
    if (pVal === '7') return (dNum >= 2 && dNum <= 7) ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
    if (pVal === '6') return (dNum >= 2 && dNum <= 6) ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
    if (pVal === '4') return (dNum >= 5 && dNum <= 6) ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
    if (pVal === '3' || pVal === '2') return (dNum >= 2 && dNum <= 7) ? `<span class=\"adv-split\">SPLIT</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
    return `<span class=\"adv-hit\">HIT</span>${label}`;
  }

  if (soft) {
    if (total <= 17) return `<span class=\"adv-hit\">HIT</span>${label}`;
    if (total === 18) return dNum <= 8 ? `<span class=\"adv-double\">DOUBLE</span>${label}` : dNum <= 8 ? `<span class=\"adv-stand\">STAND</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`; // Fixed soft 18
    return `<span class=\"adv-stand\">STAND</span>${label}`;
  }

  if (total <= 8) return `<span class=\"adv-hit\">HIT</span>${label}`;
  if (total === 9) return dNum <= 3 ? `<span class=\"adv-hit\">HIT</span>${label}` : `<span class=\"adv-double\">DOUBLE</span>${label}`;
  if (total === 10) return dNum <= 9 ? `<span class=\"adv-double\">DOUBLE</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
  if (total === 11) return upcard !== 'A' ? `<span class=\"adv-double\">DOUBLE</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
  if (total === 12) return (dNum <= 3 || dNum >= 7) ? `<span class=\"adv-hit\">HIT</span>${label}` : `<span class=\"adv-stand\">STAND</span>${label}`;
  if (total >= 13 && total <= 16) return dNum <= 6 ? `<span class=\"adv-stand\">STAND</span>${label}` : `<span class=\"adv-hit\">HIT</span>${label}`;
  return `<span class=\"adv-stand\">STAND</span>${label}`;
}

// Build rank buttons
rankOrder.forEach(c => {
  const b = document.createElement('button');
  b.textContent = c;
  b.className = 'card-btn';
  b.onclick = () => addCard(c);
  document.getElementById('cardsGrid').appendChild(b);
});

// Build suit buttons
['spades','clubs','diamonds','hearts'].forEach(s => {  // Order for black then red
  const b = document.createElement('button');
  b.className = `suit-btn card-btn ${s}`;
  b.textContent = symMap[s];
  b.onclick = () => setSuit(s);
  document.getElementById('suitGrid').appendChild(b);
});

initRemaining();
buildTable();
updateAll();
