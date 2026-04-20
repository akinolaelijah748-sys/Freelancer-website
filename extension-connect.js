// extension-connect.js
// This goes in your website folder (same place as dashboard.html)

const EXTENSION_ID = 'pjdnhpkakbbifdkjfcdjljjjddohdhnh'; // Your extension ID

// Check if extension is installed and responding
window.checkExtensionInstalled = function() {
    return new Promise((resolve) => {
        console.log('🔍 Checking if extension is installed...');
        
        try {
            if (!chrome || !chrome.runtime) {
                console.log('❌ Chrome runtime not available');
                resolve(false);
                return;
            }
            
            chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('❌ Extension not installed or not responding:', chrome.runtime.lastError.message);
                    resolve(false);
                } else if (response && response.pong) {
                    console.log('✅ Extension is installed and responding!');
                    resolve(true);
                } else {
                    console.log('❌ Extension installed but no response');
                    resolve(false);
                }
            });
            
            // Timeout after 2 seconds
            setTimeout(() => {
                console.log('⏰ Extension check timeout');
                resolve(false);
            }, 2000);
        } catch (e) {
            console.log('❌ Error checking extension:', e);
            resolve(false);
        }
    });
};

// Connect to extension after login
window.connectToExtension = async function(user) {
    console.log('🔄 Connecting to extension...', { userId: user.uid, userEmail: user.email });
    
    try {
        const isInstalled = await checkExtensionInstalled();
        console.log('Extension installed:', isInstalled);
        
        if (isInstalled) {
            // Send connection message to extension
            chrome.runtime.sendMessage(EXTENSION_ID, {
                type: 'CONNECT_EXTENSION',
                userId: user.uid,
                userEmail: user.email
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Extension connection error:', chrome.runtime.lastError.message);
                    showToast('⚠️ Extension connection failed. Please make sure the extension is enabled.', 'warning');
                    return;
                }
                
                if (response && response.success) {
                    console.log('✅ Extension connected successfully!');
                    showToast('✅ Connected to Fiverr Inbox AI extension!', 'success');
                    localStorage.setItem('extensionConnected', 'true');
                    
                    // Dispatch event for other scripts
                    window.dispatchEvent(new CustomEvent('extension-connected', { detail: { userId: user.uid } }));
                } else {
                    console.error('❌ Extension connection failed:', response?.error || 'Unknown error');
                    showToast('⚠️ Extension connection failed. Try reinstalling the extension.', 'warning');
                }
            });
        } else {
            console.log('❌ Extension not installed');
            showExtensionPrompt();
            
            // Check again after a delay (user might have installed it)
            setTimeout(async () => {
                const nowInstalled = await checkExtensionInstalled();
                if (nowInstalled && window.currentUser) {
                    console.log('✅ Extension was installed, reconnecting...');
                    window.connectToExtension(window.currentUser);
                }
            }, 5000);
        }
    } catch (error) {
        console.error('❌ Error in connectToExtension:', error);
        showToast('⚠️ Error connecting to extension. Please check if the extension is installed.', 'error');
    }
};

// Show prompt to install extension
function showExtensionPrompt() {
    // Don't show if already dismissed
    if (localStorage.getItem('extensionPromptDismissed')) return;
    
    // Check if already has prompt
    if (document.getElementById('extension-prompt')) return;
    
    const prompt = document.createElement('div');
    prompt.id = 'extension-prompt';
    prompt.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        border: 1px solid #4f46e5;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
        z-index: 9999;
        max-width: 320px;
        animation: slideIn 0.3s ease;
    `;
    
    prompt.innerHTML = `
        <div style="display: flex; gap: 12px;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4f46e5, #8b5cf6); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: white;">Connect Chrome Extension</h3>
                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Install our extension to use AI directly in Fiverr inbox and track your usage.</p>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button id="install-extension-btn" style="background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Install Extension</button>
                    <button id="dismiss-prompt-btn" style="background: transparent; color: #94a3b8; border: 1px solid #1e293b; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Later</button>
                </div>
            </div>
            <button id="close-prompt-btn" style="background: transparent; border: none; color: #64748b; cursor: pointer; padding: 0;">✕</button>
        </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Add event listeners
    document.getElementById('install-extension-btn')?.addEventListener('click', () => {
        installExtension();
    });
    
    document.getElementById('dismiss-prompt-btn')?.addEventListener('click', () => {
        dismissPrompt();
    });
    
    document.getElementById('close-prompt-btn')?.addEventListener('click', () => {
        dismissPrompt();
    });
    
    // Add animation style if not exists
    if (!document.getElementById('animation-style')) {
        const style = document.createElement('style');
        style.id = 'animation-style';
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(20px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Install extension function
window.installExtension = function() {
    console.log('📦 Opening extension install page...');
    
    // For now, show instructions
    // When you publish to Chrome Web Store, replace with your store URL
    const extensionStoreUrl = 'https://chrome.google.com/webstore/detail/fiverr-inbox-ai/' + EXTENSION_ID;
    
    // Show instructions modal
    showInstallInstructions();
    
    // Track installation attempt
    if (window.gtag) {
        window.gtag('event', 'extension_install_click', {
            event_category: 'extension',
            event_label: 'install_button'
        });
    }
};

// Show installation instructions
function showInstallInstructions() {
    const modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: #0f172a; border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; border: 1px solid #1e293b;">
            <h3 style="color: white; font-size: 18px; margin-bottom: 12px;">📦 Install Chrome Extension</h3>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">
                To use AI features in your Fiverr inbox, you need to install our Chrome extension.
            </p>
            <div style="background: #1e293b; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">📝 Steps:</p>
                <ol style="color: #94a3b8; font-size: 12px; margin-left: 20px;">
                    <li>Click the Chrome Web Store link below</li>
                    <li>Click "Add to Chrome"</li>
                    <li>Click "Add Extension" to confirm</li>
                    <li>Refresh this page after installation</li>
                </ol>
            </div>
            <div style="display: flex; gap: 12px;">
                <a href="https://chrome.google.com/webstore/search/fiverr%20inbox%20ai" target="_blank" style="flex: 1; background: #4f46e5; color: white; text-align: center; padding: 10px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Open Chrome Web Store
                </a>
                <button id="close-modal-btn" style="background: #1e293b; color: #94a3b8; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('close-modal-btn')?.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Dismiss prompt
window.dismissPrompt = function() {
    const prompt = document.getElementById('extension-prompt');
    if (prompt) {
        prompt.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => prompt.remove(), 300);
    }
    localStorage.setItem('extensionPromptDismissed', 'true');
};

// Toast notification with different types
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    
    const colors = {
        success: { bg: '#10b981', border: '#059669' },
        warning: { bg: '#f59e0b', border: '#d97706' },
        error: { bg: '#ef4444', border: '#dc2626' },
        info: { bg: '#3b82f6', border: '#2563eb' }
    };
    
    const color = colors[type] || colors.success;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #0f172a;
        border: 1px solid ${color.bg};
        border-left: 4px solid ${color.bg};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-family: 'Inter', sans-serif;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add fadeIn animation
if (!document.getElementById('fade-animation')) {
    const style = document.createElement('style');
    style.id = 'fade-animation';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(20px); }
        }
    `;
    document.head.appendChild(style);
}

// Log extension connection status on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 Extension connect script loaded');
    
    // Check if extension is installed on page load
    const isInstalled = await window.checkExtensionInstalled();
    if (isInstalled) {
        console.log('✅ Extension detected on page load');
        localStorage.setItem('extensionDetected', 'true');
    } else {
        console.log('❌ Extension not detected');
    }
});