// MedMate - Dashboard JavaScript

// Global variables - using VoiceAssistant from voice-assistant.js
let isListening = false;

// ==================== VOICE MUTE TOGGLE ====================

const muteToggle = document.getElementById('muteToggle');
if (muteToggle) {
    // Set initial state
    updateMuteIcon();
    
    muteToggle.addEventListener('click', () => {
        const isMuted = voiceAssistant.toggleMute();
        updateMuteIcon();
        
        // Show feedback
        const message = isMuted ? 'Voice output muted' : 'Voice output enabled';
        showToast(message);
    });
}

function updateMuteIcon() {
    if (!muteToggle) return;
    const icon = muteToggle.querySelector('i');
    const isMuted = voiceAssistant.isMuted;
    
    if (isMuted) {
        icon.className = 'fas fa-volume-mute';
        muteToggle.classList.remove('btn-secondary');
        muteToggle.classList.add('btn-warning');
        muteToggle.title = 'Voice Muted - Click to Unmute';
    } else {
        icon.className = 'fas fa-volume-up';
        muteToggle.classList.remove('btn-warning');
        muteToggle.classList.add('btn-secondary');
        muteToggle.title = 'Voice Enabled - Click to Mute';
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Sidebar navigation
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const contentSections = document.querySelectorAll('.content-section');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

// Mobile sidebar toggle
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// Section navigation
sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        
        // Update active link
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show corresponding section
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
        
        // Close mobile sidebar
        sidebar.classList.remove('active');
        
        // Load data for specific sections
        if (sectionId === 'history') {
            loadDiagnosisHistory();
        }
    });
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    });
}

// Loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// ==================== SYMPTOM CHECKER ====================

const symptomForm = document.getElementById('symptomForm');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const symptomsTextarea = document.getElementById('symptoms');

// Voice input for symptoms
if (voiceInputBtn && voiceAssistant.isRecognitionAvailable()) {
    voiceInputBtn.addEventListener('click', () => {
        if (!isListening) {
            const started = voiceAssistant.startListening(
                (transcript, confidence) => {
                    symptomsTextarea.value = transcript;
                    showToast(`Recognized: ${transcript.substring(0, 50)}...`);
                    isListening = false;
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
                    voiceInputBtn.classList.remove('btn-danger');
                },
                (error) => {
                    showToast(`Voice error: ${error}`);
                    isListening = false;
                    voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
                    voiceInputBtn.classList.remove('btn-danger');
                }
            );
            
            if (started) {
                isListening = true;
                voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
                voiceInputBtn.classList.add('btn-danger');
            }
        } else {
            voiceAssistant.stopListening();
            isListening = false;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
            voiceInputBtn.classList.remove('btn-danger');
        }
    });
} else if (voiceInputBtn) {
    voiceInputBtn.disabled = true;
    voiceInputBtn.title = 'Voice recognition not supported in this browser';
}

// Symptom form submission
if (symptomForm) {
    symptomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const symptoms = symptomsTextarea.value.trim();
        if (!symptoms) return;
        
        showLoading();
        
        try {
            const response = await fetch('/api/diagnose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ symptoms })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                displayDiagnosisResult(data.result);
            } else {
                alert('Error: ' + (data.error || 'Failed to analyze symptoms'));
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });
}

