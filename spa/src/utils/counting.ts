// src/utils/counting.ts
export type CountingSystem = 'hi-lo' | 'ko' | 'umtc';

export const getCardValue = (card: string, system: CountingSystem): number => {
  const rank = card.slice(0, -1);
  if (rank === 'A' || rank === 'K' || rank === 'Q' || rank === 'J') {
    return -1;
  }
  const num = Number(rank);
  if (num >= 2 && num <= 6) return 1;
  if (num === 7 || num === 8 || num === 9) return 0;
  if (num === 10) return -1;
  return 0;
};

export const updateCount = (
  system: CountingSystem,
  cards: Array<{ card: string; timestamp: Date }>
): number => {
  return cards.reduce((acc, c) => acc + getCardValue(c.card, system), 0);
};
