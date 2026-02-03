// Configuration management
const CONFIG_KEY = 'calAlzinaConfig';

// Load configuration from localStorage
function loadConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        haUrl: '',
        haToken: '',
        notifyService: 'notify.mobile_app',
        lockEntity: 'lock.porta_principal'
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

// Call Home Assistant API
async function callHomeAssistant(domain, service, entityId = null, data = {}) {
    const config = loadConfig();
    
    if (!config.haUrl || !config.haToken) {
        showStatus('Si us plau, configura primer la connexió amb Home Assistant', 'error');
        document.getElementById('settingsPanel').classList.remove('hidden');
        return false;
    }

    const url = `${config.haUrl}/api/services/${domain}/${service}`;
    
    const body = {
        ...data
    };
    
    if (entityId) {
        body.entity_id = entityId;
    }

    try {
        showStatus('Enviant comanda...', 'loading');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.haToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        return false;
    }
}

// Notify button handler
async function handleNotify() {
    const config = loadConfig();
    const result = await callHomeAssistant('notify', config.notifyService.split('.')[1], null, {
        message: 'Algú ha arribat a Cal Alzina!',
        title: 'Cal Alzina',
        data: {
            priority: 'high'
        }
    });
    
    if (result) {
        showStatus('✅ Notificació enviada correctament!', 'success');
    }
}

// Open door button handler
async function handleOpenDoor() {
    const config = loadConfig();
    const result = await callHomeAssistant('lock', 'unlock', config.lockEntity);
    
    if (result) {
        showStatus('✅ Porta oberta!', 'success');
    }
}

// Settings form handlers
function loadSettingsForm() {
    const config = loadConfig();
    document.getElementById('haUrl').value = config.haUrl;
    document.getElementById('haToken').value = config.haToken;
    document.getElementById('notifyService').value = config.notifyService;
    document.getElementById('lockEntity').value = config.lockEntity;
}

function handleSaveSettings(e) {
    e.preventDefault();
    
    const config = {
        haUrl: document.getElementById('haUrl').value.trim().replace(/\/$/, ''),
        haToken: document.getElementById('haToken').value.trim(),
        notifyService: document.getElementById('notifyService').value.trim(),
        lockEntity: document.getElementById('lockEntity').value.trim()
    };
    
    saveConfig(config);
    showStatus('✅ Configuració desada correctament!', 'success');
    document.getElementById('settingsPanel').classList.add('hidden');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
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
