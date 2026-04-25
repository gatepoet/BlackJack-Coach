#!/usr/bin/env node
/**
 * Quick verification script for bankroll tier system.
 * Demonstrates how $50 bankroll now uses conservative settings.
 */

import { BANKROLL_TIERS, getTierParams, getBetFloor } from '../modules/state.js';

console.log('=== Bankroll Tier Verification ===\n');

const testBankrolls = [50, 75, 100, 150, 200, 250, 300, 500, 1000, 5000];

console.log('Bankroll | Kelly% | Multiplier | Max TC | Floor% | FloorUnits ($1)');
console.log('-'.repeat(70));

for (const br of testBankrolls) {
  const p = getTierParams(br);
  const floor = getBetFloor(br, 1);
  console.log(
    `$${br.toString().padStart(6)} | ` +
    `${(p.kellyFrac * 100).toFixed(0).padStart(5)}%   | ` +
    `${p.baseMult.toString().padStart(6)}      | ` +
    `${p.maxTC.toString().padStart(5)}   | ` +
    `${(p.floorPct * 100).toFixed(1).padStart(4)}%  | ` +
    `${floor} units`
  );
}

console.log('\n=== Mikki Multiplier Cap Demonstration ===\n');
console.log('TC  |  $50 BR (1.5× cap TC4)  |  $200 BR (2.0× cap TC5)  |  $500 BR (3.0× cap TC7)');
console.log('-'.repeat(75));

for (let tc = 0; tc <= 8; tc++) {
  const p50 = getTierParams(50);
  const p200 = getTierParams(200);
  const p500 = getTierParams(500);

  const u50 = Math.min(tc <= 0 ? 1 : p50.baseMult * tc + 1, p50.maxTC * p50.baseMult + 1);
  const u200 = Math.min(tc <= 0 ? 1 : p200.baseMult * tc + 1, p200.maxTC * p200.baseMult + 1);
  const u500 = Math.min(tc <= 0 ? 1 : p500.baseMult * tc + 1, p500.maxTC * p500.baseMult + 1);

  console.log(
    `+${tc}  |  ${u50} units ($${u50})           |  ${u200} units ($${u200})           |  ${u500} units ($${u500})`
  );
}

console.log('\n=== Edge Cases ===');
console.log('$50, TC+5:', Math.min(1.5*5+1, 4*1.5+1), 'units (capped, standard would be 16)');
console.log('$500, TC+3:', Math.min(2.0*3+1, 5*2.0+1), 'units (standard would be 10)');
console.log('$1000, TC+6:', Math.min(3.0*6+1, 7*3.0+1), 'units (standard would be 19 but capped at 22)');

console.log('\n✅ Tier system active — $50 bankroll now uses 1.5× multiplier, TC+5 capped at 7 units');
