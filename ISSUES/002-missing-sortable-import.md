# Issue #002: Missing Sortable Library Import

## Summary
The `Sortable` library is used in uiManager.js but not imported or included as a dependency.

## Type
- [x] Bug
- [ ] Feature Request
- [ ] Refactoring
- [ ] Documentation

## Priority
- [x] Critical
- [ ] High
- [ ] Medium
- [ ] Low

## Description
In uiManager.js line 61, `Sortable` is used to create draggable card hands, but:
1. No import statement exists for Sortable
2. sortablejs is not listed in package.json dependencies
3. The moveCard callback function is referenced but not defined

## Steps to Reproduce
1. Load the application in a browser
2. Check browser console for errors
3. Observe "Sortable is not defined" error

## Expected Behavior
Cards should be draggable between hands using Sortable library.

## Actual Behavior
Application fails with "Sortable is not defined" ReferenceError.

## Technical Details
- Files affected: modules/uiManager.js, package.json
- Functions involved: buildTable()
- Error messages:
  - "Sortable is not defined"
  - "moveCard is not defined" (from Sortable onMove callback)

## Additional Context
Need to:
1. Add sortablejs to package.json dependencies
2. Import Sortable in uiManager.js
3. Define the moveCard function that handles card drag events
