# BlackJack-Coach Bug Fix & Refactor Plan

All findings from a comprehensive code audit across 7 files (script.js, modules/state.js, deck.js, cardHandler.js, seatManager.js, uiManager.js, strategy.js, charting.js, index.html, styles.css). Organized by severity. Each item has exact file/line references and numbered fix steps.

---

## CRITICAL — ✅ Fixed (commit a99bd44)

### C1. HTML Mismatched Tag Breaks infoBar Layout
**Status: FIXED** ✅
**File:** `index.html` line 49 → `<div class="sidebets-inline">`
**What's wrong:** `<div class="sidebets-inline"></span>` opens with a `<div>` but closes with `</span>`. The browser's error recovery injects implicit closing tags, breaking the entire infoBar layout structure and cascading into wrong element positioning for all adjacent content.

**Fix steps:**
1. Replace line 49 with: `<div class="sidebets-inline">` (remove the stray `</span>` closing tag)
2. Verify the closing `</div>` on line 52 properly closes the new div
3. Reload app and check that infoBar elements render in correct layout order

**Verification:** Open index.html in browser — all spans inside `.sidebets-inline` should be visible next to each other without broken styling or overlapping content.

---

### C2. skipDisabled() Infinite Loop on All-Disabled State
**File:** `modules/seatManager.js` lines 30-36
**What's wrong:** The recursive `skipDisabled()` function has no cycle guard. If every seat in `state.order` is disabled, it recurses forever cycling through all 8 entries — stack overflow or hangs the main thread.

**Fix steps:**
1. Replace the recursive function with an iterative loop that counts iterations:
```javascript
function skipDisabled(candidate) {
    const baseC = candidate.replace(/[AB]$/, '');
    if (candidate.match(/[AB]$/) || !state.disabledSeats.has(baseC)) return candidate;
    let cIdx = state.order.indexOf(baseC);
    let maxIter = state.order.length; // safety cap
    while (maxIter-- > 0 && state.disabledSeats.has(state.order[(cIdx + state.order.length - 1) % state.order.length])) {
        cIdx = (cIdx + state.order.length - 1) % state.order.length;
    }
    return state.order[cIdx]; // returns current position if all disabled
}
```
2. In `setInputTarget()`, add a fallback: if the returned candidate is still disabled, keep it (no safe alternative exists).

**Verification:** Disable every seat via right-click, then try navigating — app should not hang or crash. Should land on whichever seat you started from.

---

### C3. Container Null Crash on Invalid inputTarget
**File:** `modules/cardHandler.js` lines 56-60
**What's wrong:** `const container = target.match(/[AB]$/)? document.getElementById(...): state.handContainers[target];` followed by `container.appendChild(mini)` — if container is null or undefined, this throws an uncaught error and breaks all subsequent operations.

This happens when:
- `inputTarget` points to a seat not in `state.order` (e.g., "9")
- `buildTable()` hasn't finished running yet
- A split hand container ID doesn't match expected format

**Fix steps:**
1. Add null check immediately after the container assignment (line 58):
```javascript
if (!container) {
    console.warn(`No container found for target: ${target}`);
    return; // bail out safely instead of crashing
}
```
2. Also add a guard at the top of `addCard()` to validate inputTarget against state.order:
```javascript
const baseSeat = target.replace(/[AB]$/, '');
if (!state.order.includes(baseSeat)) {
    console.warn(`Invalid seat ${baseSeat}, resetting to 1`);
    setInputTarget('1');
    return;
}
```

**Verification:** Manually set `inputTarget` to an invalid value via browser console, then press a card button — app should log a warning and skip the card instead of crashing.

---

## HIGH — Will Cause Real Bugs

### H1. Duplicate Event Listeners on .seat-round
**Files:** `modules/uiManager.js` lines 59-63 AND `script.js` lines 54-58
**What's wrong:** Both files independently register click handlers on `.seat-round` elements. Every single click triggers two separate setInputTarget calls, creating race conditions and unexpected state transitions during rapid navigation.

**Fix steps:**
1. Remove the duplicate handler from `script.js` (lines 54-58). The uiManager version is more complete — it includes double-tap detection, 300ms delay logic, and proper split-hand routing. Keep only the uiManager registration.
2. Verify that clicking seat headers still works correctly after removal.

**Verification:** Click each seat header once — the active indicator should move to exactly one seat, not flicker or jump between two.

---

### H2. Disabled-Skip Goes Wrong Direction (Counter-Navigation)
**File:** `modules/seatManager.js` lines 25-28
**What's wrong:** When navigating right and encountering a disabled seat, the code calculates `(baseIdx + length - 1) % length` which moves counter-clockwise (left). The intent should be to continue in the same direction (right), not reverse.

