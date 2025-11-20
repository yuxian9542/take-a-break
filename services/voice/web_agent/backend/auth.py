"""Firebase authentication for voice backend."""

import logging
import os
from typing import Dict, Optional

import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK if not already initialized."""
    global _firebase_app
    
    if _firebase_app is not None:
        return _firebase_app
    
    load_dotenv()
    
    # Check if Firebase is already initialized
    try:
        _firebase_app = firebase_admin.get_app()
        logger.info("Firebase Admin SDK already initialized")
        return _firebase_app
    except ValueError:
        pass
    
    # Try to initialize with service account file
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    if service_account_path:
        # Resolve relative paths relative to web_agent directory
        if not os.path.isabs(service_account_path):
            # Get the directory where this file is located (backend/)
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            web_agent_dir = os.path.dirname(backend_dir)
            service_account_path = os.path.join(web_agent_dir, service_account_path)
        
        if os.path.exists(service_account_path):
            logger.info(f"Initializing Firebase Admin with service account file: {service_account_path}")
            cred = credentials.Certificate(service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            return _firebase_app
        else:
            logger.warning(f"Service account file not found at: {service_account_path}")
    
    # Try to initialize with environment variables
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    
    if project_id and client_email and private_key:
        logger.info("Initializing Firebase Admin with environment variables")
        # Handle escaped newlines in private key
        private_key_clean = private_key.replace("\\n", "\n")
        cred = credentials.Certificate({
            "project_id": project_id,
            "client_email": client_email,
            "private_key": private_key_clean
        })
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    
    # Fallback: initialize with default credentials (for local development)
    logger.warning("No Firebase credentials found. Using default credentials (may fail in production)")
    try:
        _firebase_app = firebase_admin.initialize_app()
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        raise RuntimeError(
            "Firebase Admin SDK initialization failed. "
            "Please set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY"
        ) from e


def verify_id_token(token: str) -> Dict:
    """
    Verify Firebase ID token and return decoded token.
    Raises ValueError if token is invalid or expired.
    """
    try:
        initialize_firebase() # Ensure Firebase app is initialized
        decoded_token = auth.verify_id_token(token)
        logger.info("Token verified for user: %s", decoded_token.get("uid"))
        return decoded_token
    except Exception as e:
        logger.error("Firebase ID token verification failed: %s", e)
        raise ValueError(f"Invalid authentication token: {e}")


def get_user_id_from_token(token: str) -> str:
    """Verify token and return user ID."""
    decoded_token = verify_id_token(token)
    uid = decoded_token.get("uid")
    if not uid:
        raise ValueError("User ID not found in token")
    return uid

