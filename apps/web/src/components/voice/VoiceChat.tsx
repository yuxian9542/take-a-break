import { useCallback, useEffect, useRef, useState } from "react";
import { PcmPlayer } from "./player";
import { MicRecorder } from "./recorder";
import { VoiceWsClient } from "./wsClient";
import "./VoiceChat.css";

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

interface VoiceChatProps {
  wsUrl: string;
  systemPrompt?: string;
}

export function VoiceChat({ wsUrl, systemPrompt }: VoiceChatProps) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserText, setCurrentUserText] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<VoiceWsClient | null>(null);
  const recorderRef = useRef<MicRecorder | null>(null);
  const playerRef = useRef<PcmPlayer | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldStopSendingRef = useRef(false);
  const isPlayingRef = useRef<boolean>(false);
  const systemPromptRef = useRef<string | null>(systemPrompt?.trim() ? systemPrompt.trim() : null);
  const lastSentPromptRef = useRef<string | null>(null);

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

  useEffect(() => {
    const trimmed = systemPrompt?.trim() ?? null;
    systemPromptRef.current = trimmed && trimmed.length > 0 ? trimmed : null;

    if (!systemPromptRef.current) {
      lastSentPromptRef.current = null;
      return;
    }

    const client = wsRef.current;
    if (client && client.isConnected() && lastSentPromptRef.current !== systemPromptRef.current) {
      try {
        client.send({
          type: "control",
          action: "set_system_prompt",
          prompt: systemPromptRef.current
        });
        lastSentPromptRef.current = systemPromptRef.current;
      } catch (err) {
        console.error("Failed to send updated system prompt.", err);
      }
    }
  }, [systemPrompt]);

  const startChat = useCallback(async () => {
    if (isActive) return;

    setConnectionError(null);

    // Connect WebSocket
    const client = new VoiceWsClient({
      url: wsUrl,
      onOpen: () => {
        console.log("WebSocket connected");
        // Set language to auto-detect (null)
        client.send({ type: "control", action: "set_language", language: null });
        if (systemPromptRef.current) {
          client.send({
            type: "control",
            action: "set_system_prompt",
            prompt: systemPromptRef.current
          });
          lastSentPromptRef.current = systemPromptRef.current;
        }
        setMessages([]);
        setCurrentUserText("");
        setConnectionError(null);
      },
      onClose: () => {
        console.log("WebSocket closed");
        setIsActive(false);
        stopRecording();
        lastSentPromptRef.current = null;
      },
      onMessage: (msg) => {
        if (msg.type === "reply_audio_chunk") {
          if (msg.isLast) {
            setIsSpeaking(false);
            isPlayingRef.current = false;
            setIsAIThinking(false);
            setCurrentUserText("");
            shouldStopSendingRef.current = false;
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
          shouldStopSendingRef.current = true;
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
      onError: (err) => {
        console.error("WebSocket error:", err);
        setConnectionError("Failed to connect to voice backend. Make sure it's running on " + wsUrl);
      }
    });

    try {
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
    } catch (err) {
      console.error("Failed to start chat:", err);
      setConnectionError("Failed to access microphone. Please grant permission.");
      client.disconnect();
    }
  }, [isActive, wsUrl]);

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
    lastSentPromptRef.current = null;
    
    console.log("Chat ended");
  }, [isActive]);

  return (
    <div className="voice-chat">
      <header className="voice-chat-header">
        <h3>🎤 Live Voice Chat</h3>
        <p>Talk to AI companion</p>
      </header>

      <div className="voice-chat-main">
        {/* Avatar */}
        <div className="voice-avatar-container">
          <div className={`voice-avatar ${isSpeaking ? "voice-avatar--speaking" : ""}`}>
            🤖
          </div>
          <div className="voice-status-text">
            {!isActive && "Ready to chat"}
            {isActive && !isSpeaking && "Listening..."}
            {isActive && isSpeaking && "Speaking..."}
          </div>
        </div>

        {/* Messages */}
        <div className="voice-messages">
          {messages.length === 0 && !isActive && (
            <div className="voice-empty-state">
              Click "Start Chat" to begin
            </div>
          )}
          {connectionError && (
            <div className="voice-error-message">
              {connectionError}
            </div>
          )}
          {messages.map((msg, idx) => {
            const isThinking = msg.text.includes("🤔") || msg.text.includes("Transcribing");
            return (
              <div
                key={idx}
                className={`voice-message ${msg.role === "user" ? "voice-message--user" : "voice-message--assistant"} ${isThinking ? "voice-message--thinking" : ""}`}
              >
                <div className="voice-message-role">
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div className="voice-message-text">{msg.text}</div>
              </div>
            );
          })}
          {currentUserText && (
            <div className="voice-listening-indicator">{currentUserText}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="voice-controls">
          {!isActive ? (
            <button
              onClick={startChat}
              className="voice-button voice-button--start"
            >
              🎙️ Start Chat
            </button>
          ) : (
            <button
              onClick={endChat}
              className="voice-button voice-button--end"
            >
              ⏹️ End Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



