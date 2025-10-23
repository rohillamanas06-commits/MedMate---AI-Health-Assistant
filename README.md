# MedMate - AI Medical Assistant 🏥💊

MedMate is a comprehensive AI-powered Progressive Web App (PWA) medical assistant that helps users analyze symptoms, get health insights, and find nearby medical facilities. Install it on any device for a native app experience!

## ✨ Key Highlights

- 📱 **Progressive Web App** - Install on any device (Windows, Mac, Android, iOS)
- 🤖 **Dual AI Support** - Works with both OpenAI GPT and Google Gemini
- 🔌 **Offline Support** - Core features work without internet
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode
- 🚀 **Fast & Lightweight** - Optimized performance with service workers

## 🌟 Features

### 1. **Symptom Checker**
- Text-based symptom input
- AI-powered disease prediction with confidence percentages
- Multiple possible diagnoses with explanations
- Treatment recommendations and urgency levels
- Supports both OpenAI and Gemini AI

### 2. **Medical Image Analysis**
- Upload medical images for AI analysis
- Computer vision-powered diagnosis
- Detailed observations and recommendations
- Support for PNG, JPG, JPEG, GIF, BMP, WEBP formats
- Up to 16MB file size

### 3. **AI Medical Assistant**
- Interactive chat with AI assistant
- Natural language understanding
- Health advice and medication information
- Conversation history tracking

### 4. **Hospital Finder**
- Find nearby hospitals using GPS or city search
- Google Maps integration
- Hospital ratings and reviews
- Directions and contact information
- Open/closed status

### 5. **Medical History**
- Track diagnosis history
- Save chat conversations
- View past consultations
- Organized by date

### 6. **Progressive Web App (PWA)**
- 📥 **Install on Any Device** - One-click installation
- 🔌 **Offline Support** - Works without internet
- 🚀 **Fast Loading** - Cached assets for instant access
- 📱 **Native Feel** - Runs like a native app
- 🔄 **Auto Updates** - Always get the latest version
- 🎯 **App Shortcuts** - Quick access to key features

## 🛠️ Technology Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database
- **OpenAI GPT-4** - AI diagnosis and chat (optional)
- **Google Gemini 2.5 Flash** - Alternative AI provider (optional)
- **OpenAI Vision API** - Image analysis
- **Google Maps API** - Hospital finder
- **pyttsx3** - Text-to-speech (optional)

### Frontend
- **HTML5** - Structure and PWA manifest
- **CSS3** - Modern styling with animations
- **JavaScript (ES6+)** - Interactivity and PWA logic
- **Service Workers** - Offline support and caching
- **Font Awesome** - Icons

### PWA Features
- **Manifest.json** - App configuration
- **Service Worker** - Offline functionality
- **Cache API** - Asset caching
- **Install Prompts** - Beautiful install UI

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- **At least ONE AI API key** (OpenAI OR Gemini)
- Google Maps API key (for hospital finder)
- Pillow library (for PWA icon generation)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/rohillamanas06-commits/MedMate---AI-Health-Assistant.git
cd MedMate---AI-Health-Assistant
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
copy .env.example .env
```

Edit `.env` and add your API keys:

```env
# AI API Keys (At least ONE required)
OPENAI_API_KEY=sk-your-openai-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Google Maps API Key (Required for hospital finder)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Note:** You need at least ONE AI API key (OpenAI OR Gemini). The app will automatically use Gemini if available, otherwise OpenAI.

### 5. Generate PWA Icons

```bash
pip install Pillow
python generate_icons.py
```

This creates all required PWA icons in `static/icons/`

### 6. Initialize Database

The database will be automatically created when you first run the application.

### 7. Run the Application

```bash
python MedMate.py
```

The application will start on `http://localhost:5000`

### 8. Install as PWA (Optional)

1. Open http://localhost:5000 in Chrome or Edge
2. Wait 5 seconds for the install prompt
3. Click "Install Now"
4. Enjoy the native app experience!

## 🔑 Getting API Keys

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

**Note:** OpenAI API requires payment. Make sure you have credits in your account.

### Google Gemini API Key (Alternative to OpenAI)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste into `.env` file

**Note:** Gemini API has a generous free tier! Perfect for development and testing.

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Go to Credentials and create an API key
5. Copy and paste into `.env` file

**Note:** Google Maps API has a free tier with $200 monthly credit.

## 📁 Project Structure

