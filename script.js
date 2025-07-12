// --- Declare variables ONCE at the top ---
let score = 0;
let timeLeft = 30;
let dropInterval, timerInterval;
let isPlaying = false;
let purifierActive = false;
let purifierTimeout = null;
let paused = false;
let pausedState = {};

const player = document.getElementById('player');
const gameScreen = document.getElementById('gameScreen');
const statusBar = document.getElementById('statusBar');
const messageBox = document.getElementById('messageBox');
const catchSound = document.getElementById('catchSound');
const bgMusic = document.getElementById('bgMusic');
const muteBtn = document.getElementById('muteBtn');
let isMuted = false;

let currentTheme = 'rural';
let currentDropInterval = 800;

const difficultySelect = document.getElementById('difficulty');
let difficulty = 'normal';

// Milestones logic
let milestones = [50, 100, 200];
let milestonesReached = {};

// Start the game
function startGame() {
  if (isPlaying) return;
  isPlaying = true;
  // Get selected difficulty
  difficulty = difficultySelect ? difficultySelect.value : 'normal';

  // Set time and drop interval based on difficulty
  if (difficulty === 'easy') {
    timeLeft = 40;
    currentDropInterval = 1000;
  } else if (difficulty === 'hard') {
    timeLeft = 20;
    currentDropInterval = 400;
  } else {
    timeLeft = 30;
    currentDropInterval = 800;
  }

  updateStatus();
  messageBox.textContent = "Catch the water drops!";
  gameScreen.style.display = "block";
  player.style.left = "150px";
  clearDrops();

  document.addEventListener('keydown', movePlayer);

  setThemeAndDifficulty();
  timerInterval = setInterval(updateTimer, 1000);

  // Start music if not muted
  if (!isMuted) {
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.5;
    bgMusic.muted = false;
    // Play and handle promise
    bgMusic.play().catch((e) => {
      // Optionally show a message if playback fails
      console.log("Audio playback was prevented by the browser.", e);
    });
  }
}

// Move player left/right
function movePlayer(e) {
  if (paused) return;
  const gameWidth = gameScreen.offsetWidth;
  const playerWidth = player.offsetWidth;
  const left = parseInt(player.style.left) || 0;
  if (e.key === "ArrowLeft" && left > 0) {
    player.style.left = Math.max(0, left - 0.06 * gameWidth) + "px";
  }
  if (e.key === "ArrowRight" && left < gameWidth - playerWidth) {
    player.style.left = Math.min(gameWidth - playerWidth, left + 0.06 * gameWidth) + "px";
  }
}

// Spawn a water drop
function spawnDrop() {
  if (paused) return;
  const gameWidth = gameScreen.offsetWidth;
  const drop = document.createElement('div');
  let dropType = 'normal';

  // Decide drop type
  const rand = Math.random();
  if (rand < 0.08) {
    // 8% chance for a bonus drop
    const bonusRand = Math.random();
    if (bonusRand < 0.33) {
      dropType = 'golden';
      drop.className = 'water-drop bonus-drop golden-drop';
    } else if (bonusRand < 0.66) {
      dropType = 'clock';
      drop.className = 'water-drop bonus-drop clock-drop';
    } else {
      dropType = 'purifier';
      drop.className = 'water-drop bonus-drop purifier-drop';
    }
  } else if (rand < 0.28) {
    dropType = 'bad';
    drop.className = 'water-drop bad-drop';
  } else {
    drop.className = 'water-drop';
  }

  const dropWidth = 0.06 * gameWidth;
  drop.style.left = Math.floor(Math.random() * (gameWidth - dropWidth)) + "px";
  drop.style.top = "0px";
  gameScreen.appendChild(drop);

  let fallInterval = setInterval(() => {
    let top = parseInt(drop.style.top);
    drop.style.top = (top + 0.016 * gameScreen.offsetHeight) + "px";

    if (top > gameScreen.offsetHeight - player.offsetHeight - drop.offsetHeight) {
      const dropLeft = parseInt(drop.style.left);
      const playerLeft = parseInt(player.style.left);
      if (
        dropLeft + drop.offsetWidth > playerLeft &&
        dropLeft < playerLeft + player.offsetWidth
      ) {
        // Collision detected
        player.classList.remove('wiggle'); // reset if already animating
        void player.offsetWidth; // force reflow for restart
        player.classList.add('wiggle');

        if (dropType === 'bad') {
          score -= 10;
          messageBox.textContent = "Oh no! Bad water drop! -10";
          // Play failure sound
          const failureSound = document.getElementById('failureSound');
          if (failureSound) {
            failureSound.currentTime = 0;
            failureSound.play();
          }
        } else if (dropType === 'golden') {
          score += purifierActive ? 100 : 50;
          messageBox.textContent = "Golden Drop! +" + (purifierActive ? "100" : "50");
        } else if (dropType === 'clock') {
          timeLeft += 5;
          messageBox.textContent = "Clock Drop! +5s";
        } else if (dropType === 'purifier') {
          activatePurifier();
          messageBox.textContent = "Purifier! Double points for 5s!";
        } else {
          score += purifierActive ? 20 : 10;
          messageBox.textContent = "Nice catch! +" + (purifierActive ? "20" : "10");
          catchSound.currentTime = 0;
          catchSound.play();

          // Play water drop sound
          const waterDropSound = document.getElementById('waterDropSound');
          if (waterDropSound) {
            waterDropSound.currentTime = 0;
            waterDropSound.play();
          }
        }
        // Play shine sound for bonus drops
        if (
          dropType === 'bonus' ||
          dropType === 'golden' ||
          dropType === 'clock' ||
          dropType === 'purifier'
        ) {
          const shineSound = document.getElementById('shineSound');
          if (shineSound) {
            shineSound.currentTime = 0;
            shineSound.play();
          }
        }
        updateStatus();
        drop.remove();
        clearInterval(fallInterval);

        // Remove wiggle class after animation
        setTimeout(() => player.classList.remove('wiggle'), 400);
      }
    }
    if (top > gameScreen.offsetHeight) {
      drop.remove();
      clearInterval(fallInterval);
    }
  }, 20);
}

