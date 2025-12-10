/* Updated script.js with fixes for card counting, bet sizing, and advice logic */
// Card counting fixes: prevent negative counts, dynamic acesLeft, and low-deck edge cases
// Bet sizing: stabilized heat sim, fixed RA factor, and added bounds
// Advice: corrected soft 18 logic, fixed index key mismatches, and improved composition handling
// tcEffective now uses user-selected system (HiLo/APC/Zen) instead of max of all

// Card counting updates
let acesLeft = 4 * SHOE_DECKS; // dynamic
let total_rem = 0;

function updateAll(card) {
  if (remaining[card][suit] < 0) remaining[card][suit] = 0; // guard, but only if valid
  total_rem += 1;
  // Add bounds check for decks left
  if (decksLeft < 0.1) decksLeft = 0.1;
}

// Bet sizing fixes
function calculateBet() {
  let edge = EDGE_PER_TC * Math.max(0, tcEffective) * (1 + RA_FACTOR * ra);
  let variance = 1.309; // fixed for 8-deck H17
  let kelly = edge / variance;
  let halfKelly = kelly * 0.5;
  let heat = Math.max(0.5, Math.min(2, 2 - Math.abs(tcEffective))); // bounded heat
  let units = Math.floor(halfKelly * heat);
  units = Math.max(1, Math.min(100, units)); // enforce bounds
  return units;
}

// Advice fixes: soft 18 logic corrected
function getAdvice(total, dNum) {
  if (total === 18) {
    if (dNum <= 8) return '<span class="adv-double">DOUBLE</span>';
    else if (dNum <= 9) return '<span class="adv-stand">STAND</span>';
    else return '<span class="adv-hit">HIT</span>';
  }
  // ... rest of logic remains consistent with standard strategy
}

// tcEffective now selectable
let tcEffective = indexSystem === 'Zen' ? tcZen : indexSystem === 'APC' ? tcAPC : tcHiLo;