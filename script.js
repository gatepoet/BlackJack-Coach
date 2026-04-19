import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Import all modules
import { state, suits } from './modules/state.js';
import { initRemaining } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit, setSuit, changeLastCardSuit } from './modules/cardHandler.js';
import { getFirstPlayingSeat, setInputTarget, moveLeft, moveRight, disableSeat } from './modules/seatManager.js';
import { initCombinedChart } from './modules/charting.js';
import { buildTable, updateSplitButtonVisibility } from './modules/uiManager.js';
import { precomputeRoRTable, getCurrentRoR, updateAll } from './modules/strategy.js';

// Keyboard shortcuts mapping
const keyMap = {1:'A',a:'A',A:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',0:'10',t:'10',T:'10','o':'J','p':'Q','[':'K','å':'K','Å':'K','/':'J','*':'Q','-':'K'};

// Single DOMContentLoaded handler: init → button creation → event bindings
document.addEventListener('DOMContentLoaded', () => {
  // --- Init functions first ---
  initCombinedChart();
  precomputeRoRTable();
  initRemaining();
  buildTable();

  // --- Build card/suit buttons (after DOM elements exist) ---
  state.rankOrder.forEach(c => {
    const b = document.createElement('button');
    b.textContent = c;
    b.className = 'card-btn';
    b.onclick = () => addCard(c);
    document.getElementById('cardsGrid').appendChild(b);
  });

  suits.reverse().forEach(s => {
    const b = document.createElement('button');
    b.className = `suit-btn card-btn ${s}`;
    b.textContent = state.symMap[s];
    b.onclick = () => setSuit(s);
    document.getElementById('suitGrid').appendChild(b);
  });

  // --- Event bindings ---

  // Card button handlers (also handle suit buttons)
  document.querySelectorAll('.card-btn[data-val]').forEach(btn => {
    btn.onclick = () => addCard(btn.dataset.val);
  });

  // Suit button handlers
  document.querySelectorAll('.suit-btn').forEach(btn => {
    btn.onclick = () => setSuit(btn.dataset.suit);
  });

  // Split button handlers
  document.querySelectorAll('.split-btn').forEach(btn => {
    btn.onclick = () => {
      const seat = btn.id.replace('splitBtn-', '');
      performSplit(seat);
    };
  });

  // Seat header click handlers (set input target)
  document.querySelectorAll('.seat-round').forEach(seat => {
    seat.addEventListener('click', () => {
      setInputTarget(seat.dataset.seat);
    });
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      const c = keyMap[e.key];
      if (c) { e.preventDefault(); addCard(c); return; }
      const suitK = state.suitMap ? null : null; // suitMap is in state but we use direct mapping
      if (e.key === 'Backspace') { e.preventDefault(); removeLastCardFromActiveHand(); return; }
      if (e.key === ' ') {
        e.preventDefault();
        disableSeat(state.inputTarget);
        return;
      }
      // Suit shortcut keys: s=spades, d=diamonds, x=hearts, c=clubs
      if (state.suitMap[e.key]) {
        const suit = state.suitMap[e.key];
        e.preventDefault();
        setSuit(suit);
        return;
      }
      return;
    }

    e.preventDefault();
    
    let base = state.inputTarget.replace(/[AB]$/, '');
    let currentIdx = state.order.indexOf(base);

    if (e.key === 'ArrowRight') {
      moveRight(base, currentIdx);
    } else {
      moveLeft(base, currentIdx);
    }
  });

  // Next hand button
  document.getElementById('nextHandBtn').onclick = () => {
    for (const s in state.hands) { 
      state.hands[s].forEach(c => c.element.remove()); 
      state.hands[s] = []; 
    }
    document.querySelectorAll('.split-container').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.hand').forEach(h => h.style.display = 'flex');
    document.getElementById('insuranceBox').style.display = 'none';
    state.insuranceResolved = false;
    state.activeSplit = null;
    document.querySelectorAll('.hand-total').forEach(el => el.remove()); // Clear totals
    state.lastAddedCard = null;
    setInputTarget('1');
    updateAll();
  };

  // Shuffle button
  document.getElementById('shuffleBtn').onclick = () => {
    if (!confirm('Start fresh 8-deck shoe?')) return;
    initRemaining();
    state.cardsDealt = 0;
    state.counts.HiLo.rc = 0;
    state.counts.APC.rc = 0;
    state.counts.Zen.rc = 0;
    state.counts.OmegaII.rc = 0; // Added
    state.aceRC = 0;
    document.querySelectorAll('.mini').forEach(m => m.remove());
    for (const s in state.hands) state.hands[s] = [];
    state.disabledSeats.clear();
    document.querySelectorAll('.seat-round').forEach(el => el.classList.remove('disabled'));
    state.insuranceResolved = false;
    state.lastAddedCard = null;
    document.getElementById('insuranceBox').style.display = 'none';
    setInputTarget('1');
    updateAll();
  };

  // Insurance yes/no buttons
  document.getElementById('bjYes').onclick = () => {
    if (!state.insuranceResolved) {
      setInputTarget('dealer');
      addCard('10');
    }
    state.insuranceResolved = true;
    updateAll();
    document.getElementById('insuranceBox').style.display = 'none';
  };

  document.getElementById('bjNo').onclick = () => {
    state.insuranceResolved = true;
    document.getElementById('insuranceBox').style.display = 'none';
    updateAll();
  };

  // Toggle switches and settings inputs
  document.getElementById('compDep').addEventListener('change', e => { 
    state.useCompDep = e.target.checked; 
    updateAll(); 
  });

  document.getElementById('heatSim').addEventListener('change', e => { 
    state.useHeatSim = e.target.checked; 
    updateAll(); 
  });

  document.getElementById('indexSet').addEventListener('change', e => { 
    state.indexSystem = e.target.value; 
    updateAll(); 
  });

  document.getElementById('useKelly').addEventListener('change', e => { 
    state.useKelly = e.target.checked; 
    updateAll(); 
  });

  // Settings inputs
  document.getElementById('bankroll').addEventListener('input', updateAll);
  document.getElementById('betUnit').addEventListener('input', updateAll);
  document.getElementById('mikkiMultiplier').addEventListener('input', updateAll);
  document.getElementById('raFactor').addEventListener('input', (e) => { 
    globalThis.RA_FACTOR = parseFloat(e.target.value) || 0.5; 
    updateAll(); 
  });

  // Side bet pay table inputs
  ['ppPerfect','ppColored','ppMixed'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateAll);
  });

  ['p3Suited3','p3SF','p3Three','p3Str','p3Flush'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateAll);
  });

  // Final init call after everything is set up
  updateAll();
});
