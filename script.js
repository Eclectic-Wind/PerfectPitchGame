// Initialize synth and game state variables
const synth = new Tone.Synth().toDestination();
synth.volume.value = -12;
let currentNote;
let gameTimer;
let startTime;
let currentScore = 0;
let currentStreak = 0;
let currentQuestion = 0;
let answerSubmitted = false;
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const majorScale = ["C", "D", "E", "F", "G", "A", "B"];

// Menu navigation functions
function showMenu() {
  document.getElementById("menu").style.display = "block";
  document.getElementById("gameArea").style.display = "none";
  document.getElementById("gameOver").style.display = "none";
  if (gameTimer) {
    clearInterval(gameTimer);
  }
  displayHighScores();
}

function showScores() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("scoresArea").style.display = "block";
  displayHighScores();
}

// Display top 10 high scores sorted by score then time
function displayHighScores() {
  const scores = JSON.parse(localStorage.getItem("highScores") || "[]");
  const scoresList = document.getElementById("highScoresList");
  scoresList.innerHTML = "";

  scores
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 10)
    .forEach((score, index) => {
      const entry = document.createElement("div");
      entry.className = "score-entry";
      entry.innerHTML = `
        <span>#${index + 1}</span>
        <span>${score.score}/10</span>
        <span>${formatTime(score.time)}</span>
        <span>Streak: ${score.streak}</span>
      `;
      scoresList.appendChild(entry);
    });
}

// Initialize new game
function startGame() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("gameArea").style.display = "block";
  currentScore = 0;
  currentStreak = 0;
  currentQuestion = 1;
  answerSubmitted = false;
  document.getElementById("currentScore").textContent = currentScore;
  document.getElementById("currentQuestion").textContent = currentQuestion;
  document.getElementById("streak").textContent = currentStreak;
  startTime = Date.now();
  updateTimer();
  gameTimer = setInterval(updateTimer, 1000);
  generateOptions();
  currentNote = getRandomNote();
  playCurrentNote();
}

// Timer functions
function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById("timer").textContent = formatTime(elapsed);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Get random note based on game mode and octave range
function getRandomNote() {
  const mode = document.getElementById("mode").value;
  const availableNotes = mode === "major" ? majorScale : notes;

  const minOctave = parseInt(document.getElementById("minOctave").value);
  const maxOctave = parseInt(document.getElementById("maxOctave").value);

  const noteIndex = Math.floor(Math.random() * availableNotes.length);
  const octave =
    Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;

  return availableNotes[noteIndex] + octave;
}

// Generate note buttons based on game mode
function generateOptions() {
  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = "";
  const mode = document.getElementById("mode").value;
  const availableNotes = mode === "major" ? majorScale : notes;

  availableNotes.forEach((note) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.textContent = note;
    button.onclick = () => checkAnswer(note);
    optionsContainer.appendChild(button);
  });
}

// Play current note with animation
function playCurrentNote() {
  const soundButton = document.querySelector(".sound-button");
  soundButton.disabled = true;
  soundButton.classList.add("loading");

  const soundContainer = document.querySelector(".sound-container");
  soundContainer.classList.add("playing");
  synth.triggerAttackRelease(currentNote, "0.5");

  setTimeout(() => {
    soundContainer.classList.remove("playing");
    soundButton.disabled = false;
    soundButton.classList.remove("loading");
  }, 500);
}

// Check answer and update game state
function checkAnswer(selectedNote) {
  if (answerSubmitted) return;

  answerSubmitted = true;
  const correctNote = currentNote.slice(0, -1);
  const buttons = document.querySelectorAll(".option-button");

  buttons.forEach((button) => {
    button.disabled = true;
    if (button.textContent === correctNote) {
      button.classList.add("correct");
    }
    if (button.textContent === selectedNote && selectedNote !== correctNote) {
      button.classList.add("incorrect");
    }
  });

  if (selectedNote === correctNote) {
    currentScore++;
    currentStreak++;
  } else {
    currentStreak = 0;
  }

  document.getElementById("currentScore").textContent = currentScore;
  document.getElementById("streak").textContent = currentStreak;

  if (currentQuestion === 10) {
    setTimeout(() => {
      endGame();
    }, 1000);
  } else {
    setTimeout(() => {
      currentQuestion++;
      document.getElementById("currentQuestion").textContent = currentQuestion;
      buttons.forEach((button) => {
        button.disabled = false;
        button.classList.remove("correct", "incorrect");
      });

      answerSubmitted = false;
      currentNote = getRandomNote();
      playCurrentNote();
    }, 1000);
  }

  const progressFill = document.querySelector(".progress-fill");
  progressFill.style.width = `${(currentQuestion / 10) * 100}%`;
}

