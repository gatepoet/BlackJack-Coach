function buildTable(state) {
  const table = document.getElementById('table');
  table.innerHTML = '';
  
  // Create card buttons grid
  const cardsGrid = document.getElementById('cardsGrid');
  cardsGrid.innerHTML = '';
  state.rankOrder.forEach(rank => {
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.textContent = rank === '10' ? 'T' : rank;
    btn.dataset.val = rank;
    btn.style.backgroundColor = rank === 'A' ? '#dc2626' : rank === 'K' || rank === 'Q' || rank === 'J' ? '#1d4ed8' : '#1d4ed8';
    cardsGrid.appendChild(btn);
  });
  
  // Create suit buttons grid
  const suitGrid = document.getElementById('suitGrid');
  suitGrid.innerHTML = '';
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  suits.forEach(suit => {
    const btn = document.createElement('button');
    btn.className = 'suit-btn';
    btn.textContent = state.symMap[suit];
    btn.dataset.suit = suit;
    btn.dataset.rank = 'A'; // Default for now
    suitGrid.appendChild(btn);
  });
  
  state.order.forEach(seat => {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class="seat-header">
        <div class="seat-round ${seat === 'dealer' ? 'dealer' : seat} ${seat === state.YOUR_SEAT ? 'your-seat' : ''}" data-seat="${seat}">
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
      disableSeat(seat, state);
    });

    let clickTimeout;
    const clickDelay = 300; // delay duration

    function doubleClick(e) {
      clearTimeout(clickTimeout);
      e.stopPropagation();
      state.YOUR_SEAT = seat;
      document.querySelectorAll('.your-seat').forEach(x => x.classList.remove('your-seat'));
      header.classList.add('your-seat');
    }
    let lastTap;
    header.addEventListener('touchend', function(e) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < clickDelay && tapLength > 0) {
          doubleClick(e);
      }
      lastTap = currentTime;
    });
    header.addEventListener('dblclick', doubleClick);
    header.addEventListener('click', () => {
      clickTimeout = setTimeout(function() {
        setInputTarget(seat, state);
      }, clickDelay);
    });

    new Sortable(state.handContainers[seat], { group: 'cards', animation: 150, onMove: moveCard });
  });
}

function moveCard() {
  // This function is a placeholder for the Sortable.js onMove event
  // The actual implementation would be more complex
  return true;
}

function updateSplitButtonVisibility(state) {
  Object.keys(state.splitButtons).forEach(seat => {
    const btn = state.splitButtons[seat];
    btn.style.display = 'none';

    if (seat !== state.YOUR_SEAT) return;

    if (state.hands[seat]?.length === 2 && state.hands[seat][0].value === state.hands[seat][1].value && state.splitContainers[seat].style.display === 'none') {
      btn.style.display = 'block';
    }
  });
}

// Export functions
export { buildTable, updateSplitButtonVisibility, moveCard };