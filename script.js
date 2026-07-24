const gameState = {
  currentCategory: null,
  currentWord: '',
  currentGuess: '',
  attempts: [],
  maxAttempts: 6,
  gameOver: false,
  won: false
};

const categories = {
  tadc: {
    name: "The Amazing Digital Circus",
    words: [
      "pomni", "jax", "ragatha", "gangle", "zooble", "kinger", "caine", "bubble",
      "abstract", "circus", "digital"
    ],
    color: "#ff6b9d"
  },
 unstablesmp: {
  name: "Unstable SMP",
  words: [
    "wifies", "parrot", "spoke", "jumperwho", "flamefrag", "wemmbu""
  ],
  color: "#7c3aed"
}
};

// NEW: longest word length per category
const maxLenByCategory = Object.fromEntries(
  Object.entries(categories).map(([key, category]) => [
    key,
    Math.max(...category.words.map(word => word.length))
  ])
);

function getDisplayLength() {
  // Fixed box counts by category (do not reveal actual answer length)
  if (gameState.currentCategory === 'tadc') return 7;
  if (gameState.currentCategory === 'unstablesmp') return 9;

  // Fallback for any other category
  return maxLenByCategory[gameState.currentCategory];
}

const categoryButtons = document.querySelectorAll('.category-btn');
const gameBoard = document.getElementById('gameBoard');
const currentCategorySpan = document.getElementById('currentCategory');
const messageDiv = document.getElementById('message');
const keyboard = document.getElementById('keyboard');
const playAgainBtn = document.getElementById('playAgain');
const clueBtn = document.getElementById('clueBtn');
const attemptsDisplay = document.getElementById('attempts');
const maxAttemptsDisplay = document.getElementById('maxAttempts');
const categorySelection = document.getElementById('categorySelection');

function selectCategory(categoryKey) {
  gameState.currentCategory = categoryKey;
  const category = categories[categoryKey];
  gameState.currentWord = category.words[Math.floor(Math.random() * category.words.length)].toUpperCase();
  
  currentCategorySpan.textContent = category.name;
  currentCategorySpan.style.color = category.color;
  
  resetGame();
  createGameBoard();
  createKeyboard();
  
  categorySelection.style.display = 'none';
  gameBoard.style.display = 'grid';
  keyboard.style.display = 'block';
}

function resetGame() {
  gameState.currentGuess = '';
  gameState.attempts = [];
  gameState.gameOver = false;
  gameState.won = false;
  
  messageDiv.textContent = '';
  messageDiv.className = 'message';
  playAgainBtn.style.display = 'none';
  clueBtn.disabled = false;
  
  attemptsDisplay.textContent = '0';
  maxAttemptsDisplay.textContent = gameState.maxAttempts;
}

function createGameBoard() {
  gameBoard.innerHTML = '';
  const displayLength = getDisplayLength();
  
  for (let row = 0; row < gameState.maxAttempts; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'word-row';
    
    for (let col = 0; col < displayLength; col++) {
      const tile = document.createElement('div');
      tile.className = 'letter-tile';
      tile.id = `tile-${row}-${col}`;
      rowDiv.appendChild(tile);
    }
    
    gameBoard.appendChild(rowDiv);
  }
}

function createKeyboard() {
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'SPACE', '⌫']
  ];
  
  keyboard.innerHTML = '';
  
  keyboardRows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    
    row.forEach(key => {
      const keyBtn = document.createElement('button');
      keyBtn.className = 'key-btn';
      keyBtn.textContent = key;
      keyBtn.addEventListener('click', () => handleKeyPress(key));
      
      if (key === 'ENTER' || key === '⌫' || key === 'SPACE') {
        keyBtn.classList.add('special-key');
      }
      
      rowDiv.appendChild(keyBtn);
    });
    
    keyboard.appendChild(rowDiv);
  });
}

function handleKeyPress(key) {
  if (gameState.gameOver) return;
  
  const displayLength = getDisplayLength();
  
  if (key === 'ENTER') {
    submitGuess();
  } else if (key === '⌫') {
    deleteLetter();
  } else if (key === 'SPACE') {
    if (gameState.currentGuess.length < displayLength) {
      addLetter(' ');
    }
  } else if (gameState.currentGuess.length < displayLength) {
    addLetter(key);
  }
}

function addLetter(letter) {
  const displayLength = getDisplayLength();
  if (gameState.currentGuess.length < displayLength) {
    gameState.currentGuess += letter;
    updateCurrentRow();
  }
}

function deleteLetter() {
  gameState.currentGuess = gameState.currentGuess.slice(0, -1);
  updateCurrentRow();
}

