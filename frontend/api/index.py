import os
import sys

# 1. Dynamically append the exact directory containing the app folder to the Python runtime path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# 2. Attempt explicit absolute import first, fallback to package-relative path if necessary
try:
    from app.main import app
except ImportError:
    try:
        from .app.main import app
    except ImportError as e:
        raise RuntimeError(f"Serverless router configuration failure. Directory contents: {os.listdir(current_dir)}") from e