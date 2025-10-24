# MedMate - AI Medical Assistant Frontend

## 🏥 About MedMate

MedMate is an advanced AI-powered medical assistant platform that provides:

- **AI Symptom Diagnosis** - Instant symptom analysis using Gemini/OpenAI
- **Medical Image Analysis** - Upload and analyze medical images
- **24/7 AI Chat Assistant** - Interactive medical consultation
- **Hospital Finder** - Locate nearby medical facilities
- **Medical History** - Track diagnoses and conversations
- **Voice Recognition** - Hands-free symptom input

## 🚀 Features

### Core Features
- ✅ User authentication (register/login)
- ✅ AI-powered symptom checker
- ✅ Medical image analysis with Vision API
- ✅ Interactive AI chat with context awareness
- ✅ Hospital finder with Google Maps integration
- ✅ Diagnosis and chat history tracking
- ✅ Voice recognition for hands-free input
- ✅ Text-to-speech for accessibility
- ✅ Responsive design for all devices

### Design Highlights
- 🎨 Medical-grade UI with calming blue/teal theme
- ✨ Smooth animations and micro-interactions
- 🌓 Light/dark mode support
- 📱 Mobile-first responsive design
- ♿ Accessible components

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **React Router** - Navigation
- **TanStack Query** - Data fetching

### Backend Integration
- **Flask** - Python backend API
- **SQLAlchemy** - Database ORM
- **OpenAI/Gemini** - AI models
- **Google Maps API** - Location services

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Backend running on port 5000 (see MedMate.py)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd medmate-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your backend URL
# VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### Backend Setup

Make sure your Flask backend is running with:
- OpenAI or Gemini API key configured
- Google Maps API key (for hospital finder)
- Database configured (PostgreSQL recommended for production)

## 📱 Pages

### Public Pages
- **Home** (`/`) - Landing page with features
- **Auth** (`/auth`) - Login/Register

### Protected Pages (Require Authentication)
- **Dashboard** (`/dashboard`) - Overview and quick actions
- **Diagnose** (`/diagnose`) - Symptom checker and image analysis
- **Chat** (`/chat`) - AI medical assistant
- **Hospitals** (`/hospitals`) - Find nearby hospitals
- **History** (`/history`) - View past diagnoses and chats
- **Profile** (`/profile`) - User account settings

## 🎨 Design System

### Color Palette
- **Primary**: Medical Blue (#3B82F6)
- **Secondary**: Healthcare Green (#10B981)
- **Accent**: Teal (#14B8A6)
- **Destructive**: Medical Red (#EF4444)

### Animations
- Smooth transitions with cubic-bezier easing
- Float animations for hero elements
- Fade-in and slide-up for page elements
- Pulse glow for interactive elements

## 🔌 API Integration

The frontend communicates with the Flask backend via REST API:

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Check auth status

### Diagnosis
- `POST /api/diagnose` - Text symptom analysis
- `POST /api/diagnose-image` - Image analysis
- `GET /api/diagnosis-history` - Get user's diagnosis history

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat-history` - Get conversation history

### Hospitals
- `POST /api/geocode-city` - Convert city to coordinates
- `POST /api/nearby-hospitals` - Find nearby hospitals
- `GET /api/hospital-details/<id>` - Get hospital details

### Voice
- `POST /api/voice-to-text` - Voice recognition
- `POST /api/text-to-speech` - Text-to-speech
- `GET /api/voice/status` - Voice features status

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

### Deploy Options
- **Vercel** - Recommended for frontend
- **Netlify** - Easy deployment
- **Cloudflare Pages** - Fast CDN
- **AWS S3 + CloudFront** - Enterprise scale

### Backend Deployment
Deploy the Flask backend to:
- **Vercel** (serverless)
- **Railway** (with PostgreSQL)
- **Heroku** (with add-ons)
- **AWS EC2/ECS** (production scale)

## 🔒 Security

- Session-based authentication with secure cookies
- HTTPS enforced in production
- CORS configured for frontend domain
- Input sanitization on backend
- Medical disclaimer on all diagnoses

## 📄 License

This project is created for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please follow:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

## ⚠️ Medical Disclaimer

MedMate is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.

---

Built with ❤️ using React, TypeScript, and AI technology
