function setInputTarget(t) {
  if (!t.match(/[AB]$/) && state.splitContainers[t] && state.splitContainers[t].style.display !== 'none') {
    const aHand = state.hands[t + 'A'];
    const bHand = state.hands[t + 'B'];
    if (bHand && bHand.length > 0) t = t + 'B';
    else if (aHand && aHand.length > 0) t = t + 'A';
  }

  state.inputTarget = t;
  const baseT = t.replace(/[AB]$/, '');
  if (!t.match(/[AB]$/) && state.disabledSeats.has(baseT)) {
    const baseIdx = state.order.indexOf(baseT);
    t = state.order[(baseIdx + state.order.length - 1) % state.order.length];
  }

  function skipDisabled(candidate) {
    const baseC = candidate.replace(/[AB]$/, '');
    if (candidate.match(/[AB]$/) || !state.disabledSeats.has(baseC)) return candidate;
    const cIdx = state.order.indexOf(baseC);
    const nextC = state.order[(cIdx + state.order.length - 1) % state.order.length];
    return skipDisabled(nextC);
  }
  t = skipDisabled(t);
  state.activeSplit = t.match(/[AB]$/) ? t : null;

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
}

// Export functions
export { setInputTarget };