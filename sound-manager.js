/* Implementación de sonido para el juego */

// Clase para gestionar todos los sonidos del juego
class SoundManager {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        this.isMuted = false;
        
        // Crear botón de control de sonido
        this.createSoundControls();
        
        // Inicializar sonidos
        this.loadSounds();
    }
    
    // Cargar todos los sonidos del juego
    loadSounds() {
        // Música de fondo
        this.loadSound('background', 'https://assets.codepen.io/460692/retro-synth-loop.mp3', true, this.musicVolume);
        
        // Efectos de sonido (SFX)
        this.loadSound('jump', 'https://assets.codepen.io/460692/jump.wav', false, this.sfxVolume);
        this.loadSound('doubleJump', 'https://assets.codepen.io/460692/double-jump.wav', false, this.sfxVolume);
        this.loadSound('coin', 'https://assets.codepen.io/460692/coin.wav', false, this.sfxVolume);
        this.loadSound('powerup', 'https://assets.codepen.io/460692/powerup.wav', false, this.sfxVolume);
        this.loadSound('hit', 'https://assets.codepen.io/460692/hit.wav', false, this.sfxVolume);
        this.loadSound('gameOver', 'https://assets.codepen.io/460692/game-over.wav', false, this.sfxVolume);
        this.loadSound('start', 'https://assets.codepen.io/460692/start-game.wav', false, this.sfxVolume);
        this.loadSound('menu', 'https://assets.codepen.io/460692/menu-select.wav', false, this.sfxVolume);
    }
    
    // Cargar un sonido individual
    loadSound(name, url, loop = false, volume = 1.0) {
        const audio = new Audio();
        audio.src = url;
        audio.loop = loop;
        audio.volume = volume;
        audio.preload = 'auto';
        
        // Manejar errores de carga
        audio.onerror = () => {
            console.error(`Error al cargar sonido: ${name} - ${url}`);
            
            // Crear un oscilador como fallback para efectos de sonido críticos
            if (name === 'jump' || name === 'coin' || name === 'hit') {
                this.createFallbackSound(name);
            }
        };
        
        this.sounds[name] = audio;
    }
    
    // Crear sonidos de fallback usando Web Audio API
    createFallbackSound(name) {
        // Crear un sonido sintético de respaldo
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Diferentes sonidos según el tipo
        switch(name) {
            case 'jump':
                this.sounds[name] = {
                    play: () => {
                        if (this.isMuted) return;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = 200;
                        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
                        gain.gain.value = this.sfxVolume * 0.7;
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.3);
                    }
                };
                break;
                
            case 'coin':
                this.sounds[name] = {
                    play: () => {
                        if (this.isMuted) return;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = 800;
                        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                        gain.gain.value = this.sfxVolume * 0.6;
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.2);
                    }
                };
                break;
                
            case 'hit':
                this.sounds[name] = {
                    play: () => {
                        if (this.isMuted) return;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = 100;
                        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
                        gain.gain.value = this.sfxVolume * 0.8;
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.3);
                    }
                };
                break;
        }
    }
    
    // Reproducir un sonido
    play(name) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (!sound) return;
        
        // Si es un elemento de audio
        if (sound instanceof Audio) {
            // Reiniciar si ya está reproduciéndose
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.error(`Error al reproducir sonido ${name}:`, e);
            });
        } else if (typeof sound.play === 'function') {
            // Si es un fallback personalizado
            sound.play();
        }
    }
    
    // Detener un sonido
    stop(name) {
        const sound = this.sounds[name];
        if (!sound || !(sound instanceof Audio)) return;
        
        sound.pause();
        sound.currentTime = 0;
    }
    
    // Pausar un sonido
    pause(name) {
        const sound = this.sounds[name];
        if (!sound || !(sound instanceof Audio)) return;
        
        sound.pause();
    }
    
    // Reanudar un sonido
    resume(name) {
        if (this.isMuted) return;
        
        const sound = this.sounds[name];
        if (!sound || !(sound instanceof Audio)) return;
        
        sound.play().catch(e => {
            console.error(`Error al reanudar sonido ${name}:`, e);
        });
    }
    
    // Silenciar o activar todos los sonidos
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Actualizar sonidos
        Object.values(this.sounds).forEach(sound => {
            if (sound instanceof Audio) {
                if (this.isMuted) {
                    sound.pause();
                } else {
                    if (sound.loop && gameRunning) {
                        sound.play().catch(e => console.error('Error al reanudar sonido:', e));
                    }
                }
            }
        });
        
        // Actualizar ícono del botón
        this.updateMuteButton();
        
        return this.isMuted;
    }
    
    // Crear controles para el sonido
    createSoundControls() {
        const muteButton = document.createElement('div');
        muteButton.id = 'muteButton';
        muteButton.className = 'sound-control';
        muteButton.innerHTML = '<i class="sound-icon">🔊</i>';
        
        muteButton.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Agregar botón al DOM cuando esté listo
        window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(muteButton);
        });
    }
    
    // Actualizar el botón de silencio
    updateMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (!muteButton) return;
        
        const soundIcon = muteButton.querySelector('.sound-icon');
        if (soundIcon) {
            soundIcon.textContent = this.isMuted ? '🔇' : '🔊';
        }
    }
}

// Inicializar el gestor de sonidos
const soundManager = new SoundManager();
