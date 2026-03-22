"""
MedMate - AI-Powered Medical Assistant
A comprehensive medical diagnosis and assistance platform
"""

import sys
import io

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import json
from openai import OpenAI
import requests
import base64
import fitz # PyMuPDF
import docx
from functools import wraps
import secrets
import threading
from dotenv import load_dotenv
import google.generativeai as genai
import re
from email_validator import validate_email, EmailNotValidError
# Text-to-speech disabled on backend (handled by frontend Web Speech API) to prevent comtypes crash
PYTTSX3_AVAILABLE = False
pyttsx3 = None

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("⚠️ scispaCy not available, using regex fallback")

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))

# Enable CORS for frontend communication
# Auto-detect production environment
is_vercel = os.getenv('VERCEL') == '1'
vercel_url = os.getenv('VERCEL_URL')
deployment_url = os.getenv('DEPLOYMENT_URL')

# Build allowed origins dynamically
cors_origins = [
    'http://localhost:8000',  # Vite dev server port
    'http://127.0.0.1:8000', 
    'http://localhost:8080', 
    'http://127.0.0.1:8080', 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://med-mate-ai-health-assistant-v2.vercel.app',
    'https://medmate-ecru.vercel.app',
    'https://medmate-ai-health-assistant-lhwk.onrender.com',
]

# Add Vercel URL if available
if is_vercel and vercel_url:
    cors_origins.append(f'https://{vercel_url}')
if deployment_url:
    cors_origins.append(deployment_url)

CORS(app, 
     supports_credentials=True, 
     origins=cors_origins,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     expose_headers=['Content-Type', 'Authorization', 'X-Total-Count'],
     max_age=86400,  # 24 hours
     vary_header=True)

# Session configuration for proper cookie handling
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Set SESSION_COOKIE_SECURE and SESSION_COOKIE_SAMESITE based on environment
# In production (Railway/Vercel), use True for HTTPS and None for SameSite
# In local development, use False for HTTP and Lax for SameSite
is_production = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER') or os.getenv('VERCEL')

if is_production:
    app.config['SESSION_COOKIE_SECURE'] = True  # HTTPS required
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-domain
else:
    app.config['SESSION_COOKIE_SECURE'] = False  # HTTP for local
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Better for local development

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)  # Extended to 30 days

# Database configuration - PostgreSQL for production, SQLite for local
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use PostgreSQL
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    # Configure SQLAlchemy for PostgreSQL
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_size': 20,  # Increased pool size for faster queries
        'max_overflow': 30,  # More overflow connections
        'connect_args': {
            'sslmode': 'require',
            'connect_timeout': 30,  # Increased for reliability
            'application_name': 'medmate_app'  # Helpful for monitoring
        }
    }
    upload_folder = '/tmp/uploads' if os.getenv('VERCEL') else 'static/uploads'
    print("✅ Using PostgreSQL database for production")
    print(f"📍 Database host: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'unknown'}")
else:
    # Local development: Use SQLite
    if os.getenv('VERCEL'):
        db_path = '/tmp/medmate.db'
        upload_folder = '/tmp/uploads'
        print("⚠️ WARNING: Using temporary SQLite on Vercel - accounts will not persist!")
    else:
        db_path = 'medmate.db'
        upload_folder = 'static/uploads'
        print("✅ Using SQLite database for local development")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = upload_folder
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
db = SQLAlchemy(app)

# Email configuration - SendGrid
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')

# Razorpay configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

# Credit packages - pricing in rupees
CREDIT_PACKAGES = [
    {'id': 'starter', 'name': 'Starter Pack', 'price': 50, 'credits': 20, 'currency': 'INR'},
    {'id': 'professional', 'name': 'Professional Pack', 'price': 100, 'credits': 50, 'currency': 'INR'},
]

# Credit costs for different features
CREDIT_COSTS = {
    'chat': 1,
    'report': 1,
    'image': 1,
    'symptoms': 1
}

# Database initialization function for serverless
def init_db():
    """Initialize database tables - called on each request in serverless"""
    try:
        # Check if profile_picture column exists, if not add it
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user')]
            if 'profile_picture' not in columns:
                print("⚠️ Adding profile_picture column to user table...")
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE \"user\" ADD COLUMN profile_picture VARCHAR(300)"))
                    conn.commit()
                print("✅ profile_picture column added successfully")
            
            if 'diagnosis' in inspector.get_table_names():
                diag_columns = [col['name'] for col in inspector.get_columns('diagnosis')]
                if 'is_deleted' not in diag_columns:
                    print("⚠️ Adding is_deleted to diagnosis table...")
                    with db.engine.connect() as conn:
                        conn.execute(text("ALTER TABLE diagnosis ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE"))
                        conn.execute(text("ALTER TABLE diagnosis ADD COLUMN deleted_at TIMESTAMP"))
                        conn.commit()

            if 'chat_history' in inspector.get_table_names():
                chat_columns = [col['name'] for col in inspector.get_columns('chat_history')]
                if 'is_deleted' not in chat_columns:
                    print("⚠️ Adding is_deleted to chat_history table...")
                    with db.engine.connect() as conn:
                        conn.execute(text("ALTER TABLE chat_history ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE"))
                        conn.execute(text("ALTER TABLE chat_history ADD COLUMN deleted_at TIMESTAMP"))
                        conn.commit()
        except Exception as migration_error:
            print(f"⚠️ Migration check skipped (development mode): {migration_error}")
        
        db.create_all()
        
        # Create indexes for better query performance
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            
            # Create indexes if they don't exist
            with db.engine.connect() as conn:
                # Index for diagnosis.user_id
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_diagnosis_user_id ON diagnosis(user_id)"))
                # Index for diagnosis.created_at
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_diagnosis_created_at ON diagnosis(created_at)"))
                # Index for chat_history.user_id
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id)"))
                # Index for chat_history.created_at
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at)"))
                conn.commit()
            print("✅ Database indexes created/verified successfully")
        except Exception as index_error:
            print(f"⚠️ Index creation skipped: {index_error}")
        
        print("✅ Database tables created/verified successfully")
        return True
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Hook to ensure database is initialized before each request and refresh session
@app.before_request
def ensure_db_initialized():
    """Ensure database tables exist before processing request"""
    if not hasattr(app, '_db_initialized'):
        with app.app_context():
            success = init_db()
            if success:
                app._db_initialized = True
                print(f"📊 Database URI: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
            else:
                print("⚠️ Database initialization failed, but continuing...")
    
    # Refresh session expiration time on each request if user is authenticated
    if 'user_id' in session:
        session.permanent = True
        session.modified = True  # This tells Flask to send a new cookie with updated expiration

# Hook to add CORS headers to all responses
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    origin = request.headers.get('Origin')
    allowed_origins = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://med-mate-ai-health-assistant-v2.vercel.app',
        'https://medmate-ecru.vercel.app',
        'https://medmate-ai-health-assistant-lhwk.onrender.com',
    ]
    
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Max-Age'] = '3600'
    
    return response

# Initialize text-to-speech engine
tts_engine = None
tts_lock = threading.Lock()  # Thread lock for TTS engine
if PYTTSX3_AVAILABLE:
    try:
        tts_engine = pyttsx3.init()
        tts_engine.setProperty('rate', 150)
        tts_engine.setProperty('volume', 0.9)
    except Exception as e:
        print(f"TTS initialization warning: {e}")
else:
    print("TTS not available (running in serverless environment)")

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

# Configure Razorpay
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
razorpay_client = None

# Initialize AI clients (prioritize Gemini over OpenAI)
openai_client = None
gemini_model = None
ai_provider = None

if GEMINI_API_KEY:
    try:
        print(f"🔧 Configuring Gemini API...")
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Initialize model without testing (lazy loading)
        # Use the most common model that should work
        gemini_model = genai.GenerativeModel('models/gemini-2.5-flash')
        ai_provider = 'gemini'
        print(f"✓ Gemini API configured (model will be tested on first use)")
    except Exception as e:
        print(f"⚠️ Gemini API configuration warning: {type(e).__name__}: {str(e)}")
        gemini_model = None

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
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'pdf', 'docx', 'txt'}

# ==================== DATABASE MODELS ====================

class User(db.Model):
    """User model for authentication"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    profile_picture = db.Column(db.String(300), nullable=True)
    credits = db.Column(db.Integer, default=10)  # 10 free credits on signup
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    diagnoses = db.relationship('Diagnosis', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    report_history = db.relationship('ReportHistory', backref='user', lazy=True, cascade='all, delete-orphan')
    credit_transactions = db.relationship('CreditsTransaction', backref='user', lazy=True, cascade='all, delete-orphan')
    payment_orders = db.relationship('PaymentOrder', backref='user', lazy=True, cascade='all, delete-orphan')
    reset_tokens = db.relationship('PasswordResetToken', backref='user', lazy=True, cascade='all, delete-orphan')
    account_deletion_tokens = db.relationship('AccountDeletionToken', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class PasswordResetToken(db.Model):
    """Password reset token model"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(200), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        return not self.used and datetime.utcnow() < self.expires_at


class AccountDeletionToken(db.Model):
    """Store verification codes for account deletion"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at

class Diagnosis(db.Model):
    """Store diagnosis history"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    symptoms = db.Column(db.Text, nullable=False)
    diagnosis_result = db.Column(db.Text, nullable=False)  # JSON string
    image_path = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    def get_result_dict(self):
        try:
            return json.loads(self.diagnosis_result)
        except:
            return {}

class ChatHistory(db.Model):
    """Store chat conversations with AI assistant"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

class ReportHistory(db.Model):
    """Store medical report explanations"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    file_name = db.Column(db.String(300), nullable=True)
    result = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def get_result_dict(self):
        try:
            return json.loads(self.result)
        except:
            return {}

