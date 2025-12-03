import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Create a new chat session
 * @param {string} userId - User ID
 * @returns {Promise<string>} Session ID
 */
export const createSession = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  console.log('createSession: Creating session for user:', userId);
  const sessionRef = doc(collection(db, 'users', userId, 'sessions'));
  const sessionId = sessionRef.id;
  console.log('createSession: Session ID generated:', sessionId);

  try {
    await setDoc(sessionRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      title: 'New Chat',
    });
    console.log('createSession: Session document created successfully');
    return sessionId;
  } catch (error) {
    console.error('createSession: Error creating session:', error);
    console.error('createSession: Error details:', {
      code: error.code,
      message: error.message,
    });
    // Don't throw - return null to indicate failure
    return null;
  }
};

/**
 * Save a message to a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {Object} message - Message object to save
 */
export const saveMessage = async (userId, sessionId, message) => {
  if (!userId || !sessionId || !message) {
    console.warn('saveMessage: Missing required parameters', { userId: !!userId, sessionId: !!sessionId, message: !!message });
    return;
  }

  // Validate message ID - Firestore document IDs must be non-empty strings
  if (!message.id || typeof message.id !== 'string' || message.id.trim() === '') {
    console.error('saveMessage: Invalid message ID', { messageId: message.id });
    return;
  }

  console.log('saveMessage: Starting save', { userId, sessionId, messageId: message.id, messageType: message.type });

  try {
    const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const messageRef = doc(messagesRef, message.id || undefined);
    console.log('saveMessage: Message ref created', messageRef.id);

    // Validate and clean message data
    // Firestore has a 1MB limit per document, so we need to limit audioData size
    let audioData = message.audioData || [];
    
    // Calculate approximate size of audioData (base64 strings)
    const audioDataSize = JSON.stringify(audioData).length;
    const maxSize = 800000; // ~800KB to leave room for other fields (safety margin under 1MB)
    
    if (audioDataSize > maxSize) {
      console.warn('saveMessage: audioData too large, truncating', { 
        originalSize: audioDataSize, 
        maxSize,
        chunks: audioData.length 
      });
      // Keep only the last few chunks to stay under limit
      // Estimate ~50KB per chunk, so keep last ~15 chunks
      audioData = audioData.slice(-15);
    }

    // Clean blob URLs - they won't persist anyway, so convert to null
    let audioUrl = message.audioUrl || null;
    if (audioUrl && typeof audioUrl === 'string' && audioUrl.startsWith('blob:')) {
      audioUrl = null; // Don't save blob URLs as they're temporary
    }
    
    let videoUrlContent = message.videoUrlContent || null;
    if (videoUrlContent && typeof videoUrlContent === 'string' && videoUrlContent.startsWith('blob:')) {
      videoUrlContent = null; // Don't save blob URLs as they're temporary
    }

    // Ensure textContent is an array of strings
    const textContent = Array.isArray(message.textContent) 
      ? message.textContent.filter(item => typeof item === 'string')
      : [];

    // Save message data
    const messageData = {
      id: message.id || '',
      type: message.type || 'client',
      textContent: textContent,
      audioUrl: audioUrl,
      videoUrlContent: videoUrlContent,
      // Only save audioData if it's not too large
      audioData: audioDataSize <= maxSize ? audioData : [],
      responseType: message.responseType || null,
      answerStatus: message.answerStatus || null,
      timestamp: serverTimestamp(),
    };

    // Final size check before saving
    const finalSize = JSON.stringify(messageData).length;
    if (finalSize > 1000000) { // 1MB limit
      console.error('saveMessage: Message data still too large after cleanup', { finalSize });
      // Remove audioData completely if still too large
      messageData.audioData = [];
    }

    await setDoc(messageRef, messageData);
    console.log('saveMessage: Message document saved');

    // Update session updatedAt timestamp
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      updatedAt: serverTimestamp(),
    });
    console.log('saveMessage: Session updatedAt timestamp updated');

    // Update session title from first user message if still "New Chat"
    if (message.type === 'client' && message.textContent && message.textContent.length > 0) {
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        if (sessionData.title === 'New Chat') {
          const preview = message.textContent.join('').substring(0, 50);
          await updateDoc(sessionRef, {
            title: preview || 'New Chat',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error saving message:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    // Don't throw - fail silently to not break voice flow
  }
};

/**
 * Load all messages for a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} Array of message objects
 */
export const loadSession = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return [];
  }

  try {
    const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: data.id,
        type: data.type,
        textContent: data.textContent || [],
        audioUrl: data.audioUrl || null,
        videoUrlContent: data.videoUrlContent || null,
        audioData: data.audioData || [],
        responseType: data.responseType || null,
        answerStatus: data.answerStatus || null,
      });
    });

    return messages;
  } catch (error) {
    console.error('Error loading session:', error);
    return [];
  }
};

/**
 * List all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of session objects with metadata
 */
export const listSessions = async (userId) => {
  if (!userId) {
    console.warn('listSessions: No userId provided');
    return [];
  }

  try {
    console.log('listSessions: Loading sessions for user:', userId);
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    console.log('listSessions: Found', querySnapshot.size, 'sessions');

    const sessions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        title: data.title || 'New Chat',
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
      });
      console.log('listSessions: Session', doc.id, data.title || 'New Chat');
    });

    return sessions;
  } catch (error) {
    console.error('Error listing sessions:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
    });
    return [];
  }
};

/**
 * Update session title
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {string} title - New title
 */
export const updateSessionTitle = async (userId, sessionId, title) => {
  if (!userId || !sessionId || !title) {
    return;
  }

  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      title: title.substring(0, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating session title:', error);
  }
};

/**
 * Check if a session has any messages
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} True if session has messages
 */
export const sessionHasMessages = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return false;
  }

  try {
    const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking session messages:', error);
    return false;
  }
};

/**
 * Delete a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 */
export const deleteSession = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return;
  }

  try {
    // Delete all messages in the session
    const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the session
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};
