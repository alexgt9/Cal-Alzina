// Configuration management
const CONFIG_KEY = 'calAlzinaConfig';

// Load configuration from localStorage
function loadConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        haDomain: '',
        token: ''
    };
}

// Save configuration to localStorage
function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// Show status message
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status-message show ${type}`;
    
    if (type !== 'loading') {
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 5000);
    }
}

// Call webhook
async function callWebhook(webhookId, action) {
    const config = loadConfig();
    
    if (!config.haDomain) {
        showStatus('Error: enllaç no configurat correctament', 'error');
        return false;
    }

    // Get visitor name
    const visitorName = document.getElementById('visitorName').value.trim();
    if (!visitorName) {
        showStatus('Si us plau, escriu el teu nom primer', 'error');
        document.getElementById('visitorName').focus();
        return false;
    }

    const webhookUrl = `${config.haDomain}/api/webhook/${webhookId}`;

    try {
        showStatus('Enviant...', 'loading');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: visitorName,
                action: action,
                timestamp: new Date().toISOString(),
                token: config.token
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        return false;
    }
}

// Notify button handler
async function handleNotify() {
    const result = await callWebhook('invitado_en_la_puerta', 'notify');
    
    if (result) {
        showStatus('✅ Notificació enviada!', 'success');
    }
}

// Open door button handler
async function handleOpenDoor() {
    const result = await callWebhook('abrir_puerta', 'open_door');
    
    if (result) {
        showStatus('✅ Porta oberta!', 'success');
    }
}

// Load configuration from query parameters
function loadConfigFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain');
    const token = urlParams.get('token');
    
    if (domain && token) {
        const config = {
            haDomain: domain.trim().replace(/\/$/, ''),
            token: token.trim()
        };
        saveConfig(config);
        
        // Clean URL without reloading
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);
        
        showStatus('✅ Llest per utilitzar!', 'success');
    } else if (domain || token) {
        showStatus('Error: enllaç incomplet', 'error');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load config from query params if present
    loadConfigFromQuery();
    
    // Action buttons
    document.getElementById('notifyBtn').addEventListener('click', handleNotify);
    document.getElementById('openDoorBtn').addEventListener('click', handleOpenDoor);
});
