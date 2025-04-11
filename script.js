/**
 * Cuadrado Saltarín Combo - Código principal optimizado
 * Optimizado para múltiples dispositivos y navegadores.
 * Mejorado para un rendimiento óptimo y corrección de errores.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script principal cargado");
    
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
    const mobileInstructions = document.querySelector('.mobile-instructions');
    const muteButton = document.getElementById('muteButton');

    // Variables del juego
    let playerY = 20; // Posición inicial en el suelo
    let playerSpeedY = 0; // Velocidad inicial en Y (0 = sin movimiento)
    let gravity = 0.5;
    let isJumping = false;
    let jumpCount = 0; // Contador de saltos para arreglar el problema de saltos múltiples
    let score = 0;
    let timer = 120;
    let combo = 0;
    let obstacles = [];
    let coins = [];
    let gameRunning = false;
    let gamePaused = false;
    let obstacleInterval;
    let coinInterval;
    let timerInterval;
    let playerName = '';
    let playerEmail = '';
    let hasDoubleJump = false;
    let doubleJumpAvailable = false;
    let gameSpeed = 1;
    let lastFrameTime = 0;
    let frameCounter = 0;
    let fps = 60;
    let requestId = null;
    let baseSpeed = 5; // Velocidad base para obstáculos
    let maxObstacles = 5; // Limitar número de obstáculos
    let maxCoins = 7; // Limitar número de monedas
    let isOnGround = true; // Nueva variable para controlar si el jugador está en el suelo

    // Mostrar instrucciones específicas para móviles si es necesario
    if (window.deviceManager && (window.deviceManager.isMobile || window.deviceManager.isTablet)) {
        if (mobileInstructions) {
            mobileInstructions.style.display = 'block';
        }
    }

    // Referencias a gestores externos
    const soundManager = window.soundManager || null;

    // Asegurar que el botón de sonido tenga su evento
    if (muteButton && soundManager) {
        muteButton.addEventListener('click', () => {
            soundManager.toggleMute();
        });
    }

    // CORRECCIÓN: Inicializar la posición del jugador explícitamente
    if (player) {
        player.style.position = 'absolute'; // Asegurar que la posición sea absoluta
        player.style.left = '50px';
        player.style.bottom = '20px';
        // CORRECCIÓN: Establecer explícitamente top como auto para prevenir conflictos
        player.style.top = 'auto';
    }

    // Funciones de utilidad
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Detección de colisiones mejorada con tolerancia para reducir falsos positivos
     */
    function checkCollision(element1, element2, tolerance = 0.8) {
        if (!element1 || !element2) return false;
        
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        // Ajustar rectángulos con tolerancia (hace la colisión menos estricta)
        const adjustedRect1 = {
            left: rect1.left + rect1.width * (1 - tolerance) / 2,
            right: rect1.right - rect1.width * (1 - tolerance) / 2,
            top: rect1.top + rect1.height * (1 - tolerance) / 2,
            bottom: rect1.bottom - rect1.height * (1 - tolerance) / 2
        };

        const adjustedRect2 = {
            left: rect2.left + rect2.width * (1 - tolerance) / 2,
            right: rect2.right - rect2.width * (1 - tolerance) / 2,
            top: rect2.top + rect2.height * (1 - tolerance) / 2,
            bottom: rect2.bottom - rect2.height * (1 - tolerance) / 2
        };

        return !(
            adjustedRect1.right < adjustedRect2.left || 
            adjustedRect1.left > adjustedRect2.right || 
            adjustedRect1.bottom < adjustedRect2.top || 
            adjustedRect1.top > adjustedRect2.bottom
        );
    }

    /**
     * Crea texto flotante con animación mejorada
     */
    function createFloatingText(text, x, y, color = '#fff') {
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.style.position = 'absolute';
        floatingText.style.left = `${x}px`;
        floatingText.style.top = `${y}px`;
        floatingText.style.color = color;
        floatingText.style.fontSize = '1.2em';
        floatingText.style.fontWeight = 'bold';
        floatingText.style.textShadow = '0 0 5px rgba(0,0,0,0.7)';
        floatingText.style.pointerEvents = 'none';
        floatingText.style.zIndex = '100';
        floatingText.style.transition = 'all 1.5s ease-out';
        floatingText.style.opacity = '1';
        
        gameContainer.appendChild(floatingText);
        
        // Animación con requestAnimationFrame para mejor rendimiento
        requestAnimationFrame(() => {
            floatingText.style.transform = 'translateY(-50px) scale(1.2)';
            floatingText.style.opacity = '0';
        });
        
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.remove();
            }
        }, 1500);
    }

    /**
     * Función de salto mejorada con física más natural
     * CORREGIDA para solucionar problemas de salto múltiple
     */
    function jump() {
        if (gameRunning && !gamePaused) {
            // CORRECCIÓN: Permitir salto solo si está en el suelo o tiene doble salto disponible
            if (isOnGround) {
                playerSpeedY = -12;
                isJumping = true;
                isOnGround = false;
                jumpCount = 1; // Primer salto realizado
                player.classList.add('player-jump');
                
                if (soundManager) {
                    soundManager.playSound('jump');
                }
            } 
            // CORRECCIÓN: Permitir doble salto solo si está habilitado y es el segundo salto
            else if (hasDoubleJump && jumpCount === 1) {
                playerSpeedY = -10;
                jumpCount = 2; // Segundo salto realizado
                player.classList.add('player-double-jump');
                
                // Efecto visual para el doble salto
                const jumpEffect = document.createElement('div');
                jumpEffect.className = 'jump-effect';
                jumpEffect.style.left = player.style.left;
                jumpEffect.style.bottom = player.style.bottom;
                gameContainer.appendChild(jumpEffect);
                
                setTimeout(() => {
                    if (jumpEffect.parentNode) {
                        jumpEffect.remove();
                    }
                }, 300);
                
                if (soundManager) {
                    soundManager.playSound('jump');
                }
            }
        }
    }

    /**
     * Genera obstáculos con comportamiento variado
     */
    function spawnObstacle() {
        if (!gameRunning || gamePaused) return;
        
        // Limitar número de obstáculos para mejor rendimiento
        if (document.querySelectorAll('.obstacle').length >= maxObstacles) {
            return;
        }
        
        const obstacle = document.createElement('div');
        
        // Variabilidad en tipos de obstáculos
        const obstacleType = Math.floor(Math.random() * 3);
        let className = 'obstacle obstacle-animation';
        
        switch (obstacleType) {
            case 0: // Obstáculo estándar
                className += ' obstacle-standard';
                break;
            case 1: // Obstáculo alto y delgado
                className += ' obstacle-tall';
                break;
            case 2: // Obstáculo bajo y ancho
                className += ' obstacle-wide';
                break;
        }
        
        obstacle.className = className;
        
        // Dimensiones y posición
        const height = getRandom(20, 100);
        const width = getRandom(20, 50);
        obstacle.style.height = `${height}px`;
        obstacle.style.width = `${width}px`;
        obstacle.style.left = `${gameContainer.offsetWidth}px`;
        
        gameContainer.appendChild(obstacle);
        obstacles.push({ 
            element: obstacle, 
            x: gameContainer.offsetWidth, 
            width: parseInt(obstacle.style.width),
            height: parseInt(obstacle.style.height),
            speed: baseSpeed * (0.8 + Math.random() * 0.4) * gameSpeed // Velocidad ligeramente variable
        });
        
        // Ajustar intervalo de obstáculos según velocidad del juego
        clearInterval(obstacleInterval);
        const newInterval = 2000 / gameSpeed;
        obstacleInterval = setInterval(spawnObstacle, newInterval);
    }

    /**
     * Genera monedas con diferentes patrones de movimiento
     */
    function spawnCoin() {
        if (!gameRunning || gamePaused) return;
        
        // Limitar número de monedas para mejor rendimiento
        if (document.querySelectorAll('.coin').length >= maxCoins) {
            return;
        }
        
        const coinType = Math.random();
        let coinClass;
        
        if (coinType < 0.5) {
            coinClass = 'coin-green';
        } else if (coinType < 0.8) {
            coinClass = 'coin-blue';
        } else {
            coinClass = 'coin-yellow';
        }
        
        const coin = document.createElement('div');
        coin.className = `coin ${coinClass} coin-animation`;
        
        // Posicionar la moneda
        const x = gameContainer.offsetWidth + getRandom(0, 300);
        const y = getRandom(50, gameContainer.offsetHeight - 100);
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        
        gameContainer.appendChild(coin);
        
        // Determinar si la moneda tiene movimiento
        const movementPattern = Math.floor(Math.random() * 4);
        let movementY = 0;
        let amplitude = 0;
        let frequency = 0;
        
        // Patrones de movimiento variados
        if (movementPattern >= 1) {
            amplitude = getRandom(20, 50);
            frequency = getRandom(0.01, 0.03);
            movementY = y; // Posición inicial Y
        }
        
        coins.push({ 
            element: coin, 
            x: x, 
            y: y,
            baseY: movementY,
            amplitude: amplitude,
            frequency: frequency,
            phase: 0,
            movementPattern: movementPattern,
            speed: baseSpeed * gameSpeed
        });
    }

    /**
     * Actualización del juego optimizada con delta time para consistencia
     * CORREGIDA para mantener al jugador en el suelo inicialmente
     */
    function updateGame(timestamp) {
        if (!gameRunning || gamePaused) return;
        
        // Cálculo de delta time para animaciones consistentes
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        
        // Limitar delta time para evitar saltos grandes después de tab inactivo
        const cappedDelta = Math.min(deltaTime, 50);
        const timeScale = cappedDelta / (1000 / 60); // Normalizar a 60 FPS
        
        // Calcular FPS actual para optimización
        frameCounter++;
        if (timestamp - lastFrameTime > 1000) {
            fps = Math.round(frameCounter / ((timestamp - lastFrameTime) / 1000));
            frameCounter = 0;
        }
        
        // CORRECCIÓN: Aplicar gravedad solo si está saltando o no está en el suelo
        if (isJumping || playerY > 20) {
            // Aplicar gravedad de forma más suave y consistente
            playerSpeedY += gravity * timeScale;
            playerY += playerSpeedY * timeScale;
        }
        
        // CORRECCIÓN: Límites de la física para evitar que el jugador salga volando
        // y reiniciar estado de salto cuando toque el suelo
        if (playerY <= 20) {
            playerY = 20; // Mantener en el suelo
            playerSpeedY = 0; // Detener movimiento vertical
            isJumping = false; // Ya no está saltando
            isOnGround = true; // Está en el suelo
            jumpCount = 0; // Reiniciar contador de saltos
            player.classList.remove('player-jump');
            player.classList.remove('player-double-jump');
        }
        
        // CORRECCIÓN: Mantener el jugador dentro de los límites superiores
        const maxHeight = gameContainer.offsetHeight - 40; // Altura del contenedor menos altura del jugador
        if (playerY > maxHeight) {
            playerY = maxHeight;
            playerSpeedY = 0;
        }
        
        // CORRECCIÓN: Aplicar posición del jugador
        player.style.bottom = `${playerY}px`;
        
        // Actualizar obstáculos
        obstacles = obstacles.filter(obstacle => {
            if (!obstacle.element || !obstacle.element.parentNode) return false;
            
            // Usar velocity y deltaTime para mover obstáculos de forma consistente
            obstacle.x -= obstacle.speed * timeScale;
            obstacle.element.style.left = `${obstacle.x}px`;
            
            // Comprobar colisión con tolerancia mejorada
            if (checkCollision(player, obstacle.element, 0.85)) {
                timer -= 1;
                // Resetear combo
                if (combo > 0) {
                    combo = 0;
                    comboDisplay.textContent = `Combo: ${combo}`;
                    // Reducir velocidad si no hay combo
                    if (gameSpeed > 1) {
                        gameSpeed = Math.max(1, gameSpeed - 0.2);
                    }
                }
                
                // Efectos visuales de colisión
                gameContainer.style.animation = 'shake 0.2s ease-in-out 2';
                player.style.backgroundColor = '#c62828';
                setTimeout(() => {
                    gameContainer.style.animation = '';
                    player.style.backgroundColor = '#007bff';
                }, 200);
                
                if (soundManager) {
                    soundManager.playSound('hit');
                }
                
                // Crear efecto visual
                const hitEffect = document.createElement('div');
                hitEffect.className = 'hit-effect';
                hitEffect.style.left = obstacle.element.style.left;
                hitEffect.style.top = obstacle.element.style.top;
                gameContainer.appendChild(hitEffect);
                
                setTimeout(() => {
                    if (hitEffect.parentNode) {
                        hitEffect.remove();
                    }
                }, 300);
                
                if (obstacle.element.parentNode) {
                    obstacle.element.remove();
                }
                return false;
            }
            
            // Mejorar detección del límite de pantalla para eliminar obstáculos
            if (obstacle.x < -100) {
                if (obstacle.element.parentNode) {
                    obstacle.element.remove();
                }
                return false;
            }
            
            return true;
        });
        
        // Movimiento de monedas mejorado
        coins = coins.filter(coin => {
            if (!coin.element || !coin.element.parentNode) return false;
            
            // Mover moneda con velocidad consistente
            coin.x -= coin.speed * timeScale;
            
            // Aplicar patrones de movimiento si existen
            if (coin.movementPattern >= 1) {
                coin.phase += coin.frequency * timeScale;
                // Movimiento senoidal
                const offsetY = Math.sin(coin.phase) * coin.amplitude;
                coin.y = coin.baseY + offsetY;
            }
            
            coin.element.style.left = `${coin.x}px`;
            coin.element.style.top = `${coin.y}px`;
            
            // Comprobar colisión con moneda
            if (checkCollision(player, coin.element, 0.9)) {
                // Efectos según tipo de moneda
                const coinClass = coin.element.classList[1];
                let bonusTime = 0;
                let bonusPoints = 10;
                let effectColor = '';
                
                switch (coinClass) {
                    case 'coin-green':
                        bonusTime = 1;
                        effectColor = '#4CAF50';
                        break;
                    case 'coin-blue':
                        bonusTime = 2;
                        bonusPoints = 15;
                        effectColor = '#2196F3';
                        // Aumentar velocidad a partir de combo 3
                        if (combo >= 3 && gameSpeed < 1.2) {
                            gameSpeed = 1.2;
                        }
                        break;
                    case 'coin-yellow':
                        bonusTime = 5;
                        bonusPoints = 25;
                        effectColor = '#FFC107';
                        // Habilitar doble salto persistente a partir de combo 6
                        if (combo >= 6) {
                            hasDoubleJump = true;
                            gameSpeed = 1.5;
                            // Efecto visual para doble salto
                            const powerupEffect = document.createElement('div');
                            powerupEffect.className = 'powerup-effect';
                            powerupEffect.style.left = coin.x + 'px';
                            powerupEffect.style.top = coin.y + 'px';
                            gameContainer.appendChild(powerupEffect);
                            setTimeout(() => {
                                if (powerupEffect.parentNode) {
                                    powerupEffect.remove();
                                }
                            }, 500);
                        }
                        break;
                }
                
                // Actualizar tiempo y puntuación
                timer += bonusTime;
                score += bonusPoints;
                scoreDisplay.textContent = score;
                
                // Efecto visual del bonus
                createFloatingText(`+${bonusPoints}`, coin.x, coin.y, effectColor);
                if (bonusTime > 0) {
                    createFloatingText(`+${bonusTime}s`, coin.x, coin.y - 30, '#ffffff');
                }
                
                // Reproducir sonido
                if (soundManager) {
                    soundManager.playSound('coin');
                }
                
                // Incrementar combo
                combo++;
                comboDisplay.textContent = `Combo: ${combo}`;
                
                // Efecto visual para combo especial
                if (combo === 3 || combo === 6 || combo === 10) {
                    // Reproducir sonido especial para combo
                    if (soundManager) {
                        soundManager.playSound('combo');
                    }
                    
                    // Animación especial
                    comboDisplay.classList.add('combo-highlight');
                    setTimeout(() => comboDisplay.classList.remove('combo-highlight'), 1000);
                }
                
                if (coin.element.parentNode) {
                    coin.element.remove();
                }
                return false;
            }
            
            // Mejorar eliminación de monedas fuera de pantalla
            if (coin.x < -50) {
                if (coin.element.parentNode) {
                    coin.element.remove();
                }
                return false;
            }
            
            return true;
        });
        
        // Actualizar tiempo con delta para consistencia
        timer -= 0.016 * timeScale; // Ajustar con delta time
        timerDisplay.textContent = timer.toFixed(1);
        
        // Cambiar color del timer según el tiempo restante
        if (timer <= 10) {
            timerDisplay.style.color = '#FF5252';
            timerDisplay.classList.add('timer-warning');
        } else if (timer <= 30) {
            timerDisplay.style.color = '#FFC107';
            timerDisplay.classList.remove('timer-warning');
        } else {
            timerDisplay.style.color = '#ffffff';
            timerDisplay.classList.remove('timer-warning');
        }
        
        if (timer <= 0) {
            endGame();
            return;
        }
        
        // CORRECCIÓN: Asegurar que el bucle de animación continúe
        requestId = requestAnimationFrame(updateGame);
    }

    /**
     * Iniciar el juego con configuraciones y reinicios apropiados
     */
    function startGame() {
        console.log("Iniciando juego:", {playerName, playerEmail});
        
        // Reiniciar variables del juego
        gameRunning = true;
        gamePaused = false;
        playerY = 20; // CORRECCIÓN: Siempre iniciar en el suelo
        playerSpeedY = 0;
        isJumping = false;
        isOnGround = true; // CORRECCIÓN: Iniciar en el suelo
        jumpCount = 0; // CORRECCIÓN: Iniciar con contador de saltos en 0
        score = 0;
        timer = 120;
        combo = 0;
        obstacles = [];
        coins = [];
        hasDoubleJump = false;
        doubleJumpAvailable = false;
        gameSpeed = 1;
        lastFrameTime = performance.now();
        frameCounter = 0;
        
        // Actualizar interfaz
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timer.toFixed(1);
        comboDisplay.textContent = `Combo: ${combo}`;
        timerDisplay.style.color = '#ffffff';
        timerDisplay.classList.remove('timer-warning');
        
        // Limpiar elementos previos
        document.querySelectorAll('.obstacle, .coin, .hit-effect, .jump-effect, .powerup-effect').forEach(el => {
            if (el.parentNode) {
                el.remove();
            }
        });
        
        // Resetear jugador
        player.style.backgroundColor = '#007bff';
        player.style.bottom = `${playerY}px`;
        player.style.left = '50px';
        player.style.top = 'auto'; // CORRECCIÓN: Evitar que top sobrescriba bottom
        player.style.display = 'block';
        player.classList.remove('player-jump', 'player-double-jump');
        
        // Configurar intervalos
        clearInterval(obstacleInterval);
        clearInterval(coinInterval);
        clearInterval(timerInterval);
        
        obstacleInterval = setInterval(spawnObstacle, 2000);
        coinInterval = setInterval(spawnCoin, 3000);
        
        // Cancelar cualquier animación previa
        if (requestId) {
            cancelAnimationFrame(requestId);
        }
        
        // Iniciar bucle del juego
        requestId = requestAnimationFrame(updateGame);
        
        // Reproducir sonido de inicio
        if (soundManager) {
            soundManager.playSound('start');
            // Iniciar música de fondo
            setTimeout(() => soundManager.playSound('background'), 500);
        }
    }

    /**
     * Finalizar el juego y guardar puntuación
     */
    function endGame() {
        gameRunning = false;
        gamePaused = false;
        
        // Detener animaciones e intervalos
        if (requestId) {
            cancelAnimationFrame(requestId);
            requestId = null;
        }
        
        clearInterval(obstacleInterval);
        clearInterval(coinInterval);
        clearInterval(timerInterval);
        
        // Actualizar interfaz
        finalScoreText.textContent = `¡Tu puntuación final es: ${score}!`;
        rankingDisplay.style.display = 'block';
        
        // Pausar música y reproducir sonido de fin
        if (soundManager) {
            soundManager.pauseSound('background');
            soundManager.playSound('gameOver');
        }
        
        // Guardar puntuación en el servidor
        if (playerName && playerEmail) {
            saveScore(playerName, playerEmail, score);
        } else {
            loadRanking();
        }
    }
    
    /**
     * Pausa el juego
     */
    function pauseGame() {
        if (!gameRunning || gamePaused) return;
        
        gamePaused = true;
        
        // Pausar música
        if (soundManager) {
            soundManager.pauseSound('background');
        }
        
        // Mostrar overlay de pausa
        showPauseOverlay();
    }
    
    /**
     * Reanuda el juego
     */
    function resumeGame() {
        if (!gamePaused) return;
        
        gamePaused = false;
        gameRunning = true;
        
        // Ocultar overlay de pausa
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.style.display = 'none';
        }
        
        // Reanudar música
        if (soundManager) {
            soundManager.playSound('background');
        }
        
        // Reiniciar bucle del juego
        lastFrameTime = performance.now();
        requestId = requestAnimationFrame(updateGame);
    }
    
    /**
     * CORRECCIÓN: Mostrar el overlay de pausa con botones para continuar o salir
     */
    function showPauseOverlay() {
        // Crear o actualizar overlay de pausa
        let pauseOverlay = document.getElementById('pauseOverlay');
        
        if (!pauseOverlay) {
            pauseOverlay = document.createElement('div');
            pauseOverlay.id = 'pauseOverlay';
            pauseOverlay.className = 'pause-overlay';
            pauseOverlay.innerHTML = `
                <div class="pause-content">
                    <h2>Juego en Pausa</h2>
                    <p>¿Qué deseas hacer?</p>
                    <div class="pause-buttons">
                        <button id="resumeButton" class="pause-button">Continuar</button>
                        <button id="exitPauseButton" class="pause-button secondary">Salir</button>
                    </div>
                </div>
            `;
            document.body.appendChild(pauseOverlay);
        } else {
            // Si ya existe, pero tiene formato antiguo, actualizarlo
            if (!pauseOverlay.querySelector('#resumeButton')) {
                pauseOverlay.innerHTML = `
                    <div class="pause-content">
                        <h2>Juego en Pausa</h2>
                        <p>¿Qué deseas hacer?</p>
                        <div class="pause-buttons">
                            <button id="resumeButton" class="pause-button">Continuar</button>
                            <button id="exitPauseButton" class="pause-button secondary">Salir</button>
                        </div>
                    </div>
                `;
            }
        }
        
        pauseOverlay.style.display = 'flex';
        
        // Asegurarse de que los botones tengan sus event listeners
        const resumeButton = document.getElementById('resumeButton');
        if (resumeButton) {
            // Eliminar listeners anteriores para evitar duplicados
            const newResumeButton = resumeButton.cloneNode(true);
            resumeButton.parentNode.replaceChild(newResumeButton, resumeButton);
            
            newResumeButton.addEventListener('click', () => {
                resumeGame();
            });
        }
        
        // Botón para salir al menú principal
        const exitPauseButton = document.getElementById('exitPauseButton');
        if (exitPauseButton) {
            // Eliminar listeners anteriores para evitar duplicados
            const newExitButton = exitPauseButton.cloneNode(true);
            exitPauseButton.parentNode.replaceChild(newExitButton, exitPauseButton);
            
            newExitButton.addEventListener('click', () => {
                // Ocultar pausa y mostrar pantalla de inicio
                pauseOverlay.style.display = 'none';
                gamePaused = false;
                gameRunning = false;
                startScreen.style.display = 'flex';
                
                // Detener música
                if (soundManager) {
                    soundManager.pauseSound('background');
                }
            });
        }
        
        // CORRECCIÓN: Añadir estilos para el overlay si no existen
        if (!document.getElementById('pause-overlay-styles')) {
            const styles = document.createElement('style');
            styles.id = 'pause-overlay-styles';
            styles.textContent = `
                .pause-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .pause-button {
                    background: linear-gradient(to bottom, #000000, #111111);
                    color: #00ffff;
                    border: 3px solid #00ffff;
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
                    border-radius: 8px;
                    cursor: pointer;
                    padding: 10px 20px;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 14px;
                    min-width: 120px;
                    touch-action: manipulation;
                }
                
                .pause-button.secondary {
                    color: #ff00ff;
                    border-color: #ff00ff;
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
                }
                
                .pause-button:hover {
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(styles);
        }
    }
