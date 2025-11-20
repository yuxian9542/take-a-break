"""Conversation summarization service using GLM-4."""

import logging
from typing import Dict, Any, List

from zhipuai import ZhipuAI
from dotenv import load_dotenv
import os

from firestore_client import (
    get_conversations_to_summarize,
    mark_conversation_summarized,
    get_firestore_client
)

logger = logging.getLogger(__name__)

load_dotenv()


class ConversationSummarizer:
    """Summarize conversations using GLM-4 text model."""
    
    def __init__(self):
        api_key = os.getenv("GLM_API_KEY")
        if not api_key:
            raise ValueError("GLM_API_KEY environment variable is required")
        self.client = ZhipuAI(api_key=api_key)
        self.model = "glm-4"
    
    def summarize_conversation(self, conversation: Dict[str, Any]) -> str:
        """
        Summarize a conversation using GLM-4.
        
        Args:
            conversation: Conversation dictionary with messages
            
        Returns:
            Summary text
        """
        messages = conversation.get("messages", [])
        if not messages:
            return "Empty conversation"
        
        # Build conversation text
        conversation_text = "\n".join([
            f"{msg.get('role', 'unknown').capitalize()}: {msg.get('text', '')}"
            for msg in messages
        ])
        
        # Create summarization prompt
        prompt = f"""Please provide a concise summary of the following conversation. Focus on key topics, decisions, and important information discussed.

Conversation:
{conversation_text}

Summary:"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            summary = response.choices[0].message.content.strip()
            logger.info("Generated summary: %s", summary[:100])
            return summary
        except Exception as e:
            logger.error("Failed to summarize conversation: %s", e)
            # Fallback: use first user message as summary
            first_user_msg = next((msg.get("text", "") for msg in messages if msg.get("role") == "user"), "")
            return first_user_msg[:100] if first_user_msg else "Conversation summary"


def check_and_summarize(user_id: str) -> None:
    """
    Check if there are conversations that need summarization and summarize them.
    This should be called asynchronously in the background.
    
    Args:
        user_id: Firebase user ID
    """
    try:
        # Get conversations that need summarization (older than the 10 most recent)
        conversations = get_conversations_to_summarize(user_id, limit_count=5)
        
        if not conversations:
            logger.debug("No conversations to summarize for user_id=%s", user_id)
            return
        
        summarizer = ConversationSummarizer()
        
        for conv in conversations:
            conversation_id = conv.get("id")
            if not conversation_id:
                logger.warning("Conversation missing ID, skipping")
                continue
            
            try:
                summary = summarizer.summarize_conversation(conv)
                mark_conversation_summarized(conversation_id, user_id, summary)
                logger.info("Summarized conversation: conversation_id=%s", conversation_id)
            except Exception as e:
                logger.error("Failed to summarize conversation %s: %s", conversation_id, e)
    except Exception as e:
        logger.error("Error in check_and_summarize: %s", e)

