"""
Vercel serverless function entry point
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from MedMate import app

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda *args: None)

# For local testing
if __name__ == "__main__":
    app.run(debug=True)
