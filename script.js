// Configuration management
const CONFIG_KEY = 'calAlzinaConfig';

// Load configuration from localStorage
function loadConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        haDomain: ''
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
async function callWebhook(webhookId) {
    const config = loadConfig();
    
    if (!config.haDomain) {
        showStatus('Si us plau, configura primer el domini de Home Assistant', 'error');
        document.getElementById('settingsPanel').classList.remove('hidden');
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
            body: JSON.stringify({})
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
    const result = await callWebhook('visitant_arribat');
    
    if (result) {
        showStatus('✅ Notificació enviada!', 'success');
    }
}

// Open door button handler
async function handleOpenDoor() {
    const result = await callWebhook('obrir_porta');
    
    if (result) {
        showStatus('✅ Porta oberta!', 'success');
    }
}

// Settings form handlers
function loadSettingsForm() {
    const config = loadConfig();
    document.getElementById('haDomain').value = config.haDomain;
}

function handleSaveSettings(e) {
    e.preventDefault();
    
    const config = {
        haDomain: document.getElementById('haDomain').value.trim().replace(/\/$/, '')
    };
    
    saveConfig(config);
    showStatus('✅ Configuració desada correctament!', 'success');
    document.getElementById('settingsPanel').classList.add('hidden');
}

// Load configuration from query parameters
function loadConfigFromQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const domain = urlParams.get('domain');
    
    if (domain) {
        const config = {
            haDomain: domain.trim().replace(/\/$/, '')
        };
        saveConfig(config);
        
        // Clean URL without reloading
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);
        
        showStatus('✅ Configuració carregada des de l\'enllaç!', 'success');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load config from query params if present
    loadConfigFromQuery();
    
    // Load settings into form
    loadSettingsForm();
    
    // Action buttons
    document.getElementById('notifyBtn').addEventListener('click', handleNotify);
    document.getElementById('openDoorBtn').addEventListener('click', handleOpenDoor);
    
    // Settings panel toggle
    document.getElementById('settingsBtn').addEventListener('click', function() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            loadSettingsForm();
        }
    });
    
    // Settings form
    document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);
    document.getElementById('cancelBtn').addEventListener('click', function() {
        document.getElementById('settingsPanel').classList.add('hidden');
    });
});
