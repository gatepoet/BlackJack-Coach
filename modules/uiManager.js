// Module: uiManager - UI construction (buildTable) and helper functions
import { state } from './state.js';
import { setInputTarget, moveLeft, disableSeat as _disableSeat, registerUpdateCallback } from './seatManager.js';

export function buildTable() {
  const table = document.getElementById('table');
  table.innerHTML = '';
  state.order.forEach(seat => {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class="seat-header">
        <div class="seat-round ${seat==='dealer'?'dealer':'player'} ${seat===state.YOUR_SEAT?'your-seat':''}" data-seat="${seat}">
          ${seat === 'dealer' ? 'D' : seat}
        </div>
      </div>
      <div class="hand" id="hand-${seat}"></div>
      
      <div class="split-container" id="split-${seat}" style="display:none;">
        <div class="split-hand"><div class="split-label">A</div><div class="hand" id="hand-${seat}A"></div></div>
        <div class="split-hand"><div class="split-label">B</div><div class="hand" id="hand-${seat}B"></div></div>
      </div>

      ${seat !== 'dealer' ? '<button class="split-btn" id="splitBtn-'+seat+'">SPLIT</button>' : ''}
    `;
    table.appendChild(col);

    state.handContainers[seat] = col.querySelector(`#hand-${seat}`);
    state.splitContainers[seat] = col.querySelector(`#split-${seat}`);
    if (seat !== 'dealer') state.splitButtons[seat] = col.querySelector('#splitBtn-'+seat);

    const header = col.querySelector('.seat-round');
    header.addEventListener('contextmenu', e => {
      e.preventDefault();
      _disableSeat(seat);
    });
    
    let clickTimeout;
    const clickDelay = 300;

    function doubleClick(e) {
      clearTimeout(clickTimeout);
      e.stopPropagation();
      state.YOUR_SEAT = seat;
      document.querySelectorAll('.your-seat').forEach(x=>x.classList.remove('your-seat'));
      header.classList.add('your-seat');
    }
    let lastTap = 0;
    header.addEventListener('touchend', function(e) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < clickDelay && tapLength > 0 && lastTap > 0) {
          doubleClick(e);
      }
      lastTap = currentTime;
    });
    header.addEventListener('dblclick', doubleClick);
    header.addEventListener('click', () => {
      clickTimeout = setTimeout(function() {
        setInputTarget(seat)
      }, clickDelay);
    });

    new Sortable(state.handContainers[seat], { group: 'cards', animation: 150, onMove: moveCard });
  });
}

export function updateSplitButtonVisibility() {
  Object.keys(state.splitButtons).forEach(seat => {
    const btn = state.splitButtons[seat];
    btn.style.display = 'none';

    if (seat !== state.YOUR_SEAT) return;

    if (state.hands[seat]?.length === 2 && state.hands[seat][0].value === state.hands[seat][1].value && state.splitContainers[seat].style.display === 'none') {
      btn.style.display = 'block';
    }
  });
}

export function moveCard(event, originalEvent) {
  console.info(event, originalEvent);
}

// Register the update callback for seatManager to use (no circular dependency!)
registerUpdateCallback(updateSplitButtonVisibility);