class CreditsTransaction(db.Model):
    """Track credit transactions (usage and purchases)"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    credits = db.Column(db.Integer, nullable=False)  # Positive for purchase, negative for usage
    transaction_type = db.Column(db.String(50), nullable=False)  # 'chat', 'report', 'image', 'symptoms', 'purchase', 'free'
    description = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class PaymentOrder(db.Model):
    """Track Razorpay payment orders"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    razorpay_order_id = db.Column(db.String(100), unique=True, nullable=True)
    razorpay_payment_id = db.Column(db.String(100), unique=True, nullable=True)
    amount = db.Column(db.Integer, nullable=False)  # Amount in paise (1 rupee = 100 paise)
    credits = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='created')  # 'created', 'pending', 'completed', 'failed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    completed_at = db.Column(db.DateTime, nullable=True)

class Hospital(db.Model):
    """Store hospital information"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def validate_email_format(email):
    """Validate email format using email-validator"""
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False

def validate_password_strength(password):
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

# ==================== CREDIT SYSTEM FUNCTIONS ====================

def deduct_credits(user_id, cost, transaction_type, description=None):
    """Deduct credits from user account"""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return False, 'User not found'
        
        if user.credits < cost:
            return False, f'Insufficient credits. You have {user.credits} credits but need {cost}'
        
        # Deduct credits
        user.credits -= cost
        
        # Log transaction
        transaction = CreditsTransaction(
            user_id=user_id,
            credits=-cost,
            transaction_type=transaction_type,
            description=description
        )
        db.session.add(transaction)
        db.session.commit()
        
        return True, f'Deducted {cost} credits for {transaction_type}'
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deducting credits: {e}")
        return False, str(e)

def add_credits(user_id, credits, transaction_type, description=None):
    """Add credits to user account"""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return False, 'User not found'
        
        user.credits += credits
        
        transaction = CreditsTransaction(
            user_id=user_id,
            credits=credits,
            transaction_type=transaction_type,
            description=description
        )
        db.session.add(transaction)
        db.session.commit()
        
        return True, f'Added {credits} credits from {transaction_type}'
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding credits: {e}")
        return False, str(e)

def send_feedback_email(name, email, message):
    """Send feedback email to author using SendGrid"""
    print("=" * 50)
    print("📧 SENDING FEEDBACK EMAIL")
    print("=" * 50)
    print(f"📋 From: {name} ({email})")
    print(f"📧 To: rohillamanas06@gmail.com")
    print(f"📝 Message: {message[:100]}...")
    print(f"📋 SendGrid configured: {bool(SENDGRID_API_KEY)}")
    print("=" * 50)
    
    try:
        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False
        
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message_body = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails='rohillamanas06@gmail.com',
            subject='MedMate Feedback',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate Feedback</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">New Feedback Received</h2>
                    <p style="color: #666; line-height: 1.6;">
                        You have received new feedback from a user.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> {name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                        <p style="margin: 5px 0; white-space: pre-wrap;"><strong>Message:</strong> {message}</p>
                    </div>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """
        )
        
        response = sg.send(message_body)
        print("=" * 50)
        print(f"✅ Feedback email sent successfully! Status: {response.status_code}")
        print("=" * 50)
        return True
    except Exception as e:
        print("=" * 50)
        print(f"❌ Error sending feedback email: {e}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        return False

def send_password_reset_email(user_email, reset_link):
    """Send password reset email using SendGrid"""
    try:
        print(f"📧 Attempting to send password reset email to: {user_email}")
        
        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False
        
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails=user_email,
            subject='Reset Your MedMate Password',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate</h1>
                    <p style="color: white; margin: 10px 0 0 0;">AI-Powered Medical Assistant</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #666; line-height: 1.6;">
                        We received a request to reset your password for your MedMate account. 
                        Click the button below to reset your password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; padding: 15px 40px; text-decoration: none; 
                                  border-radius: 5px; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #999; font-size: 14px; line-height: 1.6;">
                        If you didn't request this, please ignore this email. Your password will remain unchanged.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                        This link will expire in 1 hour for security reasons.
                    </p>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """,
        )
        
        message.reply_to = 'rohillamanas06@gmail.com'
        
        response = sg.send(message)
        print(f"✅ Password reset email sent successfully to: {user_email}")
        print(f"📊 SendGrid status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_account_deletion_code(user_email, username, code):
    """Send account deletion verification code via email"""
    try:
        print(f"📧 Sending account deletion code to: {user_email}")

        if not SENDGRID_API_KEY:
            print("❌ SendGrid API key not configured")
            return False

        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        message = Mail(
            from_email='rohillamanas06@gmail.com',
            to_emails=user_email,
            subject='Confirm Your MedMate Account Deletion',
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">MedMate</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Account Deletion Request</p>
                </div>
                <div style="background: #f9f9f9; padding: 30px;">
                    <p style="color: #333; line-height: 1.6;">
                        Hi {username},
                    </p>
                    <p style="color: #666; line-height: 1.6;">
                        We received a request to delete your MedMate account. If this was you, please use the verification code below to confirm the deletion. This code will expire in 10 minutes.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; padding: 15px 40px; font-size: 28px; letter-spacing: 6px; background: #fff; border: 2px dashed #ff5f6d; border-radius: 8px; color: #ff5f6d;">
                            {code}
                        </div>
                    </div>
                    <p style="color: #999; font-size: 14px; line-height: 1.6;">
                        If you did not request this, please ignore this email. Your account will remain active.
                    </p>
                </div>
                <div style="background: #eee; padding: 20px; text-align: center;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        © 2024 MedMate. All rights reserved.
                    </p>
                </div>
            </div>
            """,
        )
        message.reply_to = 'rohillamanas06@gmail.com'
        response = sg.send(message)
        print(f"✅ Account deletion code sent (status {response.status_code})")
        return True
    except Exception as e:
        print(f"❌ Error sending account deletion code: {e}")
        import traceback
        traceback.print_exc()
        return False

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests through without authentication (CORS preflight)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        
        if 'user_id' not in session:
            # Check if this is an API request or page request
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Authentication required'}), 401
            else:
                # Redirect to home page for non-API requests
                return redirect(url_for('index'))
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

def analyze_symptoms_with_ai(symptoms, language='en'):
    """
    Analyze symptoms using AI (Gemini or OpenAI) to predict possible diseases
    Returns: List of diseases with confidence percentages and solutions
    """
    try:
        lang_names = {'en':'English','hi':'Hindi','bn':'Bengali','pa':'Punjabi','ml':'Malayalam','kn':'Kannada'}
        lang_name = lang_names.get(language, 'English')
        
        prompt = f"""You are a medical AI assistant.
IMPORTANT: Respond entirely in {lang_name}.

Analyze the following symptoms and provide:
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

        # Try Gemini first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini API for symptoms: {symptoms[:50]}...")
                
                # Use threading to implement timeout
                import threading
                import time
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        response = gemini_model.generate_content(prompt)
                        result_text = response.text
                        print(f"📥 Gemini raw response: {result_text[:200]}...")
                        
                        # Clean up markdown code blocks if present
                        if '```json' in result_text:
                            result_text = result_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in result_text:
                            result_text = result_text.split('```')[1].split('```')[0].strip()
                        
                        result = json.loads(result_text)
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (60 seconds for text analysis)
                thread.join(timeout=60)
                
                if thread.is_alive():
                    print("⏰ Gemini API call timed out after 60s, using fallback")
                    return get_fallback_diagnosis(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini diagnosis completed successfully")
                    return result_container['data']
                
            except Exception as e:
                print(f"❌ Gemini error: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                print("⚠️ Falling back to alternative method...")
        
        # Fallback to OpenAI with timeout
        if openai_client:
            try:
                print(f"🔄 Calling OpenAI API for symptoms: {symptoms[:50]}...")
                
                # Use threading to implement timeout
                result_container = {'data': None, 'error': None}
                
                def call_openai():
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
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_openai)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (45 seconds)
                thread.join(timeout=45)
                
                if thread.is_alive():
                    print("⏰ OpenAI API call timed out, using fallback")
                    return get_fallback_diagnosis(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ OpenAI diagnosis completed for: {symptoms[:50]}...")
                    return result_container['data']
                    
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
        # Optimize image before analysis
        from PIL import Image
        img = Image.open(image_path)
        
        # Resize large images to improve performance
        max_size = (1024, 1024)
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"📐 Image resized to: {img.size}")
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        prompt = f"""Analyze this medical image quickly and efficiently. 
Symptoms provided: {symptoms if symptoms else 'None provided'}

Provide a concise analysis in JSON format:
{{
    "observation": "Brief description of what you see",
    "conditions": [
        {{"name": "Most likely condition", "confidence": 75, "note": "Brief details"}}
    ],
    "recommendation": "Brief recommendation",
    "professional_evaluation": "Required/Recommended/Optional"
}}

Keep response concise and focused."""

        # Try Gemini Vision first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini Vision API for image: {os.path.basename(image_path)}")
                
                # Use threading to implement timeout
                import threading
                import time
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        response = gemini_model.generate_content([prompt, img])
                        result_text = response.text
                        
                        # Clean up markdown code blocks if present
                        if '```json' in result_text:
                            result_text = result_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in result_text:
                            result_text = result_text.split('```')[1].split('```')[0].strip()
                        
                        result = json.loads(result_text)
                        result_container['data'] = result
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (60 seconds for image analysis)
                thread.join(timeout=60)
                
                if thread.is_alive():
                    print("⏰ Gemini API call timed out after 60s, using fallback")
                    return get_fallback_result(symptoms)
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini image analysis completed successfully")
                    return result_container['data']
                
            except Exception as e:
                print(f"❌ Gemini Vision error: {type(e).__name__}: {str(e)}")
                print("⚠️ Using fallback result...")
                return get_fallback_result(symptoms)
        
        # Fallback if no AI model available
        return get_fallback_result(symptoms)
        
    except Exception as e:
        print(f"❌ Image analysis error: {type(e).__name__}: {str(e)}")
        return get_fallback_result(symptoms)

def get_fallback_result(symptoms=""):
    """Provide a fallback result when AI analysis fails"""
    return {
        "observation": "Image received but AI analysis unavailable. Please consult a medical professional.",
        "conditions": [
            {"name": "Professional evaluation needed", "confidence": 100, "note": "AI analysis service temporarily unavailable"}
        ],
        "recommendation": "Please consult with a healthcare professional for proper diagnosis.",
        "professional_evaluation": "Required"
    }

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def chat_with_assistant(message, chat_history=[], language='en'):
    """
    Chat with AI medical assistant - ChatGPT-like conversational experience
    Returns: AI response
    """
    try:
        lang_names = {'en':'English','hi':'Hindi','bn':'Bengali','pa':'Punjabi','ml':'Malayalam','kn':'Kannada'}
        lang_name = lang_names.get(language, 'English')
        
        system_prompt = f"""IMPORTANT: You must respond only in {lang_name}. All your responses must be in {lang_name} only.

