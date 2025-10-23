"""
MedMate - AI-Powered Medical Assistant
A comprehensive medical diagnosis and assistance platform
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import json
from openai import OpenAI
import requests
import base64
from functools import wraps
import secrets
import pyttsx3
import threading
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(32)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medmate.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
db = SQLAlchemy(app)

# Initialize text-to-speech engine
tts_engine = None
tts_lock = threading.Lock()  # Thread lock for TTS engine
try:
    tts_engine = pyttsx3.init()
    tts_engine.setProperty('rate', 150)
    tts_engine.setProperty('volume', 0.9)
except Exception as e:
    print(f"TTS initialization warning: {e}")

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

# Initialize AI clients (prioritize Gemini over OpenAI)
openai_client = None
gemini_model = None
ai_provider = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        ai_provider = 'gemini'
        print(f"✓ Gemini API configured (key: ...{GEMINI_API_KEY[-8:]})") if len(GEMINI_API_KEY) > 8 else print("✓ Gemini API configured")
    except Exception as e:
        print(f"✗ Gemini API initialization failed: {e}")

if not gemini_model and OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        ai_provider = 'openai'
        print(f"✓ OpenAI API configured (key: ...{OPENAI_API_KEY[-8:]})") if len(OPENAI_API_KEY) > 8 else print("✓ OpenAI API configured")
    except Exception as e:
        print(f"✗ OpenAI API initialization failed: {e}")

if not ai_provider:
    print("✗ No AI API configured - using demo mode")

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# ==================== DATABASE MODELS ====================

class User(db.Model):
    """User model for authentication"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    diagnoses = db.relationship('Diagnosis', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Diagnosis(db.Model):
    """Store diagnosis history"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    symptoms = db.Column(db.Text, nullable=False)
    diagnosis_result = db.Column(db.Text, nullable=False)  # JSON string
    image_path = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_result_dict(self):
        try:
            return json.loads(self.diagnosis_result)
        except:
            return {}

class ChatHistory(db.Model):
    """Store chat conversations with AI assistant"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Hospital(db.Model):
    """Store hospital information"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    rating = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def speak_text(text):
    """Convert text to speech with thread safety and queue management"""
    global tts_engine
    
    def _speak():
        global tts_engine
        try:
            if not tts_engine:
                print("TTS engine not initialized")
                return
            
            print(f"Starting TTS for: {text[:50]}...")
            
            with tts_lock:  # Ensure only one speech at a time
                # Stop any ongoing speech first
                try:
                    tts_engine.stop()
                except:
                    pass
                
                # Speak the text
                tts_engine.say(text)
                tts_engine.runAndWait()
                
                print("TTS completed successfully")
                
                # Small delay to ensure engine is ready for next call
                import time
                time.sleep(0.2)
                
        except Exception as e:
            print(f"TTS error: {e}")
            import traceback
            traceback.print_exc()
            
            # Reinitialize engine if it fails
            try:
                print("Attempting to reinitialize TTS engine...")
                tts_engine = pyttsx3.init()
                tts_engine.setProperty('rate', 150)
                tts_engine.setProperty('volume', 0.9)
                print("TTS engine reinitialized successfully")
            except Exception as reinit_error:
                print(f"Failed to reinitialize TTS: {reinit_error}")
    
    thread = threading.Thread(target=_speak)
    thread.daemon = True
    thread.start()

# ==================== AI FUNCTIONS ====================

def analyze_symptoms_with_ai(symptoms):
    """
    Analyze symptoms using AI (Gemini or OpenAI) to predict possible diseases
    Returns: List of diseases with confidence percentages and solutions
    """
    try:
        prompt = f"""You are a medical AI assistant. Analyze the following symptoms and provide:
1. Top 3-5 possible diseases/conditions with confidence percentages (must add up to 100%)
2. Brief explanation for each
3. Recommended solutions/treatments
4. When to see a doctor (urgency level: Low/Medium/High)

Symptoms: {symptoms}

