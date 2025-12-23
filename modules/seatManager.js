function getFirstPlayingSeat() {
  for (let seat = 1; seat <= 7; seat++) {
    const seatStr = seat.toString();
    if (!disabledSeats.has(seatStr)) return seatStr;
  }
  return YOUR_SEAT;
}

function disableSeat(seat) {
  const base = seat.replace(/[AB]$/, '');
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

// Export functions
module.exports = { getFirstPlayingSeat, disableSeat, moveLeft, moveRight };