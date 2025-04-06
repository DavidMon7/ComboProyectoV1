// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const player = document.getElementById('player');
const container = document.getElementById('gameContainer');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const comboEl = document.getElementById('combo');
const registerScreen = document.getElementById('registerScreen');
const registerForm = document.getElementById('registerForm');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const playerNameInput = document.getElementById('playerName');
const playerEmailInput = document.getElementById('playerEmail');
const rankingDisplayScreen = document.getElementById('rankingDisplay');
const rankingDiv = document.getElementById('ranking');
const finalScoreTextEl = document.getElementById('finalScoreText');
const restartButton = document.getElementById('restartButton');
const registerButton = document.getElementById('registerButton');

// Elementos de Términos y Condiciones
const termsModal = document.getElementById('termsModal');
const openTermsBtn = document.getElementById('openTermsBtn');
const closeBtn = document.querySelector('.close-btn');
const acceptTermsBtn = document.getElementById('acceptTermsBtn');
const termsCheckbox = document.getElementById('termsCheckbox');

// --- CONSTANTES Y VARIABLES GLOBALES ---
const gravity = 0.65;
const initialJumpStrength = 18;
const groundY = 0;
const baseSpeed = 7;
const initialTime = 120;
const RANKING_URL = "https://script.google.com/macros/s/AKfycbzBUuj5qYyp9PnnP83ofKBGwStiqmk8ixX4CcQiPZWAevi1_vB6rqiXtYioXM4GcnHidw/exec"; // URL del Ranking API

// Configuración del juego
const OBSTACLE_MIN_GAP = 120; // Espacio mínimo entre obstáculos (ms)
const MAX_CONSECUTIVE_OBSTACLES = 3; // Máximo número de obstáculos consecutivos
const MIN_COIN_INTERVAL = 1800; // Intervalo mínimo entre monedas (ms)
const OBSTACLE_RATE_DECREASE = 0.97; // Factor de reducción de frecuencia de obstáculos por nivel de combo

let gameRunning = false;
let score = 0;
let combo = 0;
let gameTime = initialTime;
let gameLoopId;
let playerName = "Anónimo"; // Nombre por defecto
let playerEmail = ""; // Variable para almacenar el correo electrónico

let playerY = 0;
let velocityY = 0;
let isJumping = false;
let canDoubleJump = false; // Flag: ¿Tiene el poder de doble salto activo?

let obstacles = [];
let coins = [];
let currentSpeed = baseSpeed;
let speedBoostActive = false;
let boostDuration = 0;

let obstacleInterval;
let coinInterval;
let lastObstacleTime = 0;
let consecutiveObstacles = 0;
let lastCoinTime = 0;

// --- FUNCIONES DE ADAPTACIÓN RESPONSIVA ---

// Función para verificar si la página está en un iframe
function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajustar el contenedor del juego según el entorno y dispositivo
function adjustGameContainer() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Determinar dimensiones óptimas manteniendo ratio 2:1
    let containerWidth, containerHeight;
    
    if (windowWidth / windowHeight >= 2) {
        // Pantalla muy ancha - ajustar altura
        containerHeight = windowHeight * 0.9;
        containerWidth = containerHeight * 2;
    } else {
        // Pantalla no tan ancha - ajustar ancho
        containerWidth = windowWidth * 0.95;
        containerHeight = containerWidth / 2;
    }
    
    // Aplicar límites máximos
    containerWidth = Math.min(containerWidth, 1600);
    containerHeight = Math.min(containerHeight, 800);
    
    // Ajustar las dimensiones del contenedor
    container.style.width = `${containerWidth}px`;
    container.style.height = `${containerHeight}px`;
    
    // Ajustes adicionales para móviles
    if (isMobileDevice()) {
        document.documentElement.style.touchAction = 'none'; // Prevenir desplazamiento táctil
        if (window.innerHeight > window.innerWidth) {
            // En modo retrato
            document.body.classList.add('portrait');
        } else {
            document.body.classList.remove('portrait');
        }
    }
}

// --- FUNCIONES DE GESTIÓN DE PANTALLAS ---

// Funciones para el modal de términos y condiciones
function openTermsModal() {
    termsModal.style.display = "block";
}

function closeTermsModal() {
    termsModal.style.display = "none";
}

