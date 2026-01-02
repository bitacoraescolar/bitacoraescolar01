// PASTE YOUR GOOGLE SHEET CSV LINK HERE
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIf3TGrb1_ULOsUD4DdQu52yO3tAW0HLhhfvzI9iBfv8mumy0lSOo8g_HAzf5Vo8u8vRh5DvT-scE3/pub?gid=125522208&single=true&output=csv'; 

async function fetchSchoolEvents() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const events = parseCSV(data);
        displayEvents(events);
        //console.log(events);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.querySelector('main').innerHTML = '<p style="text-align:center; color:red;">Error loading events. Please try again later.</p>';
    }
}

// Helper: Parse CSV text into an Array of Objects
function parseCSV(csvText) {
    const rows = csvText.split('\n');
    const headers = rows[0].split(',').map(header => header.trim());
    const events = [];

    for (let i = 1; i < rows.length; i++) {
        // Handle potential empty rows
        if (!rows[i].trim()) continue;

        // Simple split by comma (Note: This breaks if your description contains commas. 
        // Ideally, avoid commas in the sheet or use a robust CSV library)
        const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        
        let event = {};
        headers.forEach((header, index) => {
            // Clean up quotes if present
            let val = values[index] ? values[index].trim() : '';
            val = val.replace(/^"|"$/g, ''); 
            event[header] = val;
        });
        events.push(event);
    }
    return events;
}

function displayEvents(events) {
    const ongoingContainer = document.getElementById('ongoing-events');
    const futureContainer = document.getElementById('future-events');
    const pastContainer = document.getElementById('past-events');
    const noOngoingMsg = document.getElementById('no-ongoing');

    // Limpiar contenedores por si acaso
    ongoingContainer.innerHTML = '';
    futureContainer.innerHTML = '';
    pastContainer.innerHTML = '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Convertir las fechas de texto a objetos Date reales para poder comparar
    const processedEvents = events.map(event => {
        const parts = event.Date.split('-');
        return {
            ...event,
            dateObj: new Date(parts[0], parts[1] - 1, parts[2])
        };
    });

    // 2. ORDENAR: De más antiguo a más reciente (Cronológico general)
    processedEvents.sort((a, b) => a.dateObj - b.dateObj);

    let hasOngoing = false;
    
    // 3. SEPARAR EVENTOS
    const futureEvents = processedEvents.filter(e => e.dateObj > today);
    const ongoingEvents = processedEvents.filter(e => e.dateObj.getTime() === today.getTime());
    const pastEvents = processedEvents.filter(e => e.dateObj < today);

    // 4. RE-ORDENAR PASADOS: El más reciente primero (Descendente)
    pastEvents.sort((a, b) => b.dateObj - a.dateObj);

    // 5. RENDERIZAR EVENTOS
    

    // 4. RE-ORDENAR PASADOS: El más reciente primero (Descendente)
    pastEvents.sort((a, b) => b.dateObj - a.dateObj);

    // 5. APLICAR LÍMITE: Solo tomar los 3 más recientes
    const limitedPastEvents = pastEvents.slice(0, 3);

// Hoy (Sucediendo ahora)
    ongoingEvents.forEach(event => {
        hasOngoing = true;
        ongoingContainer.innerHTML += createCardHTML(event);
    });

    // Futuros (Próximos)
    futureEvents.forEach(event => {
        futureContainer.innerHTML += createCardHTML(event);
    });

    // Pasados (Limitados a 3)
    limitedPastEvents.forEach(event => {
        pastContainer.innerHTML += createCardHTML(event);
    });    

    if (!hasOngoing) noOngoingMsg.style.display = 'block';
}

// Función auxiliar para no repetir código de creación de tarjeta
function createCardHTML(event) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateSpanish = event.dateObj.toLocaleDateString('es-ES', options);
    dateSpanish = dateSpanish.charAt(0).toUpperCase() + dateSpanish.slice(1);

    return `
        <div class="event-card">
            <div class="event-date">${dateSpanish}</div>
            <h3 class="event-title">${event.Title}</h3>
            <p class="event-desc">${event.Description}</p>
            <div class="event-meta">📍 ${event.Location} | 🏷️ ${event.Type}</div>
        </div>
    `;
}

// Run on load
document.addEventListener('DOMContentLoaded', fetchSchoolEvents);