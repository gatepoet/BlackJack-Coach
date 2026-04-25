import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Import all modules
import { state, suits, startSession, endSession, updateSession, SESSION_CONFIG, updateWongStreak, clearCurrentHandWongState } from './modules/state.js';
import { initRemaining } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit, setSuit, changeLastCardSuit } from './modules/cardHandler.js';
import { getFirstPlayingSeat, setInputTarget, moveLeft, moveRight, disableSeat } from './modules/seatManager.js';
import { initCombinedChart } from './modules/charting.js';
import { buildTable, updateSplitButtonVisibility } from './modules/uiManager.js';
import { precomputeRoRTable, getCurrentRoR, updateAll, computeTotal } from './modules/strategy.js';

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

  [...suits].reverse().forEach(s => {
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

  // Keyboard navigation — skip all custom handling when focus is on a native interactive element
  const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select');
  const toggleItems = document.querySelectorAll('.toggle-item, .toggle-label');

  function shortcutsDisabled() {
    const t = document.activeElement;
    if (!t || t === document.body) return false;
    // Native interactive elements: input/textarea/select/button
    if (['INPUT','TEXTAREA','SELECT','BUTTON'].includes(t.tagName)) return true;
    // Labels wrapping checkboxes or toggle labels in topbar
    if (t.closest('.toggle-item') !== null || t.classList.contains('toggle-label')) return true;
    return false;
  }

  function updateShortcutIndicator() {
    const el = document.getElementById('shortcutIndicator');
    if (!el) return;
    el.style.display = shortcutsDisabled() ? 'flex' : 'none';
  }

  // Attach focus/blur to all interactive elements in settings areas
  [...inputs, ...toggleItems].forEach(el => {
    el.addEventListener('focus', () => { updateShortcutIndicator(); });
    el.addEventListener('blur', () => { updateShortcutIndicator(); });
  });

  document.addEventListener('keydown', e => {
    if (shortcutsDisabled()) return; // skip all custom handling when focus is on interactive elements

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
    // ── Session settlement: compute net win/loss from completed hand ────────
    function settleHand() {
      const dealerHand = state.hands.dealer;
      if (!dealerHand || dealerHand.length === 0) return 0;

      const dealerRes = computeTotal(dealerHand);
      const dealerBJ = dealerHand.length === 2 && dealerRes.total === 21;
      const dealerBust = dealerRes.bust;

      let net = 0;
      const bet = state.lastBetDollar || 0;

      for (const seat in state.hands) {
        if (seat === 'dealer') continue;
        const hand = state.hands[seat];
        if (!hand || hand.length === 0) continue;

        const res = computeTotal(hand);
        const isBJ = hand.length === 2 && res.total === 21;
        const bust = res.bust;

        let handNet = 0;
        if (bust) {
          handNet = -bet;
        } else if (dealerBust) {
          handNet = bet;
        } else if (dealerBJ && isBJ) {
          handNet = 0; // push
        } else if (isBJ && !dealerBJ) {
          handNet = bet * 1.5; // blackjack 3:2
        } else if (res.total > dealerRes.total) {
          handNet = bet;
        } else if (res.total < dealerRes.total) {
          handNet = -bet;
        } else {
          handNet = 0; // push
        }
        net += handNet;
      }
      return net;
    }

    if (session.active) {
      const netWin = settleHand();
      updateSession(netWin);
      // Refresh session UI immediately
      if (typeof window.updateSessionStatus === 'function') {
        window.updateSessionStatus();
      }
      // Check for session exit
      if (session.exitReason) {
        alert(`Session ended: ${session.exitReason}\nResult: $${session.bankroll.toFixed(2)}`);
      }
    }

    // Update Wong streak based on hand just completed
    updateWongStreak(state.currentHandWongState);
    clearCurrentHandWongState();

    // ── Clear table for next hand ───────────────────────────────────────────
    for (const s in state.hands) { 
      state.hands[s].forEach(c => c.element.remove()); 
      state.hands[s] = []; 
    }
    document.querySelectorAll('.split-container').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.hand').forEach(h => h.style.display = 'flex');
    document.getElementById('insuranceBox').style.display = 'none';
    state.insuranceResolved = false;
    state.activeSplit = null;
    document.querySelectorAll('.hand-total').forEach(el => el.remove());
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

  // ── Session management handlers ───────────────────────────────────────────
  const startSessionBtn = document.getElementById('startSessionBtn');
  const endSessionBtn = document.getElementById('endSessionBtn');
  const sessionStatus = document.getElementById('sessionStatus');
  const sessionBankrollInput = document.getElementById('sessionBankroll');
  const sessionProgressBar = document.getElementById('sessionProgressBar');

  startSessionBtn.onclick = () => {
    const totalBR = parseFloat(document.getElementById('bankroll').value) || 10000;
    const sessionBR = parseFloat(sessionBankrollInput.value) || 0;
    if (sessionBR <= 0 || sessionBR > totalBR) {
      alert(`Session bankroll must be > 0 and ≤ total bankroll ($${totalBR})`);
      return;
    }
    startSession(totalBR, sessionBR / totalBR);
    startSessionBtn.disabled = true;
    endSessionBtn.disabled = false;
    sessionBankrollInput.disabled = true;
    updateSessionStatus();
  };

  endSessionBtn.onclick = () => {
    endSession('USER_END');
    startSessionBtn.disabled = false;
    endSessionBtn.disabled = true;
    sessionBankrollInput.disabled = false;
    sessionStatus.textContent = `Session: inactive (ended)`;
    sessionProgressBar.style.width = '0%';
  };

  function updateSessionStatus() {
    if (!session.active) return;
    const progressWin = (session.bankroll - session.startBR) / (session.startBR * SESSION_CONFIG.winGoalPercent);
    const pct = Math.min(100, Math.max(0, progressWin * 100));
    sessionProgressBar.style.width = pct + '%';
    sessionStatus.textContent = `Session: $${session.bankroll.toFixed(0)} | Hands: ${session.handsPlayed} | Goal: +${(SESSION_CONFIG.winGoalPercent*100).toFixed(0)}%`;
  }

  // Expose session status update to be called from updateAll
  window.updateSessionStatus = updateSessionStatus;

  // ── Wong advisory UI update ─────────────────────────────────────────────────
  /**
   * Update the Wong advisory banner based on current streak state.
   * Called automatically by updateWongStreak().
   */
  function updateWongAdvisory() {
    const el = document.getElementById('wongAdvisory');
    if (!el) return;
    if (state.wongAdvisoryMessage) {
      el.textContent = state.wongAdvisoryMessage;
      el.style.display = 'flex';
      // Apply severity class
      el.classList.remove('warning', 'critical');
      if (state.wongExitStreak >= 3) {
        el.classList.add('critical');
      } else if (state.wongExitStreak >= 2 || state.wongEnterStreak >= 2) {
        el.classList.add('warning');
      }
    } else {
      el.textContent = '';
      el.style.display = 'none';
      el.classList.remove('warning', 'critical');
    }
  }

  // Expose for state module callbacks
  window.updateWongAdvisory = updateWongAdvisory;

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
