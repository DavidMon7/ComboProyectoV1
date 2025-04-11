/**
 * SoundManager - Sistema de audio mejorado con optimizaciones para diversos navegadores y dispositivos
 * Características:
 * - Precarga de sonidos optimizada
 * - Soporte para múltiples formatos
 * - Sistema de fallback para navegadores antiguos
 * - Control de volumen independiente para música y efectos
 * - Soporte para silenciar automáticamente en segundo plano
 * - Sistema de pool de sonidos para mejor rendimiento
 */
class SoundManager {
    constructor() {
        // Estado del sistema de audio
        this.initialized = false;
        this.isMuted = localStorage.getItem('gameMuted') === 'true' || false;
        this.musicVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.5;
        this.sfxVolume = parseFloat(localStorage.getItem('sfxVolume')) || 0.7;
        this.sounds = {};
        this.soundPools = {};
        this.currentMusic = null;
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Determinar formatos de audio soportados
        this.supportedFormats = this.getSupportedAudioFormats();
        
        // Inicializar sistema de audio cuando sea posible
        this.initializeAudioSystem();
        
        // Monitorear visibilidad del documento para pausar/reanudar audio
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Crear elementos de control de audio si no existen
        this.createAudioControls();
        
        console.log("SoundManager inicializado con formatos soportados:", this.supportedFormats);
    }
    
    /**
     * Inicializa el sistema de audio
     */
    initializeAudioSystem() {
        try {
            // Crear contexto de audio Web (para navegadores modernos)
            if (window.AudioContext || window.webkitAudioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Crear nodos de ganancia para control de volumen
                this.masterGain = this.audioContext.createGain();
                this.musicGain = this.audioContext.createGain();
                this.sfxGain = this.audioContext.createGain();
                
                // Conectar nodos
                this.musicGain.connect(this.masterGain);
                this.sfxGain.connect(this.masterGain);
                this.masterGain.connect(this.audioContext.destination);
                
                // Establecer volúmenes iniciales
                this.masterGain.gain.value = this.isMuted ? 0 : 1;
                this.musicGain.gain.value = this.musicVolume;
                this.sfxGain.gain.value = this.sfxVolume;
                
                console.log("Web Audio API inicializada correctamente");
            } else {
                console.log("Web Audio API no soportada, usando Audio HTMLElement");
            }
            
            this.initialized = true;
            
            // Cargar sonidos
            this.loadGameSounds();
        } catch (e) {
            console.error("Error al inicializar el sistema de audio:", e);
            // Crear sonidos de respaldo silenciosos
            this.createFallbackSounds();
        }
    }
    
    /**
     * Detecta qué formatos de audio son soportados por el navegador
     */
    getSupportedAudioFormats() {
        const audio = document.createElement('audio');
        const formats = {
            mp3: !!audio.canPlayType('audio/mpeg;').replace(/^no$/, ''),
            ogg: !!audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
            wav: !!audio.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
            aac: !!audio.canPlayType('audio/aac;').replace(/^no$/, ''),
            m4a: !!audio.canPlayType('audio/x-m4a;').replace(/^no$/, '')
        };
        
        return formats;
    }
    
