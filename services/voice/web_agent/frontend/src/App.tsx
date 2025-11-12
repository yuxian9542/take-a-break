import { useCallback, useEffect, useRef, useState } from "react";

// Local imports
import { PcmPlayer } from "./audio/player";
import { MicRecorder } from "./audio/recorder";
import { VoiceWsClient } from "./api/wsClient";

function uuid(): string {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function App() {
  const [isActive, setIsActive] = useState(false); // Combined state: connected AND recording
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserText, setCurrentUserText] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false); // Track if AI is processing

  const wsRef = useRef<VoiceWsClient | null>(null);
  const recorderRef = useRef<MicRecorder | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldStopSendingRef = useRef(false); // Flag to stop sending audio (use ref for immediate access)

  // Add CSS animations for thinking state
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes thinking {
        0%, 100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.02);
        }
      }
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const isPlayingRef = useRef<boolean>(false);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize player
  useEffect(() => {
    playerRef.current = new PcmPlayer();
    return () => {
      playerRef.current?.dispose();
    };
  }, []);

  const startChat = useCallback(async () => {
    if (isActive) return;

    // Connect WebSocket
    const client = new VoiceWsClient({
      onOpen: () => {
        console.log("WebSocket connected");
        // Set language to auto-detect (null)
        client.send({ type: "control", action: "set_language", language: null });
        setMessages([]);
        setCurrentUserText("");
      },
      onClose: () => {
        console.log("WebSocket closed");
        setIsActive(false);
        stopRecording();
      },
      onMessage: (msg) => {
        if (msg.type === "reply_audio_chunk") {
          if (msg.isLast) {
            setIsSpeaking(false);
            isPlayingRef.current = false;
            setIsAIThinking(false);
            setCurrentUserText("");
            shouldStopSendingRef.current = false; // Resume sending audio for next turn
          } else if (msg.data) {
            if (!isPlayingRef.current) {
              playerRef.current?.resetSchedule();
              isPlayingRef.current = true;
            }
            setIsSpeaking(true);
            setIsAIThinking(false);
            playerRef.current?.playBase64Pcm(msg.data);
          }
        } else if (msg.type === "speech_started") {
          setCurrentUserText("Listening...");
          setIsAIThinking(false);
        } else if (msg.type === "asr_start") {
          shouldStopSendingRef.current = true; // Stop sending audio chunks immediately
          setCurrentUserText("Transcribing...");
          setMessages(prev => [...prev, {
            role: "user",
            text: "🎤 Transcribing...",
            timestamp: new Date()
          }]);
        } else if (msg.type === "asr_complete") {
          setMessages(prev => {
            const firstTranscribingIndex = prev.findIndex(
              m => m.role === "user" && m.text === "🎤 Transcribing..."
            );
            if (firstTranscribingIndex !== -1) {
              const updated = [...prev];
              updated[firstTranscribingIndex] = {
                ...updated[firstTranscribingIndex],
                text: msg.text
              };
              return updated;
            }
            return prev;
          });
        } else if (msg.type === "glm_start") {
          setCurrentUserText("AI thinking...");
          setIsAIThinking(true);
          setMessages(prev => [...prev, {
            role: "assistant",
            text: "🤔 AI thinking...",
            timestamp: new Date()
          }]);
        } else if (msg.type === "glm_complete") {
          setMessages(prev => {
            const firstThinkingIndex = prev.findIndex(
              m => m.role === "assistant" && m.text === "🤔 AI thinking..."
            );
            if (firstThinkingIndex !== -1) {
              const updated = [...prev];
              updated[firstThinkingIndex] = {
                ...updated[firstThinkingIndex],
                text: msg.text
              };
              return updated;
            }
            return prev;
          });
        }
      },
      onError: (err) => console.error("WebSocket error:", err)
    });

    client.connect();
    wsRef.current = client;

    // Start recording
    playerRef.current?.resetSchedule();

    const recorder = new MicRecorder({
      onChunk: (base64Chunk) => {
        if (!shouldStopSendingRef.current) {
          wsRef.current?.send({
            type: "audio_chunk",
            chunkId: uuid(),
            data: base64Chunk
          });
        }
      },
      onError: (err) => console.error("Recorder error:", err)
    });

    await recorder.start();
    recorderRef.current = recorder;
    setIsActive(true);
    setCurrentUserText("Listening...");
    console.log("Chat started - microphone active");
  }, [isActive]);

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const endChat = useCallback(() => {
    if (!isActive) return;

    // Stop recording
    stopRecording();
    
    // Stop audio playback
    playerRef.current?.resetSchedule();
    setIsSpeaking(false);
    
    // Close WebSocket
    wsRef.current?.disconnect();
    wsRef.current = null;
    
    // Clear state
    setIsActive(false);
    setMessages([]);
    setCurrentUserText("");
    isPlayingRef.current = false;
    
    console.log("Chat ended");
  }, [isActive]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎤 GLM-4-Voice Chat</h1>
        <p style={styles.subtitle}>Simple voice conversation with AI</p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Avatar */}
        <div style={styles.avatarContainer}>
          <div style={{
            ...styles.avatar,
            ...(isSpeaking ? styles.avatarSpeaking : {}),
          }}>
            🤖
          </div>
          <div style={styles.statusText}>
            {!isActive && "Ready to chat"}
            {isActive && !isSpeaking && "Listening..."}
            {isActive && isSpeaking && "Speaking..."}
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 && !isActive && (
            <div style={styles.emptyState}>
              Click "Start Chat" to begin
            </div>
          )}
          {messages.map((msg, idx) => {
            const isThinking = msg.text.includes("🤔") || msg.text.includes("Transcribing");
            return (
              <div
                key={idx}
                style={{
                  ...styles.messageBubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                  ...(isThinking && msg.role === "assistant" ? styles.thinkingBubble : {}),
                }}
              >
                <div style={styles.messageRole}>
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div style={styles.messageText}>{msg.text}</div>
              </div>
            );
          })}
          {currentUserText && (
            <div style={styles.listeningIndicator}>{currentUserText}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          {/* Main Buttons */}
          <div style={styles.buttonGroup}>
            {!isActive ? (
              <button
                onClick={startChat}
                style={{ ...styles.button, ...styles.startButton }}
              >
                🎙️ Start Chat
              </button>
            ) : (
              <button
                onClick={endChat}
                style={{ ...styles.button, ...styles.endButton }}
              >
                ⏹️ End Chat
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    background: "rgba(255, 255, 255, 0.95)",
    padding: "1.5rem 2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    textAlign: "center" as const,
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    color: "#333",
  },
  subtitle: {
    margin: "0.5rem 0 0 0",
    fontSize: "1rem",
    color: "#666",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    padding: "2rem",
    gap: "2rem",
    maxWidth: "800px",
    width: "100%",
    margin: "0 auto",
  },
  avatarContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "1rem",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "4rem",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  },
  avatarSpeaking: {
    animation: "pulse 1s infinite",
    boxShadow: "0 4px 30px rgba(102, 126, 234, 0.6)",
  },
  statusText: {
    fontSize: "1.2rem",
    color: "white",
    fontWeight: 500 as const,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  messagesContainer: {
    flex: 1,
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    padding: "1.5rem",
    overflowY: "auto" as const,
    minHeight: "300px",
    maxHeight: "400px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  emptyState: {
    textAlign: "center" as const,
    color: "#999",
    fontSize: "1.1rem",
    padding: "3rem",
  },
  messageBubble: {
    marginBottom: "1rem",
    padding: "1rem",
    borderRadius: "12px",
    maxWidth: "80%",
  },
  userBubble: {
    background: "#667eea",
    color: "white",
    marginLeft: "auto",
    textAlign: "right" as const,
  },
  assistantBubble: {
    background: "#f0f0f0",
    color: "#333",
    marginRight: "auto",
  },
  messageRole: {
    fontSize: "0.8rem",
    fontWeight: 600 as const,
    marginBottom: "0.3rem",
    opacity: 0.8,
  },
  messageText: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  thinkingBubble: {
    background: "linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)",
    animation: "thinking 1.5s ease-in-out infinite",
    border: "2px solid #667eea",
  },
  listeningIndicator: {
    color: "#999",
    fontStyle: "italic" as const,
    textAlign: "center" as const,
    padding: "1rem",
  },
  controls: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "center",
  },
  button: {
    padding: "1rem 2.5rem",
    fontSize: "1.2rem",
    fontWeight: 600 as const,
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  startButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },
  endButton: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "white",
  },
};

