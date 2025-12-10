import { validateCardRank } from '../src/utils/counting.js';
import { describe, it, expect } from 'vitest';

describe('validateCardRank', () => {
  const validRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const invalidRanks = ['0', '11', 'X', 'Ace', '', null, undefined, 5, '♠'];

  it('accepts all valid ranks', () => {
    validRanks.forEach(rank => {
      expect(() => validateCardRank(rank)).not.toThrow();
      expect(validateCardRank(rank)).toBe(true);
    });
  });

  it('throws a RangeError for invalid ranks', () => {
    invalidRanks.forEach(rank => {
      expect(() => validateCardRank(rank)).toThrow(RangeError);
      expect(() => validateCardRank(rank)).toThrow(`Invalid card rank: ${rank}`);
    });
  });
});