Respond in JSON format:
{{
    "diseases": [
        {{
            "name": "Disease Name",
            "confidence": 45,
            "explanation": "Why this might be the condition",
            "solutions": ["Solution 1", "Solution 2"],
            "urgency": "Medium"
        }}
    ],
    "general_advice": "General health advice",
    "disclaimer": "Medical disclaimer"
}}"""

        # Try Gemini first
        if gemini_model:
            try:
                response = gemini_model.generate_content(prompt)
                result_text = response.text
                # Clean up markdown code blocks if present
                if '```json' in result_text:
                    result_text = result_text.split('```json')[1].split('```')[0].strip()
                elif '```' in result_text:
                    result_text = result_text.split('```')[1].split('```')[0].strip()
                
                result = json.loads(result_text)
                print(f"✓ Gemini diagnosis completed for: {symptoms[:50]}...")
                return result
            except Exception as e:
                print(f"Gemini error: {e}, falling back...")
        
        # Fallback to OpenAI
        if openai_client:
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful medical AI assistant. Always include medical disclaimers."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                result = json.loads(response.choices[0].message.content)
                print(f"✓ OpenAI diagnosis completed for: {symptoms[:50]}...")
                return result
            except Exception as e:
                print(f"OpenAI error: {e}")
        
        # If both fail, use fallback
        print("No AI service available - using fallback")
        return get_fallback_diagnosis(symptoms)
    
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return get_fallback_diagnosis(symptoms)

def analyze_image_with_vision(image_path, symptoms=""):
    """
    Analyze medical image using AI Vision (Gemini or OpenAI)
    Returns: Analysis results with possible conditions
    """
    try:
        prompt = f"""Analyze this medical image. 
Symptoms provided: {symptoms if symptoms else 'None provided'}

Provide:
1. What you observe in the image
2. Possible conditions (with confidence %)
3. Recommendations
4. Whether professional medical evaluation is needed

Respond in JSON format:
{{
    "observation": "What you see in the image",
    "conditions": [
        {{"name": "Condition", "confidence": 50, "note": "Details"}}
    ],
    "recommendation": "What to do",
    "professional_evaluation": "Required/Recommended/Optional"
}}"""

        # Try Gemini Vision first
        if gemini_model:
            try:
                from PIL import Image
                img = Image.open(image_path)
                response = gemini_model.generate_content([prompt, img])
                result_text = response.text
                
                # Clean up markdown code blocks if present
                if '```json' in result_text:
                    result_text = result_text.split('```json')[1].split('```')[0].strip()
                elif '```' in result_text:
                    result_text = result_text.split('```')[1].split('```')[0].strip()
                
                result = json.loads(result_text)
                print(f"✓ Gemini image analysis completed")
                return result
            except Exception as e:
                print(f"Gemini Vision error: {e}, falling back...")
        
        # Fallback to OpenAI Vision
        if openai_client:
            try:
                # Read and encode image
                with open(image_path, 'rb') as image_file:
                    image_data = base64.b64encode(image_file.read()).decode('utf-8')
                
                response = openai_client.chat.completions.create(
                    model="gpt-4-vision-preview",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=800
                )
                
                result = json.loads(response.choices[0].message.content)
                print(f"✓ OpenAI image analysis completed")
                return result
            except Exception as e:
                print(f"OpenAI Vision error: {e}")
        
        # If both fail, use fallback
        print("No vision AI available - using fallback")
        return get_fallback_image_analysis()
    
    except Exception as e:
        print(f"Vision API Error: {e}")
        return get_fallback_image_analysis()

def chat_with_assistant(message, chat_history=[]):
    """
    Chat with AI medical assistant - ChatGPT-like conversational experience
    Returns: AI response
    """
    try:
        system_prompt = """You are MedMate, a friendly and knowledgeable medical AI assistant. 

Your personality:
- Conversational and empathetic, like ChatGPT
- Explain medical concepts in simple, easy-to-understand language
- Answer ANY health-related questions: diseases, symptoms, medications, nutrition, fitness, mental health, etc.
- Provide detailed, helpful responses
- Be supportive and understanding
- Use examples and analogies when helpful

You can discuss:
- General health and wellness
- Disease information and symptoms
- Medications and treatments
- Nutrition and diet
- Exercise and fitness
- Mental health
- First aid
- Preventive care
- Medical procedures
- And any other health topics

