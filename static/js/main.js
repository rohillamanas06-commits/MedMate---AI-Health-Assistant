// MedMate - Main JavaScript

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            navLinks.classList.remove('active');
        }
    });
});

// Modal functionality
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const closeBtn = document.querySelector('.close');

// Open modal
function openModal() {
    loginModal.style.display = 'block';
}

if (loginBtn) {
    loginBtn.addEventListener('click', openModal);
}

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', openModal);
}

// Close modal
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Auth tabs
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Update active tab
        authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        if (tabName === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    });
});

// Login form submission
if (loginForm) {
    console.log('✅ Login form found and listener attached');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Login form submitted');
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        console.log('Login attempt for user:', username);
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            console.log('🔄 Sending login request...');
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            console.log('📥 Response status:', response.status);
            const data = await response.json();
            console.log('📥 Response data:', data);
            
            if (response.ok) {
                console.log('✅ Login successful! Redirecting...');
                submitBtn.textContent = 'Success! Redirecting...';
                // Redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                console.log('❌ Login failed:', data.error);
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.add('show');
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            errorDiv.textContent = 'An error occurred. Please try again. Check console for details.';
            errorDiv.classList.add('show');
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
} else {
    console.error('❌ Login form not found!');
}

// Register form submission
if (registerForm) {
    console.log('✅ Register form found and listener attached');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Register form submitted');
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const errorDiv = document.getElementById('registerError');
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        
        console.log('User data:', { username, email, password: '***' });
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.add('show');
            return;
        }
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        
        try {
            console.log('🔄 Sending registration request...');
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            console.log('📥 Response status:', response.status);
            const data = await response.json();
            console.log('📥 Response data:', data);
            
            if (response.ok) {
                console.log('✅ Registration successful! Redirecting...');
                submitBtn.textContent = 'Success! Redirecting...';
                // Small delay to ensure session cookie is set before redirect
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 100);
            } else {
                console.log('❌ Registration failed:', data.error);
                errorDiv.textContent = data.error || 'Registration failed';
                errorDiv.classList.add('show');
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register';
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            errorDiv.textContent = 'An error occurred. Please try again. Check console for details.';
            errorDiv.classList.add('show');
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
        }
    });
} else {
    console.error('❌ Register form not found!');
}

// Learn more button
const learnMoreBtn = document.getElementById('learnMoreBtn');
if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
        document.querySelector('#features').scrollIntoView({
            behavior: 'smooth'
        });
    });
}

// Check authentication status on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            // User is logged in, update UI
            if (loginBtn) {
                loginBtn.textContent = 'Dashboard';
                loginBtn.onclick = () => window.location.href = '/dashboard';
            }
            // Also update "Get Started" button to "Dashboard"
            if (getStartedBtn) {
                getStartedBtn.textContent = 'Dashboard';
                // Remove old event listeners and add new one
                const newBtn = getStartedBtn.cloneNode(true);
                getStartedBtn.parentNode.replaceChild(newBtn, getStartedBtn);
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = '/dashboard';
                });
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// Check auth on page load
checkAuth();

// ==================== THEME MANAGEMENT ====================

// Load saved theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('medmate-theme') || 'light';
    applyTheme(savedTheme);
}

// Apply theme to body
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-mode', 'med-mode');
    
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    } else if (theme === 'med') {
        body.classList.add('med-mode');
    }
}

// Load theme on page load
loadTheme();

// ==================== GOOGLE SIGN-IN ====================

// Google Sign-In callback
function handleGoogleSignIn(response) {
    console.log('✅ Google Sign-In response received');
    
    try {
        // Decode JWT token to get user info
        const userInfo = parseJwt(response.credential);
        console.log('User info:', userInfo);
        
        // Send to backend
        fetch('/api/google-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: response.credential,
                email: userInfo.email,
                name: userInfo.name,
                sub: userInfo.sub
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                console.log('✅ Google login successful:', data);
                window.location.href = '/dashboard';
            } else {
                console.error('❌ Google login failed:', data.error);
                alert('Google login failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('❌ Google login error:', error);
            alert('Google login failed. Please try again.');
        });
    } catch (error) {
        console.error('❌ Error processing Google response:', error);
        alert('Failed to process Google login. Please try again.');
    }
}

// Parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Error parsing JWT:', e);
        return {};
    }
}

// Initialize Google Sign-In buttons
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
        
        if (!clientIdMeta || !clientIdMeta.content || clientIdMeta.content === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
            console.warn('⚠️ Google Client ID not configured. Please add your Client ID to index.html');
            
            // Show message on buttons
            const googleLoginBtn = document.getElementById('googleLoginBtn');
            const googleRegisterBtn = document.getElementById('googleRegisterBtn');
            
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', () => {
                    alert('Google Sign-In is not configured yet.\n\nPlease add your Google Client ID to templates/index.html line 12.\n\nGet it from: https://console.cloud.google.com/');
                });
            }
            
            if (googleRegisterBtn) {
                googleRegisterBtn.addEventListener('click', () => {
                    alert('Google Sign-In is not configured yet.\n\nPlease add your Google Client ID to templates/index.html line 12.\n\nGet it from: https://console.cloud.google.com/');
                });
            }
            return;
        }
        
        console.log('✅ Initializing Google Sign-In with Client ID');
        
        // Initialize for login button
        google.accounts.id.initialize({
            client_id: clientIdMeta.content,
            callback: handleGoogleSignIn
        });
        
        // Render login button
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                console.log('Google login button clicked');
                google.accounts.id.prompt();
            });
        }
        
        // Render register button
        const googleRegisterBtn = document.getElementById('googleRegisterBtn');
        if (googleRegisterBtn) {
            googleRegisterBtn.addEventListener('click', () => {
                console.log('Google register button clicked');
                google.accounts.id.prompt();
            });
        }
        
        console.log('✅ Google Sign-In initialized successfully');
    } else {
        console.log('⏳ Waiting for Google Sign-In library...');
        setTimeout(initializeGoogleSignIn, 500);
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    setTimeout(initializeGoogleSignIn, 1000);
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
});
