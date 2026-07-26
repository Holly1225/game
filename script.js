const MAX_TRIES = 5;

const TADC_WORDS = ["gangle", "zooble", "pomni", "jax", "caine", "kinger", "ragatha", "bubble", "digital", "ribbit", "kaufmo", "wormo", "queenie", "gummigoo"];
const UNSTABLE_WORDS = ["parrot", "wifies", "wemmbu", "spoke", "flamefrags", "clownpierce", "ashwagg", "jumperwho", "lomedy", "mapicc", "eggchan", "princezam", "boosfer"];

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const boardEl = document.getElementById("board");
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const messageEl = document.getElementById("message");
const modeTitle = document.getElementById("modeTitle");
const rulesText = document.getElementById("rulesText");

const createOwnBtn = document.getElementById("createOwnBtn");
const tadcBtn = document.getElementById("tadcBtn");
const unstableBtn = document.getElementById("unstableBtn");
const backBtn = document.getElementById("backBtn");

let answer = "";
let answerLen = 0;
let tries = 0;
let gameOver = false;
let boardRows = [];

function showStart() {
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
}

function showGame() {
  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeInput(text) {
  return text.toLowerCase().replace(/[^a-z ]/g, "");
}

function createBoard(cols) {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateRows = `repeat(${MAX_TRIES}, auto)`;
  boardRows = [];

  for (let r = 0; r < MAX_TRIES; r++) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.gridTemplateColumns = `repeat(${cols}, 42px)`;

    const cells = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      row.appendChild(cell);
      cells.push(cell);
    }

    boardRows.push(cells);
    boardEl.appendChild(row);
  }
}

function startGame(newAnswer, title, rules) {
  answer = newAnswer.toLowerCase();
  answerLen = answer.length;
  tries = 0;
  gameOver = false;
  messageEl.textContent = "";
  modeTitle.textContent = title;
  rulesText.textContent = rules;
  guessInput.value = "";

  createBoard(answerLen);
  showGame();
  guessInput.focus();
}

function scoreGuess(guess, target) {
  const colors = new Array(target.length).fill("gray");
  const targetUsed = new Array(target.length).fill(false);
  const guessChars = guess.split("");
  const targetChars = target.split("");

  for (let i = 0; i < target.length; i++) {
    if (guessChars[i] === targetChars[i]) {
      colors[i] = "green";
      targetUsed[i] = true;
      guessChars[i] = null;
    }
  }

  for (let i = 0; i < target.length; i++) {
    if (guessChars[i] == null) continue;

    for (let j = 0; j < target.length; j++) {
      if (!targetUsed[j] && guessChars[i] === targetChars[j]) {
        colors[i] = "yellow";
        targetUsed[j] = true;
        break;
      }
    }
  }

  return colors;
}

function renderGuess(rowIndex, guess, colors) {
  const cells = boardRows[rowIndex];
  for (let i = 0; i < answerLen; i++) {
    const ch = guess[i];
    cells[i].textContent = ch === " " ? "␠" : ch.toUpperCase();
    cells[i].classList.add(colors[i]);
  }
}

function submitGuess() {
  if (gameOver) return;

  let raw = guessInput.value;
  raw = normalizeInput(raw);

  if (raw.length !== answerLen) {
    messageEl.textContent = `Guess must be exactly ${answerLen} characters (letters/spaces).`;
    return;
  }

  if (tries >= MAX_TRIES) return;

  const colors = scoreGuess(raw, answer);
  renderGuess(tries, raw, colors);
  tries++;
  guessInput.value = "";

  if (raw === answer) {
    gameOver = true;
    messageEl.textContent = "good job :D";
    return;
  }

  if (tries === MAX_TRIES) {
    gameOver = true;
    messageEl.textContent = `The word was "${answer}". better luck next time ig :D`;
  } else {
    messageEl.textContent = `${MAX_TRIES - tries} tries left.`;
  }
}

createOwnBtn.addEventListener("click", () => {
  let chosen = prompt("What word do you want the Wordle answer to be? (letters and spaces allowed)");
  if (chosen == null) return;

  chosen = normalizeInput(chosen.trim());

  if (!chosen || chosen.length < 1) {
    alert("Please enter at least 1 character.");
    return;
  }

  if (chosen.length > 12) {
    alert("Please keep custom word to 12 characters or fewer.");
    return;
  }

  startGame(
    chosen,
    "Create Own Wordle",
    `Custom mode • ${MAX_TRIES} tries • spaces allowed`
  );
});

tadcBtn.addEventListener("click", () => {
  const chosen = pickRandom(TADC_WORDS);
  startGame(
    chosen,
    "TADC Wordle",
    `Guess a TADC word • up to 7 letters • ${MAX_TRIES} tries • spaces allowed`
  );
});

unstableBtn.addEventListener("click", () => {
  const chosen = pickRandom(UNSTABLE_WORDS);
  startGame(
    chosen,
    "Unstable SMP Wordle",
    `Guess an Unstable SMP word • max 9+ letters list • ${MAX_TRIES} tries • spaces allowed`
  );
});

backBtn.addEventListener("click", () => {
  showStart();
});

guessBtn.addEventListener("click", submitGuess);

guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    submitGuess();
  }
});

showStart();
