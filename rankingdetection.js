/**
 * Integración con API de Google Sheets para el ranking
 * Este módulo reemplaza las funciones loadRanking y saveScore para usar la API proporcionada
 */

// URL de la API externa de ranking
const RANKING_API_URL = 'https://script.google.com/macros/s/AKfycbzBUuj5qYyp9PnnP83ofKBGwStiqmk8ixX4CcQiPZWAevi1_vB6rqiXtYioXM4GcnHidw/exec';

/**
 * Carga el ranking desde la API de Google Sheets
 * @param {HTMLElement} targetElement - Elemento donde mostrar el ranking (opcional)
 */
function loadRanking(targetElement) {
    // Determinar elemento objetivo
    let rankingDiv = targetElement;
    if (!rankingDiv) {
        // Intentar encontrar el elemento de ranking en el contexto actual
        if (document.getElementById('ranking')) {
            rankingDiv = document.getElementById('ranking');
        } else if (document.getElementById('rankingModalData')) {
            rankingDiv = document.getElementById('rankingModalData');
        }
    }
    
    if (!rankingDiv) {
        console.error("No se encontró un elemento para mostrar el ranking");
        return;
    }
    
    // Mostrar mensaje de carga
    rankingDiv.innerHTML = '<div class="loading-ranking"><div class="spinner"></div><p>Cargando ranking...</p></div>';
    
    // Obtener datos de la API
    fetch(RANKING_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el ranking desde la API');
            }
            return response.json();
        })
        .then(data => {
            displayRanking(data, rankingDiv);
        })
        .catch(error => {
            console.error('Error al cargar el ranking:', error);
            
            // Cargar datos locales como fallback
            const localRankings = JSON.parse(localStorage.getItem('gameRankings') || '[]');
            displayRanking(localRankings, rankingDiv);
            
            // Mostrar mensaje de error
            const errorMsg = document.createElement('p');
            errorMsg.className = 'ranking-error';
            errorMsg.textContent = 'No se pudo conectar al servidor de ranking. Mostrando datos locales.';
            rankingDiv.appendChild(errorMsg);
        });
}

/**
 * Muestra el ranking en el DOM
 * @param {Array} data - Datos del ranking
 * @param {HTMLElement} target - Elemento donde mostrar el ranking
 */
function displayRanking(data, target) {
    if (!target) {
        console.error("No se proporcionó un elemento para mostrar el ranking");
        return;
    }
    
    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        target.innerHTML = '<div class="empty-ranking"><p>¡Sé el primero en registrar tu puntuación!</p></div>';
        return;
    }
    
    // Obtener nombre y email del jugador actual
    let playerName = '';
    let playerEmail = '';
    
    // Intentar obtener datos del jugador desde localStorage o variables globales
    if (localStorage.getItem('playerName') && localStorage.getItem('playerEmail')) {
        playerName = localStorage.getItem('playerName');
        playerEmail = localStorage.getItem('playerEmail');
    } else if (window.playerName && window.playerEmail) {
        playerName = window.playerName;
        playerEmail = window.playerEmail;
    }
    
    // CORRECCIÓN: Ordenar de mayor a menor puntuación
    const sortedData = data.sort((a, b) => {
        // Asegurar que estamos comparando números
        const scoreA = Number(a.score || a.puntos || 0);
        const scoreB = Number(b.score || b.puntos || 0);
        return scoreB - scoreA;
    });
    
    // Limitar a los 20 mejores
    const topPlayers = sortedData.slice(0, 20);
    
    // Buscar jugador actual
    const currentPlayerIndex = playerName ? topPlayers.findIndex(p => {
        // Buscar por nombre y/o email
        const pName = p.name || p.nombre || '';
        const pEmail = p.email || p.correo || '';
        return pName === playerName || pEmail === playerEmail;
    }) : -1;
    
    // Construir HTML de la tabla
    let rankingHTML = '<h2>Ranking de Jugadores</h2>';
    rankingHTML += '<table><thead><tr><th>#</th><th>Jugador</th><th>Puntos</th></tr></thead><tbody>';
    
    topPlayers.forEach((player, index) => {
        // Extraer datos con compatibilidad para diferentes estructuras
        const playerName = player.name || player.nombre || 'Anónimo';
        const playerScore = Number(player.score || player.puntos || 0);
        
        // Sanitizar nombre para evitar XSS
        const sanitizedName = String(playerName)
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .substring(0, 15);
        
        // Asignar clases para estilos
        let rowClass = index < 3 ? `rank-${index+1}` : '';
        
        // Resaltar jugador actual
        if (index === currentPlayerIndex) {
            rowClass += ' current-player';
        }
        
        rankingHTML += `<tr class="${rowClass}">
            <td>${index + 1}</td>
            <td>${sanitizedName}</td>
            <td>${playerScore}</td>
        </tr>`;
    });
    
    rankingHTML += '</tbody></table>';
    
    // Actualizar DOM
    target.innerHTML = rankingHTML;
    
    // Mostrar posición del jugador actual si no está en el top 20
    if (currentPlayerIndex === -1 && playerName) {
        const fullPlayerIndex = sortedData.findIndex(p => {
            const pName = p.name || p.nombre || '';
            const pEmail = p.email || p.correo || '';
            return pName === playerName || pEmail === playerEmail;
        });
        
        if (fullPlayerIndex !== -1) {
            const playerPosition = document.createElement('p');
            playerPosition.className = 'player-position';
            playerPosition.textContent = `Tu posición: ${fullPlayerIndex + 1} de ${sortedData.length}`;
            target.appendChild(playerPosition);
        } else {
            // Mensaje para animar a jugar
            let currentScore = 0;
            if (window.score !== undefined) {
                currentScore = window.score;
            } else if (document.getElementById('score')) {
                currentScore = parseInt(document.getElementById('score').textContent) || 0;
            }
            
            if (currentScore > 0) {
                const playerPosition = document.createElement('p');
                playerPosition.className = 'player-position';
                playerPosition.textContent = `¡Tu puntuación se registrará al finalizar la partida!`;
                target.appendChild(playerPosition);
            }
        }
    }
}