function displayDiagnosisResult(result) {
    const resultDiv = document.getElementById('diagnosisResult');
    const contentDiv = document.getElementById('diagnosisContent');
    
    let html = '';
    let voiceText = '';
    
    // Display diseases
    if (result.diseases && result.diseases.length > 0) {
        voiceText = `I found ${result.diseases.length} possible condition${result.diseases.length > 1 ? 's' : ''}. `;
        
        result.diseases.forEach((disease, index) => {
            const confidenceClass = disease.confidence >= 50 ? 'confidence-high' : 
                                   disease.confidence >= 30 ? 'confidence-medium' : 'confidence-low';
            
            const urgencyClass = disease.urgency === 'High' ? 'urgency-high' :
                                disease.urgency === 'Medium' ? 'urgency-medium' : 'urgency-low';
            
            html += `
                <div class="disease-item">
                    <div class="disease-header">
                        <h4 class="disease-name">${disease.name}</h4>
                        <span class="confidence-badge ${confidenceClass}">${disease.confidence}%</span>
                    </div>
                    <p class="disease-explanation">${disease.explanation}</p>
                    <h5>Recommended Solutions:</h5>
                    <ul class="solutions-list">
                        ${disease.solutions.map(sol => `<li>${sol}</li>`).join('')}
                    </ul>
                    <div class="urgency-indicator ${urgencyClass}">
                        Urgency Level: ${disease.urgency}
                    </div>
                </div>
            `;
            
            // Build voice summary
            if (index === 0) {
                voiceText += `The most likely condition is ${disease.name} with ${disease.confidence} percent confidence. `;
                voiceText += `${disease.explanation}. `;
                voiceText += `The urgency level is ${disease.urgency}. `;
            }
        });
    }
    
    // General advice
    if (result.general_advice) {
        html += `<div class="disease-item"><h5>General Advice:</h5><p>${result.general_advice}</p></div>`;
        voiceText += `General advice: ${result.general_advice}. `;
    }
    
    // Disclaimer
    if (result.disclaimer) {
        html += `<div class="disclaimer"><strong>⚠️ Disclaimer:</strong> ${result.disclaimer}</div>`;
    }
    
    contentDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    
    // Scroll to results
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Speak the results
    if (voiceText && voiceAssistant.isSynthesisAvailable()) {
        voiceAssistant.speak(voiceText, {
            rate: 0.9,
            pitch: 1.0
        });
    }
}

// ==================== IMAGE ANALYSIS ====================

const imageForm = document.getElementById('imageForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

// File upload area click
if (fileUploadArea) {
    fileUploadArea.addEventListener('click', () => {
        imageUpload.click();
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary-color)';
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'var(--border-color)';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--border-color)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });
}

// Image upload change
if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });
}

function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        fileUploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove image
if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
        imageUpload.value = '';
        previewImg.src = '';
        fileUploadArea.style.display = 'block';
        imagePreview.style.display = 'none';
    });
}

// Image form submission
if (imageForm) {
    imageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = imageUpload.files[0];
        if (!file) {
            alert('Please upload an image');
            return;
        }
        
        const symptoms = document.getElementById('imageSymptoms').value;
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('symptoms', symptoms);
        
        showLoading();
        
        try {
            const response = await fetch('/api/diagnose-image', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                displayImageAnalysisResult(data.result);
            } else {
                alert('Error: ' + (data.error || 'Failed to analyze image'));
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });
}

function displayImageAnalysisResult(result) {
    const resultDiv = document.getElementById('imageAnalysisResult');
    const contentDiv = document.getElementById('imageAnalysisContent');
    
    let html = '';
    
    if (result.observation) {
        html += `<div class="disease-item"><h5>Observation:</h5><p>${result.observation}</p></div>`;
    }
    
    if (result.conditions && result.conditions.length > 0) {
        html += '<h4>Possible Conditions:</h4>';
        result.conditions.forEach(condition => {
            html += `
                <div class="disease-item">
                    <h5>${condition.name}</h5>
                    ${condition.confidence ? `<p>Confidence: ${condition.confidence}%</p>` : ''}
                    ${condition.note ? `<p>${condition.note}</p>` : ''}
                </div>
            `;
        });
    }
    
    if (result.recommendation) {
        html += `<div class="disease-item"><h5>Recommendation:</h5><p>${result.recommendation}</p></div>`;
    }
    
    if (result.professional_evaluation) {
        html += `<div class="disclaimer"><strong>⚠️ Professional Evaluation:</strong> ${result.professional_evaluation}</div>`;
    }
    
    contentDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== AI ASSISTANT ====================

const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const voiceChatBtn = document.getElementById('voiceChatBtn');

// Voice input for chat
if (voiceChatBtn && voiceAssistant.isRecognitionAvailable()) {
    voiceChatBtn.addEventListener('click', () => {
        if (!isListening) {
            const started = voiceAssistant.startListening(
                (transcript, confidence) => {
                    chatInput.value = transcript;
                    showToast(`Recognized: ${transcript.substring(0, 50)}...`);
                    isListening = false;
                    voiceChatBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceChatBtn.classList.remove('btn-danger');
                },
                (error) => {
                    showToast(`Voice error: ${error}`);
                    isListening = false;
                    voiceChatBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceChatBtn.classList.remove('btn-danger');
                }
            );
            
            if (started) {
                isListening = true;
                voiceChatBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceChatBtn.classList.add('btn-danger');
            }
        } else {
            voiceAssistant.stopListening();
            isListening = false;
            voiceChatBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceChatBtn.classList.remove('btn-danger');
        }
    });
} else if (voiceChatBtn) {
    voiceChatBtn.disabled = true;
    voiceChatBtn.title = 'Voice recognition not supported in this browser';
}

// Chat form submission
if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addChatMessage(message, 'user');
        chatInput.value = '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                addChatMessage(data.response, 'assistant');
                
                // Text-to-speech
                speakText(data.response);
            } else {
                addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            }
        } catch (error) {
            addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
            console.error(error);
        }
    });
}

function addChatMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const icon = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${icon}"></i>
        </div>
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function speakText(text) {
    // Use voiceAssistant to speak
    if (voiceAssistant.isSynthesisAvailable()) {
        voiceAssistant.speak(text, {
            rate: 0.9,
            pitch: 1.0
        });
    }
}

// ==================== HOSPITAL FINDER ====================

const findHospitalsBtn = document.getElementById('findHospitalsBtn');
const searchByCityBtn = document.getElementById('searchByCityBtn');
const citySearchForm = document.getElementById('citySearchForm');
const cityInput = document.getElementById('cityInput');
const searchCityBtn = document.getElementById('searchCityBtn');
const cancelCityBtn = document.getElementById('cancelCityBtn');
const hospitalResults = document.getElementById('hospitalResults');
const hospitalList = document.getElementById('hospitalList');

if (findHospitalsBtn) {
    findHospitalsBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            showLoading();
            
            // High accuracy GPS options with longer timeout
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,  // Increased to 15 seconds
                maximumAge: 0  // Don't use cached location
            };
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    
                    console.log(`GPS Location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
                    
                    // Validate coordinates
                    if (!latitude || !longitude || 
                        latitude < -90 || latitude > 90 || 
                        longitude < -180 || longitude > 180) {
                        hideLoading();
                        alert('Invalid GPS coordinates received. Please try again.');
                        return;
                    }
                    
                    // Warn if accuracy is poor
                    if (accuracy > 1000) {
                        hideLoading();
                        const useCitySearch = confirm(
                            `⚠️ GPS ACCURACY WARNING\n\n` +
                            `Your GPS accuracy is very poor (±${Math.round(accuracy)}m / ${(accuracy/1000).toFixed(1)}km)\n\n` +
                            `This means the detected location might be WRONG by several kilometers.\n\n` +
                            `RECOMMENDED: Use "Search by City/Area" instead for accurate results.\n\n` +
                            `Click OK to use City Search (Recommended)\n` +
                            `Click Cancel to continue with GPS anyway`
                        );
                        
                        if (useCitySearch) {
                            // Show city search form
                            citySearchForm.style.display = 'block';
                            cityInput.focus();
                            return;
                        }
                    }
                    
                    try {
                        const response = await fetch('/api/nearby-hospitals', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ 
                                latitude: parseFloat(latitude.toFixed(6)), 
                                longitude: parseFloat(longitude.toFixed(6)),
                                radius: 5000  // 5km radius
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            if (data.hospitals && data.hospitals.length > 0) {
                                displayHospitals(data.hospitals, latitude, longitude, accuracy);
                            } else {
                                alert('No hospitals found nearby. Try increasing the search radius.');
                            }
                        } else {
                            alert('Error finding hospitals: ' + (data.error || 'Unknown error'));
                        }
                    } catch (error) {
                        alert('Error connecting to server. Please check your internet connection.');
                        console.error('Hospital search error:', error);
                    } finally {
                        hideLoading();
                    }
                },
                (error) => {
                    hideLoading();
                    let errorMsg = 'Location error: ';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg += 'Please allow location access in your browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg += 'Location information unavailable. Please check your GPS/WiFi.';
                            break;
                        case error.TIMEOUT:
                            errorMsg += 'Location request timed out. Please try again.';
                            break;
                        default:
                            errorMsg += 'Unknown error occurred.';
                    }
                    
                    alert(errorMsg);
                    console.error('Geolocation error:', error);
                },
                options
            );
        } else {
            alert('Geolocation is not supported by your browser. Please use a modern browser like Chrome or Firefox.');
        }
    });
}

// City search functionality
if (searchByCityBtn) {
    searchByCityBtn.addEventListener('click', () => {
        citySearchForm.style.display = 'block';
        hospitalResults.style.display = 'none';
        cityInput.focus();
    });
}

if (cancelCityBtn) {
    cancelCityBtn.addEventListener('click', () => {
        citySearchForm.style.display = 'none';
        cityInput.value = '';
    });
}

if (searchCityBtn) {
    searchCityBtn.addEventListener('click', () => {
        searchHospitalsByCity();
    });
}

if (cityInput) {
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchHospitalsByCity();
        }
    });
}

async function searchHospitalsByCity() {
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
        alert('Please enter a city or area name');
        return;
    }
    
    showLoading();
    
    try {
        // First, geocode the city name to get coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName + ', Haryana, India')}&key=YOUR_API_KEY`;
        
        // Use a proxy approach - call our backend
        const response = await fetch('/api/geocode-city', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ city: cityName })
        });
        
        const data = await response.json();
        
        if (response.ok && data.latitude && data.longitude) {
            console.log(`City "${cityName}" located at: ${data.latitude}, ${data.longitude}`);
            
            // Now search for hospitals near this location
            const hospitalsResponse = await fetch('/api/nearby-hospitals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    latitude: data.latitude, 
                    longitude: data.longitude,
                    radius: 10000  // 10km radius for city search
                })
            });
            
            const hospitalsData = await hospitalsResponse.json();
            
            if (hospitalsResponse.ok) {
                if (hospitalsData.hospitals && hospitalsData.hospitals.length > 0) {
                    displayHospitals(hospitalsData.hospitals, data.latitude, data.longitude, 0, cityName);
                    citySearchForm.style.display = 'none';
                } else {
                    alert(`No hospitals found in ${cityName}. Try a nearby city.`);
                }
            } else {
                alert('Error finding hospitals: ' + (hospitalsData.error || 'Unknown error'));
            }
        } else {
            alert(`Could not find location for "${cityName}". Please check the spelling or try a different city.`);
        }
    } catch (error) {
        alert('Error searching for city. Please check your internet connection.');
        console.error('City search error:', error);
    } finally {
        hideLoading();
    }
}

