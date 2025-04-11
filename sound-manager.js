/**
 * SoundManager - Sistema de audio mejorado con optimizaciones para diversos navegadores y dispositivos
 * Características:
 * - Precarga de sonidos optimizada
 * - Soporte para múltiples formatos
 * - Sistema de fallback para navegadores antiguos
 * - Control de volumen independiente para música y efectos
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
                
                // Asegurar que el contexto está corriendo
                if (this.audioContext.state === 'suspended') {
                    const resumeAudio = () => {
                        this.audioContext.resume();
                        
                        // Eliminar event listeners después de reanudar
                        document.removeEventListener('click', resumeAudio);
                        document.removeEventListener('touchstart', resumeAudio);
                        document.removeEventListener('keydown', resumeAudio);
                    };
                    
                    document.addEventListener('click', resumeAudio);
                    document.addEventListener('touchstart', resumeAudio);
                    document.addEventListener('keydown', resumeAudio);
                }
                
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
            
            // Cargar sonidos con CDNs alternativos
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
        // Fuentes de audio alternativos y más confiables
        const soundSources = {
            // Música de fondo - CDNs alternativos
            background: {
                mp3: 'https://cdn.freesound.org/previews/638/638933_7173575-lq.mp3', // Backup de freesound
                ogg: 'https://cdn.freesound.org/previews/638/638933_7173575-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/632/632633_13874916-lq.mp3'
            },
            // Sonido de salto
            jump: {
                mp3: 'https://cdn.freesound.org/previews/412/412068_5121236-lq.mp3', 
                ogg: 'https://cdn.freesound.org/previews/412/412068_5121236-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/369/369515_6687899-lq.mp3'
            },
            // Sonido de moneda
            coin: {
                mp3: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/512/512216_7383358-lq.mp3'
            },
            // Sonido de colisión
            hit: {
                mp3: 'https://cdn.freesound.org/previews/331/331912_5883485-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/331/331912_5883485-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/512/512769_2393494-lq.mp3'
            },
            // Click de menú
            menu: {
                mp3: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/403/403013_5121236-lq.mp3'
            },
            // Sonido de inicio del juego
            start: {
                mp3: 'https://cdn.freesound.org/previews/270/270545_5123839-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/270/270545_5123839-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/320/320775_5123839-lq.mp3'
            },
            // Sonido para combo
            combo: {
                mp3: 'https://cdn.freesound.org/previews/270/270404_5123839-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/270/270404_5123839-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/584/584847_3160831-lq.mp3'
            },
            // Sonido para game over
            gameOver: {
                mp3: 'https://cdn.freesound.org/previews/270/270402_5123839-lq.mp3',
                ogg: 'https://cdn.freesound.org/previews/270/270402_5123839-lq.ogg',
                fallback: 'https://cdn.freesound.org/previews/363/363117_6442512-lq.mp3'
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
        // No hacer nada si está silenciado
        if (this.isMuted) return;
        
        try {
            // Manejo especial para la música de fondo
            if (name === 'background') {
                this.playMusic();
                return;
            }
            
            // Si tenemos pool de sonidos, usar eso (mejor para efectos)
            if (this.soundPools[name] && this.soundPools[name].length > 0) {
                this.playSoundFromPool(name);
                return;
            }

            // Fallback al método tradicional
            const sound = this.sounds[name];
            if (sound) {
                // CORRECCIÓN: Mejor manejo de errores en reproducción
                sound.currentTime = 0;
                
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.warn(`Error reproduciendo ${name}:`, e);
                        
                        // Si es un error de interacción, intentar usar el contexto de audio para forzar el inicio
                        if (e.name === 'NotAllowedError' && this.audioContext) {
                            // Forzar la activación del contexto de audio
                            this.audioContext.resume();
                        }
                    });
                }
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
     * Método de inicialización forzada para usar en eventos de usuario
     */
    forceAudioStart() {
        // Desbloquear Web Audio API
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Intentar reproducir un sonido silencioso para desbloquear audio en iOS
        const silentSound = document.createElement('audio');
        silentSound.src = 'data:audio/mpeg;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAZYAAAAAAAAAABQ4JAMGQgAAMAAAA0LPJCv2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        silentSound.volume = 0.01; // Volumen casi inaudible
        silentSound.play().catch(e => console.log('Silent audio play failed, but that\'s okay'));
        
        // Intentar reproducir un efecto de sonido corto para iOS y Safari
        if (this.sounds['menu']) {
            const menuSound = this.sounds['menu'];
            menuSound.volume = 0.01; // Volumen casi inaudible
            menuSound.play().catch(e => console.log('Menu sound play failed, but audio might be unblocked now'));
        }
        
        console.log('Audio system force start attempted');
        return true;
    }
    
    /**
     * Inicializa el sonido desde un evento de usuario como click
     */
    initSoundFromUserInteraction() {
        // Esta función debe llamarse desde eventos de usuario como click o touch
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Iteramos a través de todos los sonidos cargados y los precargamos correctamente
        for (const name in this.sounds) {
            const sound = this.sounds[name];
            if (sound && sound instanceof HTMLAudioElement) {
                // Forzar la carga del audio
                sound.load();
                // Reproducir brevemente a volumen 0 y luego pausar
                sound.volume = 0;
                sound.play().then(() => {
                    setTimeout(() => {
                        sound.pause();
                        sound.volume = name === 'background' ? this.musicVolume : this.sfxVolume;
                    }, 50);
                }).catch(e => {
                    console.warn(`Preload de ${name} falló, pero continuamos:`, e);
                });
            }
        }
    }
    
    /**
     * Crea controles de audio en la interfaz si no existen
     */
    createAudioControls() {
        // Verificar si ya existe el botón de silenciar
        if (document.getElementById('muteButton')) {
            // Si existe, solo asegurarse de que tenga el evento click
            const muteButton = document.getElementById('muteButton');
            
            // Eliminar eventos existentes para evitar duplicados
            const newMuteButton = muteButton.cloneNode(true);
            if (muteButton.parentNode) {
                muteButton.parentNode.replaceChild(newMuteButton, muteButton);
            }
            
            newMuteButton.addEventListener('click', () => {
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
    const buttons = document.querySelectorAll('button, .ranking-btn, #openTermsBtn, #closeRankingBtn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (window.soundManager) {
                window.soundManager.playSound('menu');
            }
        });
    });
    
    // Forzar inicialización de audio en primer click/touch
    const forceAudioInit = () => {
        if (window.soundManager) {
            window.soundManager.forceAudioStart();
        }
        document.removeEventListener('click', forceAudioInit);
        document.removeEventListener('touchstart', forceAudioInit);
    };
    
    document.addEventListener('click', forceAudioInit);
    document.addEventListener('touchstart', forceAudioInit);
});
