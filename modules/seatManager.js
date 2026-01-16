// seatManager.js - Handles seat navigation and selection
/**
 * Get the first available playing seat (not dealer, not disabled)
 * @param {Object} state - Global state object
 * @returns {string} Seat identifier
 */
function getFirstPlayingSeat(state) {
  if (!state || !state.order || !state.disabledSeats) {
    console.error('getFirstPlayingSeat: Invalid state');
    return '1';
  }
  
  const order = state.order;
  const disabledSeats = state.disabledSeats;
  
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!disabledSeats.has(seatStr)) return seatStr;
  }
  
  // Fallback to first seat in order
  return order[0];
}

/**
 * Toggle seat disabled state
 * @param {Object} state - Global state object
 * @param {string} seat - Seat identifier
 */
function disableSeat(state, seat) {
  if (!state || !seat) {
    console.error('disableSeat: Missing parameters');
    return;
  }
  
  const disabledSeats = state.disabledSeats;
  const order = state.order;
  const YOUR_SEAT = state.YOUR_SEAT;
  
  if (!disabledSeats || !order) {
    console.error('disableSeat: State missing required properties');
    return;
  }
  
  const base = seat.replace(/[AB]$/, '');
  const seatEl = document.querySelector(`.seat-round[data-seat="${base === 'dealer' ? 'dealer' : base}"]`);
  
  if (!seatEl) {
    console.warn(`disableSeat: Could not find seat element for ${base}`);
    return;
  }
  
  if (disabledSeats.has(base)) {
    disabledSeats.delete(base);
    seatEl.classList.remove('disabled');
  } else {
    disabledSeats.add(base);
    seatEl.classList.add('disabled');
  }
  
  const currentIdx = order.indexOf(base);
  if (currentIdx >= 0) {
    moveLeft(state, base, currentIdx);
  }
}

/**
 * Move to the previous available seat
 * @param {Object} state - Global state object
 * @param {string} base - Base seat identifier
 * @param {number} currentIdx - Current index in order array
 */
function moveLeft(state, base, currentIdx) {
  if (!state || !base || currentIdx === undefined) {
    console.error('moveLeft: Missing parameters');
    return;
  }
  
  const activeSplit = state.activeSplit;
  const disabledSeats = state.disabledSeats;
  const order = state.order;
  
  if (!disabledSeats || !order) {
    console.error('moveLeft: State missing required properties');
    return;
  }
  
  // Handle split hands
  if (activeSplit && activeSplit.endsWith('B')) {
    setInputTarget(state, base + 'A');
    return;
  }
  
  let nextIdx = currentIdx > 0 ? currentIdx - 1 : order.length - 1;
  let candidate = order[nextIdx];
  while (disabledSeats.has(candidate)) {
    nextIdx = nextIdx > 0 ? nextIdx - 1 : order.length - 1;
    candidate = order[nextIdx];
    if (nextIdx === currentIdx) break;
  }
  
  setInputTarget(state, candidate);
}

/**
 * Move to the next available seat
 * @param {Object} state - Global state object
 * @param {string} base - Base seat identifier
 * @param {number} currentIdx - Current index in order array
 */
function moveRight(state, base, currentIdx) {
  if (!state || !base || currentIdx === undefined) {
    console.error('moveRight: Missing parameters');
    return;
  }
  
  const activeSplit = state.activeSplit;
  const hands = state.hands;
  const disabledSeats = state.disabledSeats;
  const order = state.order;
  
  if (!hands || !disabledSeats || !order) {
    console.error('moveRight: State missing required properties');
    return;
  }
  
  // Handle split hands
  if (activeSplit && activeSplit.endsWith('A')) {
    const bHand = hands[base + 'B'];
    if (bHand && bHand.length > 0) {
      setInputTarget(state, base + 'B');
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
  
  setInputTarget(state, candidate);
}

// Import setInputTarget from inputHandler
import { setInputTarget } from './inputHandler.js';

// Export functions
export { getFirstPlayingSeat, disableSeat, moveLeft, moveRight };