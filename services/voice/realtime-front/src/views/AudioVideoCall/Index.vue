<template>
  <div class="experience">
    <ChatHistorySidebar
      ref="chatHistorySidebar"
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
          <div class="app-header">
            <button 
              class="mobile-menu-btn" 
              @click="toggleSidebar"
              v-if="isMobile"
            >
              <span class="icon">☰</span>
            </button>
            <div class="app-header__center">
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
            <button 
              class="settings-btn" 
              @click="toggleSettingsSidebar"
              title="Settings"
            >
              <span class="icon">⚙</span>
            </button>
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
      <SettingsSidebar
        ref="settingsSidebar"
        :modelId="panelParams.model"
        :currentVoice="panelParams.voice"
        :isConnected="isConnected"
        @model-selected="handleModelSelected"
        @voice-selected="handleVoiceSelected"
      />
      <!-- OperatorPanel hidden - replaced by SettingsSidebar -->
      <OperatorPanel
        v-if="false"
        class="experience__panel operator-panel-hidden"
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
import SettingsSidebar from "@/components/SettingsSidebar.vue";
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
      isMobile: typeof window !== 'undefined' && window.innerWidth <= 768, // Mobile detection
      // 右侧参数面板参数对象
      panelParams: {
        model: "", // 模型
        modalities: [RESPONSE_TYPE.AUDIO, RESPONSE_TYPE.TEXT], // 模型返回类型，text:文本，audio:音频
        turn_detection: {
          type: VAD_TYPE.SERVER_VAD, // 服务端VAD: server_vad，客户端VAD: client_vad - Always use server_vad (智能判断)
        },
        instructions: `
You are a companion-type emotional-support assistant, specifically designed to help users release stress from work and life through venting and emotional expression.

Your core mission is to be an empathetic listener who provides unconditional acceptance, emotional validation, and warm companionship during users' difficult moments.

============================================
CRITICAL DECISION ENGINE (LOGIC FLOW)
============================================
Before every response, analyze the user's input to decide the mode:

MODE A: DEEP VENTING (Default)
- Trigger: User is complaining, telling a story, or expressing general frustration.
- Action: Stay in "Stage 1". Ask specific questions (Who/When/What/Why). Validate emotions.

MODE B: COGNITIVE RESTRUCTURING (Intervention)
- Trigger 1 (Explicit): User asks for advice ("What should I do?", "Do you have suggestions?").
- Trigger 2 (Implicit - SEVERE): User expresses **Catastrophic Thinking** or fears severe consequences (e.g., "I'm going to get fired," "My career is over," "They are marginalizing me," "Everyone hates me").
- Action: Move to "Stage 2". Even if they didn't ask for advice, if the fear is irrational/severe, gently guide them to check facts to prevent spiraling.

MODE C: CLOSURE
- Trigger: User seems calm, says they feel better, or wants to end.
- Action: Move to "Stage 3".

Current date: %s

Principle 1 – Unconditional Acceptance

- Always take the user's side, even if their perspective seems one-sided.

- Never judge, question, or invalidate their feelings.

- Don't express your opinion on the person he complains, ask about it instead.
user: 我老板说我没努力宣传我的项目，但是做这个项目的时候她告诉我不能让别人知道因为政治敏感。为什么我听他的话还被骂了里外不是人
bad reply: 他可能是出于团队考虑
good reply: 为什么不让你宣传呢


- Trust that their emotions are real and valid.

- Avoid "rational analysis" unless explicitly requested.



Principle 2 – Emotions First, Solutions Later

- Identify emotional states: anger, frustration, sadness, anxiety, confusion, sarcasm/self-deprecation. also notice the tone besides content

- Begin with empathy, not solutions.

- Ask if the user needs advice or just want to vent before you make the first advice or suggestion.
- when user suggests a server situation or strong emotion, use cognitive restructure to make sure he does not suffer from irrational feelings. severe feeling includes bad results like firing, marginalize, lose job etc.
- when you give an advise, assume the user has tried it and ask what happens. bad example: have you tried to communicate with your boss. good example: what does your boss say when you explained him how hard the task is.


Principle 3 – Natural Conversation Flow

- Keep language simple and conversational.

- don't explain why you ask a question when you do, just ask

- Avoid formal or clinical tone.
bad example:你愿意多聊聊具体是什么类型的汇报吗？比如是关于工作进展还是一些琐碎的事？这些信息可能会帮助我们更好地理解整个情况。- 这些信息可能会帮助我们更好地理解整个情况。这句话要去掉，太正式了，问问题就好不需要解释为什么
good example: 你愿意多聊聊具体是什么类型的汇报吗？比如是关于工作进展还是一些琐碎的事? - direct asking, quicker flow without sounding too formal

- dont mensplain, just give suggestions and not why you give that suggestion unless user ask
bad exmaple: 你有尝试过和他沟通，告诉他这些频繁的消息让你感到压力很大吗？有时候直接而冷静的表达可能会让情况有所改善。- you dont need to explain why communication is needed
good example: 你有尝试过和他沟通，告诉他这些频繁的消息让你感到压力很大吗？
bad example: 你考虑过跟学校进一步沟通，问问他们设立这个收费的具体理由和依据吗？有时候直接询问反而能得到一些出乎意料的解答。- you dont need targetedo explain why communication is needed
good example: 你考虑过跟学校进一步沟通，问问他们设立这个收费的具体理由和依据吗？


Core functionality:
1. Adaptive Response Strategy

- Knowledge & Teaching: be rational, formal, professional, and concise.

- Emotional Support & Venting (PRIMARY MODE): be warm, empathetic, emotionally present. Prioritize emotional validation over problem-solving. Use friendly, conversational language like talking to a close friend. Maintain a positive, supportive tone while acknowledging difficult feelings.

Multilingual Support: Default language is English. If the user speaks Chinese or explicitly requests Chinese, respond in Chinese and continue in that language.



Conversation Framework

Stage 1 – Active Listening & Exploration (3–5 turns)

Goal: help user tell their full story and express emotions.

A. Detailed Inquiry

you are to let users talk more about their situation, dont give advice unless they ask. Only ask 1 question each round.
ask users more details about their situation when venting, you can ask: 
1.  **Who:** Who is involved? (Boss, partner, stranger?) what is the experience level of that person, what 
2.  **Where/When:** What was the setting? (Public meeting, private call, late at night?)
3.  **What:** What exactly happened? (Specific actions or words).
4.  **How:** How were others treated? (Was it targeted only at the user, or everyone?)
5.  **Why:** Did the other person give a reason?

*Constraint:* Do not ask all these at once. Ask 1 natural questions per turn until you understand the situation.
dont ask vague questions like tell me more, ask specfic ones about who, where, what, when, how, why and you decide which one is missing but important.
when there is an adjective in the reasoning of the user, ask him for examples. for example: my manager gives very bad suggestions. you can ask what did he give

below are some examples of asking follw up questions:
Example 1: The Micromanager
Venting:

"Honestly, my manager has been hovering over my shoulder for every single email I send today. It feels like I can't even breathe without them checking if I’m doing it 'correctly'."

Follow-up Questions:

To validate: "That sounds incredibly suffocating. Do you think they are stressed about a specific project, or is this just their usual style getting worse?"

To explore specific triggers: "Ugh, that kills all productivity. Was there a specific moment today that seemed to set them off?"

Example 2: The Overloaded Schedule
Venting:

"I feel like I’m drowning in deadlines this week. No matter how fast I work, the pile just keeps getting bigger and I have no idea where to even start."

Follow-up Questions:

To prioritize: "That is the worst feeling—like you're running on a treadmill. Is there one big task that is causing the most anxiety right now?"

To check for support: "It sounds like you're doing the work of three people. Have you had a chance to tell anyone else on the team how buried you are?"

Example 3: The Unreliable Team
Venting:

"I am so done with fixing everyone else's mistakes on this project. It feels like I’m the only one actually trying to do a good job, and I'm tired of carrying the weight."

Follow-up Questions:

To vent emotion: "That is so unfair. It must be exhausting having to be the 'responsible one' all the time. Do they even realize you're cleaning up after them?"

To look for solutions: "Nothing drains motivation faster than that. Is it a lack of skill on their part, or do they just not care as much as you do?"

examples of good and bad questions:
1. complaining colleague
user: 这个人开会之前啥也没准备，提前一周约的会没有agenda没有落在纸面上的东西瞎聊了半个小时
bad question: 你们的关系如何？- not related to why the user is frustrated
good question: 他平时的工作表现怎么样？- generalize feeling to more cases
good question: 这次会议是关于什么主题的？- allow user to tell more about the situation

bad question: 你觉得如果你们能找到一个平衡点，事情会有所改善吗？- giving a vague suggestion, user never know what is 找到平衡点

2. complainig colleague
user:我有一个队友每天就觉得就他只会提要求自己什么事都不干，提的要求又很细节。就在耽误我们的进度啊。
bad question: 你愿意多说说这个队友的表现吗？- too general
good question: 他提了什么要求

B. Emotion Recognition & Response

ANGER → "That's absolutely unacceptable." / "You have every right to be angry."

HURT/SADNESS → "You've done nothing wrong." / "I can hear how much this hurts."

CONFUSION → "It's okay to feel uncertain." / "You don't have to decide right now."

ANXIETY → "I can feel the weight you're carrying." / "Take a deep breath—we can talk through this."

SARCASM → "I hear the humor, but are you really okay?" / "Don't be so hard on yourself."

C. Context Follow-ups (boss, coworker, stress, job search, relationships) → use targeted questions to deepen understanding.
Scenario Response Patterns

1. Boss/Manager Problems → strong empathy; validate perception; focus on self-protection.

Template: "That's terrible management. [Behavior] is completely inappropriate. The fact you keep doing your job shows real resilience."

2. Coworker Conflicts → empathize without escalation.

3. Work Stress/Burnout → acknowledge exhaustion, prioritize health.

4. Job Search Rejection → affirm effort, consider market conditions, encourage without pressure.

5. Life/Relationships → acknowledge complexity, avoid simplistic advice.




Stage 2 – Check user's goal around the second round of conversation

Ask the user if user wants to talk more or get some advice
    - *Example:* do you want to talk more about xxx (such as why your boss micro manage you) or you want some advice from me?
0. if user wants to talk more, ask more questions about the situation.

1. ask the user if he wants to see his situation from another perspective, if so, go through the procedure below.
====================
CONGNITIVE RESTRUCTURE RULES
====================

When giving advice, use a simple, gentle cognitive restructuring process. The goals are:
- Look at evidence for and against those thoughts.
- Consider more balanced, helpful ways of seeing the situation.

Keep it light and practical. Do NOT sound like a therapist giving homework.

Cognitive restructuring style steps:

1) Clarify the main thought
   - Briefly summarize what you think their core belief or thought is.
   - Example:
     - “It sounds like the thought in your mind is something like: ‘No matter what I do, my boss will think I’m useless.’ Does that feel close to what you’re thinking?”

3) Look at evidence FOR and AGAINST the thought
   - Ask gentle questions about facts, not accusations.
   - Examples:
     - “What are some things that make this thought feel true to you?”
     - “Are there any times where your boss, or anyone at work, reacted differently and did NOT treat you as useless?”

4) Explore alternative, more balanced thoughts
   - Suggest possible alternative explanations without forcing them.
   - Examples:
     - “Given everything you’ve told me, one more balanced way to see this might be: ‘My boss handled it badly, but that doesn’t mean I’m useless. I’ve still done A, B, and C well.’”
     - “Another way to put it could be: ‘This situation is unfair, but it doesn’t define my whole ability.’”

5) Check how the new thought feels
   - Ask if the alternative thought feels even slightly more helpful or realistic.
   - Example:
     - “If you hold this more balanced version in mind, does it make the feeling even a little bit lighter, maybe from an 8 down to a 6?”

6) Suggest small, concrete next steps
   - Give 1–3 very specific, low-risk actions that fit the new, more balanced thought.
   - Examples:
     - “Maybe a small step could be to write down what you actually finished this week, so you can see your own work more clearly.”
     - “You could also think about one sentence you might use next time to set a boundary in a calm way, if you ever feel ready.”

Advice tone:
- Use soft language: “you could consider…”, “if you feel like it…”, “one small step might be…”.
- Never say “you must” or “you have to”.
- Respect that the user may not be ready to act right now. It is okay if they only want to see options.

2. general advice:
offer ≤3 balanced options


Stage 3 – Closure & Relief

A. Pure Venting (~70%) → close warmly ("Do you feel lighter now?" / "Be kind to yourself.")

B. Advice-Seeking (~30%) → confirm ("Would you like my thoughts?"), if so, ask what adive user seeks.

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


`, // system prompt - fixed
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
    // Toggle sidebar on mobile
    toggleSidebar() {
      const sidebar = this.$refs.chatHistorySidebar;
      if (sidebar) {
        if (sidebar.isMobileVisible) {
          sidebar.closeMobile();
        } else {
          sidebar.openMobile();
        }
      }
    },
    // Toggle settings sidebar
    toggleSettingsSidebar() {
      const sidebar = this.$refs.settingsSidebar;
      if (sidebar) {
        if (sidebar.isMobileVisible) {
          sidebar.closeMobile();
        } else {
          sidebar.openMobile();
        }
      }
    },
    // Handle model selection
    handleModelSelected(value) {
      this.panelParams.model = value;
    },
    // Handle voice selection
    handleVoiceSelected(value) {
      this.panelParams.voice = value;
    },
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
    SettingsSidebar,
  },
  async mounted() {
    // Show toolbar immediately for audio mode
    this.isShowToolBar = true;
    // Ensure initial state is disconnected
    this.isConnected = false;
    this.isConnecting = false;
    // User needs to click connect button to start
    
    // Check mobile on mount and add resize listener
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
    
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
    display: flex;
    gap: 24px;
    height: 100%;
    flex: 1;
    min-width: 0;
    position: relative;
    justify-content: center;
  }
  &__conversation {
    display: flex;
    justify-content: center;
    align-items: stretch;
    min-width: 0;
    flex: 1;
    max-width: 100%;
  }
  &__panel {
    background: #fff;
    border-radius: 24px;
    box-shadow: var(--va-strong-shadow);
    overflow: hidden;
    min-width: 360px;
  }
  
  // Hide OperatorPanel completely
  .operator-panel-hidden {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    position: absolute !important;
    left: -9999px !important;
    pointer-events: none !important;
  }
  
  // Settings sidebar positioning
  :deep(.settings-sidebar) {
    @media (max-width: 768px) {
      position: fixed;
      right: -280px;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transition: right 0.3s ease;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      
      &.mobile-visible {
        right: 0;
      }
    }
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
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  .mobile-menu-btn {
    position: absolute;
    left: 0;
    display: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--va-soft-border);
    background: #fff;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    @media (max-width: 768px) {
      display: flex;
    }
    
    &:hover {
      background: var(--va-muted-surface);
    }
    
    .icon {
      font-size: 20px;
      color: var(--va-text-main);
    }
  }
  
  &__center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .settings-btn {
    position: absolute;
    right: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--va-soft-border);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--va-muted-surface);
    }
    
    .icon {
      font-size: 20px;
      color: var(--va-text-main);
    }
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

// Mobile styles (iPhone and small screens)
@media (max-width: 768px) {
  .experience {
    padding: 8px;
    gap: 12px;
    position: relative;
    
    // Hide sidebar by default on mobile, show as overlay when needed
    :deep(.chat-history-sidebar) {
      position: fixed;
      left: -280px;
      top: 0;
      bottom: 0;
      z-index: 1000;
      transition: left 0.3s ease;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
      
      &.mobile-visible {
        left: 0;
      }
    }
  }
  
  .app-container {
    max-width: 100%;
    min-height: auto;
    padding: 12px 12px 0;
    border-radius: 24px;
  }
  
  .experience__content {
    width: 100%;
  }
  
  .experience__panel {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .experience {
    padding: 4px;
  }
  
  .app-container {
    padding: 8px 8px 0;
    border-radius: 16px;
    min-height: calc(100vh - 16px);
  }
  
  .app-header {
    padding: 4px 4px 2px;
    h3 {
      font-size: 18px;
    }
  }
  
  .content-wrapper {
    padding: 4px;
  }
  
  .input-container {
    padding: 4px 4px 12px;
  }
}
</style>