function activatePurifier() {
  purifierActive = true;
  if (purifierTimeout) clearTimeout(purifierTimeout);
  purifierTimeout = setTimeout(() => {
    purifierActive = false;
    messageBox.textContent = "Purifier ended!";
  }, 5000);
}

function setThemeAndDifficulty() {
  if (difficulty === 'easy') {
    currentDropInterval = 1000;
  } else if (difficulty === 'hard') {
    currentDropInterval = 400;
  } else {
    // Normal
    if (timeLeft > 20) {
      currentDropInterval = 800;
    } else if (timeLeft > 10) {
      currentDropInterval = 600;
    } else {
      currentDropInterval = 400;
    }
  }
  if (timeLeft > 20) {
    document.body.classList.add('rural');
    document.body.classList.remove('desert', 'storm');
    currentTheme = 'rural';
  } else if (timeLeft > 10) {
    document.body.classList.add('desert');
    document.body.classList.remove('rural', 'storm');
    currentTheme = 'desert';
  } else {
    document.body.classList.add('storm');
    document.body.classList.remove('rural', 'desert');
    currentTheme = 'storm';
  }
  // Restart drop interval with new speed
  clearInterval(dropInterval);
  dropInterval = setInterval(spawnDrop, currentDropInterval);
}

// Update timer and end game if time is up
function updateTimer() {
  timeLeft--;
  setThemeAndDifficulty();
  updateStatus();
  if (timeLeft <= 0) {
    endGame();
  }
}

// Update scoreboard
function updateStatus() {
  statusBar.textContent = `Time: ${timeLeft} | Score: ${score}`;
}

// End the game
function endGame() {
  isPlaying = false;
  clearInterval(dropInterval);
  clearInterval(timerInterval);
  document.removeEventListener('keydown', movePlayer);

  // Show "Times Up!" message with score
  if (messageBox) {
    messageBox.innerHTML = `
      <span style="font-size:1.3em; color:#FFC907; font-weight:bold;">Times Up!</span><br>
      <span style="font-size:1.1em; color:#FFF7E1;">Game Over! You scored <b>${score}</b> points.</span>
    `;
  }

  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  // Confetti celebration!
  if (window.confetti) {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    // Play firework sound
    const fireworkSound = document.getElementById('fireworkSound');
    if (fireworkSound) {
      fireworkSound.currentTime = 0;
      fireworkSound.play();
    }
  }
}

// Remove all drops
function clearDrops() {
  document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
}

// Expose startGame globally so the button works
window.startGame = startGame;

// Touch controls and mute logic
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
if (leftBtn && rightBtn) {
  leftBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const event = new KeyboardEvent('keydown', {key: 'ArrowLeft'});
    movePlayer(event);
  });
  rightBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const event = new KeyboardEvent('keydown', {key: 'ArrowRight'});
    movePlayer(event);
  });
}