```
MedMate/
├── MedMate.py                      # Main Flask application
├── generate_icons.py               # PWA icon generator
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Main documentation
├── PWA_SETUP.md                    # PWA setup guide
├── QUICK_START_PWA.md              # Quick start guide
├── PWA_IMPLEMENTATION_SUMMARY.md   # Implementation details
├── DEPLOY_TO_GITHUB.md             # GitHub deployment guide
├── medmate.db                      # SQLite database (auto-generated)
├── templates/                      # HTML templates
│   ├── index.html                 # Landing page with PWA
│   └── dashboard.html             # User dashboard with PWA
└── static/                         # Static files
    ├── css/
    │   ├── style.css              # Main styles
    │   ├── dashboard.css          # Dashboard styles
    │   └── pwa-install.css        # PWA install modal styles
    ├── js/
    │   ├── main.js                # Main JavaScript
    │   ├── dashboard.js           # Dashboard JavaScript
    │   └── pwa-install.js         # PWA installation handler
    ├── icons/                      # PWA icons (generated)
    │   ├── icon-72x72.png
    │   ├── icon-96x96.png
    │   ├── icon-128x128.png
    │   ├── icon-144x144.png
    │   ├── icon-152x152.png
    │   ├── icon-192x192.png
    │   ├── icon-384x384.png
    │   └── icon-512x512.png
    ├── manifest.json               # PWA manifest
    ├── service-worker.js           # Service worker for offline
    ├── favicon.ico                 # Browser favicon
    ├── apple-touch-icon.png        # iOS icon
    └── uploads/                    # User uploaded images
```

## 🎯 Usage Guide

### 1. Register/Login

- Visit `http://localhost:5000`
- Click "Get Started" or "Login"
- Create a new account or login with existing credentials

### 2. Symptom Checker

- Navigate to "Symptom Checker" in the dashboard
- Describe your symptoms in the text area
- Or use the "Voice Input" button to speak
- Click "Analyze Symptoms"
- View AI-powered diagnosis with confidence percentages

### 3. Image Analysis

- Go to "Image Analysis" section
- Upload a medical image (drag & drop or click)
- Optionally add symptoms for context
- Click "Analyze Image"
- View AI analysis results

### 4. AI Assistant

- Open "AI Assistant" section
- Type your health questions
- Or use voice input
- Get instant AI responses with text-to-speech

### 5. Find Hospitals

- Navigate to "Find Hospitals"
- Click "Use My Location"
- Allow location access
- View nearby hospitals with ratings and directions

### 6. View History

- Go to "My History" section
- Switch between "Diagnoses" and "AI Conversations"
- View all past interactions

## ⚠️ Important Disclaimers

1. **Not a Replacement for Medical Advice**: MedMate is an informational tool and should NOT replace professional medical advice, diagnosis, or treatment.

2. **Always Consult Healthcare Professionals**: For serious health concerns, always consult qualified healthcare providers.

3. **AI Limitations**: AI predictions are based on patterns and may not be 100% accurate.

4. **Emergency Situations**: In case of medical emergencies, call emergency services immediately.

## 🔒 Security Features

- Password hashing with Werkzeug
- Session-based authentication
- Secure file uploads with validation
- SQL injection prevention with SQLAlchemy ORM
- XSS protection

## 🐛 Troubleshooting

### Issue: "OpenAI API Error"
**Solution:** Check if your API key is correct and you have credits in your OpenAI account.

### Issue: "Google Maps API Error"
**Solution:** Verify your Google Maps API key and ensure required APIs are enabled.

### Issue: "Text-to-Speech Not Working"
**Solution:** pyttsx3 may not work on all systems. The app will continue to function without TTS.

### Issue: "Voice Input Not Working"
**Solution:** Use a modern browser (Chrome, Edge) and allow microphone permissions.

### Issue: "Database Error"
**Solution:** Delete `medmate.db` and restart the application to recreate the database.

## 📊 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Check authentication status

### Diagnosis
- `POST /api/diagnose` - Analyze symptoms
- `POST /api/diagnose-image` - Analyze medical image
- `GET /api/diagnosis-history` - Get diagnosis history

### Chat
- `POST /api/chat` - Chat with AI assistant
- `GET /api/chat-history` - Get chat history

### Hospitals
- `POST /api/nearby-hospitals` - Find nearby hospitals
- `GET /api/hospital-details/<place_id>` - Get hospital details

### Utility
- `POST /api/voice-to-text` - Text-to-speech
- `GET /api/health` - Health check

## 🚀 Deployment

### Local Development
```bash
python MedMate.py
```

### Production Deployment

For production, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 MedMate:app
```

Or deploy to platforms like:
- Heroku
- AWS Elastic Beanstalk
- Google Cloud Platform
- DigitalOcean

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is for educational purposes. Please ensure compliance with medical regulations in your jurisdiction.

## 👨‍💻 Developer

Created with ❤️ for better healthcare accessibility

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Remember:** MedMate is a tool to assist with health information, not a replacement for professional medical care. Always consult healthcare professionals for medical advice.