function acceptTerms() {
    termsCheckbox.checked = true;
    closeTermsModal();
}

// Event listeners para el modal
openTermsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openTermsModal();
});

closeBtn.addEventListener('click', closeTermsModal);
acceptTermsBtn.addEventListener('click', acceptTerms);

// Cerrar modal si se hace clic fuera del contenido
window.addEventListener('click', function(e) {
    if (e.target === termsModal) {
        closeTermsModal();
    }
});

// Manejo del formulario de registro
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!playerNameInput.value.trim()) {
        alert("Por favor, ingresa tu nombre de jugador");
        return;
    }
    
    if (!playerEmailInput.value.trim()) {
        alert("Por favor, ingresa tu correo electrónico");
        return;
    }
    
    if (!termsCheckbox.checked) {
        alert("Debes aceptar los términos y condiciones para continuar");
        return;
    }
    
    // Guardar los datos del jugador
    playerName = playerNameInput.value.trim();
    if (playerName.length > 15) playerName = playerName.substring(0, 15);
    playerEmail = playerEmailInput.value.trim();
    
    // Pasar a la pantalla de inicio
    registerScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

// Añadir un listener adicional para el botón de registro (por si acaso)
registerButton.addEventListener('click', function(e) {
    e.preventDefault();
    registerForm.dispatchEvent(new Event('submit'));
});

// --- FUNCIÓN DE INICIO DEL JUEGO (MEJORADA) ---
function startGame() {
    if (gameRunning) return;  // Evitar inicio doble
    
    // Para depuración
    console.log("Iniciando juego...");
    
    startScreen.style.display = 'none';
    rankingDisplayScreen.style.display = 'none'; // Ocultar pantalla de ranking

    gameRunning = true;
    score = 0; combo = 0; gameTime = initialTime;
    obstacles = []; coins = [];
    playerY = groundY; velocityY = 0; isJumping = false;
    canDoubleJump = false; // Resetear poder al inicio
    speedBoostActive = false; boostDuration = 0; currentSpeed = baseSpeed;
    lastObstacleTime = 0; consecutiveObstacles = 0; lastCoinTime = 0;

    // Eliminar restos de obstáculos/monedas/texto flotante de partida anterior
    container.querySelectorAll('.obstacle, .coin, .floating-text').forEach(el => el.remove());
    player.style.bottom = playerY + 'px';
    player.classList.remove('powered', 'jumping', 'collected'); // Asegurarse de limpiar clases
    container.classList.remove('hit', 'shake'); // Limpiar clases del contenedor también

    updateUI();
    clearIntervals();
    
    // Programar generación de obstáculos y monedas con tiempos dinámicos
    scheduleNextObstacle();
    scheduleNextCoin();

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(updateGame);
}

// Funciones para programar la generación de elementos del juego
function scheduleNextObstacle() {
    if (!gameRunning) return;
    
    const now = Date.now();
    const timeSinceLastObstacle = now - lastObstacleTime;
    
    // Determinar intervalo basado en combo y consecutivos
    let interval = 1800; // Intervalo base
    
    // Reducir intervalo con el combo (más difícil)
    if (combo >= 3) interval *= Math.pow(OBSTACLE_RATE_DECREASE, Math.min(10, combo - 2));
    
    // Aumentar intervalo después de varios obstáculos consecutivos (dar respiro)
    if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) {
        interval *= 1.5;
        consecutiveObstacles = 0;
    }
    
    // Asegurar tiempo mínimo entre obstáculos
    const actualDelay = Math.max(0, interval - timeSinceLastObstacle);
    
    // Programar próximo obstáculo
    obstacleInterval = setTimeout(() => {
        spawnObstacle();
        consecutiveObstacles++;
        lastObstacleTime = Date.now();
        scheduleNextObstacle();
    }, actualDelay);
}

function scheduleNextCoin() {
    if (!gameRunning) return;
    
    const now = Date.now();
    const timeSinceLastCoin = now - lastCoinTime;
    
    // Intervalos variables para monedas
    let interval = 2500; // Intervalo base
    
    // Ajustar según combo
    if (combo >= 6) interval *= 0.75; // Más monedas en combo alto
    
    // Agregar aleatoriedad
    interval += Math.random() * 1000; // +0-1000ms de variación
    
    // Asegurar tiempo mínimo
    const actualDelay = Math.max(0, interval - timeSinceLastCoin);
    
    // Programar próxima moneda
    coinInterval = setTimeout(() => {
        spawnCoin();
        lastCoinTime = Date.now();
        scheduleNextCoin();
    }, actualDelay);
}