Always remind users to consult healthcare professionals for diagnosis and treatment, but provide comprehensive information to help them understand their health better."""

        # Try Gemini first
        if gemini_model:
            try:
                # Build conversation context for Gemini
                conversation_context = system_prompt + "\n\n"
                for chat in chat_history[-10:]:
                    conversation_context += f"User: {chat['message']}\nAssistant: {chat['response']}\n\n"
                conversation_context += f"User: {message}\nAssistant:"
                
                response = gemini_model.generate_content(conversation_context)
                ai_response = response.text
                print(f"✓ Gemini chat response generated for: {message[:50]}...")
                return ai_response
            except Exception as e:
                print(f"Gemini chat error: {e}, falling back...")
        
        # Fallback to OpenAI
        if openai_client:
            try:
                messages = [{"role": "system", "content": system_prompt}]
                
                # Add chat history context (last 10 messages for better context)
                for chat in chat_history[-10:]:
                    messages.append({"role": "user", "content": chat['message']})
                    messages.append({"role": "assistant", "content": chat['response']})
                
                messages.append({"role": "user", "content": message})
                
                response = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    temperature=0.9,
                    max_tokens=800
                )
                
                ai_response = response.choices[0].message.content
                print(f"✓ OpenAI chat response generated for: {message[:50]}...")
                return ai_response
            except Exception as e:
                print(f"OpenAI chat error: {e}")
        
        # If both fail, return helpful message
        return "I'm here to help! However, the AI service is currently unavailable. Please try again later or check your API configuration."
    
    except Exception as e:
        print(f"Chat Error: {e}")
        return "I apologize, but I'm having trouble processing your request right now. Please try again."

def get_fallback_diagnosis(symptoms):
    """Fallback diagnosis when AI is unavailable"""
    return {
        "diseases": [
            {
                "name": "Common Cold",
                "confidence": 40,
                "explanation": "Based on general symptoms",
                "solutions": ["Rest", "Stay hydrated", "Over-the-counter medication"],
                "urgency": "Low"
            },
            {
                "name": "Viral Infection",
                "confidence": 35,
                "explanation": "Common viral symptoms",
                "solutions": ["Rest", "Fluids", "Monitor symptoms"],
                "urgency": "Medium"
            },
            {
                "name": "Allergic Reaction",
                "confidence": 25,
                "explanation": "Possible allergic response",
                "solutions": ["Identify allergen", "Antihistamines", "Avoid triggers"],
                "urgency": "Low"
            }
        ],
        "general_advice": "Monitor your symptoms and stay hydrated. If symptoms worsen, consult a doctor.",
        "disclaimer": "This is not a professional medical diagnosis. Please consult a healthcare provider for accurate diagnosis."
    }

def get_fallback_image_analysis():
    """Fallback image analysis when Vision API is unavailable"""
    return {
        "observation": "Image received but AI analysis is currently unavailable",
        "conditions": [
            {
                "name": "Unable to analyze",
                "confidence": 0,
                "note": "Please consult a healthcare professional for image analysis"
            }
        ],
        "recommendation": "Please show this image to a qualified healthcare provider for proper evaluation",
        "professional_evaluation": "Required"
    }

# ==================== GOOGLE MAPS FUNCTIONS ====================

def find_nearby_hospitals(latitude, longitude, radius=5000):
    """
    Find nearby hospitals using Google Places API with GPS coordinates
    Returns: List of hospitals with details
    """
    try:
        if not GOOGLE_MAPS_API_KEY:
            print("❌ Google Maps API key not configured")
            return get_fallback_hospitals()
        
        # Validate coordinates
        try:
            lat = float(latitude)
            lng = float(longitude)
        except (ValueError, TypeError):
            print(f"❌ Invalid coordinate format: {latitude}, {longitude}")
            return get_fallback_hospitals()
        
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            print(f"❌ Coordinates out of range: {lat}, {lng}")
            return get_fallback_hospitals()
        
        print(f"🔍 Searching hospitals near GPS: {lat}, {lng} (radius: {radius}m)")
        
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f'{lat},{lng}',
            'radius': radius,
            'type': 'hospital',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        print(f"📡 Calling Google Maps API...")
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        print(f"📊 Google Maps API Status: {data.get('status')}")
        
        hospitals = []
        if data.get('status') == 'OK':
            for place in data.get('results', [])[:10]:  # Top 10 hospitals
                hospital = {
                    'name': place.get('name'),
                    'address': place.get('vicinity'),
                    'latitude': place['geometry']['location']['lat'],
                    'longitude': place['geometry']['location']['lng'],
                    'rating': place.get('rating', 0),
                    'open_now': place.get('opening_hours', {}).get('open_now', None),
                    'place_id': place.get('place_id')
                }
                hospitals.append(hospital)
            print(f"✅ Found {len(hospitals)} hospitals")
            if hospitals:
                print(f"📍 First hospital: {hospitals[0]['name']} at {hospitals[0]['address']}")
        elif data.get('status') == 'ZERO_RESULTS':
            print("⚠️ No hospitals found in this area")
        else:
            print(f"❌ Google Maps API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        
        return hospitals
    
    except Exception as e:
        print(f"❌ Google Maps API Error: {e}")
        import traceback
        traceback.print_exc()
        return get_fallback_hospitals()

def get_hospital_details(place_id):
    """Get detailed information about a specific hospital"""
    try:
        if not GOOGLE_MAPS_API_KEY:
            return {}
        
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,formatted_phone_number,opening_hours,rating,website',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('status') == 'OK':
            return data.get('result', {})
        
        return {}
    
    except Exception as e:
        print(f"Hospital Details Error: {e}")
        return {}

def get_fallback_hospitals():
    """Fallback hospitals when Google API is unavailable"""
    return [
        {
            'name': 'Local Hospital',
            'address': 'Please enable location services',
            'latitude': 0,
            'longitude': 0,
            'rating': 0,
            'open_now': None,
            'place_id': None
        }
    ]

# ==================== ROUTES ====================

@app.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard"""
    user = User.query.get(session['user_id'])
    recent_diagnoses = Diagnosis.query.filter_by(user_id=user.id).order_by(Diagnosis.created_at.desc()).limit(5).all()
    return render_template('dashboard.html', user=user, diagnoses=recent_diagnoses)

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        session['username'] = user.username
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not all([username, password]):
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        session['user_id'] = user.id
        session['username'] = user.username
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
    return jsonify({'authenticated': False}), 200

