class Player {
  constructor(name, score = 0) {
    this.name = name;
    this.score = score;
    this.wins = 0;
    this.losses = 0;
    this.byes = 0;
  }
}

$(document).ready(() => {
  const $playerCountInput = $('#playerCount');
  const $tournamentForm = $('#tournamentForm');
  const $playerNamesContainer = $('#playerNamesContainer');
  const $playerList = $('#playerList');
  const $emptyMessage = $('#emptyMessage');
  const $roundInfo = $('#roundInfo');
  const $pairingsList = $('#pairingsList');
  const $roundResults = $('#roundResults');
  const $roundScoreboard = $('#roundScoreboard');
  const $nextRoundButton = $('#nextRoundButton');
  const $finishLink = $('#finishLink');

  if ($playerCountInput.length && $tournamentForm.length && $playerNamesContainer.length) {
    setupEntryPage($playerCountInput, $tournamentForm, $playerNamesContainer);
    return;
  }

  if ($pairingsList.length && $roundInfo.length && $roundResults.length && $roundScoreboard.length && $nextRoundButton.length) {
    renderSwissPage({
      $pairingsList,
      $roundInfo,
      $roundResults,
      $roundScoreboard,
      $nextRoundButton,
      $finishLink,
    });
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

function renderSwissPage({ $pairingsList, $roundInfo, $roundResults, $roundScoreboard, $nextRoundButton, $finishLink }) {
  const rawPlayers = JSON.parse(sessionStorage.getItem('players') || '[]');
  const players = rawPlayers.map(item => new Player(item.name, item.score || 0));

  if (!players.length) {
    $roundInfo.text('No players found. Add entries first on the home page.');
    $nextRoundButton.hide();
    return;
  }

  let currentRound = 1;
  const totalRounds = 3;

  function sortPlayers() {
    players.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  function shufflePlayers(list) {
    return list.slice().sort(() => Math.random() - 0.5);
  }

  function createPairings() {
    let roundPlayers = players.slice();

    if (currentRound === 1) {
      roundPlayers = shufflePlayers(roundPlayers);
    } else {
      sortPlayers();
    }

    const pairings = [];
    while (roundPlayers.length > 1) {
      pairings.push([roundPlayers.shift(), roundPlayers.shift()]);
    }

    if (roundPlayers.length === 1) {
      pairings.push([roundPlayers.shift()]);
    }

    return pairings;
  }

  let currentPairings = [];

  function updateScoreboard() {
    sortPlayers();
    $roundScoreboard.empty();
    players.forEach(player => {
      const $item = $('<li>').text(`${player.name}: ${player.score} pts (W:${player.wins} L:${player.losses}${player.byes ? ' B:' + player.byes : ''})`);
      $roundScoreboard.append($item);
    });
  }

  function renderPairings(pairings) {
    $pairingsList.empty();
    pairings.forEach((pair, index) => {
      const $item = $('<li>').css('margin-bottom', '1rem');

      if (pair.length === 1) {
        $item.text(`${pair[0].name} receives a bye and will earn 3 points (treated as a 2-0).`);
      } else {
        const groupName = `round${currentRound}-pair${index}`;
        const $matchLabel = $('<div>').text(`${pair[0].name} vs ${pair[1].name}`);

        const $row = $('<div>').css({ display: 'flex', gap: '0.5rem', 'align-items': 'center' });

        const $leftLabel = $('<label>').text(pair[0].name + ' wins:');
        const $leftInp = $('<input>')
          .attr({ type: 'number', min: 0, max: 2, step: 1, id: `${groupName}-a` })
          .css({ width: '3rem' });

        const $rightLabel = $('<label>').text(pair[1].name + ' wins:');
        const $rightInp = $('<input>')
          .attr({ type: 'number', min: 0, max: 2, step: 1, id: `${groupName}-b` })
          .css({ width: '3rem' });

        $row.append($leftLabel, $leftInp, $('<span>').text(' / '), $rightLabel, $rightInp);
        $item.append($matchLabel, $row);
      }

      $pairingsList.append($item);
    });
  }

  function renderResults(results) {
    $roundResults.empty();
    results.forEach(result => {
      const $item = $('<li>').text(result);
      $roundResults.append($item);
    });
  }

  function submitRoundResults() {
    const roundResults = [];
    let valid = true;

    currentPairings.forEach((pair, index) => {
      if (pair.length === 1) {
        const player = pair[0];
        // Treat bye as a 2-0 win -> 3 points
        player.score += 3;
        player.wins += 1;
        player.byes += 1;
        roundResults.push(`${player.name} receives a bye and earns 3 points (2-0).`);
        return;
      }

      const aVal = parseInt($(`#round${currentRound}-pair${index}-a`).val(), 10);
      const bVal = parseInt($(`#round${currentRound}-pair${index}-b`).val(), 10);

      if (Number.isNaN(aVal) || Number.isNaN(bVal)) {
        valid = false;
        return;
      }

      // Validate best-of-3: one must have 2 wins, the other 0 or 1
      if (aVal === 2 && (bVal === 0 || bVal === 1)) {
        // A wins
        const winner = pair[0];
        const loser = pair[1];
        const winnerPoints = (bVal === 0) ? 3 : 2; // 2-0 -> 3 pts, 2-1 -> 2 pts
        const loserPoints = (bVal === 0) ? 0 : 1;  // 0 or 1
        winner.score += winnerPoints;
        winner.wins += 1;
        loser.score += loserPoints;
        loser.losses += 1;
        roundResults.push(`${winner.name} defeats ${loser.name} (${aVal}-${bVal}) and earns ${winnerPoints} pts.`);
      } else if (bVal === 2 && (aVal === 0 || aVal === 1)) {
        // B wins
        const winner = pair[1];
        const loser = pair[0];
        const winnerPoints = (aVal === 0) ? 3 : 2;
        const loserPoints = (aVal === 0) ? 0 : 1;
        winner.score += winnerPoints;
        winner.wins += 1;
        loser.score += loserPoints;
        loser.losses += 1;
        roundResults.push(`${winner.name} defeats ${loser.name} (${bVal}-${aVal}) and earns ${winnerPoints} pts.`);
      } else {
        valid = false;
        return;
      }
    });

    if (!valid) {
      alert('Please enter valid results for each match: one player must have 2 wins (0-2,1-2,2-0,2-1).');
      return;
    }

    renderResults(roundResults);
    updateScoreboard();
    sessionStorage.setItem('players', JSON.stringify(players));

    if (currentRound >= totalRounds) {
      $roundInfo.text(`Final standings after ${totalRounds} rounds`);
      $nextRoundButton.hide();
      if ($finishLink.length) {
        $finishLink.show();
      }
      return;
    }

    currentRound += 1;
    currentPairings = createPairings();
    renderPairings(currentPairings);
    $roundInfo.text(`Round ${currentRound} pairings`);
    $roundResults.empty();
    $nextRoundButton.text(`Submit results for round ${currentRound}`);
  }

  $roundInfo.text(`Round ${currentRound} pairings`);
  currentPairings = createPairings();
  renderPairings(currentPairings);
  $roundResults.empty();
  updateScoreboard();
  $nextRoundButton.text(`Submit results for round ${currentRound}`);
  if ($finishLink.length) {
    $finishLink.hide();
  }

  $nextRoundButton.off('click').on('click', submitRoundResults);
}


function renderResultsPage($playerList, $emptyMessage) {
  const players = JSON.parse(sessionStorage.getItem('players') || '[]');

  if (!players.length) {
    $emptyMessage.show();
    return;
  }

  players.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

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
  window.location.href = 'swiss.html';
}