/**
 * Guarda la puntuación en la API y localmente
 * @param {string} name - Nombre del jugador
 * @param {string} email - Email del jugador
 * @param {number} score - Puntuación
 */
function saveScore(name, email, score) {
    // Validar datos
    if (!name || !email || score === undefined) {
        console.error("Datos incompletos para guardar puntuación");
        return;
    }
    
    // Asegurar que score es un número
    const numericScore = Number(score) || 0;
    
    // Crear objeto de puntuación
    const scoreData = {
        nombre: name.substring(0, 15), // Usar nombre en español para la API
        correo: email,
        puntos: numericScore,
        fecha: new Date().toISOString(),
        dispositivo: window.deviceManager ? window.deviceManager.deviceType : 'unknown'
    };
    
    console.log(`Guardando puntuación: ${name}, ${email}, ${numericScore}`);
    
    // Guardar en localStorage siempre como respaldo
    const rankings = JSON.parse(localStorage.getItem('gameRankings') || '[]');
    
    // No duplicar entradas para el mismo jugador
    const existingIndex = rankings.findIndex(r => r.name === name && r.email === email);
    if (existingIndex >= 0) {
        // Actualizar solo si la puntuación es mayor
        if (numericScore > (Number(rankings[existingIndex].score) || 0)) {
            rankings[existingIndex] = {
                name: name,
                email: email,
                score: numericScore,
                date: new Date().toISOString()
            };
        }
    } else {
        // Añadir nueva entrada
        rankings.push({
            name: name,
            email: email,
            score: numericScore,
            date: new Date().toISOString()
        });
    }
    
    // Guardar en localStorage
    localStorage.setItem('gameRankings', JSON.stringify(rankings));
    
    // Enviar a la API
    fetch(RANKING_API_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para Google Apps Script
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => {
        console.log("Puntuación enviada a la API");
        // La API devuelve no-cors, así que no podemos verificar el estado
        // Determinar dónde mostrar el ranking
        const rankingElement = document.getElementById('ranking') || document.getElementById('rankingModalData');
        loadRanking(rankingElement); // Recargar ranking
    })
    .catch(error => {
        console.error('Error al guardar la puntuación en la API:', error);
        console.log("Usando datos locales como fallback");
        const rankingElement = document.getElementById('ranking') || document.getElementById('rankingModalData');
        loadRanking(rankingElement); // Cargar de todos modos con datos locales
    });
}

// Exportar funciones para uso global
window.loadRanking = loadRanking;
window.saveScore = saveScore;
window.displayRanking = displayRanking;

// Cargar ranking en rankingModalData cuando se abre el modal
document.addEventListener('DOMContentLoaded', () => {
    const rankingButton = document.getElementById('rankingButton');
    const rankingModal = document.getElementById('rankingModal');
    const rankingModalData = document.getElementById('rankingModalData');
    const rankingCloseBtn = document.querySelector('.ranking-close-btn');
    const closeRankingBtn = document.getElementById('closeRankingBtn');
    
    if (rankingButton && rankingModal && rankingModalData) {
        rankingButton.addEventListener('click', () => {
            rankingModal.style.display = 'block';
            loadRanking(rankingModalData);
        });
        
        if (rankingCloseBtn) {
            rankingCloseBtn.addEventListener('click', () => {
                rankingModal.style.display = 'none';
            });
        }
        
        if (closeRankingBtn) {
            closeRankingBtn.addEventListener('click', () => {
                rankingModal.style.display = 'none';
            });
        }
    }
});