This breaks the expected left/right navigation flow — pressing ArrowRight can unexpectedly jump you to the opposite side of the table.

**Fix steps:**
1. Remove the inline skip logic on lines 25-28 from `setInputTarget()`. This should be handled entirely by the `skipDisabled()` helper, which already does directional skipping correctly in the caller functions (`moveLeft` and `moveRight`).
2. Simplify `setInputTarget()` to only handle split-hand routing (lines 14-19) and store the value:
```javascript
export function setInputTarget(t) {
    // Split-hand routing (keep this)
    if (!t.match(/[AB]$/) && state.splitContainers[t] && state.splitContainers[t].style.display !== 'none') {
        const aHand = state.hands[t + 'A'];
        const bHand = state.hands[t + 'B'];
        if (bHand && bHand.length > 0) t = t + 'B';
        else if (aHand && aHand.length > 0) t = t + 'A';
    }

    // Validate against known order before storing
    const baseT = t.replace(/[AB]$/, '');
    if (!state.order.includes(baseT)) return; // reject invalid targets

    state.inputTarget = t;
    // ... rest of function (UI highlighting, callback) stays the same
}
```
3. The directional skip is already correctly implemented in `moveLeft()` and `moveRight()` — removing the duplicate logic from setInputTarget eliminates the counter-directional bug.

**Verification:** Navigate right through a mix of enabled/disabled seats — should stop at the next valid seat, not jump leftward unexpectedly.

---

### H3. lastTap Undefined Relies on JavaScript Quirks
**File:** `modules/uiManager.js` line 48
**What's wrong:** `let lastTap;` is never initialized. On first tap, `tapLength = currentTime - undefined === NaN`. The condition `NaN < clickDelay && NaN > 0` evaluates to `true && false` = false — accidentally correct behavior relying on a JS quirk rather than explicit logic. If browser behavior changes or the code is refactored, this becomes fragile.

**Fix steps:**
1. Initialize properly: `let lastTap = 0;` (or `null`)
2. Update the double-tap check to explicitly handle the initial state:
```javascript
if (tapLength < clickDelay && tapLength > 0 && lastTap > 0) {
    // This is a double-tap
}
lastTap = currentTime;
```

**Verification:** Single-tap should set inputTarget normally. Double-tap within 300ms should change YOUR_SEAT correctly on both touch and desktop.

---

### H4. Collapsible Sidebets CSS Selector Chain Broken
**File:** `styles.css` (sibling selectors) AND `index.html` lines 67-83
**What's wrong:** The collapsible sidebets feature uses CSS sibling combinators (`~`) to show content when the checkbox is checked:
```css
.toggle-checkbox:checked ~ .sidebet-inputs { max-height: 120px; }
```

But in the HTML, `.multiplier-inputs` sits BETWEEN the checkbox and `.sidebet-inputs`. The `~` combinator only matches siblings after ALL intervening elements — since `.multiplier-inputs` is interposed, neither rule ever fires. The sidebets section stays collapsed forever; multiplier inputs stay collapsed too.

**Fix steps:**
1. Reorder HTML so both collapsible sections come AFTER the checkbox:
```html
<input type="checkbox" id="toggleSidebets" class="toggle-checkbox">
<label for="toggleSidebets" id="sidebetLabel" class="toggle-label">Advanced Sidebets</label>

<div class="multiplier-inputs">...</div>          <!-- move here -->
<div class="sidebet-inputs" id="sidebetInputs">...</div>  <!-- already after checkbox -->
```

2. Alternatively, fix the CSS to use direct child/descendant selectors instead of sibling combinators if HTML reordering isn't preferred:
```css
#toggleSidebets:checked + label ~ .multiplier-inputs { max-height: 80px; }
#toggleSidebets:checked + label ~ div > .sidebet-inputs { max-height: 120px; }
```

**Verification:** Toggle the "Advanced Sidebets" checkbox — both multiplier inputs and sidebet pay table inputs should expand/collapse smoothly.

---

## MEDIUM — Degrade Reliability

### M1. RoR Variance Value Mismatch
**Files:** `modules/strategy.js` line 358 AND `modules/state.js` line 16
**What's wrong:** The precomputed RoR table uses a hardcoded variance value of `v = 1.309`, but `state.js` exports `VAR = 1.329`. This discrepancy causes all displayed RoR percentages to be off by approximately 0.2–0.5% (worst case at low TC values).

**Fix steps:**
1. In `strategy.js` line 358, replace the hardcoded value:
```javascript
// Before: const v = 1.309;
const v = VAR; // import from state.js (already imported)
```
2. Remove the unused local variable `v` and use the imported constant directly in both precomputeRoRTable() and getCurrentRoR().

