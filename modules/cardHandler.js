// Module: cardHandler - Card manipulation (add, remove, split, suit change)
import { state, suits } from './state.js';
import { pickSuit } from './deck.js';
import { setInputTarget, getFirstPlayingSeat, moveLeft as _moveLeft } from './seatManager.js';

// Re-export for use in main script
export function addCard(val) {
  let target = state.inputTarget;

  // Validate inputTarget against known seats
  const baseSeat = target.replace(/[AB]$/, '');
  if (!state.order.includes(baseSeat)) {
    console.warn(`Invalid seat ${baseSeat}, resetting to 1`);
    setInputTarget('1');
    return;
  }

  // If we're in a split container, route to active hand
  if (!target.match(/[AB]$/) && state.splitContainers[target] && state.splitContainers[target].style.display !== 'none') {
    const a = state.hands[target + 'A'];
    const b = state.hands[target + 'B'];
    if (b && b.length > 0) target = target + 'B';
    else if (a && a.length > 0) target = target + 'A';
  }

  // Update counting systems
  state.counts.HiLo.rc += state.map.HiLo[val];
  state.counts.APC.rc  += state.map.APC[val];
  state.counts.Zen.rc  += state.map.Zen[val];
  state.counts.OmegaII.rc += state.map.OmegaII[val];
  if (val === 'A') state.aceRC -= 1;

  // Pick suit and update remaining cards
  const suit = pickSuit(val);
  state.remaining[val][suit]--;
  if (state.remaining[val][suit] < 0) state.remaining[val][suit] = 0;
  state.cardsDealt++;

  // Create card DOM element
  const sym = state.symMap[suit];
  const displayVal = val === '10' ? 'T' : val;

  const mini = document.createElement('div');
  mini.className = 'mini';
  mini.dataset.val = val;
  mini.dataset.suit = suit;
  mini.innerHTML = `
    <span class="corner top-left">${displayVal}</span>
    <span class="corner bottom-right">${displayVal}</span>
    <span class="suit top-right">${sym}</span>
    <span class="suit bottom-left">${sym}</span>
  `;

  // Handle disabled seat navigation
  let addBase = target.replace(/[AB]$/, '');
  if (state.disabledSeats.has(addBase)) {
    const addIdx = state.order.indexOf(addBase);
    _moveLeft(addBase, addIdx);
    target = state.inputTarget;
    addBase = target.replace(/[AB]$/, '');
  }

  // Add to appropriate container
  const container = target.match(/[AB]$/)
    ? document.getElementById(`hand-${target}`)
    : state.handContainers[target];

  if (!container) {
    console.warn(`No container found for target: ${target}`);
    return;
  }

  container.appendChild(mini);

  if (!state.hands[target]) state.hands[target] = [];
  state.hands[target].push({ value: val, element: mini });
  state.lastAddedCard = mini;

  // Auto-navigate after adding cards (except for dealer's first card)
  let base = target.replace(/[AB]$/, '');

  if ((state.hands[target].length === 1 || state.hands[target].length === 2) && addBase !== 'dealer' || 
      (addBase === 'dealer' && state.hands[target].length === 1)) {
    const currentIdx = state.order.indexOf(addBase);
    if (state.hands[target].length === 2 && addBase === '7') {
      setInputTarget(getFirstPlayingSeat());
    } else if (addBase === 'dealer' && state.hands[target].length === 1) {
      setInputTarget(getFirstPlayingSeat());
    } else {
      _moveLeft(addBase, currentIdx);
    }
  }
  
  // Trigger full update
  if (typeof window.updateAll === 'function') {
    window.updateAll();
  }
}

export function removeLastCardFromActiveHand() {
  const target = state.inputTarget;
  const hand = state.hands[target];
  if (!hand || hand.length === 0) return;
  
  const card = hand.pop();
  const suit = card.element.dataset.suit;
  
  // Undo counting updates
  state.counts.HiLo.rc -= state.map.HiLo[card.value];
  state.counts.APC.rc  -= state.map.APC[card.value];
  state.counts.Zen.rc  -= state.map.Zen[card.value];
  if (card.value === 'A') state.aceRC += 1;
  
  // Restore card to deck
  state.remaining[card.value][suit]++;
  if (state.remaining[card.value][suit] < 0) state.remaining[card.value][suit] = 0;
  state.cardsDealt--;
  card.element.remove();
  
  if (hand.length === 0) state.lastAddedCard = null;
  
  // Trigger update
  if (typeof window.updateAll === 'function') {
    window.updateAll();
  }
}

export function performSplit(baseSeat) {
  const hand = state.hands[baseSeat];
  if (!hand || hand.length !== 2 || 
      hand[0].value !== hand[1].value || 
      state.splitContainers[baseSeat].style.display !== 'none') return;

  const cardA = hand[0];
  const cardB = hand[1];

  // Create split hands
  state.hands[baseSeat + 'A'] = [cardA];
  state.hands[baseSeat + 'B'] = [cardB];
  delete state.hands[baseSeat];

  // Show/hide containers
  state.handContainers[baseSeat].style.display = 'none';
  state.splitContainers[baseSeat].style.display = 'flex';

  cardA.element.dataset.seat = baseSeat + 'A';
  cardB.element.dataset.seat = baseSeat + 'B';
  
  // Move cards to split containers
  document.getElementById(`hand-${baseSeat}A`).appendChild(cardA.element);
  document.getElementById(`hand-${baseSeat}B`).appendChild(cardB.element);

  // Make new hand containers sortable
  new Sortable(document.getElementById(`hand-${baseSeat}A`), { group: 'cards', animation: 150, onEnd: window.updateAll });
  new Sortable(document.getElementById(`hand-${baseSeat}B`), { group: 'cards', animation: 150, onEnd: window.updateAll });

  setInputTarget(baseSeat + 'A');
  
  if (typeof window.updateAll === 'function') {
    window.updateAll();
  }
}

export function setSuit(newSuit) {
  if (!state.lastAddedCard) return;

  const val = state.lastAddedCard.dataset.val;
  const oldSuit = state.lastAddedCard.dataset.suit;

  if (oldSuit === newSuit) return;

  // Check availability
  if ((state.remaining[val][newSuit] || 0) <= 0) {
    console.warn(`No ${val} of ${newSuit} left in shoe`);
    return;
  }

  // Exchange cards between suits
  state.remaining[val][oldSuit]++;           
  state.remaining[val][newSuit]--;           

  // Update display
  state.lastAddedCard.dataset.suit = newSuit;
  const sym = state.symMap[newSuit];
  state.lastAddedCard.querySelector('.top-right').textContent = sym;
  state.lastAddedCard.querySelector('.bottom-left').textContent = sym;

  if (typeof window.updateAll === 'function') {
    window.updateAll();
  }
}

export function changeLastCardSuit(newSuit) {
  // Alias for setSuit - same functionality
  setSuit(newSuit);
}

// Register updateAll on window so other modules can call it
window.registerUpdateFunction = function(fn) {
  window.updateAll = fn;
};