You are MedMate, a personal health assistant 
for Indian patients. You are NOT a general purpose chatbot.

YOUR ONLY JOB:
Help patients understand their health in simple, clear language 
that anyone — even with no medical education — can understand.

HOW YOU SPEAK:
- Use extremely simple language. No medical jargon ever.
- Speak like a trusted family doctor, not a textbook.
- Keep answers short — 3 to 5 sentences maximum.
- Use examples from daily Indian life where helpful.
  Example: instead of "elevated glucose indicates hyperglycemia",
  say "your sugar is high — like having too much mithai in your blood."
- Always end with one specific action the person should take.
- Never give a diagnosis. Always recommend seeing a doctor 
  for anything serious.

WHAT YOU CAN DISCUSS:
- Understanding lab report values and what they mean
- Symptoms and what they might indicate
- Medications — what they do, side effects in simple words
- Diet and lifestyle advice for specific conditions
- When to see a doctor urgently vs when it can wait
- Explaining what a doctor told them in simpler words

WHAT YOU MUST REFUSE:
- Any question not related to health or medicine
- General knowledge questions
- News, entertainment, technology, sports, politics
- Coding, math, writing help

If someone asks a non-medical question, say exactly:
"I'm only able to help with health and medical questions. 
Is there something about your health I can help you with?"

CONTEXT AWARENESS:
If the conversation includes previous diagnosis results or 
report data, refer to them naturally.
Example: "Based on what you shared earlier about your 
high platelet count..."

TONE:
Warm, calm, and reassuring — like a doctor who has time for you.
Never alarming. Never dismissive. Never robotic."""

        # Try Gemini first with timeout
        if gemini_model:
            try:
                print(f"🔄 Calling Gemini API for chat: {message[:50]}...")
                
                # Use threading to implement timeout
                import threading
                
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        # Build conversation context for Gemini
                        conversation_context = system_prompt + "\n\n"
                        for chat in chat_history[-10:]:
                            conversation_context += f"User: {chat['message']}\nAssistant: {chat['response']}\n\n"
                        conversation_context += f"User: {message}\nAssistant:"
                        
                        response = gemini_model.generate_content(conversation_context)
                        ai_response = response.text
                        result_container['data'] = ai_response
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (30 seconds for chat)
                thread.join(timeout=30)
                
                if thread.is_alive():
                    print("⏰ Gemini chat API call timed out, using fallback")
                    return "I'm here to help! However, the AI service is currently taking longer than expected. Please try again later."
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ Gemini chat response generated for: {message[:50]}...")
                    return result_container['data']
                    
            except Exception as e:
                print(f"Gemini chat error: {e}, falling back...")
        
        # Fallback to OpenAI with timeout
        if openai_client:
            try:
                print(f"🔄 Calling OpenAI API for chat: {message[:50]}...")
                
                result_container = {'data': None, 'error': None}
                
                def call_openai():
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
                        result_container['data'] = ai_response
                    except Exception as e:
                        result_container['error'] = e
                
                # Start the API call in a separate thread
                thread = threading.Thread(target=call_openai)
                thread.daemon = True
                thread.start()
                
                # Wait for result with timeout (30 seconds)
                thread.join(timeout=30)
                
                if thread.is_alive():
                    print("⏰ OpenAI chat API call timed out, using fallback")
                    return "I'm here to help! However, the AI service is currently taking longer than expected. Please try again later."
                
                if result_container['error']:
                    raise result_container['error']
                
                if result_container['data']:
                    print(f"✓ OpenAI chat response generated for: {message[:50]}...")
                    return result_container['data']
                    
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

MEDICAL_KB = {
    "HbA1c": {
        "aliases": ["glycated hemoglobin", "glycosylated hemoglobin", "a1c"],
        "unit": "%",
        "ranges": [
            {"label": "Normal", "max": 5.7, "condition": "Normal blood sugar"},
            {"label": "Borderline", "max": 6.4, "condition": "Prediabetes risk"},
            {"label": "High", "max": 999, "condition": "Diabetes risk"}
        ]
    },
    "Hemoglobin": {
        "aliases": ["hb", "haemoglobin", "hgb"],
        "unit": "g/dL",
        "ranges": [
            {"label": "Low", "max": 12.9, "condition": "Anemia"},
            {"label": "Normal", "max": 17.0, "condition": "Normal"},
            {"label": "High", "max": 999, "condition": "Polycythemia"}
        ]
    },
    "WBC": {
        "aliases": ["white blood cell", "wbc count", "total wbc", "leukocyte"],
        "unit": "cells/mcL",
        "ranges": [
            {"label": "Low", "max": 3999, "condition": "Immune issue"},
            {"label": "Normal", "max": 11000, "condition": "Normal"},
            {"label": "High", "max": 999999, "condition": "Infection/Inflammation"}
        ]
    },
    "Platelets": {
        "aliases": ["platelet count", "plt", "thrombocyte"],
        "unit": "/mcL",
        "ranges": [
            {"label": "Low", "max": 149999, "condition": "Thrombocytopenia"},
            {"label": "Normal", "max": 450000, "condition": "Normal"},
            {"label": "High", "max": 9999999, "condition": "Thrombocytosis"}
        ]
    },
    "Glucose": {
        "aliases": ["blood sugar", "fasting glucose", "fbs", "rbs", "blood glucose"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Low", "max": 69, "condition": "Hypoglycemia"},
            {"label": "Normal", "max": 99, "condition": "Normal"},
            {"label": "Borderline", "max": 125, "condition": "Prediabetes"},
            {"label": "High", "max": 9999, "condition": "Diabetes risk"}
        ]
    },
    "Cholesterol": {
        "aliases": ["total cholesterol", "serum cholesterol"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Normal", "max": 199, "condition": "Normal"},
            {"label": "Borderline", "max": 239, "condition": "Borderline high"},
            {"label": "High", "max": 9999, "condition": "High cholesterol"}
        ]
    },
    "HDL": {
        "aliases": ["hdl cholesterol", "good cholesterol"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Low", "max": 39, "condition": "Low HDL - heart risk"},
            {"label": "Normal", "max": 59, "condition": "Normal"},
            {"label": "High", "max": 9999, "condition": "Good - protective"}
        ]
    },
    "LDL": {
        "aliases": ["ldl cholesterol", "bad cholesterol"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Normal", "max": 99, "condition": "Optimal"},
            {"label": "Borderline", "max": 159, "condition": "Borderline high"},
            {"label": "High", "max": 9999, "condition": "High LDL - heart risk"}
        ]
    },
    "Triglycerides": {
        "aliases": ["tg", "triglyceride"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Normal", "max": 149, "condition": "Normal"},
            {"label": "Borderline", "max": 199, "condition": "Borderline high"},
            {"label": "High", "max": 9999, "condition": "High triglycerides"}
        ]
    },
    "Creatinine": {
        "aliases": ["serum creatinine", "creatinine"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Low", "max": 0.59, "condition": "Low creatinine"},
            {"label": "Normal", "max": 1.2, "condition": "Normal kidney function"},
            {"label": "High", "max": 99, "condition": "Possible kidney issue"}
        ]
    },
    "Urea": {
        "aliases": ["blood urea", "bun", "urea nitrogen"],
        "unit": "mg/dL",
        "ranges": [
            {"label": "Normal", "max": 20, "condition": "Normal"},
            {"label": "High", "max": 999, "condition": "Possible kidney issue"}
        ]
    },
    "SGPT": {
        "aliases": ["alt", "alanine aminotransferase", "alanine transaminase"],
        "unit": "U/L",
        "ranges": [
            {"label": "Normal", "max": 56, "condition": "Normal liver function"},
            {"label": "High", "max": 9999, "condition": "Possible liver issue"}
        ]
    },
    "SGOT": {
        "aliases": ["ast", "aspartate aminotransferase"],
        "unit": "U/L",
        "ranges": [
            {"label": "Normal", "max": 40, "condition": "Normal"},
            {"label": "High", "max": 9999, "condition": "Possible liver/heart issue"}
        ]
    },
    "TSH": {
        "aliases": ["thyroid stimulating hormone", "thyrotropin"],
        "unit": "mIU/L",
        "ranges": [
            {"label": "Low", "max": 0.39, "condition": "Hyperthyroidism"},
            {"label": "Normal", "max": 4.0, "condition": "Normal thyroid"},
            {"label": "High", "max": 999, "condition": "Hypothyroidism"}
        ]
    }
}

def extract_text_from_pdf(filepath):
    """Extract text from PDF using pdfplumber"""
    text = ""
    try:
        if PDFPLUMBER_AVAILABLE:
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        else:
            # fallback to fitz if available
            import fitz
            doc = fitz.open(filepath)
            for page in doc:
                text += page.get_text()
            doc.close()
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text

def get_range_from_umls(test_name):
    """
    Query UMLS API for reference ranges of a medical test.
    Returns dict with ref_min, ref_max, unit, note — or None if unavailable.
    """
    umls_api_key = os.getenv('UMLS_API_KEY')
    if not umls_api_key:
        return None  # UMLS key not configured, skip silently
    try:
        params = {
            'string': test_name,
            'apiKey': umls_api_key,
            'searchType': 'words',
            'returnIdType': 'concept'
        }
        resp = requests.get(
            'https://uts-ws.nlm.nih.gov/rest/search/current',
            params=params, timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            results = data.get('result', {}).get('results', [])
            if results:
                # Placeholder: return None until full UMLS range mapping implemented
                return None
    except Exception as e:
        print(f"⚠️ UMLS API error for '{test_name}': {e}")
    return None


spacy_nlp = None

def get_spacy_model():
    """Load scispaCy model once and reuse"""
    global spacy_nlp
    if spacy_nlp is not None:
        return spacy_nlp
    try:
        if SPACY_AVAILABLE:
            spacy_nlp = spacy.load("en_core_sci_sm")
            print("✅ scispaCy model loaded")
            return spacy_nlp
    except Exception as e:
        print(f"⚠️ scispaCy model load failed: {e}")
    return None


def extract_medical_terms_nlp(text):
    """
    Use scispaCy NER to identify medical entity positions in text.
    Returns list of identified medical terms with their positions.
    Falls back to empty list if scispaCy unavailable.
    """
    nlp_model = get_spacy_model()
    if not nlp_model:
        return []

    try:
        max_length = 100000
        if len(text) > max_length:
            text = text[:max_length]

        doc = nlp_model(text)

        medical_terms = []
        for ent in doc.ents:
            medical_terms.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })

        print(f"✅ scispaCy found {len(medical_terms)} medical entities")
        return medical_terms

    except Exception as e:
        print(f"⚠️ scispaCy extraction error: {e}")
        return []


def extract_medical_entities(text):
    """
    3-layer NLP extraction pipeline:
    Layer 1 — scispaCy NER identifies medical term positions
    Layer 2 — Regex extracts values relative to NER-identified positions
    Layer 3 — If no range found, UMLS API fetches standard range
    Falls back to pure regex if scispaCy unavailable.
    """
    entities = []
    seen = set()
    lines = text.split('\n')

    skip_words = ['date', 'age', 'sex', 'name', 'lab no', 'ref by',
                  'phone', 'mobile', 'sample', 'patient', 'doctor',
                  'report', 'www.', 'http', 'end of report',
                  'signature', 'address', 'consultant']

    # LAYER 1: Run scispaCy NER on full text
    nlp_entities = extract_medical_terms_nlp(text)

    # Build a set of NLP-confirmed medical term texts for validation
    nlp_confirmed_terms = {
        ent['text'].lower().strip()
        for ent in nlp_entities
    }

    print(f"NLP confirmed terms: {nlp_confirmed_terms}")

    # LAYER 2: Line-by-line extraction guided by NLP confirmation
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue

        if any(skip in line.lower() for skip in skip_words):
            continue

        first_num_match = re.search(r'\b(\d+\.?\d*)\b', line)
        if not first_num_match:
            continue

        test_name_raw = line[:first_num_match.start()].strip()
        test_name_raw = re.sub(r'[:\-\u2013\*\s]+$', '', test_name_raw).strip()

        if len(test_name_raw) < 2 or len(test_name_raw) > 50:
            continue

        if re.match(r'^\d+$', test_name_raw):
            continue

        if any(skip in test_name_raw.lower() for skip in skip_words):
            continue

        # NLP VALIDATION STEP
        nlp_confirmed = False

        if nlp_confirmed_terms:
            test_lower = test_name_raw.lower()
            for nlp_term in nlp_confirmed_terms:
                if (nlp_term in test_lower or
                        test_lower in nlp_term or
                        any(word in nlp_term for word in test_lower.split()
                            if len(word) > 3)):
                    nlp_confirmed = True
                    break

            if not nlp_confirmed:
                has_range = bool(re.search(
                    r'\d+\.?\d*\s*[-\u2013]\s*\d+\.?\d*', line
                ))
                if not has_range:
                    continue

        try:
            patient_value = float(first_num_match.group(1))
        except:
            continue

        if patient_value == 0:
            continue

        if patient_value > 50000:
            continue

        if 'www.' in line.lower() or 'http' in line.lower():
            continue

        unit_search = re.search(
            r'\b' + re.escape(first_num_match.group(1)) +
            r'\s*([A-Za-z%/\xb5][A-Za-z0-9%/\xb5\.]*)',
            line
        )
        unit = unit_search.group(1).strip() if unit_search else ""

        ref_min = None
        ref_max = None
        ref_type = None
        status = "Review"
        condition = "Ask your doctor about this value"

        after_value = line[first_num_match.end():]
        ref_range_match = re.search(r'(\d+\.?\d*)\s*[-\u2013]\s*(\d+\.?\d*)', after_value)
        less_than_match = re.search(r'<\s*(\d+\.?\d*)', after_value)
        greater_than_match = re.search(r'>\s*(\d+\.?\d*)', after_value)

        if ref_range_match:
            ref_min = float(ref_range_match.group(1))
            ref_max = float(ref_range_match.group(2))
            ref_type = 'range'
        elif less_than_match:
            ref_max = float(less_than_match.group(1))
            ref_type = 'less_than'
        elif greater_than_match:
            ref_min = float(greater_than_match.group(1))
            ref_type = 'greater_than'

        if ref_type == 'range' and ref_min is not None and ref_max is not None:
            if patient_value < ref_min:
                status = "Low"
                condition = f"Below normal range ({ref_min}-{ref_max})"
            elif patient_value > ref_max:
                status = "High"
                condition = f"Above normal range ({ref_min}-{ref_max})"
            else:
                status = "Normal"
                condition = "Within normal range"
        elif ref_type == 'less_than' and ref_max:
            status = "High" if patient_value > ref_max else "Normal"
            condition = (f"Above normal (should be <{ref_max})"
                         if status == "High" else "Within normal range")
        elif ref_type == 'greater_than' and ref_min:
            status = "Low" if patient_value < ref_min else "Normal"
            condition = (f"Below normal (should be >{ref_min})"
                         if status == "Low" else "Within normal range")

        # LAYER 3: No range in report — call UMLS API
        if ref_type is None:
            print(f"No range in report for {test_name_raw}, querying UMLS...")
            api_range = get_range_from_umls(test_name_raw)

            if api_range:
                ref_min = api_range.get('ref_min')
                ref_max = api_range.get('ref_max')
                api_unit = api_range.get('unit', '')
                note = api_range.get('note', '')

                if ref_min is not None and ref_max is not None:
                    ref_type = 'range'
                    if patient_value < ref_min:
                        status = "Low"
                        condition = (f"Below normal ({ref_min}-{ref_max})"
                                     f" — {note}")
                    elif patient_value > ref_max:
                        status = "High"
                        condition = (f"Above normal ({ref_min}-{ref_max})"
                                     f" — {note}")
                    else:
                        status = "Normal"
                        condition = "Within normal range"

                    if not unit and api_unit:
                        unit = api_unit

        test_key = test_name_raw.lower().strip()
        if test_key in seen:
            continue
        seen.add(test_key)

        entities.append({
            "test_name": test_name_raw,
            "value": patient_value,
            "unit": unit,
            "ref_min": ref_min,
            "ref_max": ref_max,
            "ref_type": ref_type,
            "status": status,
            "condition": condition,
            "nlp_confirmed": nlp_confirmed,
            "confidence": "matched" if ref_type else "unmatched"
        })

    print(f"✅ Extracted {len(entities)} entities total")
    return entities


def interpret_results(entities):
    interpreted = []
    for entity in entities:
        interpreted.append({
            "test_name": entity["test_name"],
            "value": entity["value"],
            "unit": entity.get("unit", ""),
            "status": entity.get("status", "Review"),
            "condition": entity.get("condition", ""),
            "ref_min": entity.get("ref_min"),
            "ref_max": entity.get("ref_max"),
            "nlp_confirmed": entity.get("nlp_confirmed", False),
            "confidence": entity.get("confidence", "unmatched")
        })
    return interpreted

def explain_medical_report_with_ai(file_content, is_image=False, language='en'):
    """
    Analyze medical report (image or text) to extract terms and generate simplified explanation.
    """
    lang_instruction = "Hindi" if language == 'hi' else "English"
    
    prompt = f"""You are a medical AI assistant helping a patient understand their medical report.
