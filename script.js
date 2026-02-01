/* ═══════════════════════════════════════════
   MEMORY – game logic
   Obrazki: images/obrazek1.jpg … obrazek7.jpg
   ═══════════════════════════════════════════ */

// ── KONFIGURACJA KART ──
// Zmień liczbę lub nazwy jeśli dodasz/zmienisz obrazki
const CARD_NAMES = [
  'obrazek1',
  'obrazek2',
  'obrazek3',
  'obrazek4',
  'obrazek5',
  'obrazek6',
  'obrazek7'
];
const IMG_EXT = '.jpg';           // rozszerzenie pliku
const IMG_DIR = 'images/';        // folder z obrazkami

// ── KOLORY GRACZ‌Y ──
const PLAYER_COLORS = ['#e94560','#8be9fd','#50fa7b','#f5a623','#bd93f9','#ff79c6'];

// ── STAN GRY ──
let playerCount   = 1;
let scores        = [];
let currentPlayer = 0;
let cardsArray    = [];   // taszkane nazwy kart (z duplikatami)
let flippedCards  = [];   // DOM-elementy odwrócone w tej rundzie
let lockBoard     = false;
let matchedCount  = 0;

// ── DOM ──
const setupPanel   = document.getElementById('setup-panel');
const gameWrapper  = document.getElementById('game-wrapper');
const gameBoard    = document.getElementById('game-board');
const scoreboard   = document.getElementById('scoreboard');
const zoomOverlay  = document.getElementById('zoom-overlay');
const zoomCardWrap = document.getElementById('zoom-card-wrap');
const winOverlay   = document.getElementById('win-overlay');
const winSub       = document.getElementById('win-sub');
const finalScores  = document.getElementById('final-scores');

// ═══════════════════════════════════════════
//  SETUP PANEL – wybór liczby gracz‌y
// ═══════════════════════════════════════════
document.getElementById('inc-btn').addEventListener('click', () => {
  if (playerCount < 6) { playerCount++; updatePlayerDisplay(); }
});
document.getElementById('dec-btn').addEventListener('click', () => {
  if (playerCount > 1) { playerCount--; updatePlayerDisplay(); }
});

function updatePlayerDisplay() {
  document.getElementById('player-count-display').textContent = playerCount;
}

document.getElementById('start-btn').addEventListener('click', startGame);

// ═══════════════════════════════════════════
//  TYŁ KARTY – SVG pattern
// ═══════════════════════════════════════════
function backPatternSVG() {
  return `<svg class="pattern" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".6"/>
      </pattern>
    </defs>
    <rect width="96" height="96" fill="url(#grid)"/>
    <circle cx="48" cy="48" r="18" fill="none" stroke="rgba(233,69,96,.5)" stroke-width="1.8"/>
    <circle cx="48" cy="48" r="8"  fill="rgba(233,69,96,.3)"/>
  </svg>`;
}

// ═══════════════════════════════════════════
//  START / INIT
// ═══════════════════════════════════════════
function startGame() {
  setupPanel.style.display  = 'none';
  gameWrapper.style.display = 'block';
  scores        = new Array(playerCount).fill(0);
  currentPlayer = 0;
  initGame();
}

function initGame() {
  gameBoard.innerHTML = '';
  matchedCount  = 0;
  flippedCards  = [];
  lockBoard     = false;

  // pary: każda nazwa x2
  cardsArray = [...CARD_NAMES, ...CARD_NAMES];

  // Fisher-Yates shuffle
  for (let i = cardsArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardsArray[i], cardsArray[j]] = [cardsArray[j], cardsArray[i]];
  }

  // 4 kolumny (7 par = 14 kart → 4 kol. × 4 wiersze, ostatnia wiersz niepełna)
  gameBoard.style.gridTemplateColumns = 'repeat(4, 96px)';

  cardsArray.forEach((name) => {
    const el = document.createElement('div');
    el.classList.add('card');
    el.dataset.name = name;

    el.innerHTML = `
      <div class="card-inner">
        <div class="card-back">${backPatternSVG()}</div>
        <div class="card-front">
          <img src="${IMG_DIR}${name}${IMG_EXT}" alt="${name}">
        </div>
      </div>`;

    el.addEventListener('click', () => flipCard(el));
    gameBoard.appendChild(el);
  });

  renderScoreboard();
  setGridResponsive(); // dostosuj do szerokości ekranu
}

// ═══════════════════════════════════════════
//  SCOREBOARD
// ═══════════════════════════════════════════
function renderScoreboard() {
  scoreboard.innerHTML = '';
  scores.forEach((s, i) => {
    const card = document.createElement('div');
    card.classList.add('score-card');
    if (i === currentPlayer) card.classList.add('active-turn');

    card.innerHTML = `
      <div class="player-name">
        <span class="player-color-dot" style="background:${PLAYER_COLORS[i]}"></span>
        ${playerCount === 1 ? 'Gracz' : `Gracz ${i + 1}`}
      </div>
      <div class="player-score">${s}</div>`;

    scoreboard.appendChild(card);
  });
}

