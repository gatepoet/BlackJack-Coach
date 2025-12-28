# Blackjack Coach

## Overview

`Blackjack Coach` is an interactive web application designed to help players improve their Blackjack skills. The app provides real‑time card‑counting data, betting strategy suggestions, and a visual interface that mimics a live casino table.

### Key Features
- **Card counting** – Hi‑Lo, Uston APC, Zen, Omega II, and **Wong Halves** count systems.
- **8-Deck Strategy** – Optimized for 8-deck games following Mikki Mase's strategy.
- **Bet ramp** – Kelly‑style betting calculator with bankroll input.
- **Real‑time visual aids** – Live heat maps, suit charts, and split/insurance prompts.
- **Adaptive UI** – Works on mobile and desktop, with responsive design.
- **Customizable** – Deck set, play‑style toggles, and advanced settings.

### How to Use
1. Load the app and select a deck set from the dropdown.
2. Choose your counting system (Hi‑Lo, APC, Zen, Omega II, or **Wong Halves** for 8-deck games).
3. Toggle the settings (Comp‑Dep, Heat Sim, Kelly) to match your strategy.
4. Follow the prompts in the interface for split, insurance, and bet suggestions.
5. Use the bet ramp section to adjust your bankroll and bet unit.
6. For 8-deck games, use Wong Halves with a 1–3× betting spread.

### Running Locally
```bash
# Clone the repo
git clone https://github.com/gatepoet/BlackJack-Coach.git
cd BlackJack-Coach

# Open in your browser
# You can serve it with any static server, e.g., using VS Code Live Server or http-server
```

### Running Tests
```bash
# Run all tests
node test_wong_halves.js
node test_integration.js
node test_8_deck_strategy.js

# Or run the vitest suite
npm test
```

### 8-Deck Strategy Guide

This application is optimized for **8-deck blackjack games** following Mikki Mase's strategy:

#### Recommended Counting System: Wong Halves

For 8-deck games, the **Wong Halves** system provides better sensitivity and accuracy than traditional Hi-Lo counting.

**Card Values:**
- 2-7: +1
- 8: +0.5  
- 9: -0.5
- 10, J, Q, K, A: -1

#### Betting Strategy

- **Base Unit**: 1 unit (e.g., $10)
- **Minimum Bet**: $10
- **Maximum Bet**: $30 (3× unit)
- **Spread**: 1–3× units
- **True Count Threshold**: Apply deviations when true count ≥ +1

#### Key Principles

- Always avoid insurance and side bets
- Set loss limit at 50% of bankroll
- Set profit target for disciplined play
- Play only in H17 tables (dealer hits soft 17)

For more details, see [WONG_HALVES_IMPLEMENTATION.md](WONG_HALVES_IMPLEMENTATION.md).

### Contribution Guidelines
- Fork the repository.
- Create a feature branch.
- Submit a pull request with a descriptive title and clear description.
- Follow the existing coding style and add tests where appropriate.

### License
MIT © 2025

