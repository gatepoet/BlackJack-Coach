function buildTable() {
  const table = document.getElementById('table');
  table.innerHTML = '';
  order.forEach(seat => {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class="seat-header">
        <div class="seat-round ${seat === 'dealer' ? 'dealer' : seat} ${seat === YOUR_SEAT ? 'your-seat' : ''}" data-seat="${seat}">
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

    handContainers[seat] = col.querySelector(`#hand-${seat}`);
    splitContainers[seat] = col.querySelector(`#split-${seat}`);
    if (seat !== 'dealer') splitButtons[seat] = col.querySelector('#splitBtn-'+seat);

    const header = col.querySelector('.seat-round');
    header.addEventListener('contextmenu', e => {
      e.preventDefault();
      disableSeat(seat);
    });

    let clickTimeout;
    const clickDelay = 300; // delay duration

    function doubleClick(e) {
      clearTimeout(clickTimeout);
      e.stopPropagation();
      YOUR_SEAT = seat;
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
        setInputTarget(seat)
      }, clickDelay);
    });

    new Sortable(handContainers[seat], { group: 'cards', animation: 150, onMove: moveCard });
  };
}

function updateSplitButtonVisibility() {
  Object.keys(splitButtons).forEach(seat => {
    const btn = splitButtons[seat];
    btn.style.display = 'none';

    if (seat !== YOUR_SEAT) return;

    if (hands[seat]?.length === 2 && hands[seat][0].value === hands[seat][1].value && splitContainers[seat].style.display === 'none') {
      btn.style.display = 'block';
    }
  });
}

// Export functions
module.exports = { buildTable, updateSplitButtonVisibility };