import { countCard, cumulativeCount, COUNT_MAP } from '../src/utils/counting.js';

describe('Card counting logic', () => {
  test('HiLo counting values', () => {
    expect(countCard('HiLo', '2')).toBe(1);
    expect(countCard('HiLo', '10')).toBe(-1);
    expect(countCard('HiLo', '7')).toBe(0);
  });

  test('Cumulative count', () => {
    const cards = [{rank:'2'}, {rank:'10'}, {rank:'7'}];
    expect(cumulativeCount('HiLo', cards)).toBe(0);
  });
});
