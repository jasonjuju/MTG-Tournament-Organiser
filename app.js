class Player {
  constructor(name, score = 0) {
    this.name = name;
    this.score = score;
  }
}

$(document).ready(() => {
  const $playerCountInput = $('#playerCount');
  const $tournamentForm = $('#tournamentForm');
  const $playerNamesContainer = $('#playerNamesContainer');
  const $playerList = $('#playerList');
  const $emptyMessage = $('#emptyMessage');

  if ($playerCountInput.length && $tournamentForm.length && $playerNamesContainer.length) {
    setupEntryPage($playerCountInput, $tournamentForm, $playerNamesContainer);
    return;
  }

  if ($playerList.length && $emptyMessage.length) {
    renderResultsPage($playerList, $emptyMessage);
    return;
  }

  console.warn('No recognised tournament page elements found');
});

function setupEntryPage($playerCountInput, $tournamentForm, $playerNamesContainer) {
  function updatePlayerNameFields() {
    const count = parseInt($playerCountInput.val(), 10) || 1;
    $playerNamesContainer.empty();

    for (let i = 1; i <= count; i++) {
      const $wrapper = $('<div>').css('margin-top', '0.75rem');
      const $label = $('<label>')
        .attr('for', 'playerName' + i)
        .text('Player ' + i + ' Name:')
        .css({ display: 'block', 'margin-bottom': '0.25rem' });
      const $input = $('<input>')
        .attr({ type: 'text', id: 'playerName' + i, name: 'playerName' + i, placeholder: 'Player ' + i })
        .css({ width: '100%', padding: '0.4rem', 'box-sizing': 'border-box' });

      $wrapper.append($label, $input);
      $playerNamesContainer.append($wrapper);
    }
  }

  $playerCountInput.on('input', updatePlayerNameFields);
  $tournamentForm.on('submit', event => {
    event.preventDefault();
    startTournament();
  });
  updatePlayerNameFields();
}

function renderResultsPage($playerList, $emptyMessage) {
  const players = JSON.parse(sessionStorage.getItem('players') || '[]');

  if (!players.length) {
    $emptyMessage.show();
    return;
  }

  players.forEach(item => {
    const player = new Player(item.name, item.score);
    const $li = $('<li>').text(`${player.name} — Score: ${player.score}`);
    $playerList.append($li);
  });
}

function startTournament() {
  const playerCount = parseInt($('#playerCount').val(), 10) || 1;
  const players = [];

  for (let i = 1; i <= playerCount; i++) {
    const $input = $('#playerName' + i);
    if ($input.length) {
      const name = $input.val().trim();
      if (name) players.push(new Player(name));
    }
  }

  sessionStorage.setItem('players', JSON.stringify(players));
  window.location.href = 'results.html';
}
