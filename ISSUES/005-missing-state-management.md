# Issue #005: Inconsistent State Management in deck.js

## Summary
The `initRemaining` function in deck.js creates a local `defaultState` object but doesn't properly integrate with the global state.

## Type
- [x] Bug
- [ ] Feature Request
- [x] Refactoring
- [ ] Documentation

## Priority
- [x] High
- [ ] Critical
- [ ] Medium
- [ ] Low

## Description
The `initRemaining` function:
1. Creates a `defaultState` object locally
2. Expects state to be passed as parameter but doesn't use it correctly
3. Modifies `defaultState` but doesn't return or update the global state properly
4. Uses undefined `rankOrder` variable

## Steps to Reproduce
1. Call initRemaining() from script.js
2. Observe that state.remaining is not properly initialized
3. Try to add cards - card counting won't work correctly

## Expected Behavior
state.remaining should be properly initialized with counts for all cards in the shoe.

## Actual Behavior
state.remaining remains undefined or is incorrectly structured.

## Technical Details
- Files affected: modules/deck.js, script.js
- Functions involved: initRemaining()
- Error messages:
  - "rankOrder is not defined"
  - state.remaining remains empty/undefined

## Additional Context
The function needs to:
1. Accept and use the state parameter properly
2. Initialize state.remaining with correct card counts (8 decks × 4 suits = 32 per rank)
3. Return the updated state or modify it in place
4. Use the rankOrder passed as parameter