function updateCurrentRow() {
  const currentRow = gameState.attempts.length;
  const displayLength = getDisplayLength();
  
  for (let col = 0; col < displayLength; col++) {
    const tile = document.getElementById(`tile-${currentRow}-${col}`);
    const letter = gameState.currentGuess[col] || '';
    
    tile.textContent = letter === ' ' ? '␣' : letter;
    tile.className = 'letter-tile';
    
    if (letter) {
      tile.classList.add('filled');
    }
  }
}

function submitGuess() {
  const displayLength = getDisplayLength();

  // Require full fixed-length input for the category
  if (gameState.currentGuess.length !== displayLength) {
    showMessage(
      `Enter exactly ${displayLength} letters/spaces. The real answer may be shorter.`,
      'error'
    );
    return;
  }

  const guess = gameState.currentGuess;
  const result = evaluateGuess(guess);

  gameState.attempts.push({ guess, result });
  updateRowColors(gameState.attempts.length - 1, result);
  updateKeyboardColors(guess, result);

  // Win check: trim spaces so short real answers can still win
  if (guess.trim() === gameState.currentWord) {
    gameState.won = true;
    gameState.gameOver = true;
    showMessage('🎉 Congratulations! You guessed the word!', 'success');
    endGame();
    return;
  }

  if (gameState.attempts.length >= gameState.maxAttempts) {
    gameState.gameOver = true;
    showMessage(`Game Over! The word was: ${gameState.currentWord}`, 'error');
    endGame();
    return;
  }

  gameState.currentGuess = '';
  attemptsDisplay.textContent = gameState.attempts.length;
}

function evaluateGuess(guess) {
  const result = new Array(guess.length).fill('absent');
  const wordLetters = gameState.currentWord.split('');
  const guessLetters = guess.split('');
  
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === wordLetters[i]) {
      result[i] = 'correct';
      wordLetters[i] = null;
      guessLetters[i] = null;
    }
  }
  
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] && wordLetters.includes(guessLetters[i])) {
      result[i] = 'present';
      wordLetters[wordLetters.indexOf(guessLetters[i])] = null;
    }
  }
  
  return result;
}

function updateRowColors(row, result) {
  for (let col = 0; col < result.length; col++) {
    const tile = document.getElementById(`tile-${row}-${col}`);
    setTimeout(() => {
      tile.classList.add(result[col]);
    }, col * 100);
  }
}

function updateKeyboardColors(guess, result) {
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];
    const keyBtn = Array.from(document.querySelectorAll('.key-btn'))
      .find(btn => btn.textContent === letter);
    
    if (keyBtn) {
      const currentClass = keyBtn.className;
      
      if (result[i] === 'correct') {
        keyBtn.className = currentClass.replace(/present|absent/g, '') + ' correct';
      } else if (result[i] === 'present' && !currentClass.includes('correct')) {
        keyBtn.className = currentClass.replace(/absent/g, '') + ' present';
      } else if (result[i] === 'absent' && !currentClass.includes('correct') && !currentClass.includes('present')) {
        keyBtn.className += ' absent';
      }
    }
  }
}

function showMessage(message, type) {
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  
  setTimeout(() => {
    if (!gameState.gameOver) {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }
  }, 3000);
}

function endGame() {
  playAgainBtn.style.display = 'inline-block';
  clueBtn.disabled = true;
}

function giveClue() {
  if (!gameState.currentWord || gameState.gameOver) return;
  
  const clues = {
    tadc: [
      "This character/show is from a digital world",
      "Think about circus performers and AI",
      "Popular on YouTube animation"
    ],
    murderdrones: [
      "This character/show involves robots",
      "Think about drones and sci-fi horror",
      "Created by GLITCH Productions"
    ]
  };
  
  const categoryClues = clues[gameState.currentCategory];
  const randomClue = categoryClues[Math.floor(Math.random() * categoryClues.length)];
  
  showMessage(`💡 Clue: ${randomClue}`, 'success');
  clueBtn.disabled = true;
}

categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.category;
    selectCategory(category);
  });
});

playAgainBtn.addEventListener('click', () => {
  categorySelection.style.display = 'block';
  gameBoard.style.display = 'none';
  keyboard.style.display = 'none';
  currentCategorySpan.textContent = '';
  playAgainBtn.style.display = 'none';
  messageDiv.textContent = '';
});

clueBtn.addEventListener('click', giveClue);

document.addEventListener('keydown', (e) => {
  if (gameState.gameOver || !gameState.currentCategory) return;
  
  if (e.key === 'Enter') {
    handleKeyPress('ENTER');
  } else if (e.key === 'Backspace') {
    handleKeyPress('⌫');
  } else if (e.key === ' ') {
    e.preventDefault();
    handleKeyPress('SPACE');
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    handleKeyPress(e.key.toUpperCase());
  }
});
