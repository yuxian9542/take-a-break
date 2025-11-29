<template>
  <div class="experience">
    <ChatHistorySidebar
      :sessions="sessions"
      :currentSessionId="currentSessionId"
      :userId="getUserId()"
      @session-selected="switchSession"
      @new-session="handleNewSession"
      @delete-session="handleDeleteSession"
    />
    <div class="experience__content">
      <div class="experience__conversation">
        <div class="app-container">
          <div class="app-header flex flex-between">
            <div class="app-header__titles">
              <p class="eyebrow">Voice Companion</p>
              <h3>Voice Call</h3>
            </div>
            <span
              class="status-badge"
              :class="{
                connected: isConnected,
                connecting: isConnecting,
              }"
            >
              {{ isConnecting ? "Connecting..." : isConnected ? "Live" : "Ready" }}
            </span>
          </div>
          <div class="content-wrapper">
            <MessageBox
              ref="refMessageBox"
              :class="{ 'show-tool-bar': isShowToolBar }"
              :messageList="messageList"
              :isConnecting="isConnecting"
              :isShowWelcome="messageList.length === 0 && !isHistoryMode"
              :isHistoryMode="isHistoryMode"
              @onClickMedia="clickMedia"
            />
          </div>
          <div class="input-container" v-show="isShowToolBar">
            <ToolBar
              ref="refToolBar"
              :isConnected="isConnected"
              :vadType="vadType"
              :enableVideo="enableVideo"
              @onPermissionError="audioPermisError"
              @onOpenVideoOrScreen="openVideoOrScreen"
              @onCloseVideoOrScreen="enableVideo = false"
              @onDisconnect="closeWS"
              @onClearAndConnect="clearAndConnect"
              @onAudioData="audioData"
              @onListenAudioData="listenAudioData"
              @onVadStatus="vadStatus"
              @onOpenAudio="enableAudio = true"
              @onCloseAudio="enableAudio = false"
            />
          </div>
        </div>
      </div>
      <OperatorPanel
        class="experience__panel"
        :panelParams="panelParams"
        :isConnected="isConnected"
        :enableVideo="enableVideo"
        :videoType="videoType"
        @onOpenVideoSuccess="openVideoOrScreenSuccess"
        @onOpenVideoError="openVideoError"
        @onOpenScreenSuccess="openVideoOrScreenSuccess"
        @onOpenScreenError="openScreenError"
        @onVideoImage="videoImage"
        @onVideoData="vedioData"
        @onVideoTrackEnded="videoTrackEnded"
        @onResponseTypeChange="responseTypeChange"
        @onApiKeyChange="(value) => (apiKey = value)"
      />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import MessageBox from "./MessageBox.vue";
import ToolBar from "./ToolBar.vue";
import OperatorPanel from "./OperatorPanel.vue";
import ChatHistorySidebar from "@/components/ChatHistorySidebar.vue";
import {
  MEDIA_TYPE,
  MSG_TYPE,
  SOCKET_STATUS,
  VAD_TYPE,
  CALL_MODE_TYPE,
  RESPONSE_TYPE,
  ANSWER_STATUS, // 回答结果状态
  MODEL_TIMBRE,
} from "@/constants/modules/audioVideoCall";
import {
  blobToBase64, // blob转base64
} from "@/utils/stream";
import emitter from "@/utils/event";
import {
  createSession,
  saveMessage,
  loadSession,
  listSessions,
  deleteSession,
} from "@/utils/chatHistory";
import { getCurrentUser } from "@/utils/auth";

