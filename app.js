document.addEventListener('DOMContentLoaded', () => {
  const playerCountInput = document.getElementById('playerCount');
  const tournamentForm = document.getElementById('tournamentForm');
  const startButton = document.getElementById('startTournament');
  const playerNamesContainer = document.getElementById('playerNamesContainer');

  if (!playerCountInput || !tournamentForm || !startButton || !playerNamesContainer) {
    console.warn('Required tournament elements not found');
    return;
  }

  function updatePlayerNameFields() {
    const count = parseInt(playerCountInput.value, 10) || 1;
    playerNamesContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const wrapper = document.createElement('div');
      wrapper.style.marginTop = '0.75rem';

      const label = document.createElement('label');
      label.setAttribute('for', 'playerName' + i);
      label.textContent = 'Player ' + i + ' Name:';
      label.style.display = 'block';
      label.style.marginBottom = '0.25rem';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'playerName' + i;
      input.name = 'playerName' + i;
      input.placeholder = 'Player ' + i;
      input.style.width = '100%';
      input.style.padding = '0.4rem';
      input.style.boxSizing = 'border-box';

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      playerNamesContainer.appendChild(wrapper);
    }
  }

  playerCountInput.addEventListener('input', updatePlayerNameFields);
  tournamentForm.addEventListener('submit', event => {
    event.preventDefault();
    startTournament();
  });

  updatePlayerNameFields();
});

function startTournament() {
  const playerCount = parseInt(document.getElementById('playerCount').value, 10) || 1;
  const playerNames = [];

  for (let i = 1; i <= playerCount; i++) {
    const input = document.getElementById('playerName' + i);
    if (input) {
      const name = input.value.trim();
      if (name) playerNames.push(name);
    }
  }

  sessionStorage.setItem('playerNames', JSON.stringify(playerNames));
  window.location.href = 'results.html';
}
