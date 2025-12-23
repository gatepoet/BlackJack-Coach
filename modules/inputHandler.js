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
}

// Export functions
module.exports = { setInputTarget };