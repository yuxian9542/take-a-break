"""Firestore client for conversation storage and retrieval."""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

import firebase_admin
from google.cloud import firestore
from dotenv import load_dotenv

from auth import initialize_firebase

logger = logging.getLogger(__name__)

_firestore_client: Optional[firestore.Client] = None


def get_firestore_client() -> firestore.Client:
    """Get or create Firestore client."""
    global _firestore_client
    
    if _firestore_client is not None:
        return _firestore_client
    
    initialize_firebase()  # Ensure Firebase is initialized
    _firestore_client = firestore.Client()
    logger.info("Firestore client initialized")
    return _firestore_client


def create_conversation(user_id: str) -> str:
    """
    Create a new conversation document in Firestore.
    
    Args:
        user_id: Firebase user ID
        
    Returns:
        Conversation document ID
    """
    db = get_firestore_client()
    now = datetime.utcnow()
    
    conversation_ref = db.collection("users").document(user_id).collection("conversations").document()
    conversation_ref.set({
        "userId": user_id,
        "createdAt": now,
        "updatedAt": now,
        "messages": [],
        "isSummarized": False
    })
    
    conversation_id = conversation_ref.id
    logger.info("Created conversation: conversation_id=%s, user_id=%s", conversation_id, user_id)
    return conversation_id


def save_conversation_turn(user_id: str, conversation_id: str, user_text: str, assistant_text: str) -> None:
    """
    Save a conversation turn (user message + assistant response) to Firestore.
    
    Args:
        user_id: Firebase user ID
        conversation_id: Conversation document ID
        user_text: User's message text
        assistant_text: Assistant's response text
    """
    db = get_firestore_client()
    now = datetime.utcnow()
    
    conversation_ref = db.collection("users").document(user_id).collection("conversations").document(conversation_id)
    
    # Get current messages
    conversation_doc = conversation_ref.get()
    if not conversation_doc.exists:
        logger.warning("Conversation not found: conversation_id=%s", conversation_id)
        return
    
    messages = conversation_doc.to_dict().get("messages", [])
    
    # Add new messages
    messages.append({
        "role": "user",
        "text": user_text,
        "timestamp": now
    })
    messages.append({
        "role": "assistant",
        "text": assistant_text,
        "timestamp": now
    })
    
    # Update conversation
    conversation_ref.update({
        "messages": messages,
        "updatedAt": now
    })
    
    logger.info("Saved conversation turn: conversation_id=%s, user_text=%s", conversation_id, user_text[:50])


def get_recent_conversations(user_id: str, limit_count: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent conversations for a user.
    
    Args:
        user_id: Firebase user ID
        limit_count: Maximum number of conversations to return
        
    Returns:
        List of conversation dictionaries
    """
    db = get_firestore_client()
    conversations_ref = db.collection("users").document(user_id).collection("conversations")
    
    # Query for non-summarized conversations, ordered by updatedAt
    query = conversations_ref.where("isSummarized", "==", False).order_by("updatedAt", direction=firestore.Query.DESCENDING).limit(limit_count)
    
    conversations = []
    for doc in query.stream():
        conversations.append(doc.to_dict())
    
    return conversations


def get_conversations_to_summarize(user_id: str, limit_count: int = 5) -> List[Dict[str, Any]]:
    """
    Get conversations that need summarization (older than 10 recent ones).
    
    Args:
        user_id: Firebase user ID
        limit_count: Maximum number of conversations to return
        
    Returns:
        List of conversation dictionaries with 'id' field added
    """
    db = get_firestore_client()
    conversations_ref = db.collection("users").document(user_id).collection("conversations")
    
    # Query for non-summarized conversations, ordered by updatedAt (oldest first)
    query = conversations_ref.where("isSummarized", "==", False).order_by("updatedAt", direction=firestore.Query.ASCENDING).limit(limit_count)
    
    conversations = []
    for doc in query.stream():
        conv_data = doc.to_dict()
        conv_data["id"] = doc.id  # Add document ID
        conversations.append(conv_data)
    
    return conversations


def mark_conversation_summarized(conversation_id: str, user_id: str, summary: str) -> None:
    """
    Mark a conversation as summarized and store the summary.
    
    Args:
        conversation_id: Conversation document ID
        user_id: Firebase user ID
        summary: Summary text
    """
    db = get_firestore_client()
    conversation_ref = db.collection("users").document(user_id).collection("conversations").document(conversation_id)
    
    conversation_ref.update({
        "isSummarized": True,
        "summary": summary,
        "updatedAt": datetime.utcnow()
    })
    
    logger.info("Marked conversation as summarized: conversation_id=%s", conversation_id)


def build_history_text(user_id: str) -> str:
    """
    Build conversation history text for GLM from Firestore.
    Includes last 10 conversations (full transcripts) and summaries of older ones.
    
    Args:
        user_id: Firebase user ID
        
    Returns:
        Formatted history text string
    """
    db = get_firestore_client()
    conversations_ref = db.collection("users").document(user_id).collection("conversations")
    
    # Get recent conversations (not summarized)
    recent_query = conversations_ref.where("isSummarized", "==", False).order_by("updatedAt", direction=firestore.Query.DESCENDING).limit(10)
    recent_conversations = []
    for doc in recent_query.stream():
        recent_conversations.append(doc.to_dict())
    
    # Get summarized conversations (for context)
    summarized_query = conversations_ref.where("isSummarized", "==", True).order_by("updatedAt", direction=firestore.Query.DESCENDING).limit(5)
    summarized_conversations = []
    for doc in summarized_query.stream():
        summarized_conversations.append(doc.to_dict())
    
    # Build history text
    history_parts = []
    
    # Add summaries of older conversations first (for context)
    for conv in reversed(summarized_conversations):  # Oldest first
        summary = conv.get("summary", "")
        if summary:
            history_parts.append(f"[Previous conversation summary]: {summary}")
    
    # Add recent conversations (full transcripts)
    for conv in reversed(recent_conversations):  # Oldest first
        messages = conv.get("messages", [])
        for msg in messages:
            role = msg.get("role", "")
            text = msg.get("text", "")
            if role and text:
                history_parts.append(f"{role.capitalize()}: {text}")
    
    history_text = "\n".join(history_parts)
    logger.info("Built history text: %d chars for user_id=%s", len(history_text), user_id)
    return history_text


def get_user_summary(user_id: str) -> Optional[str]:
    """Get user's summary document if it exists."""
    db = get_firestore_client()
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        return user_doc.to_dict().get("summary")
    return None


def update_user_summary(user_id: str, summary: str) -> None:
    """Update user's summary document."""
    db = get_firestore_client()
    user_ref = db.collection("users").document(user_id)
    user_ref.set({
        "summary": summary,
        "updatedAt": datetime.utcnow()
    }, merge=True)
    
    logger.info("Updated user summary: user_id=%s", user_id)