// ═══════════════════════════════════════════
//  FLIP & MATCH
// ═══════════════════════════════════════════
function flipCard(card) {
  if (lockBoard) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (flippedCards.includes(card)) return;

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) checkMatch();
}

function checkMatch() {
  lockBoard = true;
  const [c1, c2] = flippedCards;

  if (c1.dataset.name === c2.dataset.name) {
    // ✓ PARA ZNALEZIONA
    c1.classList.add('matched');
    c2.classList.add('matched');
    matchedCount += 2;
    scores[currentPlayer]++;
    renderScoreboard();

    // celebracja – zoom overlay
    showZoom(c1.dataset.name);

    setTimeout(() => {
      closeZoom();
      if (matchedCount === cardsArray.length) {
        showWin();
      } else {
        resetTurn(false); // ten sam gracz kontynuuje
      }
    }, 1200);

  } else {
    // ✗ NIE PASUJĄ
    setTimeout(() => {
      c1.classList.remove('flipped');
      c2.classList.remove('flipped');
      resetTurn(true); // następny gracz
    }, 900);
  }
}

// ═══════════════════════════════════════════
//  ZOOM OVERLAY – celebracja pary
// ═══════════════════════════════════════════
function showZoom(name) {
  const src = `${IMG_DIR}${name}${IMG_EXT}`;
  zoomCardWrap.innerHTML = `
    <div class="zoom-card"><img src="${src}" alt="${name}"></div>
    <div class="zoom-card"><img src="${src}" alt="${name}"></div>`;
  zoomOverlay.classList.add('show');
}

function closeZoom() {
  zoomOverlay.classList.remove('show');
}

// ═══════════════════════════════════════════
//  RESET TURN
// ═══════════════════════════════════════════
function resetTurn(switchPlayer) {
  flippedCards = [];
  lockBoard    = false;
  if (switchPlayer && playerCount > 1) {
    currentPlayer = (currentPlayer + 1) % playerCount;
    renderScoreboard();
  }
}

// ═══════════════════════════════════════════
//  WIN SCREEN
// ═══════════════════════════════════════════
function showWin() {
  const maxScore = Math.max(...scores);
  const winners  = scores
    .map((s, i) => ({ idx: i, score: s }))
    .filter(p => p.score === maxScore);

  if (playerCount === 1) {
    winSub.textContent   = `Znalazłeś wszystkie ${matchedCount / 2} par! 🎉`;
    finalScores.innerHTML = '';
  } else {
    // ranking malejąco
    const sorted = scores
      .map((s, i) => ({ idx: i, score: s }))
      .sort((a, b) => b.score - a.score);

    finalScores.innerHTML = sorted.map((p, rank) => {
      const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`;
      return `<div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
        <span style="font-size:1.3rem;min-width:30px;text-align:center">${medal}</span>
        <span style="background:${PLAYER_COLORS[p.idx]};width:12px;height:12px;border-radius:50%;display:inline-block"></span>
        <span style="font-weight:600;flex:1;text-align:left">Gracz ${p.idx + 1}</span>
        <span style="font-family:'Cinzel',serif;font-weight:700;color:var(--accent2)">${p.score}</span>
      </div>`;
    }).join('');

    if (winners.length === 1) {
      winSub.textContent = '';
      finalScores.insertAdjacentHTML('afterbegin',
        `<div class="winner-name" style="text-align:center;margin-bottom:10px;">
           🏆 Gracz ${winners[0].idx + 1} wygrywa!
         </div>`);
    } else {
      const names = winners.map(w => `Gracz ${w.idx + 1}`).join(' i ');
      winSub.textContent = `Remis – ${names}!`;
    }
  }

  winOverlay.classList.add('show');
}

// ═══════════════════════════════════════════
//  CONTROLS
// ═══════════════════════════════════════════
document.getElementById('restart-btn').addEventListener('click', () => {
  scores.fill(0);
  currentPlayer = 0;
  initGame();
});

document.getElementById('back-btn').addEventListener('click', () => {
  gameWrapper.style.display = 'none';
  setupPanel.style.display  = 'block';
  winOverlay.classList.remove('show');
  zoomOverlay.classList.remove('show');
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  winOverlay.classList.remove('show');
  scores.fill(0);
  currentPlayer = 0;
  initGame();
});

// ═══════════════════════════════════════════
//  RESPONSIVE – dostosowanie rozmiarów kart
// ═══════════════════════════════════════════
function setGridResponsive() {
  const w    = window.innerWidth;
  const size = w < 520 ? 74 : 96;
  gameBoard.style.gridTemplateColumns = `repeat(4, ${size}px)`;
  document.querySelectorAll('.card').forEach(c => {
    c.style.width  = size + 'px';
    c.style.height = size + 'px';
  });
}

window.addEventListener('resize', setGridResponsive);
