export const CARD_VALUES = {
  'A': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 10,
  'Q': 10,
  'K': 10
};

export const COUNT_MAP = {
  HiLo: {
    'A': -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0, '10': -1
  },
  APC: {
    'A': 0, '2': 1, '3': 1, '4': 2, '5': 3, '6': 2,
    '7': 2, '8': 1, '9': -3, '10': -4
  },
  Zen: {
    'A': -1, '2': 1, '3': 1, '4': 2, '5': 2, '6': 2,
    '7': 1, '8': 0, '9': 0, '10': -2
  }
};

export function countCard(system, rank) {
  const val = COUNT_MAP[system]?.[rank];
  if (val === undefined) return 0;
  return val;
}

export function cumulativeCount(system, cards) {
  return cards.reduce((sum, card) => sum + countCard(system, card.rank), 0);
}

// -------- Card rank validation --------
const VALID_RANKS = Object.keys(CARD_VALUES);
export function validateCardRank(rank) {
  if (!VALID_RANKS.includes(rank)) {
    throw new RangeError(`Invalid card rank: ${rank}`);
  }
  return true;
}
