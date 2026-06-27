import os
import sys

# Force the serverless container path to recognize the local app folder structure
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import the core FastAPI instance
from app.main import app

# Explicitly expose app at the top level so Vercel's handler sees it instantly
application = app