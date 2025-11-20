import { getFirestore, collection, query, where, orderBy, limit, getDocs, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebase';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ConversationMessage[];
  summary?: string;
  isSummarized: boolean;
}

function getFirestoreInstance(): Firestore {
  const app = getFirebaseApp();
  return getFirestore(app);
}

export async function getRecentConversations(userId: string, limitCount: number = 10): Promise<Conversation[]> {
  const db = getFirestoreInstance();
  const conversationsRef = collection(db, 'users', userId, 'conversations');
  
  try {
    // Try with index first (requires composite index)
    const q = query(
      conversationsRef,
      where('isSummarized', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        userId: data.userId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        messages: (data.messages || []).map((msg: any) => ({
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
          audioUrl: msg.audioUrl
        })),
        summary: data.summary,
        isSummarized: data.isSummarized || false
      });
    });
    
    return conversations;
  } catch (error: any) {
    // If index error, fallback to simple query without orderBy
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      console.warn('Firestore index not created yet. Using fallback query.');
      const q = query(
        conversationsRef,
        where('isSummarized', '==', false),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const conversations: Conversation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          messages: (data.messages || []).map((msg: any) => ({
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp),
            audioUrl: msg.audioUrl
          })),
          summary: data.summary,
          isSummarized: data.isSummarized || false
        });
      });
      
      // Sort manually by updatedAt
      return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    throw error;
  }
}