Analyze the provided medical report and provide a simplified explanation in {lang_instruction}.

Provide the response strictly in JSON format:
{{
    "summary": "Overall simplified summary of the report",
    "terms": [
        {{"term": "Medical Term 1", "meaning": "Simple explanation of the term"}}
    ],
    "key_findings": ["Finding 1 in simple terms", "Finding 2 in simple terms"],
    "next_steps": "What the patient should do next (e.g., consult doctor)",
    "disclaimer": "Medical disclaimer in {lang_instruction}"
}}
"""
    try:
        if gemini_model:
            print(f"🔄 Calling Gemini API for report explanation ({language})")
            import threading
            result_container = {'data': None, 'error': None}
            
            def call_gemini():
                try:
                    target = [prompt, file_content] if is_image else f"{prompt}\n\nReport Text:\n{file_content}"
                    response = gemini_model.generate_content(target)
                    result_text = response.text
                    if '```json' in result_text:
                        result_text = result_text.split('```json')[1].split('```')[0].strip()
                    elif '```' in result_text:
                        result_text = result_text.split('```')[1].split('```')[0].strip()
                    result_container['data'] = json.loads(result_text)
                except Exception as e:
                    result_container['error'] = e
                    
            thread = threading.Thread(target=call_gemini)
            thread.daemon = True
            thread.start()
            thread.join(timeout=60)
            
            if thread.is_alive():
                print("⏰ Gemini API timed out")
                raise TimeoutError("API Timeout")
                
            if result_container['error']:
                raise result_container['error']
                
            return result_container['data']
            
        elif openai_client and not is_image:
            print(f"🔄 Calling OpenAI API for report explanation ({language})")
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful medical assistant."},
                    {"role": "user", "content": f"{prompt}\n\nReport Text:\n{file_content}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return json.loads(response.choices[0].message.content)
            
    except Exception as e:
        print(f"❌ Report Explanation Error: {e}")
        
    return {
        "summary": "Could not analyze the report at this time. Please try again later.",
        "terms": [],
        "key_findings": ["System error occurred."],
        "next_steps": "Show this report to a qualified healthcare provider.",
        "disclaimer": "This is a fallback message due to a system error."
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
            'fields': 'name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,rating,website',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        print(f"📍 Getting details for hospital: {place_id}")
        
        if data.get('status') == 'OK':
            result = data.get('result', {})
            # Try to get phone number from different fields
            phone = result.get('formatted_phone_number') or result.get('international_phone_number')
            print(f"📞 Phone number found: {phone}")
            if phone:
                result['phone'] = phone
            return result
        else:
            print(f"⚠️ API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}")
        
        return {}
    
    except Exception as e:
        print(f"Hospital Details Error: {e}")
        import traceback
        traceback.print_exc()
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
    """API root - redirect to frontend"""
    # Get frontend URL from environment or use default
    frontend_url = os.getenv('FRONTEND_URL', 'https://med-mate-ai-health-assistant-v2.vercel.app')
    return jsonify({
        'message': 'MedMate API',
        'version': '1.0',
        'status': 'running',
        'frontend': frontend_url
    })

@app.route('/api/explain_report', methods=['POST', 'OPTIONS'])
@login_required
def explain_report():
    """Upgraded Medical Report Analyzer with structured NLP extraction pipeline"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Check credits first
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        credit_cost = CREDIT_COSTS.get('report', 1)
        if user.credits < credit_cost:
            return jsonify({
                'error': f'Insufficient credits. You have {user.credits} credits but need {credit_cost} credit(s) for report analysis.',
                'credits': user.credits,
                'required': credit_cost
            }), 402  # 402 Payment Required
        
        language = request.form.get('language', 'en')
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Deduct credits after file is saved but before processing
        user.credits -= credit_cost
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=-credit_cost,
            transaction_type='report',
            description='Medical report analysis'
        )
        db.session.add(transaction)
        db.session.commit()
        
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        # STEP 1: Extract text
        if ext == 'pdf':
            raw_text = extract_text_from_pdf(filepath)
        elif ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif']:
            raw_text = ""
            try:
                if gemini_model:
                    from PIL import Image as PILImage
                    img = PILImage.open(filepath)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    extraction_prompt = """Look at this medical lab report image.
Extract ALL test results you can see. For each result write it as:
TestName: Value Unit
One result per line. Only extract actual lab test results.
Ignore hospital names, patient info, dates, watermarks, URLs.
Example:
Hemoglobin: 11 g/dL
WBC: 8000 cells/mcL
HbA1c: 7.8 %"""
                    
                    import threading
                    result_container = {'data': None}
                    
                    def extract_from_image():
                        try:
                            response = gemini_model.generate_content([extraction_prompt, img])
                            result_container['data'] = response.text
                        except Exception as e:
                            print(f"Image text extraction error: {e}")
                    
                    thread = threading.Thread(target=extract_from_image)
                    thread.daemon = True
                    thread.start()
                    thread.join(timeout=30)
                    
                    if result_container['data']:
                        raw_text = result_container['data']
                        print(f"Extracted text from image: {raw_text[:200]}")
            except Exception as e:
                print(f"Image extraction error: {e}")
        elif ext == 'docx':
            try:
                from docx import Document
                doc = Document(filepath)
                raw_text = "\n".join([p.text for p in doc.paragraphs])
            except:
                raw_text = ""
        else:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                raw_text = f.read()
        
        # STEP 2 & 3: Extract entities and interpret (only for text-based files)
        extracted = []
        interpreted = []
        if raw_text.strip():
            extracted = extract_medical_entities(raw_text)
            interpreted = interpret_results(extracted)
        
        abnormal_count = sum(1 for r in interpreted if r.get('status') not in ['Normal', 'Unknown'])
        
        # STEP 4: Call LLM only for explanation
        # Build a focused prompt using structured data (not raw text)
        if interpreted:
            abnormal_results = [r for r in interpreted if r.get('status') != 'Normal']
            normal_results = [r['test_name'] for r in interpreted if r.get('status') == 'Normal']

            explanation_prompt = f"""You are a doctor explaining lab results to a patient 
with zero medical background. Be specific, not vague.

For each abnormal result, write exactly:
- What the test measures in one simple sentence
- Whether the value is too high or too low and what that means 
  for their health specifically
- One concrete action they should take

Use actual numbers in your explanation 
(e.g. "your HbA1c is 7.8%, normal is below 5.7%").
Keep total explanation to 4-5 sentences maximum.
Do not use medical jargon.
If all results are normal, say so clearly and reassuringly.

Abnormal results: {json.dumps(abnormal_results, indent=2)}
Normal results: {normal_results}

Respond ONLY in this exact JSON format, nothing else:
{{
  "english": "specific 4-5 sentence explanation mentioning actual values and actions",
  "hindi": "exact same explanation translated to Hindi"
}}"""
        else:
            # Fallback if no structured data extracted (e.g. image upload)
            explanation_prompt = f"""You are a doctor explaining a medical report to a patient in simple language.
{"Report text: " + raw_text[:3000] if raw_text else "An image report was uploaded."}

Respond ONLY in this JSON format:
{{
  "english": "3-4 sentence plain English explanation",
  "hindi": "Same explanation in Hindi"
}}"""
        
        explanation = {"english": "", "hindi": ""}
        
        try:
            if gemini_model:
                import threading
                result_container = {'data': None, 'error': None}
                
                def call_gemini():
                    try:
                        if ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif']:
                            from PIL import Image
                            img = Image.open(filepath)
                            if img.mode != 'RGB':
                                img = img.convert('RGB')
                            response = gemini_model.generate_content([explanation_prompt, img])
                        else:
                            response = gemini_model.generate_content(explanation_prompt)
                        
                        result_text = response.text
                        if '```json' in result_text:
                            result_text = result_text.split('```json')[1].split('```')[0].strip()
                        elif '```' in result_text:
                            result_text = result_text.split('```')[1].split('```')[0].strip()
                        result_container['data'] = json.loads(result_text)
                    except Exception as e:
                        result_container['error'] = e
                
                thread = threading.Thread(target=call_gemini)
                thread.daemon = True
                thread.start()
                thread.join(timeout=60)
                
                if result_container['data']:
                    explanation = result_container['data']
        except Exception as e:
            print(f"LLM explanation error: {e}")
        
        # Save to report history
        try:
            report_entry = ReportHistory(
                user_id=session['user_id'],
                file_name=filename,
                result=json.dumps({
                    'extracted': extracted,
                    'interpreted': interpreted,
                    'explanation': explanation,
                    'abnormal_count': abnormal_count
                })
            )
            db.session.add(report_entry)
            db.session.commit()
        except Exception as db_err:
            print(f"Failed to save report history: {db_err}")
            db.session.rollback()
        
        return jsonify({
            'extracted': extracted,
            'interpreted': interpreted,
            'explanation': explanation,
            'abnormal_count': abnormal_count,
            'credits_deducted': credit_cost,
            'remaining_credits': user.credits
        }), 200
    
    except Exception as e:
        print(f"❌ Explain Report Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to process report'}), 500

# ==================== AUTHENTICATION ROUTES ====================

@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        print(f"📝 Registration attempt: username={username}, email={email}")
        
        # Validate all fields are provided
        if not all([username, email, password]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Validate username
        if len(username) < 3 or len(username) > 20:
            return jsonify({'error': 'Username must be between 3 and 20 characters'}), 400
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return jsonify({'error': 'Username can only contain letters, numbers, and underscores'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Validate password strength
        is_valid, error_message = validate_password_strength(password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Check existing users
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"⚠️ Username '{username}' already exists")
            return jsonify({'error': 'Username already exists'}), 400
        
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            print(f"⚠️ Email '{email}' already exists")
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=username, 
            email=email,
            credits=10  # Award 10 free credits on signup
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log the free credits transaction
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=10,
            transaction_type='free',
            description='Sign-up bonus'
        )
        db.session.add(transaction)
        db.session.commit()
        
        print(f"✅ User registered successfully: ID={user.id}, username={user.username}, credits=10")
        
        # Set session
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        
        # Get profile picture URL (will be None for new users)
        profile_pic_url = None
        if user.profile_picture:
            profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'credits': user.credits,
                'profile_picture': user.profile_picture,
                'profile_picture_url': profile_pic_url,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        print(f"🔐 Login attempt: username={username}")
        
        if not all([username, password]):
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            print(f"⚠️ User '{username}' not found")
            return jsonify({'error': 'Invalid username or password'}), 401
        
        if not user.check_password(password):
            print(f"⚠️ Invalid password for user '{username}'")
            return jsonify({'error': 'Invalid username or password'}), 401
        
        session.permanent = True
        session['user_id'] = user.id
        session['username'] = user.username
        
        print(f"✅ Login successful: ID={user.id}, username={user.username}")
        
        # Get profile picture URL
        profile_pic_url = None
        if user.profile_picture:
            profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'credits': user.credits,
                'profile_picture': user.profile_picture,
                'profile_picture_url': profile_pic_url,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated - optimized for speed"""
    if 'user_id' in session:
        try:
            # Get full user object to check and fix credits if needed
            user = db.session.get(User, session['user_id'])
            
            if not user:
                return jsonify({'authenticated': False}), 200
            
            profile_pic_url = None
            if user.profile_picture:
                profile_pic_url = f"{request.url_root.rstrip('/')}/static/uploads/{user.profile_picture}"
            
            return jsonify({
                'authenticated': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'credits': user.credits,
                    'profile_picture': user.profile_picture,
                    'profile_picture_url': profile_pic_url,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
            }), 200
        except Exception as e:
            print(f"⚠️ check-auth error: {e}")
            return jsonify({'authenticated': False}), 200
    return jsonify({'authenticated': False}), 200

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Handle forgot password request"""
    print("=" * 50)
    print("📧 FORGOT PASSWORD REQUEST RECEIVED")
    print("=" * 50)
    try:
        data = request.get_json()
        email = data.get('email')
        print(f"📧 Email received: {email}")
        
        if not email:
            print("❌ No email provided")
            return jsonify({'error': 'Email is required'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            print("❌ Invalid email format")
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Find user by email
        print(f"🔍 Looking for user with email: {email}")
        user = User.query.filter_by(email=email).first()
        print(f"👤 User found: {user is not None}")
        
        # Always return success message (for security, don't reveal if email exists)
        if user:
            print(f"📝 Creating reset token for user: {user.email}")
            # Generate reset token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)
            
            # Create reset token
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at
            )
            
            db.session.add(reset_token)
            db.session.commit()
            print(f"💾 Token saved to database")
            
            # Create reset link
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
            reset_link = f"{frontend_url}/reset-password?token={token}"
            print(f"🔗 Reset link: {reset_link}")
            
            # Send email with threading to prevent timeout
            print(f"📧 Calling send_password_reset_email()...")
            
            # Start email thread
            email_thread = threading.Thread(target=send_password_reset_email, args=(user.email, reset_link))
            email_thread.daemon = True
            email_thread.start()
            
            # Wait a bit to ensure email is being sent
            import time
            time.sleep(1)  # 1 second delay to show some processing time
            
            print(f"✅ Password reset email thread started")
        else:
            print(f"⚠️ No user found with email: {email}")
        
        print("=" * 50)
        return jsonify({
            'message': 'If an account with that email exists, we have sent password reset instructions.'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Forgot password error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Handle password reset"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Validate password strength
        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'error': error_message}), 400
        
        # Find reset token with timeout protection
        try:
            reset_token = PasswordResetToken.query.filter_by(token=token).first()
        except Exception as query_error:
            print(f"❌ Database query error: {query_error}")
            return jsonify({'error': 'Database query failed. Please try again.'}), 500
        
        if not reset_token:
            return jsonify({'error': 'This reset link is invalid or has already been used. Please request a new one.'}), 400
        
        # Check if token is valid and not expired
        if not reset_token.is_valid():
            return jsonify({'error': 'This reset link has expired. Please request a new password reset.'}), 400
        
        # Update user password
        user = db.session.get(User, reset_token.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.set_password(new_password)
        
        # Mark token as used
        reset_token.used = True
        
        db.session.commit()
        
        print(f"✅ Password reset successful for user: {user.email}")
        
        return jsonify({
            'message': 'Password reset successful. You can now login with your new password.'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reset password error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@app.route('/api/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        
        if not reset_token or not reset_token.is_valid():
            return jsonify({'valid': False}), 200
        
        return jsonify({
            'valid': True,
            'user': {
                'email': reset_token.user.email
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Verify token error: {e}")
        return jsonify({'valid': False}), 200

# Temporary admin endpoint to get latest reset link (remove in production)
@app.route('/api/admin/latest-reset-link', methods=['GET'])
def get_latest_reset_link():
    """Get the latest password reset link for testing"""
    try:
        reset_token = PasswordResetToken.query.filter_by(used=False).order_by(PasswordResetToken.created_at.desc()).first()
        
        if not reset_token:
            return jsonify({'error': 'No active reset tokens found'}), 404
        
        if not reset_token.is_valid():
            return jsonify({'error': 'Token has expired'}), 400
        
        frontend_url = os.getenv('FRONTEND_URL', 'https://med-mate-ai-health-assistant-v2.vercel.app')
        reset_link = f"{frontend_url}/reset-password?token={reset_token.token}"
        
        return jsonify({
            'email': reset_token.user.email,
            'reset_link': reset_link,
            'token': reset_token.token,
            'created_at': reset_token.created_at.isoformat(),
            'expires_at': reset_token.expires_at.isoformat()
        }), 200
    
    except Exception as e:
        print(f"❌ Get latest reset link error: {e}")
        return jsonify({'error': str(e)}), 500

# Google OAuth removed - using local authentication only



# ==================== DIAGNOSIS ROUTES ====================

@app.route('/api/diagnose', methods=['POST', 'OPTIONS'])
@login_required
def diagnose():
    """Analyze symptoms and provide diagnosis"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Verify user exists in database
        user = db.session.get(User, session['user_id'])
        if not user:
            session.clear()
            return jsonify({'error': 'User session invalid. Please login again.'}), 401
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        symptoms = data.get('symptoms', '')
        
        if not symptoms:
            return jsonify({'error': 'Symptoms are required'}), 400
        
        # Check credits
        credit_cost = CREDIT_COSTS.get('symptoms', 1)
        if user.credits < credit_cost:
            return jsonify({
                'error': f'Insufficient credits. You have {user.credits} credits but need {credit_cost} credit(s) for symptom analysis.',
                'credits': user.credits,
                'required': credit_cost
            }), 402  # 402 Payment Required
        
        # Deduct credits
        user.credits -= credit_cost
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=-credit_cost,
            transaction_type='symptoms',
            description='Symptom analysis'
        )
        db.session.add(transaction)
        db.session.commit()
        
        language = data.get('language', 'en')
        
        # Analyze symptoms with AI
        result = analyze_symptoms_with_ai(symptoms, language)
        
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
            'result': result,
            'credits_deducted': credit_cost,
            'remaining_credits': user.credits
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Diagnose error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Diagnosis failed: {str(e)}'}), 500

@app.route('/api/diagnose-image', methods=['POST', 'OPTIONS'])
@login_required
def diagnose_image():
    """Analyze medical image with optional symptoms"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Verify user exists in database
        user = db.session.get(User, session['user_id'])
        if not user:
            session.clear()
            return jsonify({'error': 'User session invalid. Please login again.'}), 401
        
        # Check credits
        credit_cost = CREDIT_COSTS.get('image', 1)
        if user.credits < credit_cost:
            return jsonify({
                'error': f'Insufficient credits. You have {user.credits} credits but need {credit_cost} credit(s) for image analysis.',
                'credits': user.credits,
                'required': credit_cost
            }), 402  # 402 Payment Required
        
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
        
        # Deduct credits after file is saved but before processing
        user.credits -= credit_cost
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=-credit_cost,
            transaction_type='image',
            description='Medical image analysis'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Analyze image with Vision API
        result = analyze_image_with_vision(filepath, symptoms)
        
        # Save diagnosis to database
        diagnosis = Diagnosis(
            user_id=session['user_id'],
            symptoms=symptoms if symptoms else 'Image analysis',
            diagnosis_result=json.dumps(result),
            image_path=filename
        )
        db.session.add(diagnosis)
        db.session.commit()
        
        return jsonify({
            'message': 'Image analysis completed',
            'diagnosis_id': diagnosis.id,
            'result': result,
            'credits_deducted': credit_cost,
            'remaining_credits': user.credits,
            'image_url': f"{request.url_root.rstrip('/')}{url_for('uploaded_file', filename=filename)}"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnosis-history', methods=['GET'])
@login_required
def diagnosis_history():
    """Get user's diagnosis history - optimized for speed"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Limit maximum items per page to prevent slow queries
        per_page = min(per_page, 100)  # Max 100 items per page
        
        # Optimized query - select only needed columns with proper ordering
        diagnoses = db.session.query(
            Diagnosis.id,
            Diagnosis.symptoms,
            Diagnosis.diagnosis_result,
            Diagnosis.image_path,
            Diagnosis.created_at
        ).filter_by(user_id=session['user_id'], is_deleted=False)\
        .order_by(Diagnosis.created_at.desc())\
        .limit(per_page).offset((page - 1) * per_page).all()
        
        # Get total count efficiently (cached result)
        from sqlalchemy import func
        total = db.session.query(func.count(Diagnosis.id)).filter_by(user_id=session['user_id'], is_deleted=False).scalar()
        
        # Optimized result building with list comprehension
        base_url = request.url_root.rstrip('/')
        results = []
        for d in diagnoses:
            # Parse JSON only once when needed
            result_dict = {}
            if d.diagnosis_result:
                try:
                    result_dict = json.loads(d.diagnosis_result)
                except:
                    pass
            
            image_url = None
            if d.image_path:
                filename = os.path.basename(d.image_path) if '/' in str(d.image_path) else str(d.image_path)
                image_url = f"{base_url}/static/uploads/{filename}"
            
            results.append({
                'id': d.id,
                'symptoms': d.symptoms,
                'result': result_dict,
                'image_url': image_url,
                'created_at': d.created_at.isoformat()
            })
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'diagnoses': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        print(f"❌ History error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/deleted-diagnosis-history', methods=['GET'])
@login_required
def deleted_diagnosis_history():
    """Get user's deleted diagnosis history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        per_page = min(per_page, 100)
        
        diagnoses = db.session.query(
            Diagnosis.id,
            Diagnosis.symptoms,
            Diagnosis.diagnosis_result,
            Diagnosis.image_path,
            Diagnosis.created_at
        ).filter_by(user_id=session['user_id'], is_deleted=True)\
        .order_by(Diagnosis.created_at.desc())\
        .limit(per_page).offset((page - 1) * per_page).all()
        
        from sqlalchemy import func
        total = db.session.query(func.count(Diagnosis.id)).filter_by(user_id=session['user_id'], is_deleted=True).scalar()
        
        base_url = request.url_root.rstrip('/')
        results = []
        for d in diagnoses:
            result_dict = {}
            if d.diagnosis_result:
                try:
                    result_dict = json.loads(d.diagnosis_result)
                except:
                    pass
            
            image_url = None
            if d.image_path:
                filename = os.path.basename(d.image_path) if '/' in str(d.image_path) else str(d.image_path)
                image_url = f"{base_url}/static/uploads/{filename}"
            
            results.append({
                'id': d.id,
                'symptoms': d.symptoms,
                'result': result_dict,
                'image_url': image_url,
                'created_at': d.created_at.isoformat()
            })
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'diagnoses': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        print(f"❌ Deleted history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== CHAT ASSISTANT ROUTES ====================

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
@login_required
def chat():
    """Chat with AI assistant"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Verify user exists in database
        user = db.session.get(User, session['user_id'])
        if not user:
            session.clear()
            return jsonify({'error': 'User session invalid. Please login again.'}), 401
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        message = data.get('message', '')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Check credits
        credit_cost = CREDIT_COSTS.get('chat', 1)
        if user.credits < credit_cost:
            return jsonify({
                'error': f'Insufficient credits. You have {user.credits} credits but need {credit_cost} credit(s) for chat.',
                'credits': user.credits,
                'required': credit_cost
            }), 402  # 402 Payment Required
        
        # Deduct credits
        user.credits -= credit_cost
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=-credit_cost,
            transaction_type='chat',
            description='AI chat message'
        )
        db.session.add(transaction)
        db.session.commit()
        
        # Get recent chat history for context
        recent_chats = ChatHistory.query.filter_by(user_id=session['user_id'])\
            .order_by(ChatHistory.created_at.desc())\
            .limit(5)\
            .all()
        
        chat_context = [{'message': c.message, 'response': c.response} for c in reversed(recent_chats)]
        
        language = data.get('language', 'en')
        
        # Get AI response
        response = chat_with_assistant(message, chat_context, language)
        
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
            'credits_deducted': credit_cost,
            'remaining_credits': user.credits,
            'timestamp': chat_entry.created_at.isoformat()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@app.route('/api/chat-history', methods=['GET'])
@login_required
def chat_history():
    """Get chat history - optimized for speed"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Limit maximum items per page to prevent slow queries
        per_page = min(per_page, 100)  # Max 100 items per page
        
        chats = ChatHistory.query.filter_by(user_id=session['user_id'], is_deleted=False)\
            .order_by(ChatHistory.created_at.desc())\
            .limit(per_page).offset((page - 1) * per_page).all()
        
        # Get total count efficiently using scalar
        from sqlalchemy import func
        total = db.session.query(func.count(ChatHistory.id)).filter_by(user_id=session['user_id'], is_deleted=False).scalar()
        
        # Optimized result building
        results = [{
            'id': c.id,
            'message': c.message,
            'response': c.response,
            'created_at': c.created_at.isoformat()
        } for c in chats]
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'chats': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deleted-chat-history', methods=['GET'])
@login_required
def deleted_chat_history():
    """Get deleted chat history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)
        
        chats = ChatHistory.query.filter_by(user_id=session['user_id'], is_deleted=True)\
            .order_by(ChatHistory.created_at.desc())\
            .limit(per_page).offset((page - 1) * per_page).all()
        
        from sqlalchemy import func
        total = db.session.query(func.count(ChatHistory.id)).filter_by(user_id=session['user_id'], is_deleted=True).scalar()
        
        results = [{
            'id': c.id,
            'message': c.message,
            'response': c.response,
            'created_at': c.created_at.isoformat()
        } for c in chats]
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'chats': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report-history', methods=['GET'])
@login_required
def report_history():
    """Get report history"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        per_page = min(per_page, 100)
        
        reports = ReportHistory.query.filter_by(user_id=session['user_id'], is_deleted=False)\
            .order_by(ReportHistory.created_at.desc())\
            .limit(per_page).offset((page - 1) * per_page).all()
        
        from sqlalchemy import func
        total = db.session.query(func.count(ReportHistory.id)).filter_by(user_id=session['user_id'], is_deleted=False).scalar()
        
        results = [{
            'id': r.id,
            'file_name': r.file_name,
            'result': r.get_result_dict(),
            'created_at': r.created_at.isoformat()
        } for r in reports]
        
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        return jsonify({
            'reports': results,
            'total': total,
            'pages': total_pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report-history/<int:id>', methods=['DELETE'])
@login_required
def delete_report_history_item(id):
    try:
        report = db.session.get(ReportHistory, id)
        if not report or report.user_id != session['user_id']:
            return jsonify({'error': 'Report not found or unauthorized'}), 404
            
        report.is_deleted = True
        report.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Report removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/report-history/all', methods=['DELETE'])
@login_required
def delete_all_report_history():
    try:
        db.session.query(ReportHistory).filter_by(user_id=session['user_id'], is_deleted=False)\
            .update({'is_deleted': True, 'deleted_at': datetime.utcnow()})
        db.session.commit()
        
        return jsonify({'message': 'All report history cleared'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== VOICE INPUT ROUTE ====================

@app.route('/api/voice-to-text', methods=['POST'])
@login_required
def voice_to_text():
    """Process voice input text (from browser's Web Speech API)"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Process the voice command
        # This is just acknowledging receipt - actual TTS happens in browser
        return jsonify({
            'message': 'Voice input received',
            'text': text,
            'status': 'success'
        }), 200
    
    except Exception as e:
        print(f"Voice input error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
@login_required
def text_to_speech():
    """Return text for browser-based speech synthesis"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Return text for browser's Speech Synthesis API
        # The actual speech happens on the client side
        return jsonify({
            'text': text,
            'status': 'success',
            'message': 'Text ready for speech synthesis'
        }), 200
    
    except Exception as e:
        print(f"TTS endpoint error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/voice/status', methods=['GET'])
def voice_status():
    """Check voice features availability"""
    return jsonify({
        'voice_recognition': True,  # Browser-based Web Speech API
        'text_to_speech': True,     # Browser-based Speech Synthesis API
        'environment': 'serverless' if os.getenv('VERCEL') else 'local',
        'note': 'Voice features use browser APIs (Web Speech API)'
    }), 200

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

# ==================== FEEDBACK ROUTES ====================

@app.route('/api/feedback', methods=['POST'])
def feedback():
    """Handle feedback submission"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        email = data.get('email', '')
        message = data.get('message', '')
        
        print(f"📝 Feedback received from: {name} ({email})")
        
        if not all([name, email, message]):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Validate email format
        if not validate_email_format(email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Send feedback email with threading to prevent timeout
        print(f"📧 Sending feedback email...")
        
        # Start email thread
        feedback_thread = threading.Thread(target=send_feedback_email, args=(name, email, message))
        feedback_thread.daemon = True
        feedback_thread.start()
        
        # Wait a bit to ensure email is being sent (gives time for SMTP connection)
        import time
        time.sleep(1)  # 1 second delay to show some processing time
        
        print(f"✅ Feedback email thread started")
        
        return jsonify({'message': 'Feedback received successfully! Thank you for your input!'}), 200
    
    except Exception as e:
        print(f"❌ Feedback error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

# ==================== PROFILE MANAGEMENT ROUTES ====================

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Get profile error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile/picture', methods=['POST'])
@login_required
def upload_profile_picture():
    """Upload profile picture"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP'}), 400
        
        # Save file
        filename = secure_filename(f"profile_{session['user_id']}_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Update user profile
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        print(f"📸 Uploading profile picture for user: {user.username}")
        print(f"📁 Old profile picture: {user.profile_picture}")
        
        # Delete old profile picture if exists
        if user.profile_picture:
            old_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
            if os.path.exists(old_picture_path):
                try:
                    os.remove(old_picture_path)
                    print(f"🗑️ Deleted old profile picture: {old_picture_path}")
                except Exception as e:
                    print(f"⚠️ Could not delete old picture: {e}")
        
        user.profile_picture = filename
        db.session.commit()
        
        # Verify it was saved
        user_after = db.session.get(User, session['user_id'])
        print(f"✅ Profile picture uploaded: {filename}")
        print(f"💾 Profile picture saved in DB: {user_after.profile_picture}")
        
        # Generate the proper URL for the uploaded file
        image_url = f"{request.url_root.rstrip('/')}/static/uploads/{filename}"
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_picture': filename,
            'image_url': image_url
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Profile picture upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile/picture', methods=['DELETE'])
@login_required
def delete_profile_picture():
    """Delete the current user's profile picture"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.profile_picture:
            return jsonify({'error': 'No profile picture to delete'}), 400

        picture_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
        if os.path.exists(picture_path):
            try:
                os.remove(picture_path)
                print(f"🗑️ Deleted profile picture: {picture_path}")
            except Exception as file_error:
                print(f"⚠️ Could not delete profile picture file: {file_error}")

        user.profile_picture = None
        db.session.commit()

        return jsonify({'message': 'Profile picture deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete profile picture error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.get_json()
        user = db.session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update username if provided
        if 'username' in data:
            new_username = data.get('username')
            # Check if username is already taken by another user
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Username already exists'}), 400
            
            # Validate username
            if len(new_username) < 3 or len(new_username) > 20:
                return jsonify({'error': 'Username must be between 3 and 20 characters'}), 400
            
            if not re.match(r'^[a-zA-Z0-9_]+$', new_username):
                return jsonify({'error': 'Username can only contain letters, numbers, and underscores'}), 400
            
            user.username = new_username
            session['username'] = new_username
        
        # Update email if provided
        if 'email' in data:
            new_email = data.get('email')
            # Validate email format
            if not validate_email_format(new_email):
                return jsonify({'error': 'Please enter a valid email address'}), 400
            
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already exists'}), 400
            
            user.email = new_email
        
        db.session.commit()
        
        print(f"✅ Profile updated for user: {user.username}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_picture': user.profile_picture,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Update profile error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat-history/<int:item_id>', methods=['DELETE'])
@login_required
def delete_single_chat(item_id):
    """Delete a specific chat history entry"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        chat = db.session.get(ChatHistory, item_id)
        if not chat or chat.user_id != user.id:
            return jsonify({'error': 'Chat not found or access denied'}), 404
        
        # Soft delete
        chat.is_deleted = True
        chat.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Chat deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat-history/all', methods=['DELETE'])
@login_required
def delete_all_chat():
    """Delete all chat history for user"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        chats = ChatHistory.query.filter_by(user_id=user.id, is_deleted=False).all()
        for chat in chats:
            chat.is_deleted = True
            chat.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'All chat history deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnosis-history/<int:item_id>', methods=['DELETE'])
@login_required
def delete_single_diagnosis(item_id):
    """Delete a specific diagnosis history entry"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        diagnosis = db.session.get(Diagnosis, item_id)
        if not diagnosis or diagnosis.user_id != user.id:
            return jsonify({'error': 'Diagnosis not found or access denied'}), 404
        
        # Soft delete
        diagnosis.is_deleted = True
        diagnosis.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Diagnosis deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/diagnosis-history/all', methods=['DELETE'])
@login_required
def delete_all_diagnosis():
    """Delete all diagnosis history for user"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        diagnoses = Diagnosis.query.filter_by(user_id=user.id, is_deleted=False).all()
        for diagnosis in diagnoses:
            diagnosis.is_deleted = True
            diagnosis.deleted_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'All diagnosis history deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/account-deletion/request', methods=['POST'])
@login_required
def request_account_deletion():
    """Send a verification code to confirm account deletion"""
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        recent_token = AccountDeletionToken.query.filter_by(user_id=user.id)\
            .order_by(AccountDeletionToken.created_at.desc()).first()

        if recent_token and (datetime.utcnow() - recent_token.created_at).total_seconds() < 60:
            return jsonify({'error': 'Please wait a minute before requesting another code.'}), 429

        AccountDeletionToken.query.filter_by(user_id=user.id).delete()

        code = f"{secrets.randbelow(1000000):06d}"
        token = AccountDeletionToken(
            user_id=user.id,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
        db.session.add(token)
        db.session.flush()

        email_sent = send_account_deletion_code(user.email, user.username, code)
        if not email_sent:
            db.session.rollback()
            return jsonify({'error': 'Failed to send verification email. Please try again later.'}), 500

        db.session.commit()
        return jsonify({'message': 'Verification code sent to your email.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Account deletion code error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Unable to send verification code. Please try again.'}), 500

@app.route('/api/settings/account-deletion/confirm', methods=['POST'])
@login_required
def confirm_account_deletion():
    """Verify code and delete the user's account"""
    try:
        data = request.get_json() or {}
        code = str(data.get('code', '')).strip()

        if len(code) != 6 or not code.isdigit():
            return jsonify({'error': 'Please enter the 6-digit verification code.'}), 400

        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404

        token = AccountDeletionToken.query.filter_by(user_id=user.id)\
            .order_by(AccountDeletionToken.created_at.desc()).first()

        if not token:
            return jsonify({'error': 'No verification code found. Please request a new one.'}), 400

        if not token.is_valid():
            db.session.delete(token)
            db.session.commit()
            return jsonify({'error': 'Verification code expired. Request a new one.'}), 400

        if token.code != code:
            token.attempts += 1
            db.session.commit()
            if token.attempts >= 5:
                AccountDeletionToken.query.filter_by(user_id=user.id).delete()
                db.session.commit()
                return jsonify({'error': 'Too many invalid attempts. Please request a new code.'}), 400
            return jsonify({'error': 'Invalid verification code. Please try again.'}), 400

        # Remove any uploaded files (profile + diagnosis images)
        if user.profile_picture:
            profile_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(user.profile_picture))
            if os.path.exists(profile_path):
                try:
                    os.remove(profile_path)
                except Exception as file_error:
                    print(f"⚠️ Could not delete profile picture: {file_error}")

        diagnoses = Diagnosis.query.filter_by(user_id=user.id).all()
        for diag in diagnoses:
            if diag.image_path:
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(diag.image_path))
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except Exception as diag_error:
                        print(f"⚠️ Could not delete diagnosis image: {diag_error}")

        AccountDeletionToken.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()

        session.clear()

        return jsonify({'message': 'Your account has been deleted successfully.'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Account deletion error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to delete account. Please try again.'}), 500

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

# ==================== CREDIT SYSTEM ROUTES ====================

@app.route('/api/credits/packages', methods=['GET', 'OPTIONS'])
def get_credit_packages():
    """Get available credit packages"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        return jsonify({
            'packages': CREDIT_PACKAGES,
            'currency': 'INR'
        }), 200
    except Exception as e:
        print(f"❌ Error getting credit packages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/credits/balance', methods=['GET', 'OPTIONS'])
@login_required
def get_credits_balance():
    """Get user's current credit balance"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'credits': user.credits,
            'user_id': user.id
        }), 200
    except Exception as e:
        print(f"❌ Error getting credit balance: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/credits/transactions', methods=['GET', 'OPTIONS'])
@login_required
def get_credit_transactions():
    """Get user's credit transaction history"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        transactions = CreditsTransaction.query.filter_by(user_id=user.id).order_by(CreditsTransaction.created_at.desc()).limit(50).all()
        
        return jsonify({
            'transactions': [{
                'id': t.id,
                'credits': t.credits,
                'type': t.transaction_type,
                'description': t.description,
                'created_at': t.created_at.isoformat()
            } for t in transactions]
        }), 200
    except Exception as e:
        print(f"❌ Error getting transactions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/credits/transactions/<int:transaction_id>', methods=['DELETE', 'OPTIONS'])
@login_required
def delete_transaction(transaction_id):
    """Delete a specific transaction (only the user's own transactions)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Find transaction and verify it belongs to the user
        transaction = CreditsTransaction.query.filter_by(
            id=transaction_id,
            user_id=user.id
        ).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        db.session.delete(transaction)
        db.session.commit()
        
        print(f"✅ Transaction {transaction_id} deleted for user {user.id}")
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting transaction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/credits/transactions/clear/all', methods=['DELETE', 'OPTIONS'])
@login_required
def delete_all_transactions():
    """Delete all transactions for the user"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete all transactions for this user
        deleted_count = CreditsTransaction.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        
        print(f"✅ Deleted {deleted_count} transactions for user {user.id}")
        return jsonify({
            'message': f'All {deleted_count} transactions deleted successfully',
            'deleted_count': deleted_count
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting all transactions: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/create-order', methods=['POST', 'OPTIONS'])
@login_required
def create_payment_order():
    """Create a Razorpay payment order for credit purchase"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        import razorpay
        
        data = request.get_json()
        package_id = data.get('package_id')
        
        # Find the package
        package = next((p for p in CREDIT_PACKAGES if p['id'] == package_id), None)
        if not package:
            return jsonify({'error': 'Invalid package'}), 400
        
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
            return jsonify({'error': 'Payment service not configured'}), 500
        
        # Create Razorpay client
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        # Amount in paise (1 rupee = 100 paise)
        amount_paise = package['price'] * 100
        
        # Create order
        razorpay_order = client.order.create({
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': f"order_{user.id}_{int(datetime.utcnow().timestamp())}",
            'payment_capture': 1
        })
        
        # Store payment order in database
        payment_order = PaymentOrder(
            user_id=user.id,
            razorpay_order_id=razorpay_order['id'],
            amount=amount_paise,
            credits=package['credits'],
            status='created'
        )
        db.session.add(payment_order)
        db.session.commit()
        
        print(f"✅ Razorpay order created: {razorpay_order['id']} for user {user.id}")
        
        return jsonify({
            'order_id': razorpay_order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'key_id': RAZORPAY_KEY_ID,
            'package': package
        }), 200
    
    except ImportError:
        return jsonify({'error': 'razorpay library not installed. Install with: pip install razorpay'}), 500
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating payment order: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/payments/verify', methods=['POST', 'OPTIONS'])
@login_required
def verify_payment():
    """Verify Razorpay payment and credit user's account"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        import razorpay
        import hmac
        import hashlib
        
        data = request.get_json()
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        
        user = db.session.get(User, session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
            return jsonify({'error': 'Payment service not configured'}), 500
        
        # Find payment order
        payment_order = PaymentOrder.query.filter_by(
            razorpay_order_id=razorpay_order_id,
            user_id=user.id
        ).first()
        
        if not payment_order:
            return jsonify({'error': 'Payment order not found'}), 404
        
        # Verify signature
        verify_string = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            verify_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != razorpay_signature:
            print(f"❌ Payment signature verification failed for order {razorpay_order_id}")
            payment_order.status = 'failed'
            db.session.commit()
            return jsonify({'error': 'Payment verification failed'}), 400
        
        # Update payment order
        payment_order.razorpay_payment_id = razorpay_payment_id
        payment_order.status = 'completed'
        payment_order.completed_at = datetime.utcnow()
        
        # Add credits to user
        user.credits += payment_order.credits
        
        # Create transaction record
        transaction = CreditsTransaction(
            user_id=user.id,
            credits=payment_order.credits,
            transaction_type='purchase',
            description=f'Razorpay payment {razorpay_payment_id}'
        )
        db.session.add(transaction)
        db.session.commit()
        
        print(f"✅ Payment verified and {payment_order.credits} credits added to user {user.id}")
        
        return jsonify({
            'message': 'Payment verified successfully',
            'credits': user.credits,
            'credits_added': payment_order.credits
        }), 200
    
    except ImportError:
        return jsonify({'error': 'razorpay library not installed'}), 500
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error verifying payment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== DATABASE INITIALIZATION ====================

# Initialize database tables on startup (for local development)
if not os.getenv('VERCEL'):
    # Only initialize on startup for local development
    # For Vercel, initialization happens on each request via before_request hook
    try:
        with app.app_context():
            db.create_all()
            print("✓ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")
        print("Note: SQLite may not persist on Vercel. Consider using PostgreSQL for production.")

# ==================== STATIC FILE SERVING ====================

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    try:
        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        # Add CORS headers for static files
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        
        # Set correct Content-Type based on file extension
        if filename.lower().endswith('.webp'):
            response.headers['Content-Type'] = 'image/webp'
        elif filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            response.headers['Content-Type'] = 'image/jpeg'
        elif filename.lower().endswith('.png'):
            response.headers['Content-Type'] = 'image/png'
        elif filename.lower().endswith('.gif'):
            response.headers['Content-Type'] = 'image/gif'
            
        return response
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

# ==================== MAIN ====================

if __name__ == '__main__':
    try:
        # Get port from environment variable (for Railway/Render) or default to 5000
        port = int(os.getenv('PORT', 5000))
        
        # Print startup information
        print("=" * 50)
        print("MedMate - AI Medical Assistant")
        print("=" * 50)
        print(f"AI Provider: {ai_provider.upper() if ai_provider else 'NONE (Demo Mode)'}")
        print(f"Gemini API: {'✓ Configured' if GEMINI_API_KEY else '✗ Not configured'}")
        print(f"OpenAI API: {'✓ Configured' if OPENAI_API_KEY else '✗ Not configured'}")
        print(f"Google Maps API: {'✓ Configured' if GOOGLE_MAPS_API_KEY else '✗ Not configured'}")
        print(f"Text-to-Speech: {'✓ Available' if tts_engine else '✗ Not available'}")
        print(f"Database: {'✓ PostgreSQL' if DATABASE_URL else '✓ SQLite (local)'}")
        print("=" * 50)
        print(f"Starting server on http://0.0.0.0:{port}")
        print("=" * 50)
        
        # Use debug=False in production
        is_production = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER')
        app.run(debug=not is_production, host='0.0.0.0', port=port)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        # Exit with error code
        import sys
        sys.exit(1)