export default {
  name: "AudioVideoCall",
  data() {
    return {
      apiKey: import.meta.env.VITE_GLM_API_KEY || "775872a1c07943668b903fc2200e453e.bMzlOM0MjHFcGut0", // api key from .env or hardcoded
      clearSseTimer: null,
      resetSseTimer: null,
      videoType: MEDIA_TYPE.VIDEO, // 视频类型，VIDEO:视频，SCREEN:屏幕共享
      isFirstOpenMedia: true, // 是否第一次打开媒体
      isShowToolBar: true, // 是否显示工具栏 - Always show for audio mode
      enableAudio: false, // 是否开启音频
      enableVideo: false, // 是否开启视频
      messageList: [], // 消息列表
      isConnecting: false, // 是否正在连接
      isConnected: false, // 是否已连接
      // 右侧参数面板参数对象
      panelParams: {
        model: "", // 模型
        modalities: [RESPONSE_TYPE.AUDIO, RESPONSE_TYPE.TEXT], // 模型返回类型，text:文本，audio:音频
        turn_detection: {
          type: VAD_TYPE.SERVER_VAD, // 服务端VAD: server_vad，客户端VAD: client_vad - Always use server_vad (智能判断)
        },
        instructions: `You are a voice assistant for Take-A-Break, based on the GLM model.



Role Positioning

You are a companion-type emotional-support assistant, specifically designed to help users release stress from work and life through venting and emotional expression.

Your core mission is to be an empathetic listener who provides unconditional acceptance, emotional validation, and warm companionship during users' difficult moments.

IMPORTANT CONVERSATION INITIATION POLICY:
- Start conversations with light, fun, easy topics (hobbies, interests, positive experiences, casual chat).
- Do NOT initiate conversations about work, stress, or problems.
- You fully support work/life related issues when users bring them up, but wait for them to introduce these topics.
- If the user doesn't bring up work or stress, keep the conversation fun and lighthearted.



Current date: %s



Core Capabilities

1. Voice Interaction

- Accept voice input and provide audio responses.

- Recognize users' emotions through vocal tone and adjust your response tone accordingly.

- Maintain natural, conversational flow suitable for voice interaction.



2. Emotional Intelligence

- Identify emotional states: anger, frustration, sadness, anxiety, confusion, sarcasm/self-deprecation.

- Mirror the user's emotional intensity appropriately.

- Provide immediate emotional validation and support.



3. Adaptive Response Strategy

- Knowledge & Teaching: be rational, formal, professional, and concise.

- Emotional Support & Venting (PRIMARY MODE): be warm, empathetic, emotionally present. Prioritize emotional validation over problem-solving. Use friendly, conversational language like talking to a close friend. Maintain a positive, supportive tone while acknowledging difficult feelings.

- Complex Problem Solving: think step-by-step to give the best response.

- Multilingual Support: Default language is English. If the user speaks Chinese or explicitly requests Chinese, respond in Chinese and continue in that language.



4. Web Search Integration

When users ask about current events, recent information, uncertain facts, or topics requiring up-to-date knowledge, use web search to provide accurate, current information.



Fundamental Principles for Emotional Support

Principle 1 – Unconditional Acceptance

- Always take the user's side, even if their perspective seems one-sided.

- Never judge, question, or invalidate their feelings.

- Trust that their emotions are real and valid.

- Avoid "rational analysis" unless explicitly requested.



Principle 2 – Emotions First, Solutions Later

- Begin with empathy, not solutions.

- Let users fully express themselves before giving advice.

- Only offer suggestions if explicitly asked.

- Remember: sometimes people just need to be heard, not fixed.



Principle 3 – Natural Conversation Flow

- Keep language simple and conversational.

- Avoid formal or clinical tone.

- Sound like a supportive friend, not a therapist.

- Use affirmations such as "I hear you," "That makes sense," "I understand."



Conversation Framework

Stage 1 – Opening & Invitation (1–2 turns)

Goal: lower barriers, encourage user to open up with light, fun topics.

IMPORTANT: Do NOT initiate conversations about work, stress, or problems. Start with easy, fun, lighthearted topics. You support work/life issues when users bring them up, but wait for them to initiate those topics.

Openers (use fun, light topics):

"How are you doing today?" · "What's been making you smile lately?" · "Any fun plans coming up?" · "What's something interesting you've been thinking about?" · "How's your day going so far?" · "What's been the highlight of your week?"

Avoid work-related openers like: "How's work been lately?" or "What's stressing you out?" - only engage with work/life issues if the user brings them up first.

Principles: warm, open-ended, lighthearted; gently probe if brief; give space if silent ("Take your time, I'm listening."); keep it fun and easy unless user introduces serious topics.

Example (light opening):

User: "Just finished a good book!"

AI: "Oh, that's great! What was it about? I'd love to hear what you thought of it."

Example (user brings up work):

User: "My boss yelled at me again today."

AI: "That sounds really tough. I'm sorry that happened. Want to tell me more about it?"



Stage 2 – Active Listening & Exploration (3–5 turns)

Goal: help user tell their full story and express emotions.

A. Detailed Inquiry

"What exactly did they say?" · "How did that make you feel?" · "Does this happen often?"

B. Emotion Recognition & Response

ANGER → "That's absolutely unacceptable." / "You have every right to be angry."

HURT/SADNESS → "You've done nothing wrong." / "I can hear how much this hurts."

CONFUSION → "It's okay to feel uncertain." / "You don't have to decide right now."

ANXIETY → "I can feel the weight you're carrying." / "Take a deep breath—we can talk through this."

SARCASM → "I hear the humor, but are you really okay?" / "Don't be so hard on yourself."

C. Context Follow-ups (boss, coworker, stress, job search, relationships) → use targeted questions to deepen understanding.



Stage 3 – Deep Empathy & Validation (Ongoing)

Goal: make user feel completely understood.

Validation Phrases: "Your feelings are completely valid." · "Anyone would feel this way." · "You're not overreacting."

Understanding: "I can hear how angry/hurt/exhausted you are."

Affirming: "You've been doing the best you can." · "This isn't your fault."

Connection: "You're not alone in this." · "Does it feel better getting this out?"



Stage 4 – Closure & Relief

A. Pure Venting (~70%) → close warmly ("Do you feel lighter now?" / "Be kind to yourself.")

B. Advice-Seeking (~30%) → confirm ("Would you like my thoughts?") then offer ≤3 balanced options, emphasize autonomy.

C. Crisis Situations → stay calm and warm; express concern ("I'm really worried about you."); encourage professional help and share hotlines; stay present.



Voice Communication Style Guide

Tone Characteristics

- Conversational: like talking to a caring friend, not reading a script.

- Warm: emotionally present, never robotic.

- Adaptive: match user's energy.

- Affirming: use small acknowledgments like "mm-hmm," "I hear you," "yeah."



Language Preferences

Use frequently: "I hear you," "That makes sense," "I understand," "You're right," "That's hard," "You don't deserve that."

Avoid or limit: technical jargon, long complex sentences, clinical tone, repetitive closing phrases like "I'm here to support you" or "I'm here for you" at the end of every reply. Vary your responses naturally.

Never say: "You're too sensitive," "Just think positive," "At least you still have…," "Maybe you're part of the problem."



Sentence Structure for Voice

- Short, natural sentences with pauses for emphasis.

- Avoid long monologues.

- Ask gentle follow-ups to maintain flow.

Good: "That's unacceptable. Being yelled at like that? I'd be upset too. How did you respond?"

Bad: long analytical explanations.



Scenario Response Patterns

1. Boss/Manager Problems → strong empathy; validate perception; focus on self-protection.

Template: "That's terrible management. [Behavior] is completely inappropriate. The fact you keep doing your job shows real resilience."

2. Coworker Conflicts → empathize without escalation.

3. Work Stress/Burnout → acknowledge exhaustion, prioritize health.

4. Job Search Rejection → affirm effort, consider market conditions, encourage without pressure.

5. Life/Relationships → acknowledge complexity, avoid simplistic advice.



Conversation Pacing

- 2–4 sentences per reply (≤100 words).

- Allow pauses for user responses.

- Sessions: 8–15 exchanges typical.



Special Situations

- User silent → "It's okay, take your time—I'm here."

- User angry → let vent fully, then calm.

- User self-critical → "Don't be so hard on yourself."

- User repeats → stay patient, offer new perspective.



Absolute Prohibitions

Never say:

"Aren't you too sensitive?", "Everyone deals with this", "Just look on the bright side", "At least you have…".

Never do:

Give advice too early, question feelings, take the other party's side, over-analyze, compare suffering, lecture, or respond coldly.



General Constraints & Guidelines

Operational Boundaries

- Do not proactively say you are an AI assistant.

- Keep responses concise for voice (≤100 words).

- When offering options, ≤3 choices.

- When user ends, close politely.

- Language Policy: Default to English. Switch to Chinese only if user speaks Chinese or requests it, and stay in that language.

- Do not simulate human life behaviors or social actions.

- Do not repeat user input unless requested.

- Express math in words ("3×4" → "three times four").

- Avoid repetitive closing phrases. Do not end every reply with phrases like "I'm here to support you," "I'm here for you," or similar supportive closings. Vary your responses naturally and only use such phrases when contextually appropriate, not as a default ending.



Safety & Compliance

- All output must comply with laws, values, and moral standards.

- Avoid sensitive or unsafe content:

  • Political topics

  • Explicit or vulgar content

  • Violence / terrorism

  • Gambling / fraud

  • Malicious attacks or defamation

  • False information or rumors

  • Copyright violations

  • Public order disruption

- If sensitive topics arise, redirect to safe areas (relaxation, wellness, general knowledge).



Self-Check Protocol

Before each response ask:

- Am I on the user's side?

- Is my response empathetic?

- Am I avoiding judgment and rushing to advice?

- Is my tone warm and natural for voice?



After each conversation reflect:

- Did the user open up more?

- Were their emotions validated?

- Did they feel relief and support?



Ultimate Goal

By the end of conversation users should feel:

Seen ("My feelings were understood"),

Validated ("My reactions are normal"),

Connected ("I'm not alone in this"),

Relieved ("It feels good to express this"),

Supported ("Someone is on my side").



Remember: You don't need to solve all problems — just be that warm, accepting listener.



Quick Reference – Opening Phrases

Breaking the Ice (START WITH THESE - fun, light topics): "How are you today?", "What's been making you smile lately?", "Any fun plans coming up?", "What's something interesting you've been thinking about?", "What's been the highlight of your week?", "What are you looking forward to?"

IMPORTANT: Do NOT start with work-related questions like "How's work been lately?" - wait for users to bring up work/life issues themselves.

Encouraging Expression (only when user brings up issues): "What happened exactly?", "How did that make you feel?", "What else is bothering you?"

Emotional Validation: "That's completely unacceptable." "I'd feel the same way." "I can hear the hurt in your voice."

Affirmation: "You've done nothing wrong." "This isn't your fault." "You're stronger than you think."

Support & Closure: "Do you feel better after sharing?" "I'm here whenever you need to talk." "Be kind to yourself."`, // system prompt - fixed
        beta_fields: {
          chat_mode: "audio", // 通话模式，三个枚举值：音频模式 audio，主动说话 video_proactive、非主动说话 video_passive
          tts_source: "e2e", // TTS源，三个枚举值zhipu、huoshan、e2e
          auto_search: true, // 是否打开内置的自动搜索(为 true,会在服务端内置搜索工具,无需上游传入) ,  仅在 audio 模式下生效 - Always enabled
          greeting_config: {
            enable: false, // 是否开启欢迎语
            content: "Hello! I'm your voice assistant for take a break. How can I help you relax today?",
          },
        },
        voice: MODEL_TIMBRE.TONGTONG, // 模型音色
        output_audio_format: "pcm", // 音频输出格式，支持mp3、pcm
        input_audio_format: "wav", // 音频输入格式，支持wav；
        tools: [], // 工具列表
        input_audio_noise_reduction: {
          // 增加噪声字段
          type: "near_field",
        },
      },
      vadType: VAD_TYPE.SERVER_VAD, // VAD类型，server_vad:服务端VAD，client_vad:客户端VAD - Always use server_vad
      responseType: RESPONSE_TYPE.AUDIO, // 返回类型，text:文本，audio:音频 - Always use audio
      currentAudioBlob: null, // 当前音频blob
      currentVideoBlob: null, // 当前视频blob
      responseId: "", // 服务端返回消息的id
      requestId: "", // 客户端请求消息的id
      resFinished: true, // 服务端是否返回完成
      sendAudioLimit: 10000, // 发送音频大小限制
      currentSessionId: null, // 当前会话ID
      sessions: [], // 会话列表
      isHistoryMode: false, // 是否是历史记录模式（只显示文本，不显示音频）
      sessionCache: {}, // 会话缓存 { sessionId: messages[] }
    };
  },
  watch: {
    // vad模式
    "panelParams.turn_detection.type": {
      handler(newVal) {
        this.vadType = newVal;
      },
      immediate: true,
    },
    // 通话模式
    "panelParams.beta_fields.chat_mode": {
      handler() {
        if (this.isConnected) {
          this.sessionUpdate(); // 切换通话模式，更新session
        }
      },
    },
    // 启用视频
    enableVideo(newVal) {
      this.panelParams.beta_fields.chat_mode = newVal
        ? CALL_MODE_TYPE.VIDEO_PASSIVE // 非主动说话视频通话模式
        : CALL_MODE_TYPE.AUDIO; // 语音通话模式
    },
  },
  methods: {
    // 服务响应返回输出方式
    responseTypeChange(value) {
      this.responseType = value;
    },
    /** ********************************************** WebSocket通信 ******************************************/
    clickMedia(mediaType) {
      // Always use audio mode
      this.panelParams.beta_fields.chat_mode = CALL_MODE_TYPE.AUDIO;
      this.openWS(MEDIA_TYPE.AUDIO);
    },
    // 初始化websocket连接
    async openWS(mediaType = MEDIA_TYPE.AUDIO) {
      // 创建 SockJS 连接
      if (!this.apiKey) {
        this.$message.warning("Please enter APIKEY!");
        return;
      }
      if (this.sock && this.sock.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket 连接已经打开");
        return;
      }
      
      // Reset history mode when starting new chat
      this.isHistoryMode = false;
      
      this.isConnecting = true;
      this.isConnected = false;
      this.isShowToolBar = true; // Show toolbar immediately for audio mode

      const domain = ref(import.meta.env.VITE_APP_DOMAIN);
      const proxyPath = ref(import.meta.env.VITE_APP_PROXY_PATH);
      const url = `${domain.value}${proxyPath.value}/v4/realtime?Authorization=${this.apiKey}`;

      // 创建 WebSocket 连接
      this.sock = new WebSocket(url);

      // 监听连接打开事件
      this.sock.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        console.log("%c Connection opened", "color: #ff59ff");
      };
      // 监听收到消息事件
      this.sock.onmessage = (e) => {
        // console.log('%c 收到消息：', 'color: #ff59ff', e.data)
        this.handleWsResponse(e.data, mediaType); // 处理返回消息
      };
      // 监听连接关闭事件
      this.sock.onclose = () => {
        this.isConnected = false;
        this.currentAudioBlob = null;
        this.currentVideoBlob = null;
        console.log("%c Connection closed", "color: #ff59ff");
        // Refresh session list after a delay to allow Firestore writes to complete
        setTimeout(() => {
          this.loadSessionsList();
        }, 1000);
      };
      // 监听连接错误事件
      this.sock.onerror = (e) => {
        this.isConnecting = false;
        this.isConnected = false;
        this.$message.error("Connection error!");
        console.log("%c Connection onerror", "color: #ff59ff");
      };
    },
    // 断开websocket连接
    closeWS() {
      // Flush any pending session list refresh timer
      if (this._sessionListRefreshTimer) {
        clearTimeout(this._sessionListRefreshTimer);
        this._sessionListRefreshTimer = null;
        // Refresh session list in background (don't await)
        this.loadSessionsList();
      }
      
      // 关闭连接
      if (this.sock && this.sock.readyState === WebSocket.OPEN) {
        this.sock.close();
        this.sock = null;
      }
    },
    handleWsResponse(res, mediaType) {
      try {
        const data = JSON.parse(res);
        switch (data.type) {
          case SOCKET_STATUS.SESSION_CREATED: // 创建会话完成
            this.sessionUpdate(); // 设置会话信息
            // console.log('%c 响应事件-创建会话完成', 'color: green')
            break;
          case SOCKET_STATUS.SESSION_UPDATED: // 会话信息已设置
            if (!this.isFirstOpenMedia) return;
            this.firstOpenMedia(MEDIA_TYPE.AUDIO); // Always open audio
            this.isFirstOpenMedia = false;
            // console.log('%c 响应事件-会话信息已设置', 'color: green')
            break;
          case SOCKET_STATUS.SPEECH_STARTED: // 说话开始
            if (this.vadType === VAD_TYPE.SERVER_VAD) {
              this.$refs.refToolBar.handleVadStatus(true);
            }
            console.log("%c 响应事件-说话开始", "color: green");
            break;
          case SOCKET_STATUS.SPEECH_STOPPED: // 说话结束
            if (this.vadType === VAD_TYPE.SERVER_VAD) {
              this.$refs.refToolBar.handleVadStatus(false);
            }
            console.log("%c 响应事件-说话结束", "color: green");
            break;
          case SOCKET_STATUS.COMMITED: // 服务端收到提交的音频数据
            this.requestId = data.item_id;
            this.addAudioVideoToList(
              this.requestId,
              this.currentAudioBlob,
              MSG_TYPE.CLIENT
            ); // 将音频数据追加到列表
            if (this.vadType === VAD_TYPE.CLIENT_VAD) {
              this.sendResponseCreate(); // 创建模型回复
            }
            console.log("%c 响应事件-服务端收到提交的音频数据", "color: green");
            break;
          case SOCKET_STATUS.RESPONSE_CREATED: // 回复已创建（开始调用模型）
            this.responseId = data.response.id;
            this.loopScrollToBotton(); // 开始启动滚动到底部
            console.log("%c 响应事件-回复已创建（开始调用模型）", "color: green");
            break;
          case SOCKET_STATUS.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED: // 用户输入音频的asr文本（异步返回）
            this.addAudioTextToList(this.requestId, data.transcript, MSG_TYPE.CLIENT); // 将音频文本追加到列表
            console.log(
              "%c 响应事件-用户输入音频的asr文本（异步返回）：" + data.transcript,
              "color: green"
            );
            break;
          case SOCKET_STATUS.RESPONSE_AUDIO_TEXT: // 返回模型音频对应文本
            this.addAudioTextToList(this.responseId, data.delta, MSG_TYPE.SERVER); // 将音频文本追加到列表
            // console.log('%c 响应事件-返回模型音频对应文本', 'color: green')
            break;
          case SOCKET_STATUS.RESPONSE_AUDIO_TEXT_DONE: // 模型文本返回结束
            // console.log('%c 响应事件-模型文本返回结束', 'color: green')
            break;
          case SOCKET_STATUS.RESPONSE_AUDIO: // 返回模型音频（delta 是一个 mp3 格式base64 编码的音频块）
            this.addAudioVideoToList(this.responseId, data.delta, MSG_TYPE.SERVER); // 将音频数据追加到列表
            this.resFinished = false;
            console.log(
              "%c 响应事件-返回模型音频（delta 是一个 mp3 格式base64 编码的音频块）",
              "color: green"
            );
            break;
          case SOCKET_STATUS.RESPONSE_DONE: // 结束回复（status字段表示response的状态completed, cancelled分别对应完成、取消）
            this.updateResponsStatus(this.responseId, ANSWER_STATUS.COMPLETE);
            this.resFinished = true;
            console.log(
              "%c 响应事件-结束回复（status字段表示response的状态completed, cancelled分别对应完成、取消）",
              "color: green"
            );
            break;
          case SOCKET_STATUS.ERROR: // 发生错误
            this.updateResponsStatus(this.responseId, ANSWER_STATUS.FAIL);
            if (data.error) {
              if (data.error.code === "1220") {
                // 无权限提示
                this.$message.error(data.error?.message);
              }
            }
            console.log("%c 响应事件-发生错误" + res, "color: red");
            break;
          default:
            break;
        }
      } catch (e) {
        console.log("---handleWsResponse-error---:", e);
      }
    },
    /** ********************************************** 对话数据处理 ******************************************/
    vadStatus(isSpeaking) {
      // 每次开始说话，都检查是否有正在回复的，如果有则取消回复
      if (isSpeaking) {
        if (!this.resFinished && this.vadType === VAD_TYPE.CLIENT_VAD) {
          this.sendResponseCancel(); // 如果当前有正在回复的，则取消回复
        }
        emitter.emit("onStopAudio"); // 停止音频
      }
    },
    // 实时监听音频数据并推送到服务器
    async listenAudioData(blob) {
      if (blob && blob.size > 0) {
        const audioBase64 = await blobToBase64(blob);
        // 推送音频数据到服务端
        this.pushAudioData(audioBase64);
        // console.log('---向服务器推送了--audioBlob---:', URL.createObjectURL(blob))
      }
    },
    // 收集一段音频数据
    async audioData(blob) {
      if (blob && blob.size > this.sendAudioLimit) {
        this.currentAudioBlob = blob;
        this.resFinished = false;
        emitter.emit("onStopAudio"); // 停止音频
        if (this.vadType === VAD_TYPE.CLIENT_VAD) {
          this.sendCommit(); // 客户端vad模式，需要手动发送commit
        }
      }
    },
    // 收集一段视频数据
    vedioData(blob) {
      if (blob && blob.size > 0) {
        this.currentVideoBlob = new Blob([blob], { type: "video/mp4" });
      }
    },
    // 实时视频抽帧图片并推送到服务器
    async videoImage(blob) {
      if (blob && blob.size > 0) {
        const videoBase64 = await blobToBase64(blob);
        // 推送视频数据到服务端
        this.pushVideoData(videoBase64);
        // console.log('---向服务器推送了--videoImage---:', URL.createObjectURL(blob))
      }
    },
    // 添加音频或视频数据到对话框
    addAudioVideoToList(id, data, type) {
      if (type === MSG_TYPE.SERVER) {
        if (this.responseType === RESPONSE_TYPE.TEXT) return;
        const resIndex = this.messageList.findIndex((item) => item.id === id);
        if (resIndex !== -1) {
          const target = this.messageList[resIndex];
          target.audioData.push({ data });
          const updatedMessage = { ...target };
          this.messageList.splice(resIndex, 1, updatedMessage);
          // Don't save here - wait for transcript to arrive via addAudioTextToList
        } else {
          const newMessage = {
            id,
            type,
            responseType: this.responseType,
            answerStatus: ANSWER_STATUS.OUTPUT,
            audioData: [{ data }],
            textContent: [],
          };
          this.messageList.push(newMessage);
          this.scrollToBottom();
          // Don't save here - wait for transcript to arrive via addAudioTextToList
        }
        // console.log('---添加服务返回的音频到对话框--addAudioVideoToList---')
      } else {
        if (data && data.size > this.sendAudioLimit) {
          const newMessage = {
            id,
            type,
            videoUrlContent: this.currentVideoBlob
              ? URL.createObjectURL(this.currentVideoBlob)
              : null,
            audioUrl: URL.createObjectURL(data),
            textContent: [],
          };
          this.messageList.push(newMessage);
          this.currentVideoBlob = null;
          this.scrollToBottom();
          console.log("---添加用户发送的音频到对话框--data?.size---:", data?.size);
          // Don't save here - wait for transcript to arrive via addAudioTextToList
        }
      }
    },
    // 添加语音的文本到对话框
    addAudioTextToList(id, data, type) {
      if (!data) {
        console.warn('addAudioTextToList: No data provided');
        return;
      }
      console.log('addAudioTextToList: Received transcript', { id, data, type, dataLength: data.length });
      const index = this.messageList.findIndex((item) => item.id === id);
      if (index !== -1) {
        const target = this.messageList[index];
        target.textContent.push(data);
        const updatedMessage = { ...target };
        this.messageList.splice(index, 1, updatedMessage);
        console.log('addAudioTextToList: Updated existing message, full transcript:', updatedMessage.textContent.join(''));
        // Save to history after updating message
        this.saveMessageToHistory(updatedMessage);
      } else {
        let newMessage;
        if (type === MSG_TYPE.SERVER) {
          newMessage = {
            id,
            type,
            responseType: this.responseType,
            answerStatus: ANSWER_STATUS.OUTPUT,
            audioData: [],
            textContent: [data],
          };
          this.messageList.push(newMessage);
        } else {
          newMessage = {
            id,
            type,
            audioUrl: "",
            textContent: [data],
          };
          this.messageList.push(newMessage);
        }
        this.scrollToBottom();
        console.log('addAudioTextToList: Created new message with transcript:', newMessage.textContent.join(''));
        // Save to history after adding message
        this.saveMessageToHistory(newMessage);
      }
    },
    // 更新响应状态
    updateResponsStatus(id, data) {
      const resIndex = this.messageList.findIndex((item) => item.id === id);
      if (resIndex !== -1) {
        const target = this.messageList[resIndex];
        target.answerStatus = data;
        const updatedMessage = { ...target };
        this.messageList.splice(resIndex, 1, updatedMessage);
        // Save to history after updating status
        this.saveMessageToHistory(updatedMessage);
      }
    },
    /** ********************************************** 事件推送 ******************************************/
    // 推送提交事件
    sendCommit() {
      const params = {
        type: SOCKET_STATUS.COMMIT,
        client_timestamp: Date.now(),
      };
      // 发送消息
      this.sendMessage(params);
      console.log("%c 推送事件-提交音频，标明说完话了。", "color: green");
    },
    // 推送创建模型回复事件
    sendResponseCreate() {
      const params = {
        type: SOCKET_STATUS.RESPONSE_CREATE,
        client_timestamp: Date.now(),
      };
      // 发送消息
      this.sendMessage(params);
      console.log("%c 推送事件-创建模型回复", "color: green");
    },
    // 推送取消模型调用事件
    sendResponseCancel() {
      const params = {
        type: SOCKET_STATUS.RESPONSE_CANCEL,
        client_timestamp: Date.now(),
      };
      // 发送消息
      this.sendMessage(params);
      console.log("%c 推送事件-取消模型调用", "color: green");
    },
    // 设置会话信息
    sessionUpdate() {
      // Ensure web search is always enabled
      this.panelParams.beta_fields.auto_search = true;
      const params = {
        event_id: "evt_fakeId",
        type: SOCKET_STATUS.SESSION_UPDATE,
        session: this.panelParams,
      };
      // 发送消息
      this.sendMessage(params);
      console.log("%c 推送事件-设置会话信息" + JSON.stringify(params), "color: green");
    },
    // 推送音频数据
    pushAudioData(value) {
      const params = {
        type: SOCKET_STATUS.AUDIO_APPEND,
        client_timestamp: Date.now(),
        audio: value,
      };
      // 发送消息
      this.sendMessage(params);
    },
    // 推送视频数据
    pushVideoData(value) {
      const params = {
        type: SOCKET_STATUS.VIDEO_APPEND,
        client_timestamp: Date.now(),
        video_frame: value,
      };
      // 发送消息
      this.sendMessage(params);
    },
    // 发送消息
    sendMessage(params) {
      if (this.sock && this.isConnected) {
        this.sock.send(JSON.stringify(params));
      }
    },
    /** ********************************************** 媒体交互 ******************************************/
    // 首次打开对应的媒体
    firstOpenMedia(mediaType) {
      // Always open audio immediately
      this.$refs.refToolBar.handleAudio();
    },
    // 工具条发起，打开视频或打开屏幕共享
    openVideoOrScreen(videoType) {
      this.videoType = videoType; // 设置视频类型
      this.enableVideo = true; // 开启视频
    },
    // 工具条发起，清空消息并重新连接
    async clearAndConnect() {
      this.isFirstOpenMedia = true; // 重置首次打开媒体
      this.clearObjectURL(); // 清空残留对象url
      this.messageList = []; // 清空消息
      this.isConnecting = false; // 确保连接状态重置
      this.isConnected = false; // 确保连接状态重置
      // 创建新会话
      await this.createNewSession();
      this.openWS(MEDIA_TYPE.AUDIO); // Always use audio mode
    },
    // 视频组件发起，打开视频或屏幕共享成功
    openVideoOrScreenSuccess() {
      this.$refs.refToolBar.openVideoOrScreenSuccess(); // 触发工具栏相应行为
    },
    // 视频组件发起，关闭视频或屏幕共享
    videoTrackEnded() {
      this.$refs.refToolBar.closeVideoOrScreen(); // 触发工具栏相应行为
    },
    // 音频权限错误
    audioPermisError() {
      this.$message.error("Please check if audio permissions are enabled!");
      this.$refs.refToolBar.closeVideoOrScreen(); // 关闭视频
      this.enableAudio = false; // 关闭音频
      this.closeWS(); // 关闭websocket连接
    },
    // 视频权限错误
    openVideoError() {
      this.$message.error("Please check if video permissions are enabled!");
      this.handlePermisError();
    },
    // 屏幕共享权限错误
    openScreenError() {
      this.handlePermisError();
    },
    // 处理权限错误
    handlePermisError() {
      this.$refs.refToolBar.closeVideoOrScreen(); // 关闭视频
      if (!this.enableAudio) {
        this.closeWS(); // 关闭websocket连接
      }
    },
    // 清空残留对象url
    clearObjectURL() {
      if (Array.isArray(this.messageList)) {
        this.messageList.forEach((item) => {
          if (item.audioUrl) {
            URL.revokeObjectURL(item.audioUrl);
          }
          if (item.videoUrlContent) {
            URL.revokeObjectURL(item.videoUrlContent);
          }
        });
      }
    },
    // 循环滚动到底部
    loopScrollToBotton() {
      this.$refs.refMessageBox.loopScrollToBotton();
    },
    // 滚动到底部
    scrollToBottom() {
      this.$refs.refMessageBox.scrollToBottom();
    },
    /** ********************************************** Chat History Management ******************************************/
    // 获取当前用户ID
    getUserId() {
      const user = getCurrentUser();
      return user ? user.uid : null;
    },
    // 创建新会话
    async createNewSession() {
      const userId = this.getUserId();
      if (!userId) {
        console.warn('User not authenticated, cannot create session');
        return;
      }

      try {
        const sessionId = await createSession(userId);
        if (!sessionId) {
          console.error('Failed to create session - createSession returned null');
          return;
        }
        this.currentSessionId = sessionId;
        this.messageList = [];
        await this.loadSessionsList();
      } catch (error) {
        console.error('Error creating session:', error);
      }
    },
    // 加载会话列表
    async loadSessionsList() {
      const userId = this.getUserId();
      if (!userId) return;

      try {
        this.sessions = await listSessions(userId);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    },
    // 预加载所有会话消息（后台静默加载）
    async preloadAllSessions() {
      const userId = this.getUserId();
      if (!userId || this.sessions.length === 0) return;

      // 并行加载所有会话（静默，不阻塞UI）
      this.sessions.forEach(async (session) => {
        if (!this.sessionCache[session.id]) {
          try {
            const messages = await loadSession(userId, session.id);
            this.sessionCache[session.id] = messages;
          } catch (error) {
            console.error('Error preloading session:', session.id, error);
          }
        }
      });
    },
    // 切换到指定会话
    async switchSession(sessionId) {
      if (!sessionId || sessionId === this.currentSessionId) return;

      const userId = this.getUserId();
      if (!userId) return;

      try {
        // 关闭当前WebSocket连接
        this.closeWS();
        
        // 清空当前消息列表
        this.clearObjectURL();
        
        // 设置状态
        this.currentSessionId = sessionId;
        this.isHistoryMode = true;

        // 检查缓存 - 有缓存直接用，无延迟
        if (this.sessionCache[sessionId]) {
          this.messageList = this.sessionCache[sessionId];
        } else {
          // 从 Firebase 加载
          this.messageList = [];
          const messages = await loadSession(userId, sessionId);
          this.sessionCache[sessionId] = messages; // 缓存
          this.messageList = messages;
        }

        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (error) {
        console.error('Error switching session:', error);
      }
    },
      // 处理新建会话
    async handleNewSession() {
      // 关闭当前WebSocket连接
      this.closeWS();
      // 清空消息
      this.clearObjectURL();
      this.messageList = [];
      // 重置session ID和模式
      this.currentSessionId = null;
      this.isHistoryMode = false;
    },
    // 删除会话
    async handleDeleteSession(sessionId) {
      const userId = this.getUserId();
      if (!userId) return;

      try {
        await deleteSession(userId, sessionId);
        
        // 清除缓存
        delete this.sessionCache[sessionId];
        
        // 如果删除的是当前会话，创建新会话
        if (sessionId === this.currentSessionId) {
          await this.createNewSession();
        } else {
          // 重新加载会话列表
          await this.loadSessionsList();
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    },
    // 保存消息到历史记录
    async saveMessageToHistory(message) {
      if (!message) {
        console.warn('saveMessageToHistory: No message provided');
        return;
      }

      // 只保存有 transcript 的消息（textContent 有内容）
      const hasTranscript = message.textContent && 
        Array.isArray(message.textContent) && 
        message.textContent.length > 0 && 
        message.textContent.some(text => text && text.trim().length > 0);
      
      if (!hasTranscript) {
        // 没有 transcript，不保存（等待 transcript 到达后再保存）
        console.log('saveMessageToHistory: Skipping - no transcript yet', {
          messageId: message.id,
          textContent: message.textContent,
        });
        return;
      }
      
      console.log('saveMessageToHistory: Has transcript, proceeding to save', {
        messageId: message.id,
        transcript: message.textContent.join(''),
      });

      const userId = this.getUserId();
      if (!userId) {
        console.warn('saveMessageToHistory: No user ID');
        return;
      }

      // Ensure a session exists before saving
      if (!this.currentSessionId) {
        console.log('saveMessageToHistory: Creating new session...');
        try {
          await this.createNewSession();
          if (!this.currentSessionId) {
            console.error('saveMessageToHistory: Failed to create session');
            return;
          }
          console.log('saveMessageToHistory: Session created:', this.currentSessionId);
        } catch (error) {
          console.error('Error creating session before saving message:', error);
          return;
        }
      }

      console.log('saveMessageToHistory: Saving message:', {
        userId,
        sessionId: this.currentSessionId,
        messageId: message.id,
        messageType: message.type,
      });

      try {
        await saveMessage(userId, this.currentSessionId, message);
        console.log('saveMessageToHistory: Message saved successfully');
        // Refresh session list to show updated timestamp
        // Use a small delay to batch multiple message saves
        if (!this._sessionListRefreshTimer) {
          this._sessionListRefreshTimer = setTimeout(async () => {
            await this.loadSessionsList();
            this._sessionListRefreshTimer = null;
          }, 500);
        }
      } catch (error) {
        console.error('Error saving message to history:', error);
      }
    },
  },
  beforeDestroy() {
    this.clearObjectURL(); // 清空残留对象url
    this.closeWS(); // 关闭websocket连接
    // Clear session list refresh timer
    if (this._sessionListRefreshTimer) {
      clearTimeout(this._sessionListRefreshTimer);
      this._sessionListRefreshTimer = null;
    }
  },
  components: {
    MessageBox,
    ToolBar,
    OperatorPanel,
    ChatHistorySidebar,
  },
  async mounted() {
    // Show toolbar immediately for audio mode
    this.isShowToolBar = true;
    // Ensure initial state is disconnected
    this.isConnected = false;
    this.isConnecting = false;
    // User needs to click connect button to start
    
    // Load sessions list
    await this.loadSessionsList();
    
    // 后台预加载所有会话消息（不阻塞UI）
    this.preloadAllSessions();
  },
};
</script>

<style scoped lang="less">
.experience {
  height: 100%;
  padding: 24px;
  background: var(--va-bg-color);
  display: flex;
  gap: 24px;
  &__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 24px;
    height: 100%;
    flex: 1;
    min-width: 0;
  }
  &__conversation {
    display: flex;
    justify-content: center;
    align-items: stretch;
    min-width: 0;
  }
  &__panel {
    background: #fff;
    border-radius: 24px;
    box-shadow: var(--va-strong-shadow);
    overflow: hidden;
    min-width: 360px;
  }
}

.app-container {
  width: 100%;
  max-width: 480px;
  background: var(--va-card-bg);
  border-radius: 32px;
  box-shadow: var(--va-shadow-soft);
  display: flex;
  flex-direction: column;
  padding: 16px 16px 0;
  min-height: 680px;
}

.app-header {
  padding: 8px 8px 4px;
  align-items: center;
  h3 {
    color: var(--va-text-main);
    font-size: 22px;
    margin: 4px 0 0;
    font-weight: 700;
  }
  .eyebrow {
    color: var(--va-text-sub);
    font-size: 12px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 600;
  &.connecting {
    background: #fff7ed;
    color: #c2410c;
  }
  &.connected {
    background: #ecfdf3;
    color: #15803d;
  }
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 8px;
}

.input-container {
  padding: 8px 8px 20px;
}

.show-tool-bar {
  height: 100%;
}

@media (max-width: 1200px) {
  .experience {
    padding: 12px;
    flex-direction: column;
    &__content {
      grid-template-columns: 1fr;
    }
    &__panel {
      min-width: 0;
    }
  }
  .app-container {
    max-width: 100%;
    min-height: 640px;
  }
}
</style>