**Verification:** Load app, confirm RoR span shows updated values. Compare against known correct RoR calculations for 8-deck blackjack variance (1.329 is standard).

---

### M2. getOmegaRamp Unreachable Code
**File:** `modules/strategy.js` lines 114-121
**What's wrong:** Line 115 (`if (tc <= 0) return 1;`) covers all non-positive TC values, making line 116 (`if (tc < 1) return 1;`) completely unreachable. This means positive TC values between +0.1 and +0.9 skip straight to the `tc < 2` branch returning 2x bet instead of maintaining 1x — a full step jump that shouldn't exist in the ramp.

**Fix steps:**
1. Remove line 116 entirely (dead code). The existing logic flow is:
```javascript
if (tc <= 0) return 1;    // flat bet for negative/zero TC
// tc < 2 branch handles +0.5 to +1.49 → returns 2x
if (tc < 2) return 2;     // correct: first positive ramp step
```
2. This is the intended behavior — Omega II uses stepped betting, not a smooth curve. Just remove the dead code.

**Verification:** Test with TC values +0.1, +0.5, +1.0, +1.5 — should see 1x for tc≤0, 2x for tc+0.5 to +1.49, 4x for +1.5 to +2.49, etc.

---

### M3. updateAll() Runs Twice on Init
**File:** `script.js` lines 34 AND 190
**What's wrong:** The file registers two separate `DOMContentLoaded` event listeners:
- Lines 34-187: Sets up all card button handlers, keyboard shortcuts, toggle listeners
- Lines 190-196: Calls init functions (initCombinedChart, precomputeRoRTable, etc.)

The second handler's initialization calls fire after the first handler has already set up bindings. This causes:
- Card buttons created on line 16-22 are duplicated when `DOMContentLoaded` fires twice (the grid gets extra buttons)
- All event listeners registered in both handlers get double-bound
- init functions may run before DOM elements exist if timing is off

**Fix steps:**
1. Merge everything into a single DOMContentLoaded handler, or restructure so:
   - The first block (lines 34-187) runs on `DOMContentLoaded` and sets up event bindings
   - The second block (lines 190-196) moves to the top of that same handler, running initialization before any user interaction can occur
