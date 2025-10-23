"""
Vercel serverless function entry point
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app
from MedMate import app

# This is the WSGI application that Vercel will use
application = app

# For local testing
if __name__ == "__main__":
    app.run(debug=True)
