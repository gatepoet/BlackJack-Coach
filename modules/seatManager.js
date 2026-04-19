// Module: seatManager - Seat navigation, input target management, disable/enable seats
import { state } from './state.js';

export function getFirstPlayingSeat() {
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!state.disabledSeats.has(seatStr)) return seatStr;
  }
  return state.YOUR_SEAT;
}

export function setInputTarget(t) {
  // Check if we're in a split container - route to active hand
  if (!t.match(/[AB]$/) && state.splitContainers[t] && state.splitContainers[t].style.display !== 'none') {
    const aHand = state.hands[t + 'A'];
    const bHand = state.hands[t + 'B'];
    if (bHand && bHand.length > 0) t = t + 'B';
    else if (aHand && aHand.length > 0) t = t + 'A';
  }

  // Validate against known order before storing
  const baseT = t.replace(/[AB]$/, '');
  if (!state.order.includes(baseT)) return;

  state.inputTarget = t;
  
  function skipDisabled(candidate) {
    const baseC = candidate.replace(/[AB]$/, '');
    if (candidate.match(/[AB]$/) || !state.disabledSeats.has(baseC)) return candidate;
    let cIdx = state.order.indexOf(baseC);
    let maxIter = state.order.length; // safety cap to prevent infinite loop
    while (maxIter-- > 0 && state.disabledSeats.has(state.order[(cIdx + state.order.length - 1) % state.order.length])) {
      cIdx = (cIdx + state.order.length - 1) % state.order.length;
    }
    return state.order[cIdx]; // returns current position if all disabled
  }
  t = skipDisabled(t);
  
  // Track active split state
  state.activeSplit = t.match(/[AB]$/) ? t : null;

  // Update UI highlighting
  document.querySelectorAll('.seat-round').forEach(h => h.classList.remove('active'));
  document.querySelectorAll('.split-hand').forEach(h => h.classList.remove('active'));

  const base = t.replace(/[AB]$/, '');
  const header = document.querySelector(`.seat-round[data-seat="${base === 'dealer' ? 'dealer' : base}"]`);
  if (header) header.classList.add('active');

  if (state.activeSplit) {
    const idx = state.activeSplit.endsWith('A') ? 1 : 2;
    const el = document.querySelector(`#split-${base} .split-hand:nth-child(${idx})`);
    if (el) el.classList.add('active');
  }

  // Update split button visibility - call function passed in or defined later
  if (typeof window.updateSplitButtonVisibility === 'function') {
    window.updateSplitButtonVisibility();
  }
}

export function moveLeft(base, currentIdx) {
  if (state.activeSplit && state.activeSplit.endsWith('B')) {
    setInputTarget(base + 'A');
    return;
  }
  
  let nextIdx = currentIdx > 0 ? currentIdx - 1 : state.order.length - 1;
  let candidate = state.order[nextIdx];
  
  // Skip disabled seats while navigating left
  while (state.disabledSeats.has(candidate)) {
    nextIdx = nextIdx > 0 ? nextIdx - 1 : state.order.length - 1;
    candidate = state.order[nextIdx];
    if (nextIdx === currentIdx) break;
  }
  
  setInputTarget(candidate);
}

export function moveRight(base, currentIdx) {
  // If in split and on A side, check if B side has cards
  if (state.activeSplit && state.activeSplit.endsWith('A')) {
    const bHand = state.hands[base + 'B'];
    if (bHand && bHand.length > 0) {
      setInputTarget(base + 'B');
      return;
    }
  }
  
  let nextIdx = (currentIdx + 1) % state.order.length;
  let candidate = state.order[nextIdx];
  
  // Skip disabled seats while navigating right
  while (state.disabledSeats.has(candidate)) {
    nextIdx = (nextIdx + 1) % state.order.length;
    candidate = state.order[nextIdx];
    if (nextIdx === currentIdx) break;
  }
  
  setInputTarget(candidate);
}

export function disableSeat(seat) {
  const base = seat.replace(/[AB]$/, '');
  const seatEl = document.querySelector(`.seat-round[data-seat="${base === 'dealer' ? 'dealer' : base}"]`);
  
  if (state.disabledSeats.has(base)) {
    state.disabledSeats.delete(base);
    seatEl.classList.remove('disabled');
  } else {
    state.disabledSeats.add(base);
    seatEl.classList.add('disabled');
  }
  
  const currentIdx = state.order.indexOf(base);
  moveLeft(base, currentIdx);
}

// Register updateSplitButtonVisibility on window for cross-module access
export function registerUpdateCallback(callback) {
  window.updateSplitButtonVisibility = callback;
}
