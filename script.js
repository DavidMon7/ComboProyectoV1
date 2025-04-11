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
    let lastFrameTime = 0;
    let frameCounter = 0;
    let fps = 60;
    let requestId = null;
    let baseSpeed = 5; // Velocidad base para obstáculos
    let maxObstacles = 5; // Limitar número de obstáculos
    let maxCoins = 7; // Limitar número de monedas

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

    // Funciones de utilidad
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Detección de colisiones mejorada con tolerancia para reducir falsos positivos
     */
    function checkCollision(element1, element2, tolerance = 0.8) {
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
        
        setTimeout(() => floatingText.remove(), 1500);
    }

    /**
     * Función de salto mejorada con física más natural
     */
    function jump() {
        if (!isJumping) {
            playerSpeedY = -12;
            isJumping = true;
            player.classList.add('player-jump');
            
            if (soundManager) {
                soundManager.playSound('jump');
            }
        } else if (hasDoubleJump && doubleJumpAvailable) {
            playerSpeedY = -10;
            doubleJumpAvailable = false;
            player.classList.add('player-double-jump');
            
            // Efecto visual para el doble salto
            const jumpEffect = document.createElement('div');
            jumpEffect.className = 'jump-effect';
            jumpEffect.style.left = player.style.left;
            jumpEffect.style.bottom = player.style.bottom;
            gameContainer.appendChild(jumpEffect);
            
            setTimeout(() => jumpEffect.remove(), 300);
            
            if (soundManager) {
                soundManager.playSound('jump');
            }
        }
    }

    /**
     * Genera obstáculos con comportamiento variado
     */
    function spawnObstacle() {
        if (!gameRunning) return;
        
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
        if (!gameRunning) return;
        
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
     */
    function updateGame(timestamp) {
        if (!gameRunning) return;
        
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
        
        // CORRECCIÓN: Aplicar gravedad de forma más suave y consistente
        playerSpeedY += gravity * timeScale;
        playerY += playerSpeedY * timeScale;
        
        // CORRECCIÓN: Límites de la física para evitar que el jugador salga volando
        if (playerY <= 20) {
            playerY = 20;
            playerSpeedY = 0;
            isJumping = false;
            player.classList.remove('player-jump');
            player.classList.remove('player-double-jump');
            doubleJumpAvailable = true;
        }
        
        // CORRECCIÓN: Mantener el jugador dentro de los límites superiores
        const maxHeight = gameContainer.offsetHeight - 40; // Altura del contenedor menos altura del jugador
        if (playerY > maxHeight) {
            playerY = maxHeight;
            playerSpeedY = 0;
        }
        
        player.style.bottom = `${playerY}px`;
        
        // Actualizar obstáculos
        obstacles = obstacles.filter(obstacle => {
            // CORRECCIÓN: Usar velocity y deltaTime para mover obstáculos de forma consistente
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
                
                setTimeout(() => hitEffect.remove(), 300);
                
                obstacle.element.remove();
                return false;
            }
            
            // CORRECCIÓN: Mejorar detección del límite de pantalla para eliminar obstáculos
            if (obstacle.x < -100) {
                obstacle.element.remove();
                return false;
            }
            
            return true;
        });
        
        // CORRECCIÓN: Movimiento de monedas mejorado
        coins = coins.filter(coin => {
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
                            setTimeout(() => powerupEffect.remove(), 500);
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
                
                coin.element.remove();
                return false;
            }
            
            // CORRECCIÓN: Mejorar eliminación de monedas fuera de pantalla
            if (coin.x < -50) {
                coin.element.remove();
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
        lastFrameTime = performance.now();
        frameCounter = 0;
        
        // Actualizar interfaz
        scoreDisplay.textContent = score;
        timerDisplay.textContent = timer.toFixed(1);
        comboDisplay.textContent = `Combo: ${combo}`;
        timerDisplay.style.color = '#ffffff';
        timerDisplay.classList.remove('timer-warning');
        
        // Limpiar elementos previos
        document.querySelectorAll('.obstacle, .coin, .hit-effect, .jump-effect, .powerup-effect').forEach(el => el.remove());
        
        // Resetear jugador
        player.style.backgroundColor = '#007bff';
        player.style.bottom = `${playerY}px`;
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

    // ----- EVENTOS DEL JUEGO -----
    
    // Control de teclado
    document.addEventListener('keydown', event => {
        if (event.code === 'Space' && gameRunning) {
            event.preventDefault(); // Evitar scroll en la página
            jump();
        }
    });

    // Control táctil
    gameContainer.addEventListener('touchstart', event => {
        if (gameRunning) {
            event.preventDefault(); // Prevenir zoom
            jump();
        }
    }, { passive: false });

    // Iniciar juego
    startButton.addEventListener('click', () => {
        console.log("Botón de inicio clickeado");
        startScreen.style.display = 'none';
        startGame();
        
        // Intentar iniciar audio si existe soundManager
        if (soundManager && typeof soundManager.initSoundFromUserInteraction === 'function') {
            soundManager.initSoundFromUserInteraction();
        }
    });

    // Reiniciar juego
    restartButton.addEventListener('click', () => {
        rankingDisplay.style.display = 'none';
        startGame();
    });

    // Registro de jugador
    registerForm.addEventListener('submit', event => {
        event.preventDefault();
        
        // Obtener y validar datos
        const nameInput = document.getElementById('playerName');
        const emailInput = document.getElementById('playerEmail');
        
        playerName = nameInput.value.trim();
        playerEmail = emailInput.value.trim();
        
        // Validaciones básicas
        if (!playerName) {
            alert("Por favor, ingresa tu nombre de jugador");
            nameInput.focus();
            return;
        }
        
        if (!playerEmail) {
            alert("Por favor, ingresa tu correo electrónico");
            emailInput.focus();
            return;
        }
        
        if (!termsCheckbox.checked) {
            alert("Debes aceptar los términos y condiciones para continuar");
            return;
        }
        
        // Limitar longitud del nombre
        playerName = playerName.substring(0, 15);
        
        // Guardar en localStorage para futuras sesiones
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('playerEmail', playerEmail);
        
        console.log("Transición de registro a pantalla de inicio:", playerName, playerEmail);
        
        // Ocultar pantalla de registro
        registerScreen.style.display = 'none';
        
        // Mostrar pantalla de inicio
        startScreen.style.display = 'flex';
        
        // Intentar iniciar audio si existe soundManager
        if (soundManager && typeof soundManager.initSoundFromUserInteraction === 'function') {
            soundManager.initSoundFromUserInteraction();
        }
    });

    // Términos y condiciones
    openTermsBtn.addEventListener('click', event => {
        event.preventDefault();
        termsModal.style.display = 'flex';
        
        if (soundManager) {
            soundManager.playSound('menu');
        }
    });

    acceptTermsBtn.addEventListener('click', () => {
        termsCheckbox.checked = true;
        termsModal.style.display = 'none';
        
        if (soundManager) {
            soundManager.playSound('menu');
        }
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        termsModal.style.display = 'none';
    });

    // Botón de ranking
    rankingButton.addEventListener('click', () => {
        rankingModal.style.display = 'flex';
        loadRanking();
        
        if (soundManager) {
            soundManager.playSound('menu');
        }
    });

    rankingCloseBtn.addEventListener('click', () => {
        rankingModal.style.display = 'none';
    });

    // Botón adicional para cerrar ranking
    const closeRankingBtn = document.getElementById('closeRankingBtn');
    if (closeRankingBtn) {
        closeRankingBtn.addEventListener('click', () => {
            rankingModal.style.display = 'none';
            
            if (soundManager) {
                soundManager.playSound('menu');
            }
        });
    }

    // ----- INICIALIZACIÓN -----
    
    // Cargar datos guardados de sesiones anteriores
    const savedName = localStorage.getItem('playerName');
    const savedEmail = localStorage.getItem('playerEmail');
    
    if (savedName && savedEmail) {
        // Prellenar formulario
        const nameInput = document.getElementById('playerName');
        const emailInput = document.getElementById('playerEmail');
        
        if (nameInput) nameInput.value = savedName;
        if (emailInput) emailInput.value = savedEmail;
        
        // Opcionalmente, puedes iniciar sesión automáticamente
        // playerName = savedName;
        // playerEmail = savedEmail;
        // registerScreen.style.display = 'none';
        // startScreen.style.display = 'flex';
    }
    
    // Sistema de detección de dispositivo
    window.addEventListener('load', () => {
        // Si ya existe un gestor de dispositivos, usar sus métodos
        if (window.deviceManager) {
            window.deviceManager.checkOrientation();
            window.deviceManager.adjustGameContainer();
        } else {
            // Verificar orientación manualmente si no hay gestor
            checkOrientation();
        }
    });
    
    // Función simple de verificar orientación como fallback
    function checkOrientation() {
        const orientationMessage = document.getElementById('orientation-message');
        
        if (window.innerWidth < window.innerHeight) {
            if (orientationMessage) {
                orientationMessage.style.display = 'flex';
            }
            gameRunning = false;
        } else {
            if (orientationMessage) {
                orientationMessage.style.display = 'none';
            }
            if (playerName && document.visibilityState === 'visible') {
                gameRunning = true;
            }
        }
    }
    
    // Manejar cambios de visibilidad de la página
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pausar juego si está en segundo plano
            if (gameRunning) {
                gameRunning = false;
                
                // Pausar música
                if (soundManager) {
                    soundManager.pauseSound('background');
                }
            }
        } else {
            // Mostrar diálogo de "Juego en pausa" cuando regresa
            if (playerName && !gameRunning && startScreen.style.display === 'none' && rankingDisplay.style.display === 'none') {
                // Crear overlay de pausa si no existe
                let pauseOverlay = document.getElementById('pauseOverlay');
                
                if (!pauseOverlay) {
                    pauseOverlay = document.createElement('div');
                    pauseOverlay.id = 'pauseOverlay';
                    pauseOverlay.className = 'pause-overlay';
                    pauseOverlay.innerHTML = `
                        <div class="pause-content">
                            <h2>Juego en Pausa</h2>
                            <p>¡Toca para Continuar!</p>
                        </div>
                    `;
                    document.body.appendChild(pauseOverlay);
                    
                    // Evento para reanudar
                    pauseOverlay.addEventListener('click', () => {
                        gameRunning = true;
                        pauseOverlay.style.display = 'none';
                        
                        // Reanudar música
                        if (soundManager) {
                            soundManager.playSound('background');
                        }
                        
                        // Reiniciar bucle del juego
                        lastFrameTime = performance.now();
                        requestId = requestAnimationFrame(updateGame);
                    });
                }
                
                pauseOverlay.style.display = 'flex';
            }
        }
    });
    
    // Verificar cambios de tamaño de ventana
    window.addEventListener('resize', () => {
        if (window.deviceManager) {
            window.deviceManager.handleResize();
        } else {
            checkOrientation();
        }
    });
    
    // Prevenir zoom en móviles al doble tap
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Inicialización adicional para móviles
    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        document.body.classList.add('touch-device');
        
        // Asegurarse que las instrucciones móviles estén visibles
        const mobileInstructions = document.querySelectorAll('.mobile-instructions');
        mobileInstructions.forEach(el => {
            el.style.display = 'block';
        });
    }
    
    // Exponer funciones para módulos externos
    window.spawnObstacle = spawnObstacle;
    window.spawnCoin = spawnCoin;
    window.jump = jump;
    
    // Exponer variables para acceso desde módulos externos
    window.baseSpeed = baseSpeed;
    window.maxObstacles = maxObstacles;
    window.maxCoins = maxCoins;
    window.gravity = gravity;
});
