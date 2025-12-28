# Wong Halves Counting System Implementation

## Overview

This document describes the implementation of the **Wong Halves** counting system in the Blackjack Coach application, following Mikki Mase's strategy for 8-deck blackjack games.

## What is Wong Halves?

The **Wong Halves** counting system is an advanced card counting method that provides better sensitivity to small changes in deck composition compared to traditional systems like Hi-Lo. It's particularly effective for 8-deck games where the edge is smaller and high cards are less frequent.

### Card Values

| Card | Value |
|------|-------|
| 2-7  | +1    |
| 8    | +0.5  |
| 9    | -0.5  |
| 10, J, Q, K, A | -1 |

## Implementation Details

### 1. System Integration

The Wong Halves system has been added to the existing card counting infrastructure:

```javascript
// In script.js
counts: { 
  HiLo: { rc: 0 }, 
  APC: { rc: 0 }, 
  Zen: { rc: 0 }, 
  OmegaII: { rc: 0 }, 
  WongHalves: { rc: 0 }  // NEW
},

map: {
  HiLo: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':0,'8':0,'9':0,'10':-1},
  APC:  {'A':0,'2':1,'3':1,'4':2,'5':3,'6':2,'7':2,'8':1,'9':-3,'10':-4},
  Zen: {'A':-1,'2':1,'3':1,'4':2,'5':2,'6':2,'7':1,'8':0,'9':0,'10':-2},
  OmegaII: {'A':-2,'2':1,'3':1,'4':2,'5':3,'6':2,'7':1,'8':-1,'9':-1,'10':-2},
  WongHalves: {'A':-1,'2':1,'3':1,'4':1,'5':1,'6':1,'7':1,'8':0.5,'9':-0.5,'10':-1, 'J':-1, 'Q':-1, 'K':-1}
}
```

### 2. Card Handler Updates

The `cardHandler.js` module has been updated to automatically include Wong Halves in all counting operations:

```javascript
// Update counts for card counting systems
Object.keys(state.counts).forEach(countingSystem => {
  state.counts[countingSystem].rc += map[countingSystem][val];
});
```

This ensures that when any card is added or removed, all counting systems (including Wong Halves) are updated consistently.

## Why Wong Halves for 8-Deck Games?

### Advantages Over Hi-Lo System

1. **Better Sensitivity**: Uses fractional values (+0.5, -0.5) to detect small shifts in deck composition
2. **More Accurate Edge Detection**: Better at identifying when the true count is positive in 8-deck games
3. **Smaller Edge Compensation**: More effective when the house edge is higher (typical in 8-deck games)
4. **Consistent with Mikki Mase's Strategy**: Recommended by Mikki Mase for 8-deck play

### Comparison: Hi-Lo vs Wong Halves

| Card | Hi-Lo | Wong Halves |
|------|-------|-------------|
| 2-7  | +1    | +1          |
| 8    | 0     | +0.5        |
| 9    | 0     | -0.5        |
| 10-A | -1    | -1          |

## Strategy Implementation for 8-Deck Games

### Betting Spread

Following Mikki Mase's recommendations:

- **Base Unit**: 1 unit (e.g., $10)
- **Minimum Bet**: $10
- **Maximum Bet**: $30 (3× unit)
- **Spread**: 1–3× units
- **Rationale**: Safe and sustainable for 8-deck games where the edge is smaller

### True Count Calculation

```javascript
// True Count = Running Count ÷ Number of Decks Remaining
example: Running count = 8, 8 decks remaining → True Count = +1
```

### Decision Rules (Apply when True Count ≥ +1)

| Hand | Dealer Up | Action |
|------|-----------|--------|
| Hard 12 | 2-6 | Hit |
| Soft 18 | 7-A | Hit |
| 10 | 2-9 | Double |
| 9 | 3-6 | Double |

### Basic Strategy Adjustments

- **Always split Aces and 8s**
- **Stand on soft 18 vs dealer 2-6**
- **Hit on soft 18 vs dealer 7-A**
- **Double on 10-11 vs dealer 2-9**
- **Double on 9 vs dealer 3-6**

## Key Principles for 8-Deck Play

1. **Avoid Insurance**: House edge >5% - never take it
2. **Avoid Side Bets**: All side bets have high house edges
3. **Use Small Unit**: E.g., 1% of bankroll - keeps risk low
4. **Set Loss Limit**: Stop when you've lost 50% of bankroll
5. **Set Profit Target**: Stop when you reach a specific profit
6. **Play in H17 Tables Only**: Dealer hits on soft 17 (standard)
7. **Practice Counting**: Use a simulator or physical deck to build confidence

## Testing

Comprehensive tests have been implemented to verify:

1. **System Initialization**: All counting systems initialize correctly
2. **Card Values**: Wong Halves card values are correct
3. **Running Count Updates**: Running count updates properly for all cards
4. **Consistent Updates**: All systems update consistently when cards are added/removed
5. **True Count Calculation**: True count calculation works for 8-deck games
6. **Sensitivity Advantage**: Wong Halves provides better sensitivity than Hi-Lo
7. **Edge Cases**: System handles extreme running counts correctly

### Running Tests

```bash
node test_wong_halves.js
node test_integration.js
node test_8_deck_strategy.js
```

## Files Modified

1. **script.js**: Added Wong Halves to counting systems and maps
2. **modules/cardHandler.js**: Updated to include Wong Halves in all counting operations
3. **README.md**: Updated to reflect new features

## References

- Mikki Mase's Blackjack Strategy Guide
- Wong Halves Counting System documentation
- 8-Deck Blackjack Optimization techniques

## Future Enhancements

Potential improvements for future versions:

1. **UI Integration**: Add Wong Halves to the counting system selector in the UI
2. **Strategy Charts**: Include 8-deck specific strategy charts
3. **Betting Calculator**: Add Kelly criterion calculations for Wong Halves
4. **Performance Metrics**: Track win rates and edge calculations for different systems
5. **Mobile Optimization**: Ensure Wong Halves works well on mobile devices

## Conclusion

The implementation of the Wong Halves counting system ensures that Blackjack Coach is now optimized for 8-deck games following Mikki Mase's strategy. Players can achieve a measurable advantage through disciplined play, proper bankroll management, and mathematically optimal decisions.

🎯 **Play smarter - win consistently!**