# Google OAuth removed - using local authentication only

# ==================== DIAGNOSIS ROUTES ====================

@app.route('/api/diagnose', methods=['POST'])
@login_required
def diagnose():
    """Analyze symptoms and provide diagnosis"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', '')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms are required'}), 400
        
        # Analyze symptoms with AI
        result = analyze_symptoms_with_ai(symptoms)
        
        # Save diagnosis to database
        diagnosis = Diagnosis(
            user_id=session['user_id'],
            symptoms=symptoms,
            diagnosis_result=json.dumps(result)
        )
        db.session.add(diagnosis)
        db.session.commit()
        
        return jsonify({
            'message': 'Diagnosis completed',
            'diagnosis_id': diagnosis.id,
            'result': result
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnose-image', methods=['POST'])
@login_required
def diagnose_image():
    """Analyze medical image with optional symptoms"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        symptoms = request.form.get('symptoms', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file
        filename = secure_filename(f"{session['user_id']}_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Analyze image with Vision API
        result = analyze_image_with_vision(filepath, symptoms)
        
        # Save diagnosis to database
        diagnosis = Diagnosis(
            user_id=session['user_id'],
            symptoms=symptoms if symptoms else 'Image analysis',
            diagnosis_result=json.dumps(result),
            image_path=filepath
        )
        db.session.add(diagnosis)
        db.session.commit()
        
        return jsonify({
            'message': 'Image analysis completed',
            'diagnosis_id': diagnosis.id,
            'result': result,
            'image_url': url_for('static', filename=f'uploads/{filename}')
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnosis-history', methods=['GET'])
@login_required
def diagnosis_history():
    """Get user's diagnosis history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        diagnoses = Diagnosis.query.filter_by(user_id=session['user_id'])\
            .order_by(Diagnosis.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        results = []
        for d in diagnoses.items:
            results.append({
                'id': d.id,
                'symptoms': d.symptoms,
                'result': d.get_result_dict(),
                'image_url': url_for('static', filename=d.image_path.replace('static/', '')) if d.image_path else None,
                'created_at': d.created_at.isoformat()
            })
        
        return jsonify({
            'diagnoses': results,
            'total': diagnoses.total,
            'pages': diagnoses.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CHAT ASSISTANT ROUTES ====================

@app.route('/api/chat', methods=['POST'])
@login_required
def chat():
    """Chat with AI assistant"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get recent chat history for context
        recent_chats = ChatHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(ChatHistory.created_at.desc())\
            .limit(5)\
            .all()
        
        chat_context = [{'message': c.message, 'response': c.response} for c in reversed(recent_chats)]
        
        # Get AI response
        response = chat_with_assistant(message, chat_context)
        
        # Save chat to database
        chat_entry = ChatHistory(
            user_id=session['user_id'],
            message=message,
            response=response
        )
        db.session.add(chat_entry)
        db.session.commit()
        
        return jsonify({
            'message': message,
            'response': response,
            'timestamp': chat_entry.created_at.isoformat()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat-history', methods=['GET'])
@login_required
def chat_history():
    """Get chat history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        chats = ChatHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(ChatHistory.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        results = [{
            'id': c.id,
            'message': c.message,
            'response': c.response,
            'created_at': c.created_at.isoformat()
        } for c in chats.items]
        
        return jsonify({
            'chats': results,
            'total': chats.total,
            'pages': chats.pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== VOICE INPUT ROUTE ====================

@app.route('/api/voice-to-text', methods=['POST'])
@login_required
def voice_to_text():
    """Text-to-speech endpoint"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        print(f"TTS request received: {len(text)} characters")
        
        if text:
            if not tts_engine:
                print("TTS engine not available")
                return jsonify({'error': 'Text-to-speech not available'}), 503
            
            speak_text(text)
            print("TTS request queued successfully")
            return jsonify({'message': 'Speech synthesis started', 'status': 'success'}), 200
        
        print("TTS request failed: No text provided")
        return jsonify({'error': 'No text provided'}), 400
    
    except Exception as e:
        print(f"TTS endpoint error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== HOSPITAL FINDER ROUTES ====================

@app.route('/api/geocode-city', methods=['POST'])
def geocode_city():
    """Convert city name to coordinates using Google Geocoding API"""
    try:
        data = request.get_json()
        city = data.get('city', '')
        
        if not city:
            return jsonify({'error': 'City name required'}), 400
        
        if not GOOGLE_MAPS_API_KEY:
            return jsonify({'error': 'Google Maps API not configured'}), 500
        
        # Add Haryana, India to improve accuracy
        search_query = f"{city}, Haryana, India"
        print(f"🔍 Geocoding city: {search_query}")
        
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': search_query,
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data.get('status') == 'OK' and data.get('results'):
            location = data['results'][0]['geometry']['location']
            formatted_address = data['results'][0]['formatted_address']
            
            print(f"✅ Found: {formatted_address}")
            print(f"📍 Coordinates: {location['lat']}, {location['lng']}")
            
            return jsonify({
                'latitude': location['lat'],
                'longitude': location['lng'],
                'formatted_address': formatted_address
            }), 200
        else:
            print(f"❌ Geocoding failed: {data.get('status')}")
            return jsonify({'error': 'City not found'}), 404
    
    except Exception as e:
        print(f"❌ Geocoding error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/nearby-hospitals', methods=['POST'])
def nearby_hospitals():
    """Find nearby hospitals based on location"""
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        radius = data.get('radius', 5000)  # Default 5km
        
        if not latitude or not longitude:
            return jsonify({'error': 'Location coordinates required'}), 400
        
        hospitals = find_nearby_hospitals(latitude, longitude, radius)
        
        return jsonify({
            'hospitals': hospitals,
            'count': len(hospitals)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hospital-details/<place_id>', methods=['GET'])
def hospital_details(place_id):
    """Get detailed information about a hospital"""
    try:
        details = get_hospital_details(place_id)
        return jsonify(details), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== UTILITY ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'ai_provider': ai_provider if ai_provider else 'none',
        'services': {
            'database': 'connected',
            'gemini': 'available' if GEMINI_API_KEY else 'not configured',
            'openai': 'available' if OPENAI_API_KEY else 'not configured',
            'google_maps': 'available' if GOOGLE_MAPS_API_KEY else 'not configured',
            'tts': 'available' if tts_engine else 'not available'
        }
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== DATABASE INITIALIZATION ====================

# Initialize database tables (for Vercel compatibility)
try:
    with app.app_context():
        db.create_all()
except Exception as e:
    print(f"⚠️ Database initialization warning: {e}")
    print("Note: SQLite may not work on Vercel. Consider using PostgreSQL for production.")

# ==================== MAIN ====================

if __name__ == '__main__':
    # Print startup information
    print("=" * 50)
    print("MedMate - AI Medical Assistant")
    print("=" * 50)
    print(f"AI Provider: {ai_provider.upper() if ai_provider else 'NONE (Demo Mode)'}")
    print(f"Gemini API: {'✓ Configured' if GEMINI_API_KEY else '✗ Not configured'}")
    print(f"OpenAI API: {'✓ Configured' if OPENAI_API_KEY else '✗ Not configured'}")
    print(f"Google Maps API: {'✓ Configured' if GOOGLE_MAPS_API_KEY else '✗ Not configured'}")
    print(f"Text-to-Speech: {'✓ Available' if tts_engine else '✗ Not available'}")
    print("=" * 50)
    print("Starting server on http://localhost:5000")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
