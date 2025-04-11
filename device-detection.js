/**
 * DeviceManager - Gestión inteligente de dispositivos y adaptación del juego
 * Este módulo detecta el tipo de dispositivo, navegador y características
 * del sistema para optimizar la experiencia del juego.
 */
class DeviceManager {
    constructor() {
        // Propiedades del dispositivo
        this.isMobile = false;
        this.isTablet = false;
        this.isDesktop = false;
        this.browserName = '';
        this.browserVersion = '';
        this.osName = '';
        this.osVersion = '';
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.touchSupported = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.hasLowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
        this.hasPoorGPU = this.checkForPoorGPU();
        
        // Detectar características del dispositivo
        this.detectDevice();
        this.detectBrowser();
        this.detectOS();
        
        // Escuchar cambios en el tamaño de la ventana
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Iniciar optimizaciones
        this.applyOptimizations();
        
        console.log(`DeviceManager: Dispositivo detectado - ${this.deviceType} - ${this.browserName} ${this.browserVersion} - ${this.osName} ${this.osVersion}`);
    }
    
    /**
     * Detecta el tipo de dispositivo: móvil, tablet o desktop
     */
    detectDevice() {
        // Patrones para detectar dispositivos móviles
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|PlayBook/i;
        
        this.isMobile = mobileRegex.test(navigator.userAgent);
        this.isTablet = tabletRegex.test(navigator.userAgent) || 
                         (this.isMobile && Math.min(window.innerWidth, window.innerHeight) > 600);
        this.isDesktop = !this.isMobile || this.isTablet;
        
        // Propiedad auxiliar para acceso rápido
        this.deviceType = this.isTablet ? 'tablet' : (this.isMobile ? 'mobile' : 'desktop');
    }
    
    /**
     * Detecta el navegador y su versión
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        // Detectar Chrome
        if (userAgent.match(/chrome|chromium|crios/i)) {
            this.browserName = 'Chrome';
            this.browserVersion = userAgent.match(/(?:chrome|chromium|crios)\/(\d+)/i)[1];
        } 
        // Detectar Firefox
        else if (userAgent.match(/firefox|fxios/i)) {
            this.browserName = 'Firefox';
            this.browserVersion = userAgent.match(/(?:firefox|fxios)\/(\d+)/i)[1];
        }
        // Detectar Safari
        else if (userAgent.match(/safari/i) && !userAgent.match(/chrome|chromium|crios/i)) {
            this.browserName = 'Safari';
            this.browserVersion = userAgent.match(/version\/(\d+)/i)[1];
        }
        // Detectar Edge
        else if (userAgent.match(/edg/i)) {
            this.browserName = 'Edge';
            this.browserVersion = userAgent.match(/edg\/(\d+)/i)[1];
        }
        // Detectar Opera
        else if (userAgent.match(/opr\//i)) {
            this.browserName = 'Opera';
            this.browserVersion = userAgent.match(/opr\/(\d+)/i)[1];
        }
        // Detectar IE
        else if (userAgent.match(/trident/i)) {
            this.browserName = 'Internet Explorer';
            this.browserVersion = userAgent.match(/(?:rv:|msie )(\d+)/i)[1];
        }
        // Otros navegadores
        else {
            this.browserName = 'Desconocido';
            this.browserVersion = 'N/A';
        }
    }
    
    /**
     * Detecta el sistema operativo y su versión
     */
    detectOS() {
        const userAgent = navigator.userAgent;
        
        // Detectar Windows
        if (userAgent.match(/windows/i)) {
            this.osName = 'Windows';
            if (userAgent.match(/windows nt 10/i)) {
                this.osVersion = '10';
            } else if (userAgent.match(/windows nt 6.3/i)) {
                this.osVersion = '8.1';
            } else if (userAgent.match(/windows nt 6.2/i)) {
                this.osVersion = '8';
            } else {
                this.osVersion = 'Anterior';
            }
        }
        // Detectar macOS
        else if (userAgent.match(/mac os x/i)) {
            this.osName = 'macOS';
            this.osVersion = userAgent.match(/mac os x (\d+)[._](\d+)/i) 
                ? `${userAgent.match(/mac os x (\d+)[._](\d+)/i)[1]}.${userAgent.match(/mac os x (\d+)[._](\d+)/i)[2]}`
                : 'Desconocida';
        }
        // Detectar iOS
        else if (userAgent.match(/iphone|ipad|ipod/i)) {
            this.osName = 'iOS';
            this.osVersion = userAgent.match(/os (\d+)[._](\d+)/i)
                ? `${userAgent.match(/os (\d+)[._](\d+)/i)[1]}.${userAgent.match(/os (\d+)[._](\d+)/i)[2]}`
                : 'Desconocida';
        }
        // Detectar Android
        else if (userAgent.match(/android/i)) {
            this.osName = 'Android';
            this.osVersion = userAgent.match(/android (\d+)\.(\d+)/i)
                ? `${userAgent.match(/android (\d+)\.(\d+)/i)[1]}.${userAgent.match(/android (\d+)\.(\d+)/i)[2]}`
                : 'Desconocida';
        }
        // Detectar Linux
        else if (userAgent.match(/linux/i)) {
            this.osName = 'Linux';
            this.osVersion = 'Desconocida';
        }
        // Otros sistemas operativos
        else {
            this.osName = 'Desconocido';
            this.osVersion = 'Desconocida';
        }
    }
    
