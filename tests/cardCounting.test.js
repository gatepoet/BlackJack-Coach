// tests/cardCounting.test.js
// Basic unit tests for the Hi‑Lo card‑counting logic used in the project.
// The implementation lives in `src/utils/counting.js` (you can copy the logic
// directly from `script.js` if you don’t have a separate module).

import { countCard, getCount } from '../src/utils/counting.js';
import { describe, it, expect } from 'vitest';

// Helper to reset the count before each test – the original script keeps
// state in a global variable. In a testable design we expose a reset
// function, otherwise we simply re‑import the module.

describe('Hi‑Lo counting', () => {
  beforeEach(() => {
    // Reset any global state if the module exposes it. If not, simply
    // re‑import the module.
    if (typeof countCard.reset === 'function') countCard.reset();
  });

  it('starts at 0', () => {
    expect(getCount('HiLo')).toBe(0);
  });

  it('counts low cards (+1) correctly', () => {
    ['2','3','4','5','6'].forEach(rank => {
      countCard('HiLo', rank);
      expect(getCount('HiLo')).toBe(rank.length); // each low card adds 1
    });
  });

  it('counts high cards (−1) correctly', () => {
    ['10','J','Q','K','A'].forEach(rank => {
      countCard('HiLo', rank);
      expect(getCount('HiLo')).toBe(-rank.length);
    });
  });

  it('ignores neutral cards (0)', () => {
    ['7','8','9'].forEach(rank => {
      countCard('HiLo', rank);
      expect(getCount('HiLo')).toBe(0);
    });
  });
});
