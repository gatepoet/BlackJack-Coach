import { pickSuit } from './deck.js';

// Add a card to the specified hand
function addCard(val, target, state) {
  const suit = pickSuit(val);
  state.remaining[val][suit]--;
  if (state.remaining[val][suit] < 0) state.remaining[val][suit] = 0;
  
  // Update counts for card counting systems
  Object.keys(state.counts).forEach(countingSystem => {
    state.counts[countingSystem].rc += state.map[countingSystem][val];
  }); 
  if (val === 'A') state.aceRC += 1;
  
  // Add the card to the DOM
  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class="corner top-left">${val === '10' ? 'T' : val}</span>
    <span class="corner bottom-right">${val === '10' ? 'T' : val}</span>
    <span class="suit top-right">${state.symMap[suit]}</span>
    <span class="suit bottom-left">${state.symMap[suit]}</span>
  `;

  const container = target.match(/[AB]$/) ? document.getElementById(`hand-${target}`) : state.handContainers[target];
  container.appendChild(mini);
  
  if (!state.hands[target]) state.hands[target] = [];
  state.hands[target].push({ value: val, element: mini });
  state.lastAddedCard = mini;
}

// Change the suit of the last added card
function changeLastCardSuit(newSuit, state) {
  if (!state.lastAddedCard) return;
  
  const lastCard = state.lastAddedCard;
  const currentValue = lastCard.dataset.val;
  const oldSuit = lastCard.dataset.suit;
  
  // Update the suit in the DOM
  lastCard.dataset.suit = newSuit;
  const suitElements = lastCard.querySelectorAll('.suit');
  suitElements.forEach(el => {
    el.textContent = state.symMap[newSuit];
  });
  
  // Update the suit in the state
  state.remaining[currentValue][oldSuit]++;
  state.remaining[currentValue][newSuit]--;
  if (state.remaining[currentValue][newSuit] < 0) state.remaining[currentValue][newSuit] = 0;
  
  // No need to update card counting systems as the card value is unchanged
  // The card counting is only based on card value, not suit
}

// Remove the last card from the active hand
function removeLastCardFromActiveHand(state) {
  const target = state.inputTarget;
  const hand = state.hands[target];
  if (!hand || hand.length === 0) return;
  
  const card = hand.pop();
  const suit = card.element.dataset.suit;
  state.counts.WongHalves.rc += state.map.WongHalves[card.value];
  state.counts.HiLo.rc += state.map.HiLo[card.value];
  state.counts.APC.rc += state.map.APC[card.value];
  state.counts.Zen.rc += state.map.Zen[card.value];
  state.counts.OmegaII.rc += state.map.OmegaII[card.value];
  if (card.value === 'A') state.aceRC -= 1;

  state.remaining[card.value][suit]++;
  if (state.remaining[card.value][suit] < 0) state.remaining[card.value][suit] = 0;
  card.element.remove();
  if (hand.length === 0) state.lastAddedCard = null;
}

// Perform a split operation
function performSplit(baseSeat, state) {
  const hand = state.hands[baseSeat];
  if (!hand || hand.length !== 2 || hand[0].value !== hand[1].value || state.splitContainers[baseSeat].style.display !== 'none') return;

  const cardA = hand[0];
  const cardB = hand[1];

  state.hands[baseSeat + 'A'] = [cardA];
  state.hands[baseSeat + 'B'] = [cardB];
  delete state.hands[baseSeat];

  state.handContainers[baseSeat].style.display = 'none';
  state.splitContainers[baseSeat].style.display = 'flex';

  cardA.element.dataset.seat = baseSeat + 'A';
  cardB.element.dataset.seat = baseSeat + 'B';
  document.getElementById(`hand-${baseSeat}A`).appendChild(cardA.element);
  document.getElementById(`hand-${baseSeat}B`).appendChild(cardB.element);
}

// Export functions
export { addCard, removeLastCardFromActiveHand, performSplit, changeLastCardSuit };
