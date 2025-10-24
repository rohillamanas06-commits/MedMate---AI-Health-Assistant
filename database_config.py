"""
Database configuration for MedMate
Supports both local SQLite and production PostgreSQL
"""
import os
from urllib.parse import urlparse

def get_database_config():
    """Get database configuration based on environment"""
    
    # Check for PostgreSQL URL (production)
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Parse PostgreSQL URL for production (Vercel/Heroku style)
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        return {
            'SQLALCHEMY_DATABASE_URI': database_url,
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'pool_pre_ping': True,
                'pool_recycle': 300,
            }
        }
    
    # Fallback to SQLite for local development
    if os.getenv('VERCEL'):
        # For Vercel without PostgreSQL - use in-memory (temporary)
        db_path = '/tmp/medmate.db'
        print("⚠️ WARNING: Using temporary SQLite on Vercel - data will not persist!")
    else:
        # Local development
        db_path = 'medmate.db'
    
    return {
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False
    }

def init_database_tables(db, app):
    """Initialize database tables with proper error handling"""
    try:
        with app.app_context():
            db.create_all()
            print("✅ Database tables initialized successfully")
            return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