    /**
     * Carga todos los sonidos del juego con URLs optimizadas
     */
    loadGameSounds() {
        // Fuentes de audio modernas y optimizadas con múltiples formatos para compatibilidad
        const soundSources = {
            // Música de fondo - versión moderna con mejor loop
            background: {
                mp3: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
                ogg: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.ogg',
                fallback: 'https://freesound.org/data/previews/473/473584_5674468-lq.mp3'
            },
            // Sonido de salto más nítido
            jump: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.ogg',
                fallback: 'https://freesound.org/data/previews/369/369515_6687899-lq.mp3'
            },
            // Sonido de moneda mejorado
            coin: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.ogg',
                fallback: 'https://freesound.org/data/previews/341/341695_5858296-lq.mp3'
            },
            // Sonido de colisión más impactante
            hit: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-falling-hit-757.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-falling-hit-757.ogg',
                fallback: 'https://freesound.org/data/previews/331/331912_5883485-lq.mp3'
            },
            // Click de menú más responsivo
            menu: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-electronic-retro-block-hit-2185.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-electronic-retro-block-hit-2185.ogg',
                fallback: 'https://freesound.org/data/previews/242/242501_4284968-lq.mp3'
            },
            // Nuevo sonido para inicio del juego
            start: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-complete-or-approved-mission-205.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-complete-or-approved-mission-205.ogg',
                fallback: 'https://freesound.org/data/previews/270/270545_5123839-lq.mp3'
            },
            // Nuevo sonido para combo
            combo: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.ogg',
                fallback: 'https://freesound.org/data/previews/270/270404_5123839-lq.mp3'
            },
            // Sonido para game over
            gameOver: {
                mp3: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3',
                ogg: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.ogg',
                fallback: 'https://freesound.org/data/previews/270/270402_5123839-lq.mp3'
            }
        };
        
        // Cargar cada sonido eligiendo el formato adecuado
        for (const [name, sources] of Object.entries(soundSources)) {
            // Determinar la mejor URL basada en formatos soportados
            let soundUrl = sources.fallback; // URL por defecto
            
            // Comprobar formatos por orden de preferencia
            if (this.supportedFormats.mp3 && sources.mp3) {
                soundUrl = sources.mp3;
            } else if (this.supportedFormats.ogg && sources.ogg) {
                soundUrl = sources.ogg;
            }
            
            // Determinar si el sonido es música de fondo o efecto
            const isMusic = name === 'background';
            
            // Crear un pool para efectos de sonido (no para música)
            if (!isMusic) {
                this.createSoundPool(name, soundUrl, 3);
            } else {
                // Cargar música de fondo como un solo elemento
                this.loadSound(name, soundUrl, true, isMusic ? this.musicVolume : this.sfxVolume);
            }
        }
    }
    
    /**
     * Crea un pool de sonidos para reproducción simultánea
     */
    createSoundPool(name, src, size = 3) {
        this.soundPools[name] = [];
        
        // Crear múltiples instancias del mismo sonido
        for (let i = 0; i < size; i++) {
            // Si tenemos Web Audio API, usar BufferSource
            if (this.audioContext) {
                this.loadSoundBuffer(name, src, i);
            } else {
                // Fallback a HTMLAudioElement
                const sound = new Audio(src);
                sound.volume = this.sfxVolume;
                sound.preload = 'auto';
                this.soundPools[name].push(sound);
                
                // Manejar error de carga
                sound.addEventListener('error', () => {
                    console.warn(`Error al cargar sonido ${name} (${i})`);
                });
            }
        }
    }
    
    /**
     * Carga un sonido como buffer para Web Audio API
     */
    loadSoundBuffer(name, src, index = 0) {
        // Solo para Web Audio API
        if (!this.audioContext) return;
        
        fetch(src)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                // Guardar el buffer en el pool
                if (!this.soundPools[name]) {
                    this.soundPools[name] = [];
                }
                this.soundPools[name][index] = audioBuffer;
            })
            .catch(error => {
                console.error(`Error al decodificar audio ${name}:`, error);
            });
    }
    
    /**
     * Carga un sonido individual (principalmente para música)
     */
    loadSound(name, src, loop = false, volume = 1) {
        // Si tenemos Web Audio API y es un efecto de sonido, usar createSoundPool en su lugar
        if (this.audioContext && !loop) {
            return this.createSoundPool(name, src);
        }
        
        // Para música o fallback, usar HTMLAudioElement
        const sound = new Audio(src);
        sound.loop = loop;
        sound.volume = volume;
        sound.preload = 'auto';
        this.sounds[name] = sound;
        
        // Manejar error de carga
        sound.addEventListener('error', (e) => {
            console.error(`Error al cargar ${name}:`, e);
            this.createFallbackSound(name);
        });
    }
    
    /**
     * Reproduce un sonido
     */
    playSound(name) {
        if (this.isMuted) return;
        
        try {
            // Comprobar si es música de fondo
            if (name === 'background') {
                this.playMusic();
                return;
            }
            
            // Si tenemos pool de sonidos, usar eso (mejor para efectos)
            if (this.soundPools[name]) {
                this.playSoundFromPool(name);
                return;
            }

            // Fallback al método tradicional
            const sound = this.sounds[name];
            if (sound) {
                // Reiniciar y reproducir
                sound.currentTime = 0;
                sound.play().catch(e => console.warn(`Error reproduciendo ${name}:`, e));
            }
        } catch (e) {
            console.warn(`Error al reproducir sonido ${name}:`, e);
        }
    }
    
    /**
     * Reproduce un sonido desde el pool
     */
    playSoundFromPool(name) {
        if (!this.soundPools[name] || this.soundPools[name].length === 0) return;
        
        // Si tenemos Web Audio API
        if (this.audioContext) {
            // Obtener el buffer
            const buffer = this.soundPools[name][0];
            if (!buffer) return;
            
            // Crear una fuente para reproducción
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            
            // Conectar al nodo de ganancia SFX
            source.connect(this.sfxGain);
            source.start(0);
            
            return;
        }
        
        // Fallback: buscar un sonido disponible en el pool
        const availableSound = this.soundPools[name].find(sound => 
            sound.paused || sound.ended);
            
        if (availableSound) {
            availableSound.currentTime = 0;
            availableSound.play().catch(e => console.warn(`Error reproduciendo ${name} desde pool:`, e));
        } else {
            // Si todos están en uso, usar el primero
            const sound = this.soundPools[name][0];
            sound.currentTime = 0;
            sound.play().catch(e => console.warn(`Error reproduciendo ${name} desde pool:`, e));
        }
    }
    
    /**
     * Inicia o reanuda la música de fondo
     */
    playMusic() {
        const music = this.sounds['background'];
        if (!music || this.isMuted) return;
        
        // Si la música ya está sonando, no hacer nada
        if (!music.paused) return;
        
        // Intentar reproducir con fade in
        try {
            music.volume = 0; // Empezar en silencio
            const playPromise = music.play();
            
            // Manejar el fade in
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Aumentar gradualmente el volumen
                        const fadeIn = setInterval(() => {
                            if (music.volume < this.musicVolume) {
                                music.volume += 0.05;
                                if (music.volume >= this.musicVolume) {
                                    music.volume = this.musicVolume;
                                    clearInterval(fadeIn);
                                }
                            }
                        }, 100);
                    })
                    .catch(e => {
                        console.warn("Error al reproducir música:", e);
                    });
            }
        } catch (e) {
            console.warn("Error al iniciar música:", e);
        }
    }
    
    /**
     * Pausa un sonido
     */
    pauseSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].pause();
        }
    }
    
    /**
     * Reanuda un sonido previamente pausado
     */
    resumeSound(name) {
        if (this.sounds[name] && !this.isMuted) {
            this.sounds[name].play().catch(e => console.warn(`Error al reanudar ${name}:`, e));
        }
    }
    
    /**
     * Establece el volumen de la música
     */
    setMusicVolume(volume) {
        // Guardar el nuevo valor de volumen
        this.musicVolume = volume;
        localStorage.setItem('musicVolume', volume);
        
        // Aplicar el nuevo volumen
        if (this.audioContext && this.musicGain) {
            // Web Audio API
            this.musicGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        } else {
            // Aplicar directamente a los elementos de audio
            if (this.sounds['background']) {
                this.sounds['background'].volume = volume;
            }
        }
    }
    
    /**
     * Establece el volumen de los efectos de sonido
     */
    setSfxVolume(volume) {
        // Guardar el nuevo valor de volumen
        this.sfxVolume = volume;
        localStorage.setItem('sfxVolume', volume);
        
        // Aplicar el nuevo volumen
        if (this.audioContext && this.sfxGain) {
            // Web Audio API
            this.sfxGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        } else {
            // Aplicar a todos los elementos de audio excepto la música
            for (const name in this.sounds) {
                if (name !== 'background') {
                    this.sounds[name].volume = volume;
                }
            }
            
            // Aplicar a todos los sonidos en pools
            for (const poolName in this.soundPools) {
                this.soundPools[poolName].forEach(sound => {
                    if (sound instanceof Audio) {
                        sound.volume = volume;
                    }
                });
            }
        }
    }
    
    /**
     * Silencia todos los sonidos
     */
    mute() {
        this.isMuted = true;
        localStorage.setItem('gameMuted', 'true');
        
        // Actualizar estado visual del botón
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.classList.add('muted');
            muteButton.setAttribute('aria-label', 'Activar sonido');
            muteButton.querySelector('.sound-icon').textContent = '🔇';
        }
        
        // Silenciar audio
        if (this.audioContext && this.masterGain) {
            // Web Audio API - más eficiente
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        } else {
            // Pausar todos los sonidos directamente
            for (const name in this.sounds) {
                this.pauseSound(name);
            }
        }
    }
    
    /**
     * Reactiva el sonido
     */
    unmute() {
        this.isMuted = false;
        localStorage.setItem('gameMuted', 'false');
        
        // Actualizar estado visual del botón
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.classList.remove('muted');
            muteButton.setAttribute('aria-label', 'Silenciar sonido');
            muteButton.querySelector('.sound-icon').textContent = '🔊';
        }
        
        // Reactivar audio
        if (this.audioContext && this.masterGain) {
            // Web Audio API
            this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        }
        
        // Reanudar música si la página está visible
        if (document.visibilityState === 'visible') {
            this.playMusic();
        }
    }
    
    /**
     * Alterna entre silenciar y activar el sonido
     */
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
    }
    
    /**
     * Maneja cambios de visibilidad de la página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // La página está oculta, pausar música
            this.pauseSound('background');
        } else if (!this.isMuted) {
            // La página está visible de nuevo y el sonido no está silenciado
            this.playMusic();
        }
    }
    
    /**
     * Crea sonidos de respaldo en caso de error
     */
    createFallbackSounds() {
        const essentialSounds = ['background', 'jump', 'coin', 'hit', 'menu', 'start', 'gameOver'];
        
        for (const name of essentialSounds) {
            this.createFallbackSound(name);
        }
        
        console.warn("Se han creado sonidos de respaldo silenciosos debido a errores de carga");
    }
    
    /**
     * Crea un sonido de respaldo individual
     */
    createFallbackSound(name) {
        // Audio vacío como respaldo
        const sound = new Audio();
        sound.volume = 0; // Silencioso
        this.sounds[name] = sound;
    }
    
    /**
     * Crea controles de audio en la interfaz si no existen
     */
    createAudioControls() {
        // Verificar si ya existe el botón de silenciar
        if (document.getElementById('muteButton')) {
            // Si existe, solo asegurarse de que tenga el evento click
            const muteButton = document.getElementById('muteButton');
            muteButton.addEventListener('click', () => {
                this.toggleMute();
            });
            return;
        }
        
        // Crear botón de silenciar (este código no debería ejecutarse si ya existe en HTML)
        const muteButton = document.createElement('div');
        muteButton.id = 'muteButton';
        muteButton.className = 'sound-control' + (this.isMuted ? ' muted' : '');
        muteButton.setAttribute('aria-label', this.isMuted ? 'Activar sonido' : 'Silenciar sonido');
        
        // Icono de sonido
        const soundIcon = document.createElement('span');
        soundIcon.className = 'sound-icon';
        soundIcon.textContent = this.isMuted ? '🔇' : '🔊';
        muteButton.appendChild(soundIcon);
        
        // Añadir evento para alternar silencio
        muteButton.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Añadir a la página
        document.body.appendChild(muteButton);
    }
}

// Inicialización del gestor de sonidos
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando gestor de sonidos optimizado");
    
    // Si soundManager ya existe, usarlo; si no, crearlo
    if (!window.soundManager) {
        window.soundManager = new SoundManager();
        console.log("SoundManager optimizado creado");
    }
    
    // Agregar sonidos a botones
    const buttons = document.querySelectorAll('button, .ranking-btn, #openTermsBtn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            window.soundManager.playSound('menu');
        });
    });
});
