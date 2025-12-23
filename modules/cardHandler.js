const { pickSuit } = require('./deck');

// Add a card to the specified hand
function addCard(val, target) {
  const suit = pickSuit(val);
  state.remaining[val][suit]--;
  if (state.remaining[val][suit] < 0) state.remaining[val][suit] = 0;
  
  // Update counts for card counting systems
  Object.keys(state.counts).forEach(countingSystem => {
    state.counts[countingSystem].rc += map[countingSystem][val];
  }); 
  if (val === 'A') aceRC -= 1;
  
  // Add the card to the DOM
  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class="corner top-left">${val === '10' ? 'T' : val}</span>
    <span class="corner bottom-right">${val === '10' ? 'T' : val}</span>
    <span class="suit top-right">${symMap[suit]}</span>
    <span class="suit bottom-left">${symMap[suit]}</span>
  `;

  const container = target.match(/[AB]$/) ? document.getElementById(`hand-${target}`) : handContainers[target];
  container.appendChild(mini);
  
  if (!hands[target]) hands[target] = [];
  hands[target].push({ value: val, element: mini });
  lastAddedCard = mini;
}

// Remove the last card from the active hand
function removeLastCardFromActiveHand() {
  const target = inputTarget;
  const hand = hands[target];
  if (!hand || hand.length === 0) return;
  
  const card = hand.pop();
  const suit = card.element.dataset.suit;
  state.counts.HiLo.rc -= map.HiLo[card.value];
  state.counts.APC.rc -= map.APC[card.value];
  state.counts.Zen.rc -= map.Zen[card.value];
  state.counts.OmegaII.rc -= map.OmegaII[card.value];
  if (card.value === 'A') aceRC += 1;

  state.remaining[card.value][suit]++;
  if (state.remaining[card.value][suit] < 0) state.remaining[card.value][suit] = 0;
  card.element.remove();
  if (hand.length === 0) lastAddedCard = null;
}

// Perform a split operation
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
}

// Export functions
module.exports = { addCard, removeLastCardFromActiveHand, performSplit };