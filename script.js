import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const SHOE_DECKS = 8;
const TOTAL_CARDS = SHOE_DECKS * 52;
const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
let remaining = {};
let acesLeft = 0;
let aceRC = 0;                  // Ace side-count
let cardsDealt = 0;
let insuranceResolved = false;
let lastAddedCard = null;

const map = {
  HiLo: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1},
  APC:  {'A':0,'2':1,'3':1,'4':2,'5':3,'6':2,'7':2,'8':1,'9':-3,'10':-4},
  Zen: {'A':-1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':1,'8':0,'9':0,'10':-2},
  OmegaII: {'A':-2,'2':1,'3':1,'4':2,'5':3,'6':2,'7':1,'8':-1,'9':-1,'10':-2}
};
['J','Q','K'].forEach(face => {
  for (let sys in map) map[sys][face] = map[sys]['10'];
});

const counts = { HiLo: { rc: 0 }, APC: { rc: 0 }, Zen: { rc: 0 }, OmegaII: { rc: 0 } };

const VAR = 1.309;
const EDGE_PER_TC = 0.005;
let RA_FACTOR = 0.5;

let YOUR_SEAT = '1';
let inputTarget = '1';
let activeSplit = null;
let disabledSeats = new Set();
let useCompDep = false;
let useHeatSim = false;
let indexSystem = 'Basic';
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
  ['A','2','3'],['2','3','4'],['3','4','5'],['4','5','6'],['5','6','7'],
  ['6','7','8'],['7','8','9'],['8','9','10'],['9','10','J'],['10','J','Q'],
  ['J','Q','K'],['Q','K','A']
];
const order = ['dealer', '7', '6', '5', '4', '3', '2', '1'];

function getFirstPlayingSeat() {
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!disabledSeats.has(seatStr)) return seatStr;
  }
  return YOUR_SEAT;
}

