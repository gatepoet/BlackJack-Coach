
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('validateCardRank', () => {
  it('returns true for valid ranks', () => {
    const valid = ['A', '2', '10', 'J', 'Q', 'K'];
    for (const rank of valid) {
      expect(() => validateCardRank(rank)).not.toThrow();
    }
  });

  it('throws RangeError for invalid ranks', () => {
    const invalid = ['0', 'B', '11', 'X', ''];
    for (const rank of invalid) {
      expect(() => validateCardRank(rank)).toThrow(RangeError);
    }
  });
});