// Mute/unmute logic
if (muteBtn && bgMusic) {
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
    if (!isMuted && isPlaying) {
      bgMusic.play();
    }
  });
}

// --- Water facts logic ---
const facts = [
  "771 million people lack clean water.",
  "Dirty water kills more people than violence.",
  "Women spend 200 million hours daily collecting water."
];
let factIndex = 0;
const factBox = document.getElementById('factBox');
setInterval(() => {
  if (isPlaying && factBox) {
    factBox.textContent = "Did you know? " + facts[factIndex % facts.length];
    factIndex++;
  }
}, 5000);

// Audio element for water drop sound
const waterDropSound = document.createElement('audio');
waterDropSound.id = 'waterDropSound';
waterDropSound.src = 'music/water-drip-45622.mp3';
document.body.appendChild(waterDropSound);

// Pause game function
function pauseGame() {
  if (!isPlaying || paused) return;
  paused = true;
  clearInterval(dropInterval);
  clearInterval(timerInterval);
  pausedState.playerLeft = player.style.left;
  messageBox.textContent = "Game Paused";
  if (bgMusic) bgMusic.pause();
}

function resumeGame() {
  if (!isPlaying || !paused) return;
  paused = false;
  player.style.left = pausedState.playerLeft || player.style.left;
  setThemeAndDifficulty();
  timerInterval = setInterval(updateTimer, 1000);
  messageBox.textContent = "Game Resumed!";
  if (bgMusic && !isMuted) bgMusic.play();
}

// Pause button logic
const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    if (!isPlaying) return;
    if (!paused) {
      pauseGame();
      pauseBtn.textContent = '▶️ Resume';
    } else {
      resumeGame();
      pauseBtn.textContent = '⏸️ Pause';
    }
  });
}

// --- Drag to move bucket with mouse ---
let isDragging = false;
let dragOffsetX = 0;

player.addEventListener('mousedown', function(e) {
  if (!isPlaying || paused) return;
  isDragging = true;
  // Calculate offset between mouse and left edge of player
  const rect = player.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  document.body.style.userSelect = 'none'; // Prevent text selection
});

document.addEventListener('mousemove', function(e) {
  if (!isDragging || !isPlaying || paused) return;
  const gameRect = gameScreen.getBoundingClientRect();
  let newLeft = e.clientX - gameRect.left - dragOffsetX;
  // Clamp within game area
  newLeft = Math.max(0, Math.min(newLeft, gameScreen.offsetWidth - player.offsetWidth));
  player.style.left = newLeft + 'px';
});

document.addEventListener('mouseup', function() {
  isDragging = false;
  document.body.style.userSelect = '';
});

// For touch devices (optional, for completeness)
player.addEventListener('touchstart', function(e) {
  if (!isPlaying || paused) return;
  isDragging = true;
  const rect = player.getBoundingClientRect();
  dragOffsetX = e.touches[0].clientX - rect.left;
  document.body.style.userSelect = 'none';
}, {passive: false});

document.addEventListener('touchmove', function(e) {
  if (!isDragging || !isPlaying || paused) return;
  const gameRect = gameScreen.getBoundingClientRect();
  let newLeft = e.touches[0].clientX - gameRect.left - dragOffsetX;
  newLeft = Math.max(0, Math.min(newLeft, gameScreen.offsetWidth - player.offsetWidth));
  player.style.left = newLeft + 'px';
}, {passive: false});

document.addEventListener('touchend', function() {
  isDragging = false;
  document.body.style.userSelect = '';
}, {passive: false});

// Show milestone messages
function showMilestoneMessage(text) {
  messageBox.textContent = text;
  setTimeout(() => {
    // Only clear if the message hasn't changed (avoid erasing other messages)
    if (messageBox.textContent === text) messageBox.textContent = "";
  }, 2000);
}

// Add score and check milestones
function addScore(points) {
  score += points;
  updateStatus();

  // Check for milestones
  milestones.forEach(milestone => {
    if (score >= milestone && !milestonesReached[milestone]) {
      showMilestoneMessage(`🎉 Milestone: ${milestone} points!`);
      milestonesReached[milestone] = true;
    }
  });
}

// Example of replacing direct score addition
function onCatchWaterDrop() {
  addScore(10);
  // ...other logic...
}