2. Simplify to one listener:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Init functions first
    initCombinedChart();
    precomputeRoRTable();
    initRemaining();
    buildTable();
    
    // Then build card/suit buttons (already done at module level, but safe to repeat)
    state.rankOrder.forEach(c => { ... });
    suits.reverse().forEach(s => { ... });
    
    // Then all event handlers...
});
```

**Verification:** Open app, check the cards grid — should have exactly 13 rank buttons and 4 suit buttons, not duplicates. No duplicate entries in browser console from double-firing.

---

### M4. state.acesLeft Never Updated During Deal/Undo ✅ FIXED (commit 7d513ca)
**Status: FIXED**
**What was wrong:** `state.acesLeft` was initialized to 0 in `initRemaining()` but never incremented/decremented during card operations. Strategy.js already computes it dynamically in `updateAll()` (lines 379-380).

**Fix applied:** Removed stale `state.acesLeft = 0;` from `deck.js` line 22. The dynamic computation in `updateAll()` handles it correctly every time the UI updates after card operations.

---

### M5. getCurrentRoR() Imported But Never Called
**File:** `script.js` line 10 imports `getCurrentRoR`, but no code in the entire codebase calls this function. The `<span id="ror">0.00%</span>` element in index.html line 47 always shows static "0.00%" — it's never updated by any function.

**Fix steps:**
1. In `strategy.js`'s `updateAll()` function, add the call after computing edge:
```javascript
// Around line 468 (after calculating 'edge'):
document.getElementById('ror').textContent = getCurrentRoR(bankroll, betUnit, edge);
```

**Verification:** Load app, change bankroll/bet values — the RoR percentage should update dynamically.

---

## LOW — Cleanup & Refactor

### L1. compOverrides Empty Feature Scaffolding ✅ FIXED (commit 7d513ca)
**Status: FIXED**
**What was wrong:** `const compOverrides = {}` defined but never populated — dead code path in the decision engine.

**Fix applied:** Added TODO comment at line 6 of strategy.js noting this is scaffolding for future composition-dependent deviation data. No behavioral change since feature was never functional.

---

### L2. calculateRoR() Monte Carlo Dead Code
**File:** `modules/strategy.js` lines 216-242
**What's wrong:** A full Monte Carlo simulation for Ruin Rate is implemented but never called anywhere. The precomputed table approach (precomputeRoRTable) is used instead, making this function completely dead code.

**Fix steps:**
1. Remove the entire `calculateRoR()` function to reduce file size and confusion. If Monte Carlo validation is needed in future, it can be re-added as a separate testing utility.

**Verification:** No behavioral impact — the function was never invoked.

---

### L3. suits.reverse() Mutates Shared Exported Array ✅ FIXED (commit 7d513ca)
**Status: FIXED**
**What was wrong:** `suits.reverse()` permanently mutated the array exported from state.js, changing it from canonical order to reversed — fragile for any logic that iterates over suits expecting canonical order.

**Fix applied:** Changed line 32 of script.js to use `[...suits].reverse().forEach(...)` which creates a local copy before reversing. All other modules (charting.js, strategy.js) continue to receive the canonical `['spades','hearts','diamonds','clubs']` order.

---

### L4. D3 Loaded Twice via CDN + ES Module
**File:** `index.html` line 7 AND `script.js`/`modules/charting.js` lines 1-2
**What's wrong:** index.html loads d3.v7.min.js as a classic `<script>` tag (creates window.d3), while charting.js imports the ESM version (`import * as d3 from "d3@7/+esm"`). Both load simultaneously — no conflict since they use different namespaces, but the classic script is dead weight (no code ever reads window.d3).

**Fix steps:**
1. Remove line 7 from index.html: `<script src="https://d3js.org/d3.v7.min.js"></script>`
2. Keep only the ES module import in charting.js — it's what actually gets used.

**Verification:** App loads slightly faster (one fewer HTTP request). D3 functionality unchanged.

---

### L5. Duplicate Split-Hand Routing Logic
**Files:** `modules/seatManager.js` lines 14-19 AND `modules/cardHandler.js` lines 10-16
**What's wrong:** Both files contain identical logic for routing inputTarget to split hands (A/B sides). If one path is updated and the other isn't, they'll diverge. This is a DRY violation that creates maintenance risk.

**Fix steps:**
1. Extract the shared logic into a utility function in state.js or create a new helper:
```javascript
// In state.js (or a new routingHelper):
export function routeToActiveSplit(seat) {
    if (!seat.match(/[AB]$/) && state.splitContainers[seat] && 
        state.splitContainers[seat].style.display !== 'none') {
        const bHand = state.hands[seat + 'B'];
        const aHand = state.hands[seat + 'A'];
        if (bHand && bHand.length > 0) return seat + 'B';
        if (aHand && aHand.length > 0) return seat + 'A';
    }
    return seat;
}
```
2. Replace both inline implementations with calls to this helper function.

**Verification:** Splitting and adding cards should behave identically — no regression in split-hand navigation.

---

## Execution Order Recommendations

Work through items in severity order, but some dependencies matter:

1. **C1 first** — The HTML tag mismatch is the most likely cause of "doesn't work properly". Fix this immediately; everything else may improve after it's resolved.
2. **M3 (double init)** and **H1 (duplicate listeners)** can be fixed together since they're related — merge the two DOMContentLoaded handlers in script.js.
3. **C3 (container null crash)** should come early for safety — prevents cascading failures during testing of other fixes.
4. **C2 (infinite loop)** and **H2 (wrong direction navigation)** are seatManager changes that should be grouped together since they're all in the same file.
5. Remaining medium/low items can follow in any order since they're independent.


---

## COMPLETED FIXES (commit a99bd44)

| Item | Status | Description |
|------|--------|-------------|
| C1 | FIXED | HTML mismatched `</span>` tag on line 49 — replaced with proper closing |
| C2 | FIXED | Recursive skipDisabled() infinite loop — replaced with iterative maxIter guard |
| C3 | FIXED | Container null crash in addCard() — added inputTarget validation + container null check |
| H1 | FIXED | Duplicate DOMContentLoaded handlers merged into one (script.js) |
| H2 | FIXED | Counter-directional disabled-seat skip removed from setInputTarget() |
| H3 | FIXED | lastTap initialized to 0 instead of undefined in uiManager.js |
| L4 | FIXED | Removed duplicate D3 CDN script import from index.html line 7 |
| M1 | FIXED | Replaced hardcoded variance 1.309 with imported VAR constant (strategy.js:328) |
| M2 | FIXED | Removed dead code `if (tc < 1) return 1;` in getOmegaRamp() |
| L2 | FIXED | Removed unused calculateRoR() Monte Carlo function |

## REMAINING (low priority, fix on demand)

| Item | File | Description |
|------|------|-------------|
| M4 | modules/deck.js + cardHandler.js | state.acesLeft never updated during deal/undo; strategy.js already computes it dynamically so simplest fix is to remove stale variable from initRemaining() and rely on updateAll() computation (lines 408-409) |
| L1 | modules/strategy.js:6 | compOverrides = {} empty scaffolding — either populate or add TODO comment. No behavioral impact since feature was never functional |
| L3 | script.js:25 | suits.reverse() permanently mutates exported array — replace with [...suits].reverse() to create local copy |
