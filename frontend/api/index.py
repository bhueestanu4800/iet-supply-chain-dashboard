import os
import sys

# Dynamically resolve absolute path traversal to the backend directory
current_dir = os.path.dirname(__file__)
backend_path = os.path.abspath(os.path.join(current_dir, '..', '..', 'backend'))
sys.path.append(backend_path)

# Safe fallback structure context for local linters
try:
    from app.main import app # type: ignore
except ImportError:
    # Explicit backup path addition if root resolution is delayed during initial caching
    sys.path.insert(0, backend_path)
    from app.main import app # type: ignore 