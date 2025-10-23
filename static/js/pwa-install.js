/**
 * MedMate PWA Installation Handler
 * Beautiful install prompt with modal UI
 */

let deferredPrompt = null;
let isInstalled = false;
let serviceWorkerRegistration = null;

// Check if app is already installed
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
    isInstalled = true;
    console.log('✅ MedMate is running as installed PWA');
}

/**
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/static/service-worker.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered:', serviceWorkerRegistration.scope);
            
            // Check for updates
            serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = serviceWorkerRegistration.installing;
                console.log('🔄 Service Worker update found');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    });
}

/**
 * Capture install prompt event
 */
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install buttons
    showInstallButtons();
    
    // Auto-show install modal after 5 seconds if not installed
    if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
        setTimeout(() => {
            showInstallModal();
        }, 5000);
    }
});

/**
 * Show install buttons
 */
function showInstallButtons() {
    const installButtons = document.querySelectorAll('[data-pwa-install]');
    installButtons.forEach(btn => {
        btn.style.display = 'inline-flex';
        btn.disabled = false;
    });
}

/**
 * Hide install buttons
 */
function hideInstallButtons() {
    const installButtons = document.querySelectorAll('[data-pwa-install]');
    installButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}

/**
 * Show beautiful install modal
 */
function showInstallModal() {
    // Check if modal already exists
    let modal = document.getElementById('pwaInstallModal');
    
    if (!modal) {
        // Create modal HTML
        const modalHTML = `
            <div id="pwaInstallModal" class="pwa-install-modal">
                <div class="pwa-install-overlay"></div>
                <div class="pwa-install-content">
                    <button class="pwa-close-btn" onclick="closePWAModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="pwa-install-header">
                        <div class="pwa-icon-wrapper">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <h2>Install MedMate</h2>
                        <p>Get instant access to your AI medical assistant</p>
                    </div>
                    
                    <div class="pwa-install-features">
                        <div class="pwa-feature">
                            <i class="fas fa-bolt"></i>
                            <span>Lightning fast access</span>
                        </div>
                        <div class="pwa-feature">
                            <i class="fas fa-wifi"></i>
                            <span>Works offline</span>
                        </div>
                        <div class="pwa-feature">
                            <i class="fas fa-mobile-alt"></i>
                            <span>Native app experience</span>
                        </div>
                        <div class="pwa-feature">
                            <i class="fas fa-shield-alt"></i>
                            <span>Secure & private</span>
                        </div>
                    </div>
                    
                    <div class="pwa-install-actions">
                        <button class="btn btn-primary btn-lg pwa-install-btn" onclick="installPWA()">
                            <i class="fas fa-download"></i>
                            Install Now
                        </button>
                        <button class="btn btn-secondary btn-lg" onclick="dismissPWAModal()">
                            Maybe Later
                        </button>
                    </div>
                    
                    <p class="pwa-install-note">
                        <i class="fas fa-info-circle"></i>
                        Free forever • No app store needed • Uninstall anytime
                    </p>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('pwaInstallModal');
    }
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 100);
}

/**
 * Close PWA install modal
 */
function closePWAModal() {
    const modal = document.getElementById('pwaInstallModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Dismiss PWA modal (don't show again for 7 days)
 */
function dismissPWAModal() {
    closePWAModal();
    localStorage.setItem('pwa-install-dismissed', Date.now());
}

/**
 * Install PWA
 */
async function installPWA() {
    if (!deferredPrompt) {
        showInstallInstructions();
        return;
    }
    
    try {
        // Show the install prompt
        await deferredPrompt.prompt();
        
        // Wait for user response
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`Install outcome: ${outcome}`);
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            showSuccessMessage('MedMate installed successfully! 🎉');
            closePWAModal();
            hideInstallButtons();
            isInstalled = true;
        } else {
            console.log('❌ User dismissed the install prompt');
            showInfoMessage('You can install MedMate anytime from the menu');
        }
        
        // Clear the deferred prompt
        deferredPrompt = null;
    } catch (error) {
        console.error('❌ Install error:', error);
        showInstallInstructions();
    }
}

/**
 * Show install instructions for browsers that don't support prompt
 */
function showInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        instructions = `
            <h3>Install MedMate on Chrome</h3>
            <ol>
                <li>Click the <strong>⋮</strong> menu (top right)</li>
                <li>Select <strong>"Install MedMate"</strong></li>
                <li>Click <strong>"Install"</strong> in the popup</li>
            </ol>
            <p>Or look for the <strong>⊕</strong> icon in the address bar</p>
        `;
    } else if (userAgent.includes('edg')) {
        instructions = `
            <h3>Install MedMate on Edge</h3>
            <ol>
                <li>Click the <strong>⋯</strong> menu (top right)</li>
                <li>Select <strong>"Apps" → "Install MedMate"</strong></li>
                <li>Click <strong>"Install"</strong> in the popup</li>
            </ol>
            <p>Or look for the <strong>⊕</strong> icon in the address bar</p>
        `;
    } else if (userAgent.includes('safari')) {
        instructions = `
            <h3>Install MedMate on Safari (iOS)</h3>
            <ol>
                <li>Tap the <strong>Share</strong> button (bottom)</li>
                <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> in the top right</li>
            </ol>
        `;
    } else if (userAgent.includes('firefox')) {
        instructions = `
            <h3>Install MedMate on Firefox</h3>
            <ol>
                <li>Click the <strong>⋮</strong> menu (top right)</li>
                <li>Select <strong>"Install"</strong></li>
                <li>Click <strong>"Install"</strong> in the popup</li>
            </ol>
            <p>Or look for the <strong>⊕</strong> icon in the address bar</p>
        `;
    } else {
        instructions = `
            <h3>Install MedMate</h3>
            <p>Look for the <strong>install icon</strong> in your browser's address bar or menu.</p>
            <p>Usually found in: <strong>Menu → Install App</strong></p>
        `;
    }
    
    showCustomModal('How to Install', instructions);
}

/**
 * Show custom modal with content
 */
function showCustomModal(title, content) {
    const modalHTML = `
        <div id="pwaCustomModal" class="pwa-install-modal active">
            <div class="pwa-install-overlay" onclick="closeCustomModal()"></div>
            <div class="pwa-install-content" style="max-width: 500px;">
                <button class="pwa-close-btn" onclick="closeCustomModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pwa-custom-content">
                    <h2>${title}</h2>
                    ${content}
                    <button class="btn btn-primary btn-lg" onclick="closeCustomModal()" style="margin-top: 1.5rem;">
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing custom modal
    const existingModal = document.getElementById('pwaCustomModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Close custom modal
 */
function closeCustomModal() {
    const modal = document.getElementById('pwaCustomModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Show update notification
 */
function showUpdateNotification() {
    const notification = `
        <div class="pwa-update-notification">
            <div class="pwa-update-content">
                <i class="fas fa-sync-alt"></i>
                <span>New version available!</span>
                <button class="btn btn-sm btn-primary" onclick="updatePWA()">Update Now</button>
                <button class="pwa-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', notification);
}

/**
 * Update PWA
 */
function updatePWA() {
    if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
        serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    showToast(message, 'success');
}

/**
 * Show info message
 */
function showInfoMessage(message) {
    showToast(message, 'info');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('active'), 100);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Handle app installed event
 */
window.addEventListener('appinstalled', () => {
    console.log('✅ MedMate PWA installed successfully!');
    isInstalled = true;
    hideInstallButtons();
    closePWAModal();
    showSuccessMessage('Welcome to MedMate! 🎉');
});

/**
 * Initialize PWA features on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Add click listeners to install buttons
    const installButtons = document.querySelectorAll('[data-pwa-install]');
    installButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isInstalled) {
                showInfoMessage('MedMate is already installed!');
            } else if (deferredPrompt) {
                installPWA();
            } else {
                showInstallModal();
            }
        });
    });
    
    // Hide install buttons if already installed
    if (isInstalled) {
        hideInstallButtons();
    }
    
    // Check if dismissed timestamp is older than 7 days
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed > 7) {
            localStorage.removeItem('pwa-install-dismissed');
        }
    }
});

// Make functions globally available
window.installPWA = installPWA;
window.closePWAModal = closePWAModal;
window.dismissPWAModal = dismissPWAModal;
window.closeCustomModal = closeCustomModal;
window.updatePWA = updatePWA;

console.log('✅ PWA Install Handler loaded');
