# Blackjack Coach

## Overview

`Blackjack Coach` is an interactive web application designed to help players improve their Blackjack skills. The app provides real‑time card‑counting data, betting strategy suggestions, and a visual interface that mimics a live casino table.

### Key Features
- **Card counting** – Hi‑Lo, Uston APC, and Zen count systems.
- **Bet ramp** – Kelly‑style betting calculator with bankroll input.
- **Real‑time visual aids** – Live heat maps, suit charts, and split/insurance prompts.
- **Adaptive UI** – Works on mobile and desktop, with responsive design.
- **Customizable** – Deck set, play‑style toggles, and advanced settings.

### How to Use
1. Load the app and select a deck set from the dropdown.
2. Toggle the settings (Comp‑Dep, Heat Sim, Kelly) to match your strategy.
3. Follow the prompts in the interface for split, insurance, and bet suggestions.
4. Use the bet ramp section to adjust your bankroll and bet unit.

### Running Locally
```bash
# Clone the repo
git clone https://github.com/gatepoet/BlackJack-Coach.git
cd BlackJack-Coach

# Open in your browser
# You can serve it with any static server, e.g., using VS Code Live Server or http-server
```

## Bug Fixes and Refactoring

This project has undergone comprehensive bug identification and fixing. See the following documents for details:

### Documentation
- **[BUGFIX_SUMMARY.md](BUGFIX_SUMMARY.md)** - Complete summary of all bugs identified and fixed
- **ISSUES directory** - Detailed GitHub issues for each bug/improvement (8 total)

### Running Tests
To verify that all fixes are working correctly, run:

```bash
# Run comprehensive verification
test_comprehensive.js

# Run module import tests
test_module_imports.js

# Run final verification
test_final_verification.js

# Run bug identification (should find no critical issues)
test_bugs.js
```

All tests should pass with ✅ indicators.

### What Was Fixed
1. ✅ ES module import/export syntax (was using require())
2. ✅ Global variable usage (now uses state parameter passing)
3. ✅ Missing function imports
4. ✅ Incomplete main script
5. ✅ Missing moveCard function implementation
6. ✅ State management consistency across modules

## Contribution Guidelines
- Fork the repository.
- Create a feature branch.
- Submit a pull request with a descriptive title and clear description.
- Follow the existing coding style and add tests where appropriate.
- Make sure all existing tests still pass before submitting.

### Development Notes
- The codebase now uses modern ES6 module syntax (import/export)
- All functions receive state as their first parameter
- State object structure is documented in the GitHub issues
- Add new tests for any features you implement

## License
MIT © 2025

