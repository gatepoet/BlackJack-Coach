# Issue #006: Hardcoded Deck Size in deck.js

## Summary
Deck initialization hardcodes 8 decks (32 cards per rank), making it inflexible for different configurations.

## Type
- [ ] Bug
- [x] Feature Request
- [x] Refactoring
- [ ] Documentation

## Priority
- [ ] Medium
- [ ] Critical
- [x] High
- [ ] Low

## Description
In deck.js line 13, the code hardcodes `8` as the number of decks:
```javascript
suits.forEach(suit => defaultState.remaining[rank][suit] = 8);
```

This should be configurable to support different shoe sizes (e.g., 1-8 decks).

## Steps to Reproduce
1. Try to configure the app for a different number of decks
2. Observe that it's not possible without modifying source code

## Expected Behavior
Application should allow configuration of deck count through UI or initialization parameters.

## Actual Behavior
Deck count is fixed at 8, no way to change it.

## Technical Details
- Files affected: modules/deck.js
- Functions involved: initRemaining()
- Current limitation: Fixed at 8 decks

## Additional Context
Should accept deckCount as a parameter and use it for initialization:
```javascript
suits.forEach(suit => defaultState.remaining[rank][suit] = deckCount);
```