// End game and save score
function endGame() {
  clearInterval(gameTimer);
  const finalTime = Math.floor((Date.now() - startTime) / 1000);

  const scores = JSON.parse(localStorage.getItem("highScores") || "[]");
  scores.push({
    score: currentScore,
    time: finalTime,
    streak: currentStreak,
  });
  localStorage.setItem("highScores", JSON.stringify(scores));

  document.getElementById("finalScore").textContent = `${currentScore}/10`;
  document.getElementById("finalTime").textContent = formatTime(finalTime);
  document.getElementById("finalStreak").textContent = currentStreak;

  document.getElementById("gameArea").style.display = "none";
  document.getElementById("gameOver").style.display = "block";

  displayHighScores();
}

// Start new game
function replay() {
  document.getElementById("gameOver").style.display = "none";
  startGame();
}

// Volume control
function updateVolume() {
  const volume = document.getElementById("volume").value;
  synth.volume.value = scale(volume, 0, 100, -60, 0);
}

function scale(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Setup octave range slider controls
function setupOctaveSliders() {
  const minSlider = document.getElementById("minOctave");
  const maxSlider = document.getElementById("maxOctave");
  const minInput = document.getElementById("minOctaveInput");
  const maxInput = document.getElementById("maxOctaveInput");
  const trackHighlight = document.querySelector(".slider_track_highlight");

  function updateSliderTrack() {
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);
    const range = 7 - 1;

    const start = ((minVal - 1) / range) * 100;
    const end = ((maxVal - 1) / range) * 100;

    trackHighlight.style.left = start + "%";
    trackHighlight.style.width = end - start + "%";
  }

  function validateRange(newMinVal, newMaxVal) {
    if (newMaxVal - newMinVal < 1) {
      return false;
    }
    return true;
  }

  minSlider.addEventListener("input", () => {
    const newMinVal = parseInt(minSlider.value);
    const currentMax = parseInt(maxSlider.value);

    if (!validateRange(newMinVal, currentMax)) {
      minSlider.value = currentMax - 1;
      minInput.value = currentMax - 1;
    } else {
      minInput.value = newMinVal;
    }
    updateSliderTrack();
  });

  maxSlider.addEventListener("input", () => {
    const currentMin = parseInt(minSlider.value);
    const newMaxVal = parseInt(maxSlider.value);

    if (!validateRange(currentMin, newMaxVal)) {
      maxSlider.value = currentMin + 1;
      maxInput.value = currentMin + 1;
    } else {
      maxInput.value = newMaxVal;
    }
    updateSliderTrack();
  });

  minInput.addEventListener("change", () => {
    let val = parseInt(minInput.value);
    const currentMax = parseInt(maxSlider.value);

    val = Math.min(Math.max(val, 1), currentMax - 1);
    minInput.value = val;
    minSlider.value = val;
    updateSliderTrack();
  });

  maxInput.addEventListener("change", () => {
    let val = parseInt(maxInput.value);
    const currentMin = parseInt(minSlider.value);

    val = Math.min(Math.max(val, currentMin + 1), 7);
    maxInput.value = val;
    maxSlider.value = val;
    updateSliderTrack();
  });

  updateSliderTrack();
}

// Init
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("volume").addEventListener("input", updateVolume);
  setupOctaveSliders();
  displayHighScores();
});

// Keyboard control
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    playCurrentNote();
  } else if (e.key >= "1" && e.key <= "7") {
    const buttons = document.querySelectorAll(".option-button");
    const index = parseInt(e.key) - 1;
    if (buttons[index]) {
      buttons[index].click();
    }
  }
});

// Update score display with animation
function updateScore() {
  const scoreElement = document.getElementById("currentScore");
  scoreElement.classList.add("score-change");
  scoreElement.textContent = currentScore;
  setTimeout(() => scoreElement.classList.remove("score-change"), 300);
}