// --- BUCLE PRINCIPAL DEL JUEGO (MEJORADO) ---
function updateGame() {
    if (!gameRunning) return;

    gameTime = Math.max(0, gameTime - (1 / 60));
    updateUI();

    if (gameTime <= 0) {
        gameOver();
        return;
    }

    // Ajustar velocidad según combo (o boost activo)
    if (speedBoostActive) {
        boostDuration -= (1 / 60);
        if (boostDuration <= 0) {
            speedBoostActive = false;
        }
    }

    if (!speedBoostActive) {
        // Velocidad aumenta con combo 3+ y 6+
        currentSpeed = baseSpeed * (combo >= 6 ? 1.5 : (combo >= 3 ? 1.2 : 1));
    } else {
         // Mantener velocidad boost si está activo (prioridad sobre combo)
        currentSpeed = baseSpeed * 1.5;
    }

    // Física de salto
    velocityY -= gravity;
    playerY += velocityY;

    if (playerY <= groundY) {
        playerY = groundY;
        velocityY = 0;
        if (isJumping) {
            isJumping = false;
            // Al aterrizar, ya no está saltando (se quita class en jump() con timeout)
            // player.classList.remove('jumping'); // Removido para que el timeout en jump() controle la clase
            // Nota: no se resetea canDoubleJump aquí (persiste hasta uso o golpe)
        }
    }

    player.style.bottom = playerY + 'px';

    updateObstacles(); // Usa la versión mejorada
    updateCoins();     // Usa la versión mejorada

    gameLoopId = requestAnimationFrame(updateGame);
}

// --- GENERACIÓN DE OBSTÁCULOS (MEJORADA) ---
function spawnObstacle() {
    if (!gameRunning) return;
    
    const MIN_OBSTACLE_GAP = 100; // Espacio mínimo entre obstáculos
    
    const obs = document.createElement('div');
    obs.className = 'obstacle';
    let obsWidth = 62; // Ancho base
    
    // Asegurar que los obstáculos sean visibles
    obs.style.visibility = 'visible';
    obs.style.display = 'block';
    obs.style.opacity = '1';
    
    // Posición inicial fuera de pantalla
    obs.style.left = container.offsetWidth + 'px';
    obs.style.bottom = groundY + 'px';
    
    let makeLarger = false;
    let spawnSecond = false;
    
    // Lógica de dificultad por combo
    if (combo >= 3) {
        if (Math.random() < 0.3) { // 30% de ser más grande
            obs.style.width = '74px';
            obs.style.height = '74px';
            obs.classList.add('large');
            obsWidth = 74;
            makeLarger = true;
        }
        
        // Limitar la generación de segundos obstáculos consecutivos
        if (Math.random() < 0.4 && consecutiveObstacles < MAX_CONSECUTIVE_OBSTACLES) {
            spawnSecond = true;
        }
    }
    
    container.appendChild(obs);
    obstacles.push({
        element: obs,
        width: obsWidth,
        height: parseInt(obs.style.height || '62')
    });
    
    // Generar segundo obstáculo si aplica, asegurando separación
    if (spawnSecond) {
        const secondObstacle = document.createElement('div');
        secondObstacle.className = 'obstacle';
        
        // Asegurar que los obstáculos sean visibles
        secondObstacle.style.visibility = 'visible';
        secondObstacle.style.display = 'block';
        secondObstacle.style.opacity = '1';
        
        // Calcular posición del segundo basado en el primero + gap
        const gap = MIN_OBSTACLE_GAP + Math.random() * 50;
        secondObstacle.style.left = (container.offsetWidth + obsWidth + gap) + 'px';
        secondObstacle.style.bottom = groundY + 'px';
        
        // Opcional: aplicar aleatoriedad de tamaño también al segundo
        let secondWidth = 62;
        if (makeLarger && Math.random() < 0.5) {
            secondObstacle.style.width = '74px';
            secondObstacle.style.height = '74px';
            secondObstacle.classList.add('large');
            secondWidth = 74;
        }
        
        container.appendChild(secondObstacle);
        obstacles.push({
            element: secondObstacle,
            width: secondWidth,
            height: parseInt(secondObstacle.style.height || '62')
        });
    }
}

