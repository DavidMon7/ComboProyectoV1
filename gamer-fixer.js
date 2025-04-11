/**
 * Script de inicialización y corrección de problemas
 * Este script debe incluirse después de todos los demás scripts para corregir problemas y mejorar rendimiento
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Iniciando correcciones y optimizaciones...");
    
    // Objeto para almacenar las correcciones
    const GameFixer = {
        // 1. Corregir problemas de físicas
        fixPhysics: function() {
            console.log("Aplicando correcciones de física del juego...");
            
            // Verificar si la función jump existe y reemplazarla con la versión corregida
            if (typeof window.jump === 'function') {
                // La función corregida está en el artifact 'physics-fix'
                // Se puede aplicar desde el DOM cuando se cargue ese script
                window.originalJump = window.jump; // Backup por si acaso
            }
            
            // Corregir variables globales
            window.gravity = 0.5;             // Gravedad normal
            window.baseSpeed = 5;            // Velocidad base obstáculos
            window.jumpVelocity = -12;       // Velocidad de salto
            window.doubleJumpVelocity = -10; // Velocidad segundo salto
            
            // Limitar número máximo de objetos en pantalla
            window.maxObstacles = 5;  // Máximo de obstáculos simultáneos
            window.maxCoins = 7;      // Máximo de monedas simultáneas
            
            // Aplicar límites a las colecciones existentes
            this.limitGameObjects();
            
            return true;
        },
        
        // 2. Corregir sistema de ranking
        fixRanking: function() {
            console.log("Aplicando correcciones al sistema de ranking...");
            
            // Verificar si se han cargado los nuevos métodos de ranking
            // Si no, se usarán los del artifact 'ranking-fix'
            
            // Forzar recarga del ranking si está visible
            const rankingDisplay = document.getElementById('rankingDisplay');
            const rankingModal = document.getElementById('rankingModal');
            
            if ((rankingDisplay && rankingDisplay.style.display !== 'none') || 
                (rankingModal && rankingModal.style.display !== 'none')) {
                // Si alguna vista de ranking está visible, recargarla
                if (typeof window.loadRanking === 'function') {
                    window.loadRanking();
                }
            }
            
            return true;
        },
        
        // 3. Corregir sistema de sonido
        fixSound: function() {
            console.log("Aplicando correcciones al sistema de sonido...");
            
            // Verificar si existe soundManager
            if (window.soundManager) {
                // Forzar inicialización del audio
                if (typeof window.soundManager.forceAudioStart === 'function') {
                    window.soundManager.forceAudioStart();
                } else {
                    // Implementar método de emergencia
                    this.emergencyInitSound();
                }
                
                // Añadir event listeners para asegurar que el audio funciona
                this.setupSoundTriggers();
            } else {
                console.warn("SoundManager no disponible, creando versión simplificada...");
                this.createFallbackSoundManager();
            }
            
            return true;
        },
        
        // 4. Limitar objetos del juego para mejor rendimiento
        limitGameObjects: function() {
            // Limitar número de obstáculos visibles
            const obstacles = document.querySelectorAll('.obstacle');
            const coins = document.querySelectorAll('.coin');
            
            if (obstacles.length > window.maxObstacles) {
                console.log(`Limitando obstáculos: ${obstacles.length} -> ${window.maxObstacles}`);
                // Eliminar obstáculos más antiguos (primeros del DOM)
                for (let i = 0; i < obstacles.length - window.maxObstacles; i++) {
                    obstacles[i].remove();
                }
            }
            
            if (coins.length > window.maxCoins) {
                console.log(`Limitando monedas: ${coins.length} -> ${window.maxCoins}`);
                // Eliminar monedas más antiguas
                for (let i = 0; i < coins.length - window.maxCoins; i++) {
                    coins[i].remove();
                }
            }
        },
        
        // 5. Inicializar sonido en caso de emergencia
        emergencyInitSound: function() {
            // Crear contexto de audio Web
            if (window.AudioContext || window.webkitAudioContext) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                    // Intentar reanudar en respuesta a interacción del usuario
                    document.addEventListener('click', function resumeAudio() {
                        audioContext.resume();
                        document.removeEventListener('click', resumeAudio);
                    });
                }
            }
            
            // Intentar reproducir sonido silencioso para desbloquear audio en iOS
            function unlockAudio() {
                const silentSound = new Audio();
                silentSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAESAAzMzMzMzMzMzMzMzMzMzMzWVlZWVlZWVlZWVlZWVlZWXl5eXl5eXl5eXl5eXl5eXmZmZmZmZmZmZmZmZmZmZmZubn///////////+5ubm5ubm5////////////////////////////////////////////////AAAAAExhdmYAAAAAAAAAAAAAAAAAAAAAACQAAAAAAAAAAAQgijOcAQAAAAAAAAAAAAAAAAAAAP/7UEQAAAAAAGkAAAAAAAAA2gAAAAEAAABLAAAAAQAAASsAAAADAAABKQAAAAUAAAEpAAAABgAAASoAAAADAAABKgAAAAUAAAEqAAAABgAAASsAAAADAAABKwAAAAUAAA';
                silentSound.volume = 0.01;
                silentSound.play().catch(() => {});
                
                // Eliminar este event listener después de usar
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('click', unlockAudio);
            }
            
            // Añadir event listeners para desbloquear audio
            document.addEventListener('touchstart', unlockAudio);
            document.addEventListener('click', unlockAudio);
        },
        
        // 6. Configurar triggers de sonido para interacciones
        setupSoundTriggers: function() {
            const buttons = document.querySelectorAll('button, .ranking-btn, #openTermsBtn, #acceptTermsBtn');
            
            // Asegurarse de que todos los botones tengan event listeners para sonido
            buttons.forEach(button => {
                // Comprobar si ya tiene event listener para sonido
                const hasEventListener = button.getAttribute('data-sound-enabled');
                
                if (!hasEventListener) {
                    button.setAttribute('data-sound-enabled', 'true');
                    
                    button.addEventListener('click', () => {
                        if (window.soundManager) {
                            window.soundManager.playSound('menu');
                        }
                    });
                }
            });
            
            // Añadir sonido al saltador
            document.addEventListener('keydown', (event) => {
                if (event.code === 'Space' && window.soundManager) {
                    // No reproducir sonido aquí, ya se hace en la función jump
                    // Solo desbloquear audio si es necesario
                    if (window.soundManager.audioContext && window.soundManager.audioContext.state === 'suspended') {
                        window.soundManager.audioContext.resume();
                    }
                }
            });
        },
        
        // 7. Crear un gestor de sonido fallback si no existe
        createFallbackSoundManager: function() {
            console.log("Creando SoundManager fallback...");
            
            // Crear objeto básico de sonido
            window.soundManager = {
                isMuted: false,
                sounds: {},
                
                // Cargar un sonido básico
                loadSound: function(name, src) {
                    try {
                        const sound = new Audio(src);
                        sound.preload = 'auto';
                        this.sounds[name] = sound;
                    } catch (e) {
                        console.warn(`Error cargando sonido ${name}:`, e);
                    }
                },
                
                // Reproducir un sonido
                playSound: function(name) {
                    if (this.isMuted) return;
                    
                    const sound = this.sounds[name];
                    if (sound) {
                        sound.currentTime = 0;
                        sound.play().catch(e => console.warn(`Error reproduciendo ${name}:`, e));
                    }
                },
                
                // Pausar un sonido
                pauseSound: function(name) {
                    const sound = this.sounds[name];
                    if (sound) {
                        sound.pause();
                    }
                },
                
                // Alternar silencio
                toggleMute: function() {
                    this.isMuted = !this.isMuted;
                    
                    // Actualizar UI
                    const muteButton = document.getElementById('muteButton');
                    if (muteButton) {
                        if (this.isMuted) {
                            muteButton.classList.add('muted');
                            muteButton.querySelector('.sound-icon').textContent = '🔇';
                        } else {
                            muteButton.classList.remove('muted');
                            muteButton.querySelector('.sound-icon').textContent = '🔊';
                        }
                    }
                }
            };
            
            // Cargar sonidos básicos con URLs de freesound.org
            window.soundManager.loadSound('jump', 'https://cdn.freesound.org/previews/412/412068_5121236-lq.mp3');
            window.soundManager.loadSound('coin', 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3');
            window.soundManager.loadSound('hit', 'https://cdn.freesound.org/previews/331/331912_5883485-lq.mp3');
            window.soundManager.loadSound('menu', 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3');
            window.soundManager.loadSound('start', 'https://cdn.freesound.org/previews/270/270545_5123839-lq.mp3');
            window.soundManager.loadSound('background', 'https://cdn.freesound.org/previews/638/638933_7173575-lq.mp3');
            
            // Añadir event listener al botón de silencio
            const muteButton = document.getElementById('muteButton');
            if (muteButton) {
                muteButton.addEventListener('click', () => {
                    window.soundManager.toggleMute();
                });
            }
        },
        
        // 8. Añadir mejoras visuales de CSS adicionales
        enhanceVisuals: function() {
            console.log("Aplicando mejoras visuales...");
            
            // Crear estilos CSS para las correcciones
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                /* Mejoras para elementos del juego */
                #player {
                    transition: background-color 0.2s ease-out;
                    animation: player-idle 2s infinite alternate;
                }
                
                @keyframes player-idle {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-2px); }
                }
                
                /* Optimización para dispositivos de baja gama */
                .low-performance-mode .obstacle-animation,
                .low-performance-mode .coin-animation {
                    animation-duration: 3.5s !important;
                }
                
                .low-performance-mode .coin {
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3) !important;
                }
                
                /* Estilos para ranking */
                .loading-ranking {
                    text-align: center;
                    padding: 20px;
                }
                
                .loading-ranking .spinner {
                    width: 40px;
                    height: 40px;
                    margin: 0 auto 10px;
                    border: 4px solid var(--color-primary);
                    border-top: 4px solid transparent;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .ranking-error {
                    color: #ff6b6b;
                    text-align: center;
                    margin-top: 10px;
                    font-size: 0.9em;
                }
                
                /* Mejoras para controles táctiles */
                .touch-device #gameContainer {
                    touch-action: none;
                }
                
                .touch-device button, 
                .touch-device .checkbox-container input[type="checkbox"] {
                    touch-action: manipulation;
                }
                
                /* Garantizar que el timer sea visible */
                #timer {
                    z-index: 15 !important;
                    text-shadow: 0 0 8px rgba(0, 0, 0, 0.9), 0 0 5px rgba(0, 0, 0, 0.7) !important;
                }
                
                /* Mejoras para el contenedor del juego */
                #gameContainer {
                    backface-visibility: hidden;
                    will-change: transform;
                    transform: translateZ(0);
                }
            `;
            
            document.head.appendChild(styleElement);
            
            return true;
        },
        
        // 9. Aplicar todas las correcciones
        applyAllFixes: function() {
            this.fixPhysics();
            this.fixRanking();
            this.fixSound();
            this.enhanceVisuals();
            
            // Programar revisión periódica
            setInterval(() => {
                this.limitGameObjects();
            }, 5000);
            
            console.log("✅ Todas las correcciones aplicadas correctamente");
            
            return true;
        }
    };
    
    // Aplicar todas las correcciones automáticamente
    GameFixer.applyAllFixes();
    
    // Exponer objeto fixer para uso desde consola si es necesario
    window.GameFixer = GameFixer;
});
