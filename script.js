const cardNames = ['obrazek1', 'obrazek2', 'obrazek3', 'obrazek4', 'obrazek5', 'obrazek6', 'obrazek7'];
const extension = '.jpg'; 

// Tworzymy pary (razem 14 kart)
let cardsArray = [...cardNames, ...cardNames];
let flippedCards = [];
let matchedCount = 0;
let lockBoard = false; // Zabezpieczenie przed klikaniem wielu kart na raz

const gameBoard = document.getElementById('game-board');

function initGame() {
    gameBoard.innerHTML = '';
    matchedCount = 0;
    cardsArray.sort(() => 0.5 - Math.random());

    cardsArray.forEach((name) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.name = name;
        
        const img = document.createElement('img');
        // Tutaj wskazujemy folder images/
        img.src = `images/${name}${extension}`; 
        
        card.appendChild(img);
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function flipCard() {
    if (lockBoard) return;
    if (this === flippedCards[0]) return;

    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    lockBoard = true;
    const [card1, card2] = flippedCards;

    if (card1.dataset.name === card2.dataset.name) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedCount += 2;
        resetTurn();
        if (matchedCount === cardsArray.length) {
            setTimeout(() => alert('Gratulacje! Odnaleziono wszystkie pary!'), 500);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            resetTurn();
        }, 1000);
    }
}

function resetTurn() {
    flippedCards = [];
    lockBoard = false;
}

document.getElementById('restart-btn').addEventListener('click', initGame);
initGame();