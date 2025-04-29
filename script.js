// DOM Elements
const backupStatus = document.getElementById('backup-status');
const lastBackupElement = document.getElementById('last-backup');
const nextBackupElement = document.getElementById('next-backup');
const manualBackupBtn = document.getElementById('manual-backup');
const recoverFileBtn = document.getElementById('recover-file');
const activityLogs = document.getElementById('activity-logs');
const recoveryModal = document.getElementById('recovery-modal');
const closeModal = document.querySelector('.close');
const fileListContainer = document.getElementById('file-list-container');
const confirmRecoveryBtn = document.getElementById('confirm-recovery');
const recoveryPathInput = document.getElementById('recovery-path');

// API Configuration
const API_BASE_URL = 'https://r44txhke0c.execute-api.ap-south-1.amazonaws.com/prod';
const API_KEY = '5M0YG5e8XI2xR3PTDuEzN5DbqQwIH8693nZIIysV'; // Replace with your actual API key

// Initialize Dashboard
async function initDashboard() {
    try {
        console.log('Initializing dashboard...');
        setLoadingState(true);
        
        // Make sure these elements exist
        if (!lastBackupElement || !nextBackupElement || !activityLogs) {
            throw new Error('Critical DOM elements missing');
        }

        // Fetch status and logs
        const statusData = await fetchStatus();
        const logsData = await fetchLogs();
        
        updateStatus(statusData);
        updateLogs(logsData);
        
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showError(error);
    } finally {
        setLoadingState(false);
    }
}

// Fetch system status
async function fetchStatus() {
    try {
        console.log(`Fetching status from ${API_BASE_URL}/status`);
        
        const response = await fetch(`${API_BASE_URL}/status`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        
        console.log('Status response:', response);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid status data format');
        }
        
        return data;
    } catch (error) {
        console.error('Error in fetchStatus:', error);
        throw error;
    }
}

// Fetch activity logs
async function fetchLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Logs request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
}

// Update system status display
function updateStatus(data) {
    if (!data) {
        console.error('No data provided to updateStatus');
        return;
    }

    const statusDot = backupStatus.querySelector('.status-dot');
    
    // Clear all status classes
    statusDot.className = 'status-dot';
    
    // Set appropriate status
    if (data.status === 'active') {
        statusDot.classList.add('active');
    } else if (data.status === 'warning') {
        statusDot.classList.add('warning');
    } else {
        statusDot.classList.add('danger');
    }
    
    // Format and display dates
    lastBackupElement.textContent = data.lastBackup 
        ? formatDateTime(data.lastBackup) 
        : 'Never';
        
    nextBackupElement.textContent = data.nextBackup 
        ? formatDateTime(data.nextBackup) 
        : 'Not scheduled';
}

// Update activity logs
function updateLogs(logs) {
    if (!logs || !Array.isArray(logs)) {
        console.error('Invalid logs data:', logs);
        activityLogs.innerHTML = '<p class="error">Invalid log data format</p>';
        return;
    }

    if (logs.length === 0) {
        activityLogs.innerHTML = '<p class="info">No recent activity found</p>';
        return;
    }
    
    const logsHTML = logs.map(log => `
        <div class="log-entry">
            <span class="timestamp">[${formatDateTime(log.timestamp)}]</span>
            <span class="message ${log.level?.toLowerCase() || ''}">${log.message}</span>
        </div>
    `).join('');
    
    activityLogs.innerHTML = logsHTML;
}

// Format date for display
function formatDateTime(isoString) {
    try {
        if (!isoString) return 'Unknown';
        const date = new Date(isoString);
        return date.toLocaleString();
    } catch {
        return isoString; // Fallback to raw string
    }
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        lastBackupElement.textContent = 'Loading...';
        nextBackupElement.textContent = 'Loading...';
        activityLogs.innerHTML = '<div class="loading-state">Loading data...</div>';
    }
}