function displayHospitals(hospitals, userLat, userLng, accuracy, cityName) {
    let html = '';
    
    // Add location info header
    const locationTitle = cityName ? `Searching in: ${cityName}` : 'Your Location';
    const accuracyInfo = cityName ? '' : `<strong>Accuracy:</strong> ±${Math.round(accuracy)}m<br>`;
    
    html += `
        <div class="location-info" style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: #1976d2;">
                <i class="fas fa-map-marker-alt"></i> ${locationTitle}
            </h4>
            <p style="margin: 0; font-size: 0.9rem; color: #555;">
                <strong>Coordinates:</strong> ${userLat.toFixed(6)}, ${userLng.toFixed(6)}<br>
                ${accuracyInfo}
                <a href="https://www.google.com/maps?q=${userLat},${userLng}" target="_blank" style="color: #1976d2;">
                    <i class="fas fa-external-link-alt"></i> View on Google Maps
                </a>
            </p>
        </div>
    `;
    
    hospitals.forEach(hospital => {
        const stars = '⭐'.repeat(Math.round(hospital.rating || 0));
        const statusClass = hospital.open_now ? 'status-open' : 'status-closed';
        const statusText = hospital.open_now ? 'Open Now' : 'Closed';
        
        html += `
            <div class="hospital-item">
                <div class="hospital-header">
                    <div>
                        <h4 class="hospital-name">${hospital.name}</h4>
                        <p class="hospital-address">${hospital.address}</p>
                    </div>
                    <div class="hospital-rating">${stars} ${hospital.rating || 'N/A'}</div>
                </div>
                ${hospital.open_now !== null ? `<span class="hospital-status ${statusClass}">${statusText}</span>` : ''}
                <a href="https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hospital.latitude},${hospital.longitude}" 
                   target="_blank" class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">
                    <i class="fas fa-directions"></i> Get Directions
                </a>
            </div>
        `;
    });
    
    hospitalList.innerHTML = html;
    hospitalResults.style.display = 'block';
}

// ==================== HISTORY ====================

const historyTabs = document.querySelectorAll('.history-tab');
const diagnosesHistory = document.getElementById('diagnosesHistory');
const chatsHistory = document.getElementById('chatsHistory');

historyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        historyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        if (tabName === 'diagnoses') {
            diagnosesHistory.style.display = 'block';
            chatsHistory.style.display = 'none';
            loadDiagnosisHistory();
        } else {
            diagnosesHistory.style.display = 'none';
            chatsHistory.style.display = 'block';
            loadChatHistory();
        }
    });
});