// --- COLISIONES Y ACTUALIZACIÓN DE OBSTÁCULOS (MEJORADA) ---
function updateObstacles() {
    obstacles = obstacles.filter(obstacle => {
        const obstacleElement = obstacle.element;
        
        // Si el elemento ya no está en el DOM, eliminarlo del array
        if (!obstacleElement || !obstacleElement.isConnected) {
            return false;
        }
        
        // Asegurar que el obstáculo sea visible
        obstacleElement.style.visibility = 'visible';
        obstacleElement.style.display = 'block';
        obstacleElement.style.opacity = '1';
        
        let currentLeft = parseFloat(obstacleElement.style.left || '0');
        let newLeft = currentLeft - currentSpeed;
        obstacleElement.style.left = newLeft + 'px';
        
        // Colisión jugador-obstáculo (con margen negativo para ser más permisivo)
        if (checkCollision(player, obstacleElement, -10)) {
            gameTime = Math.max(0, gameTime - 1);
            combo = 0;
            consecutiveObstacles = 0; // Resetear contador de obstáculos
            updateUI();
            speedBoostActive = false; // Perder boost al chocar
            canDoubleJump = false;   // Pierde el doble salto al chocar
            player.classList.remove('powered'); // Quitar estilo visual del poder
            
            // MEJORA: Efectos de impacto visual (sacudida y destello rojo)
            container.classList.add('hit');
            container.classList.add('shake');
            setTimeout(() => {
                if (container.classList.contains('hit')) container.classList.remove('hit');
                if (container.classList.contains('shake')) container.classList.remove('shake');
            }, 300); // Duración de los efectos CSS
            
            // Texto flotante de penalización
            const rect = obstacleElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            showFloatingText(rect.left - containerRect.left + rect.width/2, rect.top - containerRect.top - 10, '-1s', false);
            
            // Remover obstáculo tras colisión
            obstacleElement.remove();
            return false; // Eliminar del array
        }
        
        // Eliminar obstáculo que sale de la pantalla por la izquierda
        if (newLeft < -obstacle.width) {
            score++; // Sumar punto por obstáculo esquivado
            updateUI();
            obstacleElement.remove();
            return false; // Eliminar del array
        }
        return true; // Mantener en el array si no colisiona ni sale
    });
}

// --- GENERACIÓN DE MONEDAS (MEJORADA) ---
function spawnCoin() {
    if (!gameRunning) return;
    let coinType; let bonus;
    
    // Tipo de moneda depende del combo actual
    if (combo >= 6) { coinType = 'yellow'; bonus = 5; }
    else if (combo >= 3) { coinType = 'blue'; bonus = 2; }
    else { coinType = 'green'; bonus = 1; }
    
    const coin = document.createElement('div');
    coin.className = `coin ${coinType}`;
    coin.textContent = `+${bonus}s`; // Muestra el bonus
    
    // Posición inicial fuera de pantalla - con algo de aleatoridad
    coin.style.left = (container.offsetWidth + Math.random() * 100) + 'px';
    
    // Posición vertical aleatoria, pero no demasiado alta ni baja
    const containerHeight = container.offsetHeight;
    const safeBottom = Math.min(containerHeight * 0.7, containerHeight - 80); // No más del 70% de altura o 80px desde arriba
    const randomBottom = 50 + Math.random() * (safeBottom - 50); // Entre 50px y safeBottom
    coin.style.bottom = randomBottom + 'px';
    
    container.appendChild(coin);
    coins.push({ 
        element: coin, 
        bonus: bonus, 
        type: coinType,
        width: 50, // Ancho estándar para monedas
        height: 50 // Alto estándar para monedas
    });
}

