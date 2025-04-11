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
        this.isIOS = false;
        this.isAndroid = false;
        this.isLowEndDevice = false;
        this.deviceModel = 'unknown';
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.touchSupported = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.hasLowMemory = navigator.deviceMemory ? navigator.deviceMemory < 4 : false;
        this.hasPoorGPU = false;
        this.isLandscape = window.innerWidth > window.innerHeight;
        
        // Detectar características del dispositivo
        this.detectDevice();
        this.detectBrowser();
        this.detectOS();
        this.detectSpecificDevice();
        
        // Escuchar cambios en el tamaño de la ventana
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Iniciar optimizaciones
        this.applyDeviceSpecificOptimizations();
        this.applyOptimizations();
        
        console.log(`DeviceManager: ${this.deviceType} - ${this.osName} ${this.osVersion} - ${this.browserName} ${this.browserVersion} - ${this.deviceModel}`);
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
        // Detectar Samsung Internet
        else if (userAgent.match(/samsungbrowser/i)) {
            this.browserName = 'Samsung Internet';
            this.browserVersion = userAgent.match(/samsungbrowser\/(\d+)/i)[1];
        }
        // Detectar MIUI Browser
        else if (userAgent.match(/miuibrowser/i)) {
            this.browserName = 'MIUI Browser';
            this.browserVersion = userAgent.match(/miuibrowser\/(\d+)/i)[1];
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
        
        // Detectar iOS (iPhone, iPad, iPod)
        if (userAgent.match(/iphone|ipad|ipod/i)) {
            this.osName = 'iOS';
            this.isIOS = true;
            
            // Intentar obtener la versión de iOS
            const match = userAgent.match(/os (\d+)[._](\d+)/i);
            if (match) {
                this.osVersion = `${match[1]}.${match[2]}`;
            } else {
                this.osVersion = 'Desconocida';
            }
        }
        // Detectar Android
        else if (userAgent.match(/android/i)) {
            this.osName = 'Android';
            this.isAndroid = true;
            
            // Intentar obtener la versión de Android
            const match = userAgent.match(/android (\d+)(?:\.(\d+))?/i);
            if (match) {
                this.osVersion = match[2] ? `${match[1]}.${match[2]}` : match[1];
            } else {
                this.osVersion = 'Desconocida';
            }
        }
        // Detectar Windows
        else if (userAgent.match(/windows/i)) {
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
     * Detecta el modelo específico del dispositivo y sus características
     */
    detectSpecificDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // CORRECCIÓN: Detección específica de modelos de dispositivos
        
        // iPhone
        if (userAgent.includes('iphone')) {
            // iPhone modelos específicos
            if (this.screenHeight === 812 || this.screenHeight === 896 || this.screenHeight > 900) {
                // iPhone X/XS/11 Pro/12/13/14
                this.deviceModel = 'iPhone X+';
                this.isLowEndDevice = false;
            } else if (this.screenHeight === 736 || this.screenHeight === 667) {
                // iPhone 6/6S/7/8 Plus
                this.deviceModel = 'iPhone 6-8';
                this.isLowEndDevice = this.osVersion < 13;
            } else if (this.screenHeight <= 568) {
                // iPhone 5/5S/SE (primera generación)
                this.deviceModel = 'iPhone 5/SE';
                this.isLowEndDevice = true;
                this.hasPoorGPU = true;
            } else {
                this.deviceModel = 'iPhone';
                this.isLowEndDevice = this.osVersion < 12;
            }
        } 
        // iPad
        else if (userAgent.includes('ipad')) {
            this.deviceModel = 'iPad';
            this.isLowEndDevice = this.osVersion < 12;
        } 
        // Samsung
        else if (userAgent.includes('samsung') || userAgent.includes('sm-')) {
            if (userAgent.match(/sm-g97\d/i) || userAgent.match(/sm-g99\d/i) || userAgent.match(/sm-s\d+/i)) {
                // Galaxy S10/S20/S21/S22/S23 series
                this.deviceModel = 'Samsung Galaxy S de gama alta';
                this.isLowEndDevice = false;
            } else if (userAgent.match(/sm-a\d+/i)) {
                // Galaxy A series
                this.deviceModel = 'Samsung Galaxy A';
                this.isLowEndDevice = userAgent.match(/sm-a[0-4]\d+/i) !== null; // A10-A40 son de gama media-baja
            } else if (userAgent.match(/sm-j\d+/i)) {
                // Galaxy J series (gama baja)
                this.deviceModel = 'Samsung Galaxy J';
                this.isLowEndDevice = true;
                this.hasPoorGPU = true;
            } else {
                this.deviceModel = 'Samsung Galaxy';
                // Para algunos Samsung más antiguos o si no podemos detectar el modelo específico
                this.isLowEndDevice = this.screenWidth < 720 || this.pixelRatio < 2;
            }
        } 
        // Xiaomi
        else if (userAgent.includes('xiaomi') || userAgent.includes('redmi') || userAgent.includes('poco')) {
            if (userAgent.includes('mi 10') || userAgent.includes('mi 11') || userAgent.includes('mi 12') || 
                userAgent.includes('poco f') || userAgent.includes('mi note 10')) {
                // Gama alta de Xiaomi
                this.deviceModel = 'Xiaomi gama alta';
                this.isLowEndDevice = false;
            } else if (userAgent.includes('redmi note')) {
                // Redmi Note
                this.deviceModel = 'Redmi Note';
                this.isLowEndDevice = userAgent.match(/redmi note [1-6]/i) !== null; // 1-6 más antiguos
            } else if (userAgent.includes('redmi')) {
                // Redmi (gama media-baja)
                this.deviceModel = 'Redmi';
                this.isLowEndDevice = true;
            } else {
                this.deviceModel = 'Xiaomi';
                this.isLowEndDevice = this.screenWidth < 720 || this.pixelRatio < 2;
            }
        } 
        // Motorola
        else if (userAgent.includes('moto') || userAgent.includes('motorola')) {
            if (userAgent.includes('moto g')) {
                // Moto G (gama media)
                this.deviceModel = 'Motorola Moto G';
                this.isLowEndDevice = userAgent.match(/moto g[1-5]/i) !== null; // G1-G5 son más antiguos
            } else if (userAgent.includes('moto e')) {
                // Moto E (gama baja)
                this.deviceModel = 'Motorola Moto E';
                this.isLowEndDevice = true;
                this.hasPoorGPU = true;
            } else if (userAgent.includes('edge')) {
                // Motorola Edge (gama alta)
                this.deviceModel = 'Motorola Edge';
                this.isLowEndDevice = false;
            } else {
                this.deviceModel = 'Motorola';
                this.isLowEndDevice = this.screenWidth < 720 || this.pixelRatio < 2;
            }
        } 
        // OPPO
        else if (userAgent.includes('oppo') || userAgent.includes('cph')) {
            this.deviceModel = 'OPPO';
            this.isLowEndDevice = this.screenWidth < 720;
        }
        // Huawei
        else if (userAgent.includes('huawei') || userAgent.includes('honor')) {
            this.deviceModel = userAgent.includes('honor') ? 'Honor' : 'Huawei';
            this.isLowEndDevice = this.screenWidth < 720;
        }
        // LG
        else if (userAgent.includes('lg')) {
            this.deviceModel = 'LG';
            this.isLowEndDevice = this.screenWidth < 720;
        }
        // OnePlus
        else if (userAgent.includes('oneplus')) {
            this.deviceModel = 'OnePlus';
            this.isLowEndDevice = false; // OnePlus suelen ser de gama media-alta
        }
        // Para otros dispositivos Android
        else if (this.isAndroid) {
            this.deviceModel = 'Android';
            
            // Intentar determinar gama por características del dispositivo
            const lowEndIndicators = [
                this.pixelRatio < 2,        // Pantalla de menor densidad
                this.screenWidth < 720,      // Resolución baja
                this.hasLowMemory,           // Poca memoria
                Number(this.osVersion) < 9   // Android antiguo
            ];
            
            // Si cumple al menos 2 de los criterios, lo consideramos de gama baja
            this.isLowEndDevice = lowEndIndicators.filter(Boolean).length >= 2;
            this.hasPoorGPU = lowEndIndicators.filter(Boolean).length >= 3;
        }
        
        // Si no pudimos detectar lo anterior, usamos heurísticas adicionales
        if (!this.isLowEndDevice && !this.hasPoorGPU) {
            // Comprobar por características generales de hardware
            this.hasPoorGPU = this.checkForPoorGPU();
            if (!this.isLowEndDevice) {
                this.isLowEndDevice = this.hasPoorGPU || 
                                   (this.hasLowMemory && this.pixelRatio < 2) ||
                                   (this.isIOS && parseFloat(this.osVersion) < 12) ||
                                   (this.isAndroid && parseFloat(this.osVersion) < 8);
            }
        }

        // Determinar modos de optimización automáticamente
        if (this.isLowEndDevice || this.hasPoorGPU) {
            // Modo de bajo rendimiento para dispositivos antiguos o de gama baja
            this.performanceMode = 'low';
        } else if (this.isMobile && !this.isTablet) {
            // Modo equilibrado para móviles modernos
            this.performanceMode = 'balanced';
        } else {
            // Modo de calidad para tablets y desktops
            this.performanceMode = 'high';
        }
    }
    
    /**
     * Comprueba si el dispositivo probablemente tiene una GPU de bajo rendimiento
     */
    checkForPoorGPU() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Lista mejorada de dispositivos conocidos con GPU de bajo rendimiento
        const lowEndDevicePatterns = [
            /iphone\s+[56]/i,  // iPhone 5, 6
            /iphone\s+se\s+\(1/i, // iPhone SE primera generación
            /ipod/i,
            /ipad\s+mini\s+[123]/i, // iPad Mini antiguas
            /galaxy\s+j/i,    // Samsung Galaxy J series
            /galaxy\s+a[1-4]/i, // Samsung Galaxy A10-A40
            /moto\s+e/i,      // Motorola Moto E
            /moto\s+g[1-4]/i, // Motorola Moto G1-G4
            /redmi\s+[1-6]/i, // Xiaomi Redmi antiguos
            /redmi\s+note\s+[1-5]/i, // Redmi Note antiguos
            /mediatek/i,       // MediaTek suele estar en dispositivos de gama baja
            /mali-4/i,        // Mali-400 es un GPU antiguo
            /mali-t7/i,       // Mali-T720 y similares, GPU más antiguos
            /adreno\s+3/i     // Adreno 300 series, GPU antiguos
        ];
        
        // Comprobar si coincide con algún patrón
        for (const pattern of lowEndDevicePatterns) {
            if (pattern.test(userAgent)) {
                return true;
            }
        }
        
        // Verificar si es un dispositivo móvil antiguo
        if (
            (this.isIOS && parseFloat(this.osVersion) < 11) || 
            (this.isAndroid && parseFloat(this.osVersion) < 7)
        ) {
            return true;
        }
        
        // Otros indicadores de posible bajo rendimiento GPU
        if (this.hasLowMemory && this.pixelRatio < 2 && this.isMobile) {
            return true;
        }
        
        // Comprobación de resolución para dispositivos de muy baja gama
        if (this.screenWidth < 640 || (this.isMobile && this.screenHeight < 480)) {
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
        this.isLandscape = window.innerWidth > window.innerHeight;
        
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
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // CORRECCIÓN: Solo mostrar mensaje de orientación en móviles y tablets cuando están en vertical
        if ((this.isMobile || this.isTablet) && !isLandscape) {
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
     * Ajusta el tamaño del contenedor del juego según el dispositivo
     */
    adjustGameContainer() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        // CORRECCIÓN: Mejor cálculo para mantener la proporción de aspecto por dispositivo
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Diferentes proporciones según el dispositivo
        let targetAspectRatio = 2; // Proporción base 2:1
        
        // Ajustes específicos por dispositivo
        if (this.isIOS) {
            // iPhones tienen proporciones más altas, especialmente los nuevos
            if (this.deviceModel.includes('X+')) {
                targetAspectRatio = 2.16; // iPhone X y más nuevos
            } else {
                targetAspectRatio = 1.77; // iPhones más antiguos
            }
        } else if (this.isAndroid) {
            // Android tiene proporciones variadas
            if (this.deviceModel.includes('Samsung')) {
                targetAspectRatio = 2.05; // Samsung modernos
            } else if (this.deviceModel.includes('Xiaomi') || this.deviceModel.includes('Redmi')) {
                targetAspectRatio = 2.1; // Xiaomi y Redmi
            } else {
                targetAspectRatio = 1.9; // Android genérico
            }
        }
        
        // CORRECCIÓN: Mejores cálculos para diferentes dispositivos
        let gameWidth, gameHeight;
        
        // Calcular tamaño según proporción y espacio disponible
        const availableWidth = windowWidth * 0.95; // 95% del ancho
        const availableHeight = windowHeight * 0.92; // 92% de la altura
        const availableRatio = availableWidth / availableHeight;
        
        if (availableRatio > targetAspectRatio) {
            // Si la ventana es más ancha que alta
            gameHeight = availableHeight;
            gameWidth = gameHeight * targetAspectRatio;
        } else {
            // Si la ventana es más alta que ancha
            gameWidth = availableWidth;
            gameHeight = gameWidth / targetAspectRatio;
        }
        
        // Aplicar tamaño máximo para evitar elementos demasiado grandes en pantallas grandes
        if (gameWidth > 1600 && !this.isMobile) {
            gameWidth = 1600;
            gameHeight = gameWidth / targetAspectRatio;
        }
        
        // Ajustar para notch en iPhones modernos
        if (this.deviceModel.includes('iPhone X+') && this.isLandscape) {
            gameHeight -= 30; // Reducir por el notch
        }
        
        // Aplicar las dimensiones calculadas
        gameContainer.style.width = `${gameWidth}px`;
        gameContainer.style.height = `${gameHeight}px`;
        
        // Guardar la escala del juego para uso en todo el código
        const baseWidth = 800; // Ancho de referencia del diseño
        this.gameScale = gameWidth / baseWidth;
        
        // Escalar los elementos del juego
        this.scaleGameElements(this.gameScale);
        
        console.log(`GameContainer ajustado a: ${gameWidth.toFixed(0)}x${gameHeight.toFixed(0)}, escala: ${this.gameScale.toFixed(2)}`);
    }
    
    /**
     * Escala los elementos del juego en proporción según el dispositivo
     */
    scaleGameElements(scale) {
        // CORRECCIÓN: Mejor escalado para diferentes dispositivos
        
        // Factor de escala ajustado por densidad de píxeles y tipo de dispositivo
        let adjustedScale = scale;
        
        // Ajustar por pixelRatio para pantallas de alta densidad
        if (this.pixelRatio > 2.5) {
            // Para dispositivos con muy alta densidad de píxeles (iPhone 12/13 Pro, etc.)
            adjustedScale *= 0.9;
        } else if (this.pixelRatio > 2) {
            // Para dispositivos con alta densidad de píxeles
            adjustedScale *= 0.95;
        }
        
        // Compensación adicional por tamaño total de pantalla
        if (this.screenWidth > 1200) {
            // Pantallas muy grandes
            adjustedScale *= 0.95;
        } else if (this.screenWidth < 350) {
            // Pantallas muy pequeñas
            adjustedScale *= 1.1;
        }
        
        // Ajustar tamaño del jugador
        const player = document.getElementById('player');
        if (player) {
            // Tamaño base ajustado según dispositivo
            let baseSize = 40; // Tamaño estándar
            
            // Ajustes por tipo de dispositivo
            if (this.isLowEndDevice) {
                baseSize = 38; // Ligeramente más pequeño en dispositivos de baja gama
            } else if (this.deviceModel.includes('iPhone X+')) {
                baseSize = 42; // Ligeramente más grande en iPhones modernos
            }
            
            player.style.width = `${baseSize * adjustedScale}px`;
            player.style.height = `${baseSize * adjustedScale}px`;
        }
        
        // Ajustar tamaño de textos con diferentes bases según dispositivo
        document.querySelectorAll('#score, #timer, #combo').forEach(element => {
            if (!element) return;
            
            // Base de tamaño variable según dispositivo
            let baseSize;
            
            if (element.id === 'timer') {
                // El timer normalmente necesita ser más visible
                baseSize = this.isMobile ? 16 : 20;
            } else if (element.id === 'combo') {
                // El combo puede ser ligeramente más pequeño
                baseSize = this.isMobile ? 14 : 16;
            } else {
                // Score estándar
                baseSize = this.isMobile ? 15 : 18;
            }
            
            // Ajustes específicos por dispositivo
            if (this.isIOS && this.deviceModel.includes('iPhone 5/SE')) {
                baseSize *= 0.9; // Más pequeño en iPhone SE/5
            } else if (this.deviceModel.includes('Galaxy J') || this.deviceModel.includes('Moto E')) {
                baseSize *= 0.9; // Más pequeño en dispositivos de gama baja
            }
            
            element.style.fontSize = `${baseSize * adjustedScale}px`;
        });
        
        // Escalar botones para mejor experiencia táctil en móviles
        document.querySelectorAll('button, .ranking-btn, #muteButton').forEach(button => {
            // Ajustes específicos para botones táctiles
            if (this.isMobile || this.isTablet) {
                // Hacer botones más grandes en dispositivos táctiles
                const touchScale = this.isTablet ? 1.05 : 1.1;
                
                // Si el botón ya tiene una escala, modificarla
                const currentTransform = window.getComputedStyle(button).transform;
                if (currentTransform && currentTransform !== 'none' && !currentTransform.includes('scale')) {
                    button.style.transform += ` scale(${touchScale})`;
                } else if (!currentTransform || currentTransform === 'none') {
                    button.style.transform = `scale(${touchScale})`;
                }
                
                // Aumentar padding para área táctil
                const currentPadding = window.getComputedStyle(button).padding;
                if (currentPadding) {
                    const paddingValue = parseInt(currentPadding);
                    if (!isNaN(paddingValue)) {
                        const newPadding = paddingValue + 4;
                        button.style.padding = `${newPadding}px ${newPadding * 1.5}px`;
                    }
                }
            }
        });
    }
    
    /**
     * Aplica optimizaciones específicas según el dispositivo detectado
     */
    applyDeviceSpecificOptimizations() {
        // 1. Establecer variables CSS personalizadas para cada dispositivo
        this.setDeviceSpecificCSSVariables();
        
        // 2. Ajustar comportamiento del juego según características
        this.adjustGameBehavior();
        
        // 3. Aplicar optimizaciones de rendimiento específicas
        if (this.hasPoorGPU || this.isLowEndDevice) {
            this.applyLowEndOptimizations();
        } else if (this.performanceMode === 'balanced') {
            this.applyBalancedOptimizations();
        }
    }
    
    /**
     * Establece variables CSS específicas por dispositivo
     */
    setDeviceSpecificCSSVariables() {
        // Obtener elemento root para variables CSS
        const root = document.documentElement;
        
        // Variables base para diferentes tipos de dispositivos
        if (this.isMobile) {
            // Móviles
            if (this.isLowEndDevice) {
                // Móviles de gama baja
                root.style.setProperty('--game-scale', '0.8');
                root.style.setProperty('--font-scale', '0.85');
                root.style.setProperty('--animation-speed-modifier', '0.7');
            } else {
                // Móviles modernos
                root.style.setProperty('--game-scale', '0.9');
                root.style.setProperty('--font-scale', '0.9');  
                root.style.setProperty('--animation-speed-modifier', '1');
            }
        } else if (this.isTablet) {
            // Tablets
            root.style.setProperty('--game-scale', '0.95');
            root.style.setProperty('--font-scale', '0.95');
            root.style.setProperty('--animation-speed-modifier', '1');
        } else {
            // Desktop
            root.style.setProperty('--game-scale', '1');
            root.style.setProperty('--font-scale', '1');
            root.style.setProperty('--animation-speed-modifier', '1');
        }
        
        // Ajustes específicos para diferentes marcas/modelos
        if (this.isIOS) {
            // Ajustes específicos para iOS
            if (this.deviceModel.includes('iPhone 5/SE')) {
                root.style.setProperty('--game-scale', '0.75');
                root.style.setProperty('--font-scale', '0.75');
            } else if (this.deviceModel.includes('iPhone 6-8')) {
                root.style.setProperty('--game-scale', '0.85');
                root.style.setProperty('--font-scale', '0.85');
            }
            
            // Safari en iOS necesita ajustes específicos
            root.style.setProperty('--safari-margin-fix', '0px');
            if (this.browserName === 'Safari') {
                root.style.setProperty('--safari-margin-fix', '20px');
            }
        } else if (this.deviceModel.includes('Samsung')) {
            // Ajustes específicos para Samsung
            if (this.deviceModel.includes('gama alta')) {
                // Para Galaxy S de alta gama
                root.style.setProperty('--extra-spacing', '2px');
                root.style.setProperty('--button-scale', '1.05');
            } else if (this.deviceModel.includes('Galaxy J')) {
                // Para modelos de gama baja
                root.style.setProperty('--game-scale', '0.75');
                root.style.setProperty('--animation-speed-modifier', '0.6');
            }
        } else if (this.deviceModel.includes('Xiaomi') || this.deviceModel.includes('Redmi')) {
            // Ajustes específicos para Xiaomi
            if (this.deviceModel.includes('gama alta')) {
                // Xiaomi de gama alta tienen pantallas brillantes
                root.style.setProperty('--extra-contrast', '1.1');
            } else {
                // Para modelos de gama media-baja
                root.style.setProperty('--extra-contrast', '1.05');
                root.style.setProperty('--animation-speed-modifier', '0.85');
            }
        } else if (this.deviceModel.includes('Motorola')) {
            // Ajustes específicos para Motorola
            if (this.deviceModel.includes('Moto E')) {
                // Moto E (gama baja)
                root.style.setProperty('--game-scale', '0.7');
                root.style.setProperty('--font-scale', '0.8');
                root.style.setProperty('--animation-speed-modifier', '0.6');
            } else if (this.deviceModel.includes('Moto G')) {
                // Moto G (gama media)
                root.style.setProperty('--game-scale', '0.85');
                root.style.setProperty('--font-scale', '0.85');
            }
        }
    }
    
    /**
     * Ajusta el comportamiento del juego según el dispositivo
     */
    adjustGameBehavior() {
        // Ajustar física y velocidad según el dispositivo
        if (window.gameSpeed !== undefined) {
            // Si existe la variable de velocidad global del juego
            if (this.isLowEndDevice) {
                // Reducir velocidad ligeramente en dispositivos de baja gama
                window.baseSpeed = 4.5; // Velocidad base más lenta
                window.gravity = 0.45;  // Gravedad más suave
            } else if (this.performanceMode === 'balanced') {
                // Velocidad estándar en dispositivos de gama media
                window.baseSpeed = 5;
                window.gravity = 0.5;
            } else {
                // Velocidad normal en gama alta
                window.baseSpeed = 5;
                window.gravity = 0.5;
            }
        }
        
        // Ajustar intervalos de generación de obstáculos y monedas
        if (this.isLowEndDevice) {
            // Menos objetos en pantalla para dispositivos de baja gama
            if (window.obstacleInterval) clearInterval(window.obstacleInterval);
            if (window.coinInterval) clearInterval(window.coinInterval);
            
            window.obstacleInterval = setInterval(window.spawnObstacle, 2500); // Más espaciados
            window.coinInterval = setInterval(window.spawnCoin, 3500);
        }
        
        // Ajustar controles táctiles para mayor responsividad en móviles
        if (this.isMobile || this.isTablet) {
            document.addEventListener('touchstart', function(e) {
                // Prevenir zoom y comportamientos no deseados
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    /**
     * Aplica optimizaciones para dispositivos de bajo rendimiento
     */
    applyLowEndOptimizations() {
        // 1. Simplificar efectos visuales
        this.simplifyVisualEffects();
        
        // 2. Reducir número de elementos en pantalla
        if (window.maxObstacles && typeof window.maxObstacles === 'number') {
            window.maxObstacles = 3; // Limitar obstáculos simultáneos
        }
        
        if (window.maxCoins && typeof window.maxCoins === 'number') {
            window.maxCoins = 3; // Limitar monedas simultáneas
        }
        
        // 3. Reducir calidad visual para mejorar rendimiento
        document.body.classList.add('low-performance-mode');
        
        // 4. Desactivar efectos de partículas si existen
        const particles = document.querySelectorAll('.particle-effect');
        particles.forEach(p => p.remove());
        
        console.log('Modo de rendimiento bajo activado: optimizaciones para dispositivo de gama baja aplicadas');
    }
    
    /**
     * Aplica optimizaciones balanceadas para dispositivos de gama media
     */
    applyBalancedOptimizations() {
        // 1. Mantener efectos visuales pero optimizarlos
        document.documentElement.style.setProperty('--animation-quality', 'optimized');
        
        // 2. Limitar algunos efectos secundarios
        document.body.classList.add('balanced-performance-mode');
        
        // 3. Mantener efectos de partículas pero reducir cantidad
        if (window.particleMultiplier && typeof window.particleMultiplier === 'number') {
            window.particleMultiplier = 0.7; // 70% de partículas
        }
        
        console.log('Modo de rendimiento balanceado activado');
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
    
    /**
     * Aplica optimizaciones generales
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
}

// Iniciar el gestor de dispositivos cuando el DOM esté cargado
window.addEventListener('DOMContentLoaded', () => {
    window.deviceManager = new DeviceManager();
});
