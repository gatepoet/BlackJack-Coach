# Issue #004: Modules Reference Global Variables Without Proper Scope

## Summary
All modules reference global state variables directly without importing them, causing ReferenceErrors.

## Type
- [x] Bug
- [ ] Feature Request
- [x] Refactoring
- [ ] Documentation

## Priority
- [x] Critical
- [ ] High
- [ ] Medium
- [ ] Low

## Description
Modules reference variables like `state`, `hands`, `handContainers`, `splitContainers`, `map`, `aceRC`, etc. directly without proper imports or parameter passing. This causes ReferenceErrors when the modules are loaded.

Variables referenced across modules:
- state (game state object)
- hands (tracked cards by seat)
- handContainers (DOM elements)
- splitContainers (DOM elements)
- splitButtons (DOM elements)
- map (card counting value mappings)
- aceRC (ace side count)
- lastAddedCard (UI focus tracking)
- inputTarget (active seat/hand)
- activeSplit (split hand tracking)
- disabledSeats (Set of disabled seats)
- YOUR_SEAT (user's selected seat)
- order (seat ordering)

## Steps to Reproduce
1. Load application in browser
2. Check console for ReferenceErrors
3. Observe errors like "state is not defined"

## Expected Behavior
Modules should have access to the state they need through proper imports or parameter passing.

## Actual Behavior
Modules fail to load with ReferenceErrors for undefined variables.

## Technical Details
- Files affected: modules/cardHandler.js, modules/deck.js, modules/seatManager.js, modules/uiManager.js, modules/inputHandler.js
- Functions involved: All exported functions in these modules
- Error messages:
  - "state is not defined"
  - "hands is not defined"
  - "map is not defined"
  - etc.

## Additional Context
Solution options:
1. Pass state as parameters to all module functions
2. Create a proper state management system (store pattern)
3. Use dependency injection
4. Export state from script.js and import in modules (after fixing ES module imports)