function initRemaining() {
  remaining = {};
  rankOrder.forEach(rank => {
    remaining[rank] = {};
    suits.forEach(suit => remaining[rank][suit] = 8);
  });
  acesLeft = 0;
  aceRC = 0;
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
      <div class="seat-header">
        <div class="seat-round ${seat==='dealer'?'dealer':'player'} ${seat===YOUR_SEAT?'your-seat':''}" data-seat="${seat}">
          ${seat === 'dealer' ? 'D' : seat}
        </div>
      </div>
      <div class="hand" id="hand-${seat}"></div>
      
      <div class="split-container" id="split-${seat}" style="display:none;">
        <div class="split-hand"><div class="split-label">A</div><div class="hand" id="hand-${seat}A"></div></div>
        <div class="split-hand"><div class="split-label">B</div><div class="hand" id="hand-${seat}B"></div></div>
      </div>

      ${seat !== 'dealer' ? '<button class="split-btn" id="splitBtn-'+seat+'">SPLIT</button>' : ''}
    `;
    table.appendChild(col);

    handContainers[seat] = col.querySelector(`#hand-${seat}`);
    splitContainers[seat] = col.querySelector(`#split-${seat}`);
    if (seat !== 'dealer') splitButtons[seat] = col.querySelector('#splitBtn-'+seat);

    const header = col.querySelector('.seat-round');
    header.addEventListener('dblclick', (e) => { e.stopPropagation(); YOUR_SEAT = seat; document.querySelectorAll('.your-seat').forEach(x=>x.classList.remove('your-seat')); header.classList.add('your-seat'); });
    header.addEventListener('click', () => setInputTarget(seat));

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
  const baseT = t.replace(/[AB]$/, '');
  if (!t.match(/[AB]$/) && disabledSeats.has(baseT)) {
    const baseIdx = order.indexOf(baseT);
    t = order[(baseIdx + order.length - 1) % order.length];
  }

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
  const header = document.querySelector(`.seat-round[data-seat="${base === 'dealer' ? 'dealer' : base}"]`);
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
    if (nextIdx === currentIdx) break;
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
    if (nextIdx === currentIdx) break;
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
      const seatEl = document.querySelector(`.seat-round[data-seat="${base === 'dealer' ? 'dealer' : base}"]`);
      if (disabledSeats.has(base)) {
        disabledSeats.delete(base);
        seatEl.classList.remove('disabled');
      } else {
        disabledSeats.add(base);
        seatEl.classList.add('disabled');
      }
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

function setSuit(newSuit) {
  if (!lastAddedCard) return;

  const val = lastAddedCard.dataset.val;
  const oldSuit = lastAddedCard.dataset.suit;

  if (oldSuit === newSuit) return;

  // Check if we can take a card from the new suit
  if ((remaining[val][newSuit] || 0) <= 0) {
    // Optional: give user feedback
    console.warn(`No ${val} of ${newSuit} left in shoe`);
    return; // silently reject invalid change
  }

  // Now it's safe: move one card from newSuit → oldSuit
  remaining[val][oldSuit]++;           // put back to old suit
  remaining[val][newSuit]--;           // take from new suit

  // Update the card display
  lastAddedCard.dataset.suit = newSuit;
  const sym = symMap[newSuit];
  lastAddedCard.querySelector('.top-right').textContent = sym;
  lastAddedCard.querySelector('.bottom-left').textContent = sym;

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
  counts.OmegaII.rc += map.OmegaII[val];
  if (val === 'A') aceRC -= 1;

  const suit = pickSuit(val);
  remaining[val][suit]--;
  if (remaining[val][suit] < 0) remaining[val][suit] = 0;
  cardsDealt++;

  const sym = symMap[suit];
  const displayVal = val === '10' ? 'T' : val;

  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class="corner top-left">${displayVal}</span>
    <span class="corner bottom-right" style="transform: rotate(180deg);">${displayVal}</span>
    <span class="suit top-right">${sym}</span>
    <span class="suit bottom-left" style="transform: rotate(180deg);">${sym}</span>
  `;

  let addBase = target.replace(/[AB]$/, '');
  if (disabledSeats.has(addBase)) {
    const addIdx = order.indexOf(addBase);
    moveLeft(addBase, addIdx);
    target = inputTarget;
    addBase = target.replace(/[AB]$/, '');
  }

  const container = target.match(/[AB]$/)
    ? document.getElementById(`hand-${target}`)
    : handContainers[target];

  container.appendChild(mini);

  if (!hands[target]) hands[target] = [];
  hands[target].push({ value: val, element: mini });
  lastAddedCard = mini;

  let base = target.replace(/[AB]$/, '');

  if ((hands[target].length === 1 || hands[target].length === 2) && addBase !== 'dealer' || (addBase === 'dealer' && hands[target].length === 1)) {
    const currentIdx = order.indexOf(addBase);
    if (hands[target].length === 2 && addBase === '7') {
      setInputTarget(getFirstPlayingSeat());
    } else if (addBase === 'dealer' && hands[target].length === 1) {
      setInputTarget(getFirstPlayingSeat());
    } else {
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
  if (card.value === 'A') aceRC += 1;
  remaining[card.value][suit]++;
  if (remaining[card.value][suit] < 0) remaining[card.value][suit] = 0;
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

  new Sortable(document.getElementById(`hand-${baseSeat}A`), { group: 'cards', animation: 150, onEnd: updateAll });
  new Sortable(document.getElementById(`hand-${baseSeat}B`), { group: 'cards', animation: 150, onEnd: updateAll });

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
  document.querySelectorAll('.seat-round').forEach(el => el.classList.remove('disabled'));
  document.querySelectorAll('.hand-total').forEach(el => el.remove()); // Added to clear totals
  lastAddedCard = null;
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
  counts.OmegaII.rc = 0; // Added
  aceRC = 0;
  document.querySelectorAll('.mini').forEach(m => m.remove());
  for (const s in hands) hands[s] = [];
  disabledSeats.clear();
  document.querySelectorAll('.seat-round').forEach(el => el.classList.remove('disabled'));
  insuranceResolved = false;
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


let combinedChart; // Global reference to SVG for updates

function initCombinedChart() {
  const container = d3.select('#combinedChart');
  const svg = container
    .html('') // Clear previous
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('viewBox', '0 0 100 100') // Square viewBox for consistent chart proportions
    .style('width', '100%')
    .style('height', '100%');

  // Dynamic dimensions based on square aspect
  let size = 100; // Square side
  const updateDimensions = () => {
    const rect = container.node().getBoundingClientRect();
    const chartSize = Math.min(rect.width, rect.height); // Scale to fit smaller dim
    size = Math.max(chartSize, 80); // Min size for visibility
    const viewBoxStr = `0 0 ${size} ${size}`;
    svg.attr('viewBox', viewBoxStr);
    if (combinedChart) {
      // Re-render if already initialized
      updateCombinedChart(combinedChart.rankTotals || rankOrder.map(r => 32), combinedChart.suitTotals || {spades:104,clubs:104,hearts:104,diamonds:104}, rankOrder, ['spades','clubs','hearts','diamonds']);
    }
  };

  // Initial call
  setTimeout(updateDimensions, 0); // Defer to after DOM

  // Resize observer for true responsiveness
  if (window.ResizeObserver) {
    new ResizeObserver(updateDimensions).observe(container.node());
  } else {
    window.addEventListener('resize', updateDimensions);
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = (size / 2) * 0.8; // Use 80% of half-size for outer (larger chart)
  const innerRadiusBase = outerRadius * 0.5; // Adjusted for better visibility in square

  // Color scales
  const rankColors = ['#ef4444','#f97316','#facc15','#a3e635','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#6366f1','#1e40af','#dc2626','#991b1b'];
  const suitColors = ['#000', '#006400', '#dc2626', '#00008b'];
  const suitSymbols = ['♠', '♣', '♥', '♦'];

  // Generators
  const pie = d3.pie().sort(null);
  const arc = d3.arc();

  // Tooltip setup
  const tooltip = d3.select('body').append('div')
    .attr('class', 'd3-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '5px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000');

  // Center group (responsive)
  const centerGroup = svg.append('g')
    .attr('transform', `translate(${centerX}, ${centerY})`);

  function showTooltip(event, d, label, value) {
    tooltip.transition().duration(200).style('opacity', .9);
    tooltip.html(`${label}: ${value}`)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 28) + 'px');
  }

  function hideTooltip() {
    tooltip.transition().duration(500).style('opacity', 0);
  }

  // Draw outer ring: Ranks
  const outerGroup = centerGroup.append('g');
  const initialRankData = rankOrder.map(r => 32);
  const outerPieData = pie(initialRankData);
  const outerPaths = outerGroup.selectAll('.rank-path')
    .data(outerPieData)
    .enter()
    .append('path')
    .attr('class', 'rank-path')
    .attr('fill', (d, i) => rankColors[i])
    .attr('d', d => arc.innerRadius(innerRadiusBase).outerRadius(outerRadius)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, rankOrder[d.index], d.data); })
    .on('mouseout', hideTooltip);

  // Outer labels (adjusted font for space)
  const outerLabels = outerGroup.selectAll('.rank-label')
    .data(outerPieData)
    .enter()
    .append('text')
    .attr('class', 'rank-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', Math.min(8, size / 12) + 'px') // Responsive font based on size
    .attr('fill', '#eee')
    .attr('dy', '.35em')
    .attr('transform', d => {
      const pos = arc.innerRadius(innerRadiusBase * 0.8).outerRadius(outerRadius * 0.9).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => d.data.toString());

  // Draw inner ring: Suits
  const innerGroup = centerGroup.append('g');
  const initialSuitData = [104, 104, 104, 104];
  const innerPieData = pie(initialSuitData);
  const innerPaths = innerGroup.selectAll('.suit-path')
    .data(innerPieData)
    .enter()
    .append('path')
    .attr('class', 'suit-path')
    .attr('fill', (d, i) => suitColors[i])
    .attr('d', d => arc.innerRadius(0).outerRadius(innerRadiusBase)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, suitSymbols[d.index], d.data); })
    .on('mouseout', hideTooltip);

  // Inner labels
  const innerLabels = innerGroup.selectAll('.suit-label')
    .data(innerPieData)
    .enter()
    .append('text')
    .attr('class', 'suit-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', Math.min(14, size / 6) + 'px') // Responsive
    .attr('fill', '#fff')
    .attr('dy', '.35em')
    .attr('transform', d => {
      const pos = arc.innerRadius(0).outerRadius(innerRadiusBase).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => suitSymbols[d.index]);

  // Store with initial data for resize re-render
  combinedChart = { 
    svg, container, centerGroup, outerGroup, innerGroup, outerRadius, innerRadiusBase, 
    pie, arc, rankColors, suitColors, suitSymbols, tooltip,
    outerPaths, outerLabels, innerPaths, innerLabels, showTooltip, hideTooltip,
    rankTotals: initialRankData, suitTotals: {spades:104, clubs:104, hearts:104, diamonds:104}
  };
}

// Update function (now also handles resize via stored data)
function updateCombinedChart(rankTotals, suitTotals, rankOrder, suitOrder) {
  if (!combinedChart) return;

  const { 
    container, centerGroup, outerGroup, innerGroup, pie, arc, rankColors, suitColors, suitSymbols, 
    outerPaths, outerLabels, innerPaths, innerLabels,
    showTooltip, hideTooltip, svg 
  } = combinedChart;

  // Update stored data
  combinedChart.rankTotals = rankTotals;
  combinedChart.suitTotals = suitTotals;

  // Re-compute dimensions and radii (for resize)
  const rect = container.node().getBoundingClientRect();
  const chartSize = Math.min(rect.width, rect.height);
  const size = Math.max(chartSize, 80);
  const viewBoxStr = `0 0 ${size} ${size}`;
  svg.attr('viewBox', viewBoxStr);
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = (size / 2) * 0.8;
  const innerRadiusBase = outerRadius * 0.5;
  combinedChart.outerRadius = outerRadius;
  combinedChart.innerRadiusBase = innerRadiusBase;
  centerGroup.attr('transform', `translate(${centerX}, ${centerY})`);

  // Update outer ring
  const outerPieData = pie(rankTotals);
  outerPaths.data(outerPieData)
    .attr('fill', (d, i) => rankColors[i % rankColors.length])
    .attr('d', d => arc.innerRadius(innerRadiusBase).outerRadius(outerRadius)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, rankOrder[d.index], d.data); })
    .on('mouseout', hideTooltip);

  outerLabels.data(outerPieData)
    .attr('font-size', Math.min(8, size / 12) + 'px')
    .attr('transform', d => {
      const pos = arc.innerRadius(innerRadiusBase * 0.8).outerRadius(outerRadius * 0.9).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => d.data.toString());

  // Update inner ring
  const suitData = suitOrder.map(s => suitTotals[s]);
  const innerPieData = pie(suitData);
  innerPaths.data(innerPieData)
    .attr('fill', (d, i) => suitColors[i])
    .attr('d', d => arc.innerRadius(0).outerRadius(innerRadiusBase)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, suitSymbols[d.index], d.data); })
    .on('mouseout', hideTooltip);

  innerLabels.data(innerPieData)
    .attr('font-size', Math.min(14, size / 6) + 'px')
    .attr('transform', d => {
      const pos = arc.innerRadius(0).outerRadius(innerRadiusBase).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => suitSymbols[d.index]);
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
  if (!useCompDep) return null;
  const values = hand.map(c => c.value).sort();
  const nonAces = values.filter(v => v !== 'A').join('-');
  const aces = values.filter(v => v === 'A').length;
  return aces ? `${nonAces}-A${aces}` : nonAces; // Updated for aces in comp
}

function computePPEV(pPerfect=25, pColored=12, pMixed=6) {
  let t = 0;
  rankOrder.forEach(r => suits.forEach(s => t += remaining[r][s] || 0));
  if (t < 5) return -1;
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
  if (t < 5) return -1;
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
  let num = pSuited3 * pays.suited3 + pSF * pays.sf + pRegThree * pays.three + pStr * pays.str + pFlush * pays.flush;
  return num / denom - 1;
}

// Risk of Ruin Monte Carlo Simulation
function calculateRoR(bankroll, betSize, edge, variance, numSimulations = 5000, maxHands = 10000) {
  const units = Math.floor(bankroll / betSize);
  let ruinCount = 0;

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentUnits = units;
    let handsPlayed = 0;

    while (currentUnits > 0 && handsPlayed < maxHands) {
      handsPlayed++;
      const rand = Math.random();
      let outcome;
      // Approximate using normal for outcomes
      const mu = edge;
      const sigma = Math.sqrt(variance);
      const z = (rand - 0.5) * 2; // -1 to 1
      outcome = z * sigma + mu > 0 ? 1 : z * sigma + mu < 0 ? -1 : 0;
      currentUnits += outcome;
      if (currentUnits <= 0) {
        ruinCount++;
        break;
      }
    }
  }

  return (ruinCount / numSimulations) * 100; // %
}

function updateAll() {
  let total_rem = 0;
  let rankTotals = rankOrder.map(r => {
    let tot = 0;
    suits.forEach(s => tot += remaining[r][s] || 0);
    total_rem += tot;
    return tot;
  });
  const decksLeft = Math.max(total_rem / 52, 0.01);
  let tcHiLo = decksLeft > 0.01 ? counts.HiLo.rc / decksLeft : 0;
  let tcAPC = decksLeft > 0.01 ? counts.APC.rc / decksLeft : 0;
  let tcZen = decksLeft > 0.01 ? counts.Zen.rc / decksLeft : 0;
  let tcOmegaII = decksLeft > 0.01 ? counts.OmegaII.rc / decksLeft : 0;
  let aceTC = decksLeft > 0.01 ? aceRC / decksLeft : 0;
  const pen = ((1 - total_rem / TOTAL_CARDS) * 100).toFixed(2);

  let acesLeft = 0;
  suits.forEach(s => acesLeft += remaining['A'][s] || 0);

  document.getElementById('penetration').textContent = pen + '%';
  document.getElementById('decksLeft').textContent = decksLeft.toFixed(2);
  document.getElementById('hiLoRC').textContent = counts.HiLo.rc;
  document.getElementById('hiLoTC').textContent = tcHiLo.toFixed(2);
  document.getElementById('hiLoTC2').textContent = tcHiLo.toFixed(2);
  document.getElementById('apcTC').textContent = tcAPC.toFixed(2);
  document.getElementById('zenTC').textContent = tcZen.toFixed(2);
  document.getElementById('omegaIITC').textContent = tcOmegaII.toFixed(2);
  document.getElementById('aceTC').textContent = aceTC.toFixed(2);

  const expAces = 32 * decksLeft;
  const ra = expAces > 0 ? (acesLeft / expAces) - 1 : 0;
  document.getElementById('ra').textContent = ra.toFixed(2);
  document.getElementById('ra').className = ra >= 0 ? '' : 'negative';

  let state = 'neutral';
  if (tcAPC >= 1.0 || ra >= 0.5) {
    state = "enter";
  } else if (tcAPC <= -1.0 || ra <= -0.5) {
    state = "exit";
  } else {
    state = "neutral";
  }
  const advice = document.getElementById('advice');
  advice.className = `wong-${state}`;

  const dealerUp = hands.dealer[0]?.value;
  if (dealerUp === 'A' && !insuranceResolved) {
    let tensLeft = 0;
    ['10','J','Q','K'].forEach(r => suits.forEach(s => tensLeft += remaining[r][s] || 0));
    const pBJ = total_rem > 0 ? tensLeft / total_rem : 0.3077;
    let insEV = pBJ - 0.5 + RA_FACTOR * ra + 0.005 * aceTC;
    const take = insEV > 0;
    
    document.getElementById('insAdvice').textContent = take ? `TAKE INSURANCE (+${(insEV*100).toFixed(1)}%)` : 'NO INSURANCE';
    document.getElementById('insAdvice').style.color = take ? '#22c55e' : '#ef4444';
    document.getElementById('insuranceBox').style.display = 'flex';
  } else {
    document.getElementById('insuranceBox').style.display = 'none';
  }

  let tcEffective;
  switch (indexSystem) {
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
  const raEdgeBonus      = EDGE_PER_TC * RA_FACTOR * Math.max(0, -ra);      // ace-poor = extra edge
  const aceSideBonus     = 0.005 * aceTC;                                   // fine-tuning from ace side-count
  let edge = rawEdgeFromCount + raEdgeBonus + aceSideBonus;

  // === 2. Base units according to your chosen system ===
  let finalUnits;
  let heatLevel = 'Cool';
  let heatColor = '#94a3b8';

  if (useKelly) {
    const kellyFraction = 0.5;
    finalUnits = (edge / VAR) * kellyFraction * (bankroll / betUnit);
  } else if (indexSystem === 'Omega II') {
    finalUnits = getOmegaRamp(tcEffective);
  } else {
    finalUnits = tcEffective <= 0 ? 1 : mikkiMultiplier * tcEffective + 1;
  }

  // RA adjustment
  const raMultiplier = ra > 0.5 ? 0.80 : ra < -0.5 ? 1.20 : 1;
  finalUnits *= raMultiplier;

  // === HEAT SIMULATION (camouflage + visual feedback) ===
  if (useHeatSim) {
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
    `${finalUnits}x — $${betDollar.toLocaleString()}`;

  const heatEl = document.getElementById('heatLevel');
  heatEl.textContent = heatLevel;
  heatEl.style.color = heatColor;
  // Consolidated kellyFrac
  document.getElementById('kellyFrac').textContent = useKelly ? '0.5 Kelly' : indexSystem === 'Omega II' ? 'Omega II Ramp' : 'Mikki Ramp';

  const suitOrder = ['spades', 'clubs', 'hearts', 'diamonds'];
  let suitTotals = { spades: 0, clubs: 0, hearts: 0, diamonds: 0 };
  suits.forEach(suit => {
    rankOrder.forEach(r => suitTotals[suit] += remaining[r][suit] || 0);
  });
  updateCombinedChart(rankTotals, suitTotals, rankOrder, suitOrder);
  
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
      container.insertAdjacentElement('afterbegin', totalEl);
    }
    totalEl.style.color = color;
    totalEl.textContent = `Total: ${total} ${status}`;
  });
  document.getElementById('advice').innerHTML = getPlayAdvice(tcHiLo, tcZen, tcAPC, tcOmegaII);
}

// Betting Ramp for Omega II
function getOmegaRamp(tc) {
  if (tc <= 0) return 1;
  if (tc < 1) return 1;
  if (tc < 2) return 2;
  if (tc < 3) return 4;
  if (tc < 4) return 6;
  if (tc < 5) return 8;
  return 12; // +5+
}

function getNonAceValue(hand) {
  const nonAces = hand.filter(c => c.value !== 'A').map(c => c.value);
  if (nonAces.length === 0) return null; // AA pair
  if (nonAces.length === 1) return nonAces[0];
  // For multi non-ace soft (rare, e.g., A+multi), use total-11 as proxy key
  const nonAceTotal = nonAces.reduce((sum, v) => sum + (['10','J','Q','K'].includes(v) ? 10 : +v), 0);
  return nonAceTotal.toString(); // e.g., '7' for A+2+5
}


// Toggles
document.getElementById('compDep').addEventListener('change', e => { useCompDep = e.target.checked; updateAll(); });
document.getElementById('heatSim').addEventListener('change', e => { useHeatSim = e.target.checked; updateAll(); });
document.getElementById('indexSet').addEventListener('change', e => { indexSystem = e.target.value; updateAll(); });
document.getElementById('useKelly').addEventListener('change', e => { useKelly = e.target.checked; updateAll(); });
document.getElementById('bankroll').addEventListener('input', updateAll);
document.getElementById('betUnit').addEventListener('input', updateAll);
document.getElementById('mikkiMultiplier').addEventListener('input', updateAll);
document.getElementById('raFactor').addEventListener('input', (e) => { RA_FACTOR = parseFloat(e.target.value) || 0.5; updateAll(); });
document.getElementById('ppPerfect').addEventListener('input', updateAll);
document.getElementById('ppColored').addEventListener('input', updateAll);
document.getElementById('ppMixed').addEventListener('input', updateAll);
document.getElementById('p3Suited3').addEventListener('input', updateAll);
document.getElementById('p3SF').addEventListener('input', updateAll);
document.getElementById('p3Three').addEventListener('input', updateAll);
document.getElementById('p3Str').addEventListener('input', updateAll);
document.getElementById('p3Flush').addEventListener('input', updateAll);

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

function getPlayAdvice(tcHiLo, tcZen, tcAPC, tcOmegaII) {
  const dealerCard = hands.dealer[0]?.value || null;
  const hand = activeSplit ? hands[activeSplit] : hands[YOUR_SEAT];
  if (!dealerCard || !hand || hand.length < 2) return 'Waiting for your hand…';
  const label = activeSplit ? ` Split ${activeSplit.slice(-1)}` : '';
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

  const systemKey = indexSystem?.toLowerCase().replace(' ', '').replace('ii', 'i') || 'index'; // Fixed
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

// Helper for basic surrender (8-deck S17)
function basicActionWouldBeSurr(total, dValStr) {
  return (total === 15 || total === 16) && (dValStr === '10' || dValStr === 'A');
}

rankOrder.forEach(c => {
  const b = document.createElement('button');
  b.textContent = c;
  b.className = 'card-btn';
  b.onclick = () => addCard(c);
  document.getElementById('cardsGrid').appendChild(b);
});

suits.reverse().forEach(s => {
  const b = document.createElement('button');
  b.className = `suit-btn card-btn ${s}`;
  b.textContent = symMap[s];
  b.onclick = () => setSuit(s);
  document.getElementById('suitGrid').appendChild(b);
});

let rorTable = null;

function precomputeRoRTable() {
  console.log("Building RoR table...");
  const table = {};
  const v = 1.309;
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
function getCurrentRoR(bankroll, betUnit, edge) {
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
document.addEventListener('DOMContentLoaded', () => {
  initCombinedChart();
  precomputeRoRTable();
  initRemaining();
  buildTable();
  updateAll();
});