// --- COLISIONES Y ACTUALIZACIÓN DE MONEDAS (MEJORADA) ---
function updateCoins() {
    coins = coins.filter(coinData => {
        const coinElement = coinData.element;
        
        // Si el elemento ya no está en el DOM, eliminarlo del array
        if (!coinElement || !coinElement.isConnected) {
            return false;
        }
        
        let currentLeft = parseFloat(coinElement.style.left || '0');
        let newLeft = currentLeft - currentSpeed; // Mover con la velocidad actual
        coinElement.style.left = newLeft + 'px';
        
        // Colisión jugador-moneda
        if (checkCollision(player, coinElement, 5)) { // Margen positivo para facilitar colisión
            combo++;
            gameTime = Math.min(initialTime + 30, gameTime + coinData.bonus); // Añadir tiempo (con límite)
            score += 5 * combo; // Puntos proporcionales al combo
            updateUI();
            
            // Efectos especiales según tipo de moneda
            if (coinData.type === 'blue' || coinData.type === 'yellow') {
                speedBoostActive = true; // Activar boost de velocidad
                boostDuration = 5;       // Duración del boost
            }
            if (coinData.type === 'yellow') {
                canDoubleJump = true; // Otorgar el PODER de doble salto
                player.classList.add('powered'); // Añadir clase para efecto visual del poder
            }
            
            // MEJORA: Efecto visual: pequeño salto/escala del jugador al tomar moneda
            player.classList.add('collected');
            setTimeout(() => player.classList.remove('collected'), 200); // Quitar clase después de un tiempo
            
            // Mostrar texto flotante con el bonus de tiempo
            const rect = coinElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            showFloatingText(
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `+${coinData.bonus}s`, true // true indica que es un bonus (plus)
            );
            
            coinElement.remove(); // Eliminar la moneda
            return false; // Eliminar del array
        }
        
        // Eliminar moneda que sale de la pantalla por la izquierda
        if (newLeft < -coinData.width) {
            coinElement.remove();
            return false; // Eliminar del array
        }
        return true; // Mantener en el array si no colisiona ni sale
    });
}

// --- FUNCIÓN DE SALTO (MEJORADA - Lógica idéntica, reestructurada) ---
function jump() {
    if (!gameRunning) return;
    
    // Ajustar fuerza de salto dinámicamente según combo
    const currentJumpStrength = initialJumpStrength * (combo >= 3 ? 1.15 : 1); // Ligero boost con combo 3+
    
    // Salto Normal (desde el suelo)
    if (!isJumping) {
        isJumping = true;
        velocityY = currentJumpStrength;
        player.classList.add('jumping'); // Añadir clase para posible estilo CSS de salto
        // Remover clase 'jumping' después de un tiempo corto para que la animación CSS se vea bien si existe
        setTimeout(() => { if(player.classList.contains('jumping')) player.classList.remove('jumping'); }, 200);
    }
    // Doble Salto (si está en el aire y TIENE el poder activo)
    else if (isJumping && canDoubleJump) {
        velocityY = currentJumpStrength * 1.1; // Doble salto un poco más fuerte
        canDoubleJump = false; // ¡Consume el poder!
        player.classList.remove('powered'); // Quitar estilo visual del poder amarillo
        
        // Re-aplicar clase jumping para efecto visual de doble salto si existe
        player.classList.add('jumping');
        setTimeout(() => { if(player.classList.contains('jumping')) player.classList.remove('jumping'); }, 200);
    }
}

// --- TEXTO FLOTANTE (MEJORADA) ---
function showFloatingText(x, y, text, isPlus) {
    const el = document.createElement('div');
    el.className = `floating-text ${isPlus ? 'plus' : 'minus'}`; // Clases para estilo y color
    el.textContent = text;
    
    // Calcular posición con escala responsiva
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scale = Math.min(containerWidth / 1600, containerHeight / 800);
    
    // Ajustar posición para centrar y escalar
    el.style.left = (x - 20 * scale) + 'px';
    el.style.top = y + 'px';
    el.style.fontSize = `${3 * scale}vmin`;
    
    container.appendChild(el); // Añadir al contenedor del juego
    
    // Forzar reflow para reiniciar animación si aparece rápido de nuevo
    el.offsetHeight;
    
    // Eliminar el elemento después de que la animación termine
    setTimeout(() => { if (el && el.parentNode) el.remove(); }, 1150);
}