// Show error message
function showError(error) {
    lastBackupElement.textContent = 'Error';
    nextBackupElement.textContent = 'Error';
    
    activityLogs.innerHTML = `
        <div class="error-state">
            <h3>Failed to load dashboard data</h3>
            <p>${error.message || 'Unknown error occurred'}</p>
            <div class="error-actions">
                <button class="btn" onclick="initDashboard()">Retry</button>
            </div>
        </div>
    `;
}

// Run manual backup
manualBackupBtn.addEventListener('click', async () => {
    manualBackupBtn.disabled = true;
    manualBackupBtn.innerHTML = '<span class="btn-loader"></span> Backing up...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/backup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Backup failed with status ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Backup initiated successfully!', 'success');
            await initDashboard(); // Refresh data
        } else {
            throw new Error(result.message || 'Backup failed');
        }
    } catch (error) {
        console.error('Backup error:', error);
        showNotification(`Backup failed: ${error.message}`, 'error');
    } finally {
        manualBackupBtn.disabled = false;
        manualBackupBtn.textContent = 'Run Manual Backup';
    }
});

// Show recovery modal
recoverFileBtn.addEventListener('click', async () => {
    try {
        fileListContainer.innerHTML = '<div class="loading-state">Loading backup files...</div>';
        recoveryModal.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/backups`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch backups: ${response.status}`);
        }
        
        const { backups } = await response.json();
        
        if (!backups || !Array.isArray(backups)) {
            throw new Error('Invalid backups data received');
        }
        
        if (backups.length === 0) {
            fileListContainer.innerHTML = '<p class="info">No backup files available</p>';
            return;
        }
        
        fileListContainer.innerHTML = backups.map(backup => `
            <div class="file-item">
                <label>
                    <input type="radio" name="backup-file" value="${backup.key}">
                    ${backup.key}
                </label>
                <span class="file-size">
                    ${formatFileSize(backup.size)} • 
                    ${formatDateTime(backup.lastModified)}
                </span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading backups:', error);
        fileListContainer.innerHTML = `
            <div class="error-state">
                <h3>Failed to load backups</h3>
                <p>${error.message}</p>
                <div class="error-actions">
                    <button class="btn" onclick="recoverFileBtn.click()">Retry</button>
                </div>
            </div>
        `;
    }
});

// Close modal
closeModal.addEventListener('click', () => {
    recoveryModal.style.display = 'none';
    recoveryPathInput.value = '';
});

// Confirm recovery
confirmRecoveryBtn.addEventListener('click', async () => {
    const selectedFile = document.querySelector('input[name="backup-file"]:checked');
    const destinationPath = recoveryPathInput.value.trim();
    
    if (!selectedFile) {
        showNotification('Please select a backup file to recover', 'warning');
        return;
    }
    
    if (!destinationPath) {
        showNotification('Please enter a destination path', 'warning');
        return;
    }
    
    confirmRecoveryBtn.disabled = true;
    confirmRecoveryBtn.innerHTML = '<span class="btn-loader"></span> Recovering...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/recover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({
                fileKey: selectedFile.value,
                destination: destinationPath
            })
        });
        
        if (!response.ok) {
            throw new Error(`Recovery failed with status ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('File recovery initiated successfully!', 'success');
            recoveryModal.style.display = 'none';
            await initDashboard(); // Refresh data
        } else {
            throw new Error(result.message || 'Recovery failed');
        }
    } catch (error) {
        console.error('Recovery error:', error);
        showNotification(`Recovery failed: ${error.message}`, 'error');
    } finally {
        confirmRecoveryBtn.disabled = false;
        confirmRecoveryBtn.textContent = 'Recover Selected';
    }
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || isNaN(bytes)) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization');
    initDashboard();
});

// Refresh data every 5 minutes
setInterval(() => {
    console.log('Refreshing dashboard data...');
    initDashboard();
}, 5 * 60 * 1000);