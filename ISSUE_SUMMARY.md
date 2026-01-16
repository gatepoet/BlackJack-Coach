# GitHub Issues Summary

This document lists all identified bugs and issues that need to be addressed. Each issue has been documented in detail in the ISSUES directory.

## Critical Issues (Blockers)

### #001: Fix Module Import Syntax
**Priority**: Critical  
**Type**: Bug, Refactoring  
**File**: All modules + script.js  
**Description**: Modules use Node.js `require()` instead of ES module `import` statements. This prevents the application from loading in browsers.

### #002: Missing Sortable Library Import
**Priority**: Critical  
**Type**: Bug  
**File**: modules/uiManager.js, package.json  
**Description**: `Sortable` library is used but not imported or included as a dependency. Also missing `moveCard` callback function.

### #003: Incomplete script.js File
**Priority**: Critical  
**Type**: Bug, Refactoring  
**File**: script.js  
**Description**: Main application file is incomplete - only contains state initialization, no event handlers or game logic.

### #004: Modules Reference Global Variables Without Proper Scope
**Priority**: Critical  
**Type**: Bug, Refactoring  
**File**: All modules  
**Description**: Modules reference global variables directly without imports, causing ReferenceErrors.

## High Priority Issues

### #005: Inconsistent State Management in deck.js
**Priority**: High  
**Type**: Bug, Refactoring  
**File**: modules/deck.js  
**Description**: `initRemaining` function doesn't properly integrate with global state and has undefined variable references.

### #006: Hardcoded Deck Size in deck.js
**Priority**: High  
**Type**: Feature Request, Refactoring  
**File**: modules/deck.js  
**Description**: Deck count is hardcoded at 8 decks, should be configurable.

### #008: Missing Error Handling in Card Operations
**Priority**: High  
**Type**: Bug, Refactoring  
**File**: modules/cardHandler.js  
**Description**: Card operations lack input validation and error handling for edge cases.

## Medium Priority Issues

### #007: Incomplete Chart Implementation
**Priority**: Medium  
**Type**: Feature Request, Refactoring  
**File**: modules/charting.js  
**Description**: Chart module only initializes SVG container but doesn't render actual data visualizations.

## Architectural Recommendations (Not Issues, but Suggestions)

1. **State Management System**: Create a proper state management pattern (store/class) instead of global variables
2. **Type Safety**: Consider adding TypeScript for better type checking
3. **Testing Framework**: Implement comprehensive tests using vitest
4. **Documentation**: Document module interfaces and state structure
5. **Code Organization**: Better separation of concerns (UI vs game logic)
6. **Error Boundaries**: Add error boundaries in React-like pattern for UI components
7. **Configuration System**: Allow runtime configuration of deck count, counting systems, etc.

## Verification Plan

After fixing these issues, verify by:
1. Loading application in browser - should work without console errors
2. Testing basic functionality:
   - Clicking seats should activate them
   - Cards should be draggable
   - Card counts should update
   - Charts should display data
3. Testing edge cases:
   - Invalid card values
   - Empty hands
   - Split operations
   - Multiple decks
4. Running linting: `npm run lint`
5. Running tests: `npm test` (after implementing tests)

## Issue Tracking

Each issue is documented in detail in the ISSUES directory with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Technical details
- Suggested solutions

These can be used directly to create GitHub issues or as a reference for fixing them.
