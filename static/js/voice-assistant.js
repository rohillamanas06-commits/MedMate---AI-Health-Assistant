// Voice Assistant - Browser-based Speech Recognition and Synthesis
// Works in serverless environments (Vercel, Netlify, etc.)

class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isMuted = localStorage.getItem('voiceMuted') === 'true' || false;
        this.voices = [];
        
        this.initRecognition();
        this.initSynthesis();
    }
    
    // Initialize Speech Recognition
    initRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            console.log('✓ Speech Recognition initialized');
        } else {
            console.warn('⚠️ Speech Recognition not supported in this browser');
        }
    }
    
    // Initialize Speech Synthesis
    initSynthesis() {
        if (this.synthesis) {
            // Load voices
            this.loadVoices();
            
            // Voices may load asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
            
            console.log('✓ Speech Synthesis initialized');
        } else {
            console.warn('⚠️ Speech Synthesis not supported in this browser');
        }
    }
    
    // Load available voices
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log(`Loaded ${this.voices.length} voices`);
    }
    
    // Start listening
    startListening(onResult, onError) {
        if (!this.recognition) {
            if (onError) onError('Speech recognition not supported');
            return false;
        }
        
        if (this.isListening) {
            this.stopListening();
            return false;
        }
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            
            console.log(`Recognized: "${transcript}" (${(confidence * 100).toFixed(1)}% confidence)`);
            
            if (onResult) {
                onResult(transcript, confidence);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            if (onError) {
                onError(event.error);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
        };
        
        try {
            this.recognition.start();
            this.isListening = true;
            console.log('🎤 Listening...');
            return true;
        } catch (error) {
            console.error('Failed to start recognition:', error);
            if (onError) onError(error.message);
            return false;
        }
    }
    
    // Stop listening
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            console.log('🎤 Stopped listening');
        }
    }
    
    // Speak text
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return false;
        }
        
        if (this.isMuted) {
            console.log('🔇 Voice muted, not speaking');
            return false;
        }
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply options
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = options.lang || 'en-US';
        
        // Select voice
        if (options.voice) {
            utterance.voice = options.voice;
        } else if (this.voices.length > 0) {
            // Try to find an English voice
            const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
        }
        
        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speaking:', text.substring(0, 50) + '...');
        };
        
        utterance.onend = () => {
            console.log('✓ Speech completed');
            if (options.onEnd) options.onEnd();
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            if (options.onError) options.onError(event.error);
        };
        
        // Speak
        this.synthesis.speak(utterance);
        return true;
    }
    
    // Stop speaking
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            console.log('🔇 Stopped speaking');
        }
    }
    
    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('voiceMuted', this.isMuted);
        
        if (this.isMuted) {
            this.stopSpeaking();
        }
        
        console.log(this.isMuted ? '🔇 Voice muted' : '🔊 Voice unmuted');
        return this.isMuted;
    }
    
    // Set mute state
    setMuted(muted) {
        this.isMuted = muted;
        localStorage.setItem('voiceMuted', this.isMuted);
        
        if (this.isMuted) {
            this.stopSpeaking();
        }
    }
    
    // Check if features are available
    isRecognitionAvailable() {
        return this.recognition !== null;
    }
    
    isSynthesisAvailable() {
        return this.synthesis !== null;
    }
    
    // Get available voices
    getVoices() {
        return this.voices;
    }
    
    // Get status
    getStatus() {
        return {
            recognitionAvailable: this.isRecognitionAvailable(),
            synthesisAvailable: this.isSynthesisAvailable(),
            isListening: this.isListening,
            isMuted: this.isMuted,
            voicesCount: this.voices.length
        };
    }
}

// Create global instance
const voiceAssistant = new VoiceAssistant();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceAssistant;
}