// --- DETECCIÓN DE COLISIONES (MEJORADA) ---
function checkCollision(el1, el2, margin = 0) {
    try {
        if (!el1 || !el2 || !el1.isConnected || !el2.isConnected) {
            return false;
        }
        
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        
        // Verificar si alguno de los elementos tiene dimensiones inválidas
        if (rect1.width <= 0 || rect1.height <= 0 || rect2.width <= 0 || rect2.height <= 0) {
            return false;
        }
        
        // margin: tolerancia (negativo requiere más solapamiento, positivo permite ligera distancia)
        return (
            rect1.left < rect2.right + margin &&
            rect1.right > rect2.left - margin &&
            rect1.top < rect2.bottom + margin &&
            rect1.bottom > rect2.top - margin
        );
    } catch (e) {
        console.error("Error en detección de colisiones:", e);
        return false; // En caso de error, no detecta colisión
    }
}

// --- LIMPIAR INTERVALOS (MEJORADA) ---
function clearIntervals() {
    clearTimeout(obstacleInterval);
    clearTimeout(coinInterval);
    obstacleInterval = null;
    coinInterval = null;
}

// --- ACTUALIZAR UI (ORIGINAL) ---
function updateUI() {
    scoreEl.textContent = score;
    timerEl.textContent = gameTime.toFixed(1); // Mostrar tiempo con 1 decimal
    comboEl.textContent = 'Combo: ' + combo;
}

// --- FIN DE JUEGO Y RANKING (MEJORADA PARA ORDENAR POR PUNTUACIÓN) ---
async function gameOver() {
    if (!gameRunning) return; // Evitar múltiples llamadas si ya terminó
    
    gameRunning = false;
    clearIntervals(); // Detener generación de obstáculos/monedas
    if (gameLoopId) cancelAnimationFrame(gameLoopId); // Detener bucle de juego
    gameLoopId = null;
    
    // Mostrar Puntuación Final Inmediatamente
    finalScoreTextEl.textContent = `${playerName}, tu puntuación: ${score} | Combo Máx: ${combo}`;
    rankingDiv.innerHTML = "<p>Cargando ranking...</p>"; // Mensaje mientras carga
    rankingDisplayScreen.style.display = 'flex'; // Mostrar pantalla final
    
    // --- Lógica del Ranking ---
    const nombreCodificado = encodeURIComponent(playerName);
    const correoCodificado = encodeURIComponent(playerEmail);
    const puntajeCodificado = encodeURIComponent(score); // Enviar puntuación
    const urlEnviar = `${RANKING_URL}?nombre=${nombreCodificado}&email=${correoCodificado}&puntaje=${puntajeCodificado}`;
    
    try {
        // Enviar puntuación (no necesitamos esperar la respuesta si no la usamos)
        fetch(urlEnviar).catch(err => {
            console.error("Error al enviar puntuación:", err);
        });
        
        // Obtener ranking
        const response = await fetch(RANKING_URL);
        if (!response.ok) throw new Error(`Error al obtener ranking: ${response.statusText}`);
        const data = await response.json();
        
        // MEJORA: Si el juego se reinició rápido mientras cargaba, no actualizar ranking
        if (gameRunning) return;
        
        // Procesar y mostrar ranking ordenado de mayor a menor puntuación
        const top = data
            .map(r => ({
                ...r,
                // Asegurar que puntaje es un número y nombre tiene valor
                puntaje: parseInt(String(r.puntaje).replace(/[^\d]/g, '')) || 0,
                nombre: r.nombre || "Anónimo"
            }))
            .sort((a, b) => b.puntaje - a.puntaje) // Ordenar por puntos (descendente)
            .slice(0, 20); // Tomar solo los primeros 20
        
        let table = '<h2>Ranking Top 20</h2><table><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>';
        top.forEach((r, i) => {
            // Evitar XSS simple escapando caracteres básicos HTML
            const safeName = String(r.nombre)
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .substring(0, 15); // Limitar a 15 caracteres
            
            table += `<tr><td>${i + 1}</td><td>${safeName}</td><td>${r.puntaje}</td></tr>`;
        });
        
        table += '</tbody></table>';
        rankingDiv.innerHTML = table; // Insertar la tabla en el div
        
    } catch (error) {
        console.error("Error con el ranking:", error);
        
        // MEJORA: Solo mostrar error si el juego no se ha reiniciado ya
        if (!gameRunning) {
            rankingDiv.innerHTML = "<p>No se pudo cargar el ranking. Intenta más tarde.</p>";
        }
    }
}

