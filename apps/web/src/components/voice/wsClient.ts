import { ClientMessage, ServerMessage } from "./types";

export type VoiceWsClientOptions = {
  url?: string;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: ServerMessage) => void;
};

export class VoiceWsClient {
  private socket: WebSocket | null = null;
  private readonly options: VoiceWsClientOptions;

  constructor(options: VoiceWsClientOptions = {}) {
    this.options = options;
  }

  /**
   * 解析 WebSocket URL，支持相对路径
   * 如果 URL 以 / 开头，则基于当前页面协议和主机名构建完整 URL
   */
  private resolveWebSocketUrl(url: string): string {
    // 如果已经是完整的 WebSocket URL，直接返回
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return url;
    }

    // 处理相对路径
    if (url.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}${url}`;
    }

    // 如果格式不正确，回退到默认值
    return url;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    const url = this.resolveWebSocketUrl(this.options.url ?? "ws://localhost:8000/ws/voice");
    this.socket = new WebSocket(url);
    this.socket.binaryType = "arraybuffer";

    this.socket.addEventListener("open", () => {
      this.options.onOpen?.();
    });

    this.socket.addEventListener("close", (event) => {
      this.options.onClose?.(event);
    });

    this.socket.addEventListener("error", (event) => {
      this.options.onError?.(event);
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as ServerMessage;
        this.options.onMessage?.(payload);
      } catch (err) {
        console.error("Failed to parse server message", err, event.data);
      }
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }

  send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.socket.send(JSON.stringify(message));
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}


