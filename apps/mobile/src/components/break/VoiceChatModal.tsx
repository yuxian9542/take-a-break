import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Mic, MicOff, Volume2 } from 'lucide-react-native';
import { createVoiceService, VoiceServerMessage } from '../../services/voiceService';
import AudioRecorder from '../../services/audioRecorder';
import AudioPlayer from '../../services/audioPlayer';

interface VoiceChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTopic?: string;
  showContinueButton?: boolean;
  onListeningChange?: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

export function VoiceChatModal({ 
  open, 
  onOpenChange, 
  sessionTopic = 'general_chat',
  showContinueButton = false,
  onListeningChange,
  onSpeakingChange
}: VoiceChatModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const messageIdRef = useRef(0);
  const isSpeakingRef = useRef(false); // Track speaking state for cleanup
  const isOpenRef = useRef(open); // Track modal open state for cleanup checks

  // Message handling function (must be defined before use)
  const handleServerMessage = (message: VoiceServerMessage) => {
    console.log('[VoiceChatModal] Server message:', message.type);

    switch (message.type) {
      case 'info':
        if (message.message) {
          addSystemMessage(message.message);
        }
        break;
      
      case 'speech_started':
        setIsListening(true);
        if (message.message) {
          addSystemMessage(message.message);
        }
        break;
      
      case 'asr_start':
        // Stop sending audio chunks when ASR starts
        recorderRef.current?.stopSending();
        if (message.message) {
          addSystemMessage(message.message);
        }
        break;
      
      case 'asr_complete':
        if (message.text) {
          addUserMessage(message.text);
        }
        break;
      
      case 'glm_start':
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsListening(false);
        if (message.message) {
          addSystemMessage(message.message);
        }
        break;
      
      case 'glm_complete':
        if (message.text) {
          addAssistantMessage(message.text);
        }
        // Resume sending audio for next turn
        recorderRef.current?.resumeSending();
        break;
      
      case 'reply_audio_chunk':
        if (message.data) {
          // Queue audio chunk for playback
          playerRef.current?.addAudioChunk(message.data);
        }
        if (message.isLast) {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          // Resume sending audio after response completes
          recorderRef.current?.resumeSending();
        }
        break;
      
      case 'error':
        console.error('[VoiceChatModal] Server error:', message.message);
        if (message.message) {
          addSystemMessage('Error: ' + message.message);
        }
        setIsListening(false);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        break;
    }
  };

  // Create voice service with callbacks
  const voiceServiceRef = useRef<ReturnType<typeof createVoiceService> | null>(null);
  
  // Initialize voice service (only once)
  if (!voiceServiceRef.current) {
    voiceServiceRef.current = createVoiceService({
      onConnectionChange: (state) => {
        console.log('[VoiceChatModal] Connection state changed:', state, 'modal open:', isOpenRef.current);
        setConnectionStatus(state);
        setIsConnecting(state === 'connecting');
        
        // Log if connection drops while modal is open (for debugging)
        if (state === 'disconnected' && isOpenRef.current) {
          console.warn('[VoiceChatModal] Connection lost while modal is open - user may need to reconnect');
          // Don't auto-reconnect for now - let user manually reconnect by closing/reopening
        }
      },
      onMessage: handleServerMessage,
      onError: (error) => {
        console.error('[VoiceChatModal] Voice service error:', error);
        // Only show error if modal is still open (use ref to avoid closure issues)
        if (isOpenRef.current) {
          addSystemMessage('Connection error: ' + error.message);
        }
      }
    });
  }

  // Update open ref whenever open prop changes
  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (open) {
      initializeVoiceChat();
    } else {
      // Async cleanup - don't block
      cleanupVoiceChat().catch(error => {
        console.error('[VoiceChatModal] Error in cleanup:', error);
      });
    }
    
    // Cleanup on unmount
    return () => {
      // Async cleanup in return - can't await but will run in background
      cleanupVoiceChat().catch(error => {
        console.error('[VoiceChatModal] Error in unmount cleanup:', error);
      });
    };
  }, [open]);

  useEffect(() => {
    if (onListeningChange) {
      onListeningChange(isListening);
    }
  }, [isListening, onListeningChange]);

  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(isSpeaking);
    }
  }, [isSpeaking, onSpeakingChange]);

  async function initializeVoiceChat() {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      
      // Reset speaking state
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsListening(false);

      // Ensure voice service is initialized
      if (!voiceServiceRef.current) {
        console.error('[VoiceChatModal] Voice service not initialized');
        addSystemMessage('Voice service error. Please try again.');
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        return;
      }

      // Initialize audio player
      if (!playerRef.current) {
        playerRef.current = new AudioPlayer({
          onError: (error) => {
            console.error('[VoiceChatModal] Audio player error:', error);
            addSystemMessage('Audio playback error');
          }
        });
        await playerRef.current.initialize();
      }

      // Connect to voice service
      await voiceServiceRef.current.connect();
      
      addSystemMessage('Connected to voice chat');
    } catch (error) {
      console.error('[VoiceChatModal] Failed to initialize:', error);
      addSystemMessage('Failed to connect. Please try again.');
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  }

  async function cleanupVoiceChat() {
    // Only cleanup if modal is actually closed
    // This prevents cleanup from running if called while modal is still open
    // Use ref to get current value (avoids closure issues)
    if (isOpenRef.current) {
      console.log('[VoiceChatModal] Skipping cleanup - modal is still open');
      return;
    }
    
    console.log('[VoiceChatModal] Starting cleanup...');
    
    // Stop recording if active - wait for cleanup to complete
    if (recorderRef.current) {
      try {
        console.log('[VoiceChatModal] Stopping recorder...');
        // Stop even if isRecording() returns false - might still have active PCM generator
        await recorderRef.current.stop();
        console.log('[VoiceChatModal] Recorder stopped');
      } catch (error) {
        console.error('[VoiceChatModal] Error stopping recording during cleanup:', error);
      } finally {
        recorderRef.current = null;
      }
    }
    setIsListening(false);

    // Wait for any ongoing GLM responses to complete before disconnecting
    // This ensures we receive the final reply audio chunks
    // Check if we're currently speaking (response in progress) using ref
    if (isSpeakingRef.current) {
      console.log('[VoiceChatModal] Response in progress, waiting for completion...');
      // Wait up to 10 seconds for response to complete
      let waited = 0;
      while (isSpeakingRef.current && waited < 10000) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waited += 500;
      }
      console.log('[VoiceChatModal] Finished waiting for response (waited', waited, 'ms)');
    } else {
      // No response in progress, but wait a bit anyway in case one starts
      console.log('[VoiceChatModal] No response in progress, waiting briefly...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Stop playback
    if (playerRef.current) {
      try {
        console.log('[VoiceChatModal] Stopping player...');
        await playerRef.current.stop();
        console.log('[VoiceChatModal] Player stopped');
      } catch (error) {
        console.error('[VoiceChatModal] Error stopping playback during cleanup:', error);
      }
    }

    // Disconnect voice service (after waiting for responses)
    // Only disconnect if modal is still closed (double-check to prevent race conditions)
    // Use ref to get current value (avoids closure issues)
    if (!isOpenRef.current && voiceServiceRef.current) {
      try {
        console.log('[VoiceChatModal] Disconnecting voice service...');
        voiceServiceRef.current.disconnect();
        console.log('[VoiceChatModal] Voice service disconnected');
      } catch (error) {
        console.error('[VoiceChatModal] Error disconnecting voice service:', error);
      }
    } else if (isOpenRef.current) {
      console.log('[VoiceChatModal] Skipping disconnect - modal reopened during cleanup');
    }
    
    // Clear messages
    setMessages([]);
    messageIdRef.current = 0;
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    
    console.log('[VoiceChatModal] Cleanup complete');
  }

  function addUserMessage(text: string) {
    // Increment counter first to ensure uniqueness even if called multiple times rapidly
    const id = ++messageIdRef.current;
    const timestamp = Date.now();
    const uniqueId = `user-${timestamp}-${id}-${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => {
      // Prevent duplicate messages
      if (prev.some(msg => msg.id === uniqueId)) {
        return prev;
      }
      return [...prev, {
        id: uniqueId,
        type: 'user',
        text,
        timestamp: new Date()
      }];
    });
  }

  function addAssistantMessage(text: string) {
    // Increment counter first to ensure uniqueness even if called multiple times rapidly
    const id = ++messageIdRef.current;
    const timestamp = Date.now();
    const uniqueId = `assistant-${timestamp}-${id}-${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => {
      // Prevent duplicate messages
      if (prev.some(msg => msg.id === uniqueId)) {
        return prev;
      }
      return [...prev, {
        id: uniqueId,
        type: 'assistant',
        text,
        timestamp: new Date()
      }];
    });
  }

  function addSystemMessage(text: string) {
    // Increment counter first to ensure uniqueness even if called multiple times rapidly
    const id = ++messageIdRef.current;
    const timestamp = Date.now();
    const uniqueId = `system-${timestamp}-${id}-${Math.random().toString(36).substr(2, 9)}`;
    setMessages(prev => {
      // Prevent duplicate messages with same ID or same text at same time
      // Check for duplicates by ID or by text+timestamp (to catch rapid duplicates)
      const isDuplicate = prev.some(msg => 
        msg.id === uniqueId || 
        (msg.type === 'system' && msg.text === text && Math.abs(msg.timestamp.getTime() - timestamp) < 100)
      );
      if (isDuplicate) {
        return prev;
      }
      return [...prev, {
        id: uniqueId,
        type: 'system',
        text,
        timestamp: new Date()
      }];
    });
  }

  async function handleToggleMic() {
    if (isListening) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  }

  async function startRecording() {
    if (!voiceServiceRef.current?.isConnected()) {
      addSystemMessage('Not connected. Reconnecting...');
      await initializeVoiceChat();
      if (!voiceServiceRef.current?.isConnected()) {
        return;
      }
    }

    try {
      setIsListening(true);

      // Create audio recorder
      // Use file-based mode for Expo Go (real audio on iOS, placeholder on Android)
      // Set to false for test mode (generates test audio)
      recorderRef.current = new AudioRecorder({
        onChunk: (base64Chunk) => {
          // Send audio chunk to server
          voiceServiceRef.current.sendAudioChunk(base64Chunk);
        },
        onError: (error) => {
          console.error('[VoiceChatModal] Recording error:', error);
          addSystemMessage('Recording error: ' + error.message);
          setIsListening(false);
        }
      }, true); // true = useFileBased mode (real audio on iOS)

      await recorderRef.current.start();
    } catch (error) {
      console.error('[VoiceChatModal] Failed to start recording:', error);
      addSystemMessage('Failed to start recording');
      setIsListening(false);
      recorderRef.current = null;
    }
  }

  async function stopRecording() {
    if (!recorderRef.current) {
      return;
    }

    try {
      const uri = await recorderRef.current.stop();
      recorderRef.current = null;
      setIsListening(false);

      // Process and send the recorded audio
      if (uri && recorderRef.current) {
        // Note: The recorder might have been recreated, so check if it still exists
        // For now, audio chunks are sent during recording
      }
    } catch (error) {
      console.error('[VoiceChatModal] Failed to stop recording:', error);
      setIsListening(false);
      recorderRef.current = null;
    }
  }

  const connectionStatusText = 
    connectionStatus === 'connected' ? 'Connected' :
    connectionStatus === 'connecting' ? 'Connecting...' :
    'Disconnected';

  const statusColor = 
    connectionStatus === 'connected' ? '#10b981' :
    connectionStatus === 'connecting' ? '#f59e0b' :
    '#ef4444';

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <LinearGradient
            colors={['#f0fdf4', '#ecfdf5']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Voice Chat</Text>
              <TouchableOpacity onPress={() => onOpenChange(false)}>
                <X size={20} color="#134e4a" />
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.body}>
              {/* Microphone Button */}
              <TouchableOpacity
                onPress={handleToggleMic}
                disabled={!voiceServiceRef.current?.isConnected() || isSpeaking}
                style={[
                  styles.micButton, 
                  isListening && styles.micButtonActive,
                  (!voiceServiceRef.current?.isConnected() || isSpeaking) && styles.micButtonDisabled
                ]}
                activeOpacity={0.8}
              >
                {isSpeaking ? (
                  <Volume2 size={64} color="#134e4a" />
                ) : isListening ? (
                  <Mic size={64} color="#134e4a" />
                ) : (
                  <MicOff size={64} color="#9ca3af" />
                )}
              </TouchableOpacity>

              {/* Connection Status */}
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusText}>{connectionStatusText}</Text>
              </View>

              {/* Instructions */}
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  {isListening ? "I'm listening..." : 
                   isSpeaking ? "AI is speaking..." :
                   "Tap to speak"}
                </Text>
                <Text style={styles.subInstruction}>
                  {isListening 
                    ? "Share what's on your mind" 
                    : isSpeaking
                    ? "Please wait..."
                    : "Start talking about how you're feeling"
                  }
                </Text>
              </View>

              {/* Conversation Messages */}
              <ScrollView 
                style={styles.conversationBox}
                contentContainerStyle={styles.conversationContent}
              >
                {messages.length === 0 ? (
                  <Text style={styles.conversationPlaceholder}>
                    Your conversation will appear here
                  </Text>
                ) : (
                  messages.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.messageContainer,
                        msg.type === 'user' && styles.userMessage,
                        msg.type === 'assistant' && styles.assistantMessage,
                        msg.type === 'system' && styles.systemMessage
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.type === 'system' && styles.systemMessageText
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* Footer */}
            {showContinueButton && (
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => onOpenChange(false)}
                  style={styles.continueButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
    minHeight: 500,
    height: '85%',
  },
  gradient: {
    flex: 1,
    minHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: 18,
    fontWeight: '300',
    color: '#134e4a',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    minHeight: 400,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  micButtonActive: {
    backgroundColor: '#5eead4',
    shadowColor: '#5eead4',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#134e4a',
    marginBottom: 8,
  },
  subInstruction: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6b7280',
  },
  conversationBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    minHeight: 120,
    maxHeight: 200,
  },
  conversationPlaceholder: {
    fontSize: 14,
    fontWeight: '300',
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  conversationContent: {
    padding: 4,
  },
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#5eead4',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.2)',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#134e4a',
    lineHeight: 20,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(94, 234, 212, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#5eead4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#5eead4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#134e4a',
  },
});