async function loadDiagnosisHistory() {
    try {
        const response = await fetch('/api/diagnosis-history');
        const data = await response.json();
        
        const listDiv = document.getElementById('diagnosesHistoryList');
        
        if (data.diagnoses && data.diagnoses.length > 0) {
            let html = '';
            data.diagnoses.forEach(diagnosis => {
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-file-medical"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${diagnosis.symptoms.substring(0, 100)}...</h4>
                            <p>${new Date(diagnosis.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                `;
            });
            listDiv.innerHTML = html;
        } else {
            listDiv.innerHTML = '<p class="empty-state">No diagnosis history yet</p>';
        }
    } catch (error) {
        console.error('Error loading diagnosis history:', error);
    }
}

async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat-history');
        const data = await response.json();
        
        const listDiv = document.getElementById('chatsHistoryList');
        
        if (data.chats && data.chats.length > 0) {
            let html = '';
            data.chats.forEach(chat => {
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${chat.message.substring(0, 100)}...</h4>
                            <p>${new Date(chat.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                `;
            });
            listDiv.innerHTML = html;
        } else {
            listDiv.innerHTML = '<p class="empty-state">No chat history yet</p>';
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Load stats on page load
async function loadStats() {
    try {
        const [diagnosisRes, chatRes] = await Promise.all([
            fetch('/api/diagnosis-history'),
            fetch('/api/chat-history')
        ]);
        
        const diagnosisData = await diagnosisRes.json();
        const chatData = await chatRes.json();
        
        document.getElementById('totalDiagnoses').textContent = diagnosisData.total || 0;
        document.getElementById('totalChats').textContent = chatData.total || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Initialize
loadStats();

// ==================== THEME MANAGEMENT ====================

// Load saved theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('medmate-theme') || 'light';
    applyTheme(savedTheme);
    updateThemeButtons(savedTheme);
}

// Apply theme to body
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-mode', 'med-mode');
    
    if (theme === 'dark') {
        body.classList.add('dark-mode');
    }
    // If med mode was previously selected, default to light
    if (theme === 'med') {
        theme = 'light';
    }
    
    localStorage.setItem('medmate-theme', theme);
}

// Update theme button states
function updateThemeButtons(activeTheme) {
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === activeTheme) {
            btn.classList.add('active');
        }
    });
}

// Theme button event listeners (using event delegation for dynamic content)
document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-option')) {
        const btn = e.target.closest('.theme-option');
        const theme = btn.getAttribute('data-theme');
        applyTheme(theme);
        updateThemeButtons(theme);
        showToast(`Theme changed to ${theme === 'light' ? 'Light' : 'Dark'} mode`);
    }
});

// Load theme on page load
loadTheme();

// ==================== DELETE HISTORY ====================

const deleteChatHistoryBtn = document.getElementById('deleteChatHistoryBtn');
const deleteDiagnosisHistoryBtn = document.getElementById('deleteDiagnosisHistoryBtn');

// Delete chat history
if (deleteChatHistoryBtn) {
    deleteChatHistoryBtn.addEventListener('click', async () => {
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete ALL your chat history.\n\n' +
            'This action cannot be undone. Are you sure you want to continue?'
        );
        
        if (!confirmed) return;
        
        showLoading();
        
        try {
            const response = await fetch('/api/delete-chat-history', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Chat history deleted successfully');
                // Reload chat history if on history page
                if (document.getElementById('chatsHistory').style.display !== 'none') {
                    loadChatHistory();
                }
                // Update stats
                loadStats();
            } else {
                alert('Error: ' + (data.error || 'Failed to delete chat history'));
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });
}

// Delete diagnosis history
if (deleteDiagnosisHistoryBtn) {
    deleteDiagnosisHistoryBtn.addEventListener('click', async () => {
        const confirmed = confirm(
            '⚠️ WARNING: This will permanently delete ALL your diagnosis history.\n\n' +
            'This action cannot be undone. Are you sure you want to continue?'
        );
        
        if (!confirmed) return;
        
        showLoading();
        
        try {
            const response = await fetch('/api/delete-diagnosis-history', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Diagnosis history deleted successfully');
                // Reload diagnosis history if on history page
                if (document.getElementById('diagnosesHistory').style.display !== 'none') {
                    loadDiagnosisHistory();
                }
                // Update stats
                loadStats();
            } else {
                alert('Error: ' + (data.error || 'Failed to delete diagnosis history'));
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });
}
