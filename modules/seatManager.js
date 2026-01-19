function getFirstPlayingSeat() {
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!state.disabledSeats.has(seatStr)) return seatStr;
  }
  return state.YOUR_SEAT;
}

function disableSeat(seat) {
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

function moveLeft(base, currentIdx) {
  if (state.activeSplit && state.activeSplit.endsWith('B')) {
    setInputTarget(base + 'A');
    return;
  }
  let nextIdx = currentIdx > 0 ? currentIdx - 1 : state.order.length - 1;
  let candidate = state.order[nextIdx];
  while (state.disabledSeats.has(candidate)) {
    nextIdx = nextIdx > 0 ? nextIdx - 1 : state.order.length - 1;
    candidate = state.order[nextIdx];
    if (nextIdx === currentIdx) break;
  }
  setInputTarget(candidate);
}

function moveRight(base, currentIdx) {
  if (state.activeSplit && state.activeSplit.endsWith('A')) {
    const bHand = state.hands[base + 'B'];
    if (bHand && bHand.length > 0) {
      setInputTarget(base + 'B');
      return;
    }
  }
  let nextIdx = (currentIdx + 1) % state.order.length;
  let candidate = state.order[nextIdx];
  while (state.disabledSeats.has(candidate)) {
    nextIdx = (nextIdx + 1) % state.order.length;
    candidate = state.order[nextIdx];
    if (nextIdx === currentIdx) break;
  }
  setInputTarget(candidate);
}

// Export functions
export { getFirstPlayingSeat, disableSeat, moveLeft, moveRight };