    /**
     * Verifica si el dispositivo probablemente tiene una GPU de bajo rendimiento
     */
    checkForPoorGPU() {
        // Lista de dispositivos conocidos con GPU de bajo rendimiento
        const lowEndDevices = /iphone 5|iphone 6|iphone se|ipod|galaxy s5|galaxy j|moto g|redmi 4|nokia/i;
        
        // Verificar si es un dispositivo móvil antiguo
        if (this.isMobile && lowEndDevices.test(navigator.userAgent)) {
            return true;
        }
        
        // Otros indicadores de posible bajo rendimiento GPU
        if (this.hasLowMemory && this.isMobile && this.pixelRatio < 2) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Maneja cambios en el tamaño de la ventana
     */
    handleResize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        
        // Comprobar si el dispositivo cambia de orientación en móvil/tablet
        if (this.isMobile || this.isTablet) {
            this.checkOrientation();
        }
        
        // Ajustar el contenedor del juego
        this.adjustGameContainer();
    }
    
    /**
     * Verifica la orientación del dispositivo
     */
    checkOrientation() {
        const orientationMessage = document.getElementById('orientation-message');
        const gameContainer = document.getElementById('gameContainer');
        
        // Solo mostrar mensaje de orientación en móviles y tablets
        if ((this.isMobile || this.isTablet) && window.innerWidth < window.innerHeight) {
            if (orientationMessage) {
                orientationMessage.style.display = 'flex';
            }
            if (gameContainer) {
                gameContainer.classList.add('hidden-game');
            }
            return false;
        } else {
            if (orientationMessage) {
                orientationMessage.style.display = 'none';
            }
            if (gameContainer) {
                gameContainer.classList.remove('hidden-game');
            }
            return true;
        }
    }
    
    /**
     * Ajusta el tamaño del contenedor del juego
     */
    adjustGameContainer() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        // Cálculos para mantener la proporción de aspecto
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const targetAspectRatio = 2; // Proporción deseada (2:1)
        
        let gameWidth, gameHeight;
        
        // Ajustar según el espacio disponible manteniendo la proporción
        if (windowWidth / windowHeight > targetAspectRatio) {
            // Si la ventana es más ancha que alta
            gameHeight = windowHeight * 0.9; // 90% de la altura
            gameWidth = gameHeight * targetAspectRatio;
        } else {
            // Si la ventana es más alta que ancha
            gameWidth = windowWidth * 0.9; // 90% del ancho
            gameHeight = gameWidth / targetAspectRatio;
        }
        
        // Aplicar las dimensiones calculadas
        gameContainer.style.width = `${gameWidth}px`;
        gameContainer.style.height = `${gameHeight}px`;
        
        // Escalar los elementos del juego si es necesario
        this.scaleGameElements(gameWidth / 800); // 800 es el ancho de referencia del diseño
        
        console.log(`GameContainer ajustado a: ${gameWidth}x${gameHeight}`);
    }
    
    /**
     * Escala los elementos del juego en proporción
     */
    scaleGameElements(scale) {
        // Ajustar tamaño del jugador
        const player = document.getElementById('player');
        if (player) {
            // Mantener proporción pero ajustar tamaño según la escala
            const baseSize = 40; // Tamaño base en px
            player.style.width = `${baseSize * scale}px`;
            player.style.height = `${baseSize * scale}px`;
        }
        
        // Ajustar tamaño de textos
        document.querySelectorAll('#score, #timer, #combo').forEach(element => {
            if (element) {
                const baseSize = this.isMobile ? 14 : 18; // Tamaño base en px
                element.style.fontSize = `${baseSize * scale}px`;
            }
        });
    }
    
    /**
     * Aplica optimizaciones basadas en el dispositivo detectado
     */
    applyOptimizations() {
        // Agregar una clase al body para facilitar el CSS adaptativo
        document.body.classList.add(`device-${this.deviceType}`);
        
        // Específicas para móvil
        if (this.isMobile) {
            document.body.classList.add('mobile-device');
            // Mostrar controles táctiles específicos
            document.querySelectorAll('.mobile-instructions').forEach(el => {
                el.style.display = 'block';
            });
            
            // Simplificar efectos visuales en dispositivos de bajo rendimiento
            if (this.hasPoorGPU) {
                this.simplifyVisualEffects();
            }
        }
        
        // Específicas para tablet
        if (this.isTablet) {
            document.body.classList.add('tablet-device');
        }
        
        // Específicas para desktop
        if (this.isDesktop) {
            document.body.classList.add('desktop-device');
        }
        
        // Ajustar el contenedor del juego
        this.adjustGameContainer();
        
        // Comprobar orientación
        this.checkOrientation();
    }
    
    /**
     * Simplifica efectos visuales para dispositivos de bajo rendimiento
     */
    simplifyVisualEffects() {
        // Reducir animaciones
        document.documentElement.style.setProperty('--animation-speed-modifier', '0.7');
        
        // Desactivar efectos complejos
        document.body.classList.add('low-performance-mode');
        
        // Reducir partículas o efectos específicos
        console.log('Modo de rendimiento bajo activado: efectos visuales simplificados');
    }
}

// Iniciar el gestor de dispositivos cuando el DOM esté cargado
window.addEventListener('DOMContentLoaded', () => {
    window.deviceManager = new DeviceManager();
});