// --- EVENT LISTENERS (MEJORADO Y REORGANIZADO) ---
startButton.addEventListener('click', startGame);

// Usar Enter en input para enviar formulario (uso estándar)
playerNameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !gameRunning && startScreen.style.display !== 'none') {
        startGame();
    }
});

// Control de teclas mejorado para diferentes navegadores y dispositivos
document.addEventListener('keydown', (e) => {
    // Salto con Espacio si el juego está corriendo (compatible con todos los navegadores)
    if ((e.code === 'Space' || e.key === ' ' || e.keyCode === 32) && gameRunning) {
        e.preventDefault(); // Prevenir scroll
        jump();
    }
    // Iniciar juego con Enter si estamos en la pantalla de inicio
    if ((e.key === 'Enter' || e.keyCode === 13) && !gameRunning && startScreen.style.display !== 'none') {
        startGame();
    }
});

// Prevenir el scroll de la página al presionar Espacio
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === ' ' || e.keyCode === 32) && gameRunning) {
        e.preventDefault();
    }
});

// Permitir salto tocando la pantalla en móviles/tablets
container.addEventListener('touchstart', (e) => {
    // Saltar solo si se toca el contenedor o el jugador (evitar saltar al tocar botones/UI)
    if ((e.target === container || e.target === player) && gameRunning) {
        jump();
        e.preventDefault(); // Prevenir acciones por defecto como zoom o scroll
    }
}, { passive: false }); // Necesario para poder usar preventDefault()

// Mejor soporte para gestos táctiles en dispositivos móviles
if (isMobileDevice()) {
    container.addEventListener('touchmove', (e) => {
        if (gameRunning) e.preventDefault(); // Prevenir scroll durante el juego
    }, { passive: false });
    
    // Tap anywhere to jump on mobile
    document.addEventListener('touchstart', (e) => {
        if (gameRunning && !e.target.closest('button, a, input')) {
            jump();
            e.preventDefault();
        }
    }, { passive: false });
}

// MEJORA: Reiniciar juego sin recargar la página usando el nuevo botón
restartButton.addEventListener('click', () => {
    // Solo reiniciar si el juego NO está corriendo actualmente (evita problemas)
    if (!gameRunning) {
        rankingDisplayScreen.style.display = 'none';
        startScreen.style.display = 'flex';
    }
});

// Ajustar tamaño al cargar y al cambiar el tamaño de ventana
window.addEventListener('load', () => {
    adjustGameContainer();
    
    // Verificar si hay soporte para orientación en el dispositivo
    if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', adjustGameContainer);
    } else {
        // Fallback para dispositivos que no soportan orientation API
        window.addEventListener('orientationchange', adjustGameContainer);
    }
});

window.addEventListener('resize', adjustGameContainer);

// Detectar cambios de orientación en dispositivos móviles
window.addEventListener('orientationchange', () => {
    setTimeout(adjustGameContainer, 100); // Pequeño retraso para asegurar que la orientación se actualizó
});

// Inicializar: enfocar el campo de correo electrónico automáticamente 
window.addEventListener('load', function() {
    // Pequeño retraso para asegurar que todos los elementos están cargados
    setTimeout(() => {
        if (playerEmailInput) {
            playerEmailInput.focus();
        }
        
        // Forzar visibilidad de obstáculos (fix para el bug de invisibilidad)
        document.head.insertAdjacentHTML('beforeend', `
            <style>
            .obstacle {
                visibility: visible !important;
                display: block !important;
                opacity: 1 !important;
                background: rgba(255, 0, 255, 0.3) !important;
                border: 4px solid #ff00ff !important;
                box-shadow: 0 0 8px #ff00ff, 0 0 15px #ff00ff inset !important;
            }
            </style>
        `);
    }, 100);
});

// Prevenir errores en navegadores que no soporten ciertas características
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error en el juego:", message);
    // No detener el juego por errores no críticos
    return true;
};

// Inicialización inmediata de ajustes responsivos
adjustGameContainer();
