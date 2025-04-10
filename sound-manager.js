// Configuración del sonido
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.5; // Cargar volumen de localStorage
        this.sfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.7; // Cargar volumen de localStorage
    }

    loadSounds() {
        try {
            console.log("Cargando sonidos...");
            
            // Música de fondo
            this.loadSound('background', 'https://freesound.org/data/previews/473/473584_5674468-lq.mp3', true, this.musicVolume);
            
            // Efectos de sonido (SFX)
            this.loadSound('jump', 'https://freesound.org/data/previews/369/369515_6687899-lq.mp3', false, this.sfxVolume);
            this.loadSound('coin', 'https://freesound.org/data/previews/341/341695_5858296-lq.mp3', false, this.sfxVolume);
            this.loadSound('hit', 'https://freesound.org/data/previews/331/331912_5883485-lq.mp3', false, this.sfxVolume);
            this.loadSound('menu', 'https://freesound.org/data/previews/242/242501_4284968-lq.mp3', false, this.sfxVolume * 0.5);
            
            console.log("Sonidos cargados correctamente");
        } catch (e) {
            console.error("Error al cargar sonidos:", e);
            this.createFallbackSounds();
        }
    }

    loadSound(name, src, loop = false, volume = 1) {
        const sound = new Audio(src);
        sound.loop = loop;
        sound.volume = volume;
        this.sounds[name] = sound;
        sound.addEventListener('error', (e) => {
            console.error(`Error al cargar ${name}:`, e);
            this.createFallbackSound(name); // Crear sonido de respaldo individual
        });
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound && !this.isMuted) {
            sound.currentTime = 0; // Reiniciar el sonido
            sound.play();
        }
    }

    pause(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.pause();
        }
    }

    resume(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.play();
        }
    }

    createFallbackSounds() {
        // Crear sonidos de respaldo para todos los sonidos
        for (const name in this.sounds) {
            this.createFallbackSound(name);
        }
    }

    createFallbackSound(name) {
        // Crear un sonido de respaldo individual
        this.sounds[name] = new Audio(); // Sonido vacío
        console.warn(`Sonido de respaldo creado para ${name}`);
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.sounds.background) {
            this.sounds.background.volume = volume;
        }
        localStorage.setItem('musicVolume', volume); // Guardar en localStorage
    }

    setSfxVolume(volume) {
        this.sfxVolume = volume;
        for (const name in this.sounds) {
            if (name !== 'background') {
                this.sounds[name].volume = volume;
            }
        }
        localStorage.setItem('sfxVolume', volume); // Guardar en localStorage
    }

    mute() {
        this.isMuted = true;
        for (const name in this.sounds) {
            this.pause(name);
        }
    }

    unmute() {
        this.isMuted = false;
        if (document.visibilityState === 'visible') {
            this.resume('background');
        }
    }
}

// Inicialización del gestor de sonidos
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando gestor de sonidos");
    
    // Si soundManager ya existe, usarlo; si no, crearlo
    if (!window.soundManager) {
        window.soundManager = new SoundManager();
        console.log("SoundManager creado");
    }
    
    // Cargar sonidos
    window.soundManager.loadSounds();

    // Evento de clic para probar sonido
    document.body.addEventListener('click', function() {
        if (window.soundManager && typeof window.soundManager.play === 'function') {
            window.soundManager.play('menu');
            console.log("Probando sonido de menú");
        }
    }, {once: true}); // Solo una vez para no molestar
});

// Función para ajustar el tamaño del contenedor del juego de acuerdo con el tamaño de la pantalla
function adjustGameContainer() {
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        gameContainer.style.height = `${windowHeight}px`;
        gameContainer.style.width = `${windowWidth}px`;

        console.log("Contenedor ajustado: ", windowWidth, windowHeight);
    }
}

// Detectar cambios de orientación en dispositivos móviles
window.addEventListener('orientationchange', function() {
    setTimeout(adjustGameContainer, 100); // Pequeño retraso para asegurar que la orientación se actualizó
});

// Pausar/reanudar sonidos cuando la pestaña no está activa
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        soundManager.pause('background');
    } else if (gameRunning && !soundManager.isMuted) {
        soundManager.resume('background');
    }
});

// Prevenir errores en navegadores que no soporten ciertas características
window.onerror = function(message, source, lineno, colno, error) {
    console.error("Error en el juego:", message);
    // No detener el juego por errores no críticos
    return true;
};

// Manejo del formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerButton = document.getElementById('registerButton');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener los valores
            const playerName = document.getElementById('playerName').value.trim();
            const playerEmail = document.getElementById('playerEmail').value.trim();
            const termsCheckbox = document.getElementById('termsCheckbox');
            
            // Validar
            if (!playerName) {
                alert("Por favor, ingresa tu nombre de jugador");
                return;
            }
            
            if (!playerEmail) {
                alert("Por favor, ingresa tu correo electrónico");
                return;
            }
            
            if (!termsCheckbox.checked) {
                alert("Debes aceptar los términos y condiciones para continuar");
                return;
            }
            
            // Guardar datos
            window.playerName = playerName.substring(0, 15);
            window.playerEmail = playerEmail;
            
            // Transición explícita entre pantallas
            document.getElementById('registerScreen').style.display = 'none';
            document.getElementById('startScreen').style.display = 'flex';
            
            console.log("Registro completado, nombre:", playerName, "email:", playerEmail);
        });
    }
    
    // Asegurar que el botón directo también funcione
    if (registerButton) {
        registerButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerForm) {
                // Disparar un evento de envío sintético
                const event = new Event('submit', {
                    bubbles: true,
                    cancelable: true
                });
                registerForm.dispatchEvent(event);
            }
        });
    }
});

// Ajustar el contenedor del juego inmediatamente
adjustGameContainer();

// Sonido al hacer clic en los botones
const buttons = document.querySelectorAll('button, .ranking-btn, #openTermsBtn');
buttons.forEach(button => {
    button.addEventListener('click', () => {
        soundManager.play('menu');
    });
});
