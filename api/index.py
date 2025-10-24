import sys
import os

# Add parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from MedMate import app

# Export the Flask app for Vercel
# Vercel will automatically use this as the WSGI application
