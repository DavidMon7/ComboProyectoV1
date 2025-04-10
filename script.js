document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const player = document.getElementById('player');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const comboDisplay = document.getElementById('combo');
    const gameContainer = document.getElementById('gameContainer');
    const startScreen = document.getElementById('startScreen');
    const registerScreen = document.getElementById('registerScreen');
    const rankingDisplay = document.getElementById('rankingDisplay');
    const finalScoreText = document.getElementById('finalScoreText');
    const rankingDiv = document.getElementById('ranking');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const registerForm = document.getElementById('registerForm');
    const termsModal = document.getElementById('termsModal');
    const openTermsBtn = document.getElementById('openTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const rankingButton = document.getElementById('rankingButton');
    const rankingModal = document.getElementById('rankingModal');
    const rankingModalContent = document.getElementById('rankingModalContent');
    const rankingCloseBtn = document.querySelector('.ranking-close-btn');

    // Variables del juego
    let playerY = 20;
    let playerSpeedY = 0;
    let gravity = 0.5;
    let isJumping = false;
    let score = 0;
    let timer = 120;
    let combo = 0;
    let obstacles = [];
    let coins = [];
    let gameRunning = false;
    let obstacleInterval;
    let coinInterval;
    let timerInterval;
    let playerName = '';
    let playerEmail = '';
    let hasDoubleJump = false;
    let doubleJumpAvailable = false;
    let gameSpeed = 1;

    // Funciones de sonido (asumiendo que tienes sound-manager.js)
    const soundManager = new SoundManager();

    // Funciones de utilidad
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    function checkCollision(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    }

    function createFloatingText(text, x, y, color = '#fff') {
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.position = 'absolute';
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        floatingText.style.color = color;
        floatingText.style.fontSize = '1.2em';
        floatingText.style.pointerEvents = 'none';
        gameContainer.appendChild(floatingText);
        setTimeout(() => floatingText.remove(), 1500);
    }

    // Funciones del juego
    function jump() {
        if (!isJumping) {
            playerSpeedY = -12;
            isJumping = true;
            player.classList.add('player-jump');
            soundManager.playSound('jump');
        } else if (hasDoubleJump && doubleJumpAvailable) {
            playerSpeedY = -10;
            doubleJumpAvailable = false;
            soundManager.playSound('jump');
        }
    }

    function spawnObstacle() {
        if (!gameRunning) return;
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle obstacle-animation';
        obstacle.style.height = `${getRandom(20, 100)}px`;
        obstacle.style.width = `${getRandom(20, 50)}px`;
        obstacle.style.left = '800px';
        gameContainer.appendChild(obstacle);
        obstacles.push({ element: obstacle, x: 800, width: parseInt(obstacle.style.width) });
    }

    function spawnCoin() {
        if (!gameRunning) return;
        const coin = document.createElement('div');
        coin.className = `coin coin-${['green', 'blue', 'yellow'][Math.floor(Math.random() * 3)]} coin-animation`;
        coin.style.left = `${getRandom(400, 700)}px`;
        coin.style.top = `${getRandom(50, 400)}px`;
        gameContainer.appendChild(coin);
        coins.push({ element: coin, x: parseInt(coin.style.left), y: parseInt(coin.style.top) });
    }

    function updateGame() {
        if (!gameRunning) return;

        // Actualizar jugador
        playerSpeedY += gravity;
        playerY += playerSpeedY;
        if (playerY > 20) {
            playerY = 20;
            isJumping = false;
            player.classList.remove('player-jump');
            doubleJumpAvailable = true;
        }
        player.style.bottom = `${playerY}px`;

        // Actualizar obstáculos
        obstacles = obstacles.filter(obstacle => {
            obstacle.x -= 5 * gameSpeed;
            obstacle.element.style.left = `${obstacle.x}px`;
            if (checkCollision(player, obstacle.element)) {
                timer -= 1;
                combo = 0;
                comboDisplay.textContent = `Combo: ${combo}`;
                gameContainer.style.animation = 'shake 0.2s ease-in-out 2';
                player.style.backgroundColor = '#c62828';
                setTimeout(() => {
                    gameContainer.style.animation = '';
                    player.style.backgroundColor = '#007bff';
                }, 200);
                soundManager.playSound('hit');
                obstacle.element.remove();
                return false;
            }
            if (obstacle.x < -obstacle.width) {
                obstacle.element.remove();
                return false;
            }
            return true;
        });

        // Actualizar monedas
        coins = coins.filter(coin => {
            if (checkCollision(player, coin.element)) {
                switch (coin.element.classList[1]) {
                    case 'coin-green':
                        timer += 1;
                        break;
                    case 'coin-blue':
                        timer += 2;
                        if (combo >= 3) gameSpeed = 1.2;
                        break;
                    case 'coin-yellow':
                        timer += 5;
                        if (combo >= 6) {
                            hasDoubleJump = true;
                            gameSpeed = 1.5;
                        }
                        break;
                }
                score += 10;
                scoreDisplay.textContent = score;
                createFloatingText('+10', coin.x, coin.y, coin.style.backgroundColor);
                soundManager.playSound('coin');
                coin.element.remove();
                combo++;
                comboDisplay.textContent = `Combo: ${combo}`;
                return false;
            }
            return true;
        });

        // Actualizar tiempo
        timer -= 0.016; // 1 segundo / 60 frames
        timerDisplay.textContent = timer.toFixed(1);
        if (timer <= 0) {
            endGame();
        }

        requestAnimationFrame(updateGame);
    }

    function startGame() {
        gameRunning = true;
        playerY = 20;
        playerSpeedY = 0;
        score = 0;
        timer = 120;
        combo = 0;
        obstacles = [];
        coins = [];
        hasDoubleJump = false;
        doubleJumpAvailable = false;
        gameSpeed = 1;
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timer.toFixed(1);
        comboDisplay.textContent = `Combo: ${combo}`;
        player.style.backgroundColor = '#007bff';
        gameContainer.innerHTML = '<div id="player"></div><div id="score">0</div><div id="timer">120.0</div><div id="combo">Combo: 0</div>';
        player.style.bottom = `${playerY}px`;
        obstacleInterval = setInterval(spawnObstacle, 2000);
        coinInterval = setInterval(spawnCoin, 3000);
        timerInterval = setInterval(() => {
            if (gameRunning) {
                timer -= 1;
                timerDisplay.textContent = timer.toFixed(1);
                if (timer <= 0) endGame();
            }
        }, 1000);
        updateGame();
        soundManager.playSound('start');
    }

    function endGame() {
        gameRunning = false;
        clearInterval(obstacleInterval);
        clearInterval(coinInterval);
        clearInterval(timerInterval);
        finalScoreText.textContent = `¡Tu puntuación final es: ${score}!`;
        rankingDisplay.style.display = 'block';
        gameContainer.style.display = 'none';
        fetch('/api/ranking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerName, email: playerEmail, score })
        })
        .then(() => loadRanking())
        .catch(error => console.error('Error al guardar la puntuación:', error));
    }

    function loadRanking() {
        fetch('/api/ranking')
            .then(response => response.json())
            .then(data => {
                let rankingHTML = '<h2>Ranking de Jugadores</h2><ol>';
                data.forEach(player => {
                    rankingHTML += `<li>${player.name} - ${player.score}</li>`;
                });
                rankingHTML += '</ol>';
                rankingDiv.innerHTML = rankingHTML;
            })
            .catch(error => console.error('Error al cargar el ranking:', error));
    }

    // Eventos
    document.addEventListener('keydown', event => {
        if (event.code === 'Space' && gameRunning) {
            jump();
        }
    });

    document.addEventListener('touchstart', () => {
        if (gameRunning) {
            jump();
        }
    });

    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        startGame();
    });

    restartButton.addEventListener('click', () => {
        rankingDisplay.style.display = 'none';
        gameContainer.style.display = 'block';
        startGame();
    });

    registerForm.addEventListener('submit', event => {
        event.preventDefault();
        playerName = document.getElementById('playerName').value;
        playerEmail = document.getElementById('playerEmail').value;
        registerScreen.style.display = 'none';
        startScreen.style.display = 'block';
    });

    openTermsBtn.addEventListener('click', () => {
        termsModal.style.display = 'flex';
    });

    acceptTermsBtn.addEventListener('click', () => {
        if (termsCheckbox.checked) {
            termsModal.style.display = 'none';
        } else {
            alert('Debes aceptar los términos y condiciones para continuar.');
        }
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        termsModal.style.display = 'none';
    });

    rankingButton.addEventListener('click', () => {
        rankingModal.style.display = 'flex';
        loadRanking();
    });

    rankingCloseBtn.addEventListener('click', () => {
        rankingModal.style.display = 'none';
    });

    // Inicialización
    if (playerName) {
        registerScreen.style.display = 'none';
        startScreen.style.display = 'block';
    }

    // Detector de orientación para móviles
    function checkOrientation() {
        if (window.innerWidth < window.innerHeight) {
            document.getElementById('orientation-message').style.display = 'flex';
            gameRunning = false;
        } else {
            document.getElementById('orientation-message').style.display = 'none';
            if (playerName) gameRunning = true;
        }
    }

    window.addEventListener('resize', checkOrientation);
    checkOrientation();
});
