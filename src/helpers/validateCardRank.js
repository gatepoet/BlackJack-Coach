module.exports = {
  name: 'validateCardRank',
  description: 'Validate a card rank (A,2-10,J,Q,K)',
  params: {
    rank: { type: 'string' },
  },
  fn: ({ rank }) => {
    const valid = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    if (!valid.includes(rank)) {
      throw new RangeError(`Invalid card rank: ${rank}`);
    }
    return true;
  },
};
