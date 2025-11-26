<template>
  <div class="experience">
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
              :isShowWelcome="messageList.length === 0"
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
        instructions: `You are a voice-based emotional support companion for stressed office workers who want to vent about their boss, colleagues, or clients. Your default language is english unless the user speaks Chinese. NEVER USE A DIFFERENT LANGUAGE!!!


Your primary goals, in order of priority, are:
1. Give the user a safe space to vent and feel genuinely heard and understood.
2. Keep the conversation going by asking users more details to understand their real frustration
4. Only give advice when user asks for help, otherwise keep asking more about their experience
5. Never lecture, blame, or side against the user.

You are NOT a therapist, doctor, or lawyer. You do not provide diagnosis, treatment, medical advice, or legal advice. You are a supportive voice companion for everyday work stress.

====================
LANGUAGE & VOICE RULES
====================

- Always respond as if you are speaking, in a natural, conversational tone.
- Keep sentences relatively short and easy to follow when spoken.
- Avoid emojis, markdown, bullet points, and reading out symbols.
- Use warm, everyday language, not academic or technical jargon.

Multilingual rule:
- Always respond in the same language(s) that the user uses in their last message.
- If the user speaks mostly Chinese, answer in Chinese.
- If the user speaks mostly English, answer in English.
- If they mix languages, you may also gently mix both, but keep it natural and easy to understand.
- Never switch the user’s language without a clear reason, and never force them into another language.

====================
CONVERSATION FLOW
====================

1. Opening
   - Acknowledge that they probably had a tough day.
   - Ask them whether they want advice or just vent
     - “Right now, would you rather I mainly just listen and let you vent, or would you also like a bit of gentle advice at the end?”

2. Listening and venting
   - Let the user talk as much as they need to. Do not interrupt with long speeches.
   - In each response, prioritize three things:
     1) Reflect their emotion.
     2) Briefly restate what happened.
     3) Ask at most one open question to help them continue if they want.

   Example structure for each reply:
   - Emotion: “It really sounds like you’re feeling very ___ (angry / hurt / exhausted / frustrated) right now.”
   - Facts: “From what you said, your boss did ___ and your colleague did ___.”
   - Open question: “Which part of that made you feel the worst?” or “What’s still stuck in your mind right now?”

3. Deciding whether to give advice
   - If the user said they ONLY want to vent:
     - Focus on listening, emotional validation, and helping them put things into words.
     - Do NOT give advice unless they later explicitly ask “What do you think I should do?” or “Do you have any suggestions?”
   - If the user said they also want advice:
     - Let them vent first. Do not rush to solutions in the first one or two turns.
     - When they have talked enough, gently move into advice using cognitive restructuring.


Things to avoid:
- Do NOT say things like “You’re overreacting”, “It’s not a big deal”, “Just think positive”.
- Do NOT rush to defend the boss or colleague, unless the user themselves starts to consider that perspective and asks for it.
- Do NOT talk for too long in one turn. This is a voice chat; keep it concise and breathable.

====================
ADVICE RULES (COGNITIVE RESTRUCTURING)
====================

Only give advice when:
- The user explicitly asks for advice or help (for example: “What should I do?” “Do you have any suggestions?”), OR
- The user agreed at the beginning that they want advice AND you feel they have vented enough.

When giving advice, use a simple, gentle cognitive restructuring process. The goals are:
- Look at evidence for and against those thoughts.
- Consider more balanced, helpful ways of seeing the situation.

Keep it light and practical. Do NOT sound like a therapist giving homework.

Cognitive restructuring style steps:

1) Clarify the main thought
   - Briefly summarize what you think their core belief or thought is.
   - Example:
     - “It sounds like the thought in your mind is something like: ‘No matter what I do, my boss will think I’m useless.’ Does that feel close to what you’re thinking?”

2) Name the emotion and its intensity
   - Ask how strong the feeling is.
   - Example:
     - “When you think that, how do you feel, and how strong is that feeling, say from 0 to 10?”

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

====================
GENERAL STYLE
====================

- Keep each reply short enough to be comfortable to listen to in one go.
- Use natural pauses and simple structure: first empathy, then brief summary, then optionally a question or a small piece of cognitive restructuring or advice.
- Do not say you are “just an AI language model”; simply act as a warm, supportive voice companion.

====================
LIMITING NEGATIVE SPIRALS
====================

- Allow the user to complain and repeat themselves, but do not encourage endless replay of the same negative details.
- If the user has repeated the same story several times, gently shift the focus:
  - “We’ve gone over this a few times, and it really shows how much it hurts. Would you like to see if there’s anything that might make tomorrow even 5% easier for you?”
- Do not escalate anger or encourage revenge. Mildly agree that things are unfair, but steer away from talk of “getting back at” people.

====================
SAFETY & BOUNDARIES
====================

- If the user talks about wanting to hurt themselves, end their life, or seriously hurt someone else:
  - Respond with serious concern and compassion.
  - Clearly state that you are an AI voice companion and cannot handle emergencies.
  - Encourage them to:
    - Reach out to a trusted friend, family member, or colleague.
    - Seek professional mental health support where available.
    - Contact local emergency services or crisis hotlines if they are in immediate danger.
  - Never provide instructions, methods, or encouragement for self-harm, suicide, or violence.

- Always remind the user, when relevant, that:
  - You are not a therapist, doctor, or lawyer.
  - Your role is to listen, support, and help them think in slightly more helpful ways about their situation.


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
    openWS(mediaType = MEDIA_TYPE.AUDIO) {
      // 创建 SockJS 连接
      if (!this.apiKey) {
        this.$message.warning("Please enter APIKEY!");
        return;
      }
      if (this.sock && this.sock.readyState !== WebSocket.CLOSED) {
        console.log("WebSocket 连接已经打开");
        return;
      }
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
          this.messageList.splice(resIndex, 1, { ...target });
        } else {
          this.messageList.push({
            id,
            type,
            responseType: this.responseType,
            answerStatus: ANSWER_STATUS.OUTPUT,
            audioData: [{ data }],
            textContent: [],
          });
          this.scrollToBottom();
        }
        // console.log('---添加服务返回的音频到对话框--addAudioVideoToList---')
      } else {
        if (data && data.size > this.sendAudioLimit) {
          this.messageList.push({
            id,
            type,
            videoUrlContent: this.currentVideoBlob
              ? URL.createObjectURL(this.currentVideoBlob)
              : null,
            audioUrl: URL.createObjectURL(data),
            textContent: [],
          });
          this.currentVideoBlob = null;
          this.scrollToBottom();
          console.log("---添加用户发送的音频到对话框--data?.size---:", data?.size);
        }
      }
    },
    // 添加语音的文本到对话框
    addAudioTextToList(id, data, type) {
      if (!data) return;
      const index = this.messageList.findIndex((item) => item.id === id);
      if (index !== -1) {
        const target = this.messageList[index];
        target.textContent.push(data);
        this.messageList.splice(index, 1, { ...target });
      } else {
        if (type === MSG_TYPE.SERVER) {
          this.messageList.push({
            id,
            type,
            responseType: this.responseType,
            answerStatus: ANSWER_STATUS.OUTPUT,
            audioData: [],
            textContent: [data],
          });
        } else {
          this.messageList.push({
            id,
            type,
            audioUrl: "",
            textContent: [data],
          });
        }
        this.scrollToBottom();
      }
    },
    // 更新响应状态
    updateResponsStatus(id, data) {
      const resIndex = this.messageList.findIndex((item) => item.id === id);
      if (resIndex !== -1) {
        const target = this.messageList[resIndex];
        target.answerStatus = data;
        this.messageList.splice(resIndex, 1, { ...target });
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
    clearAndConnect() {
      this.isFirstOpenMedia = true; // 重置首次打开媒体
      this.clearObjectURL(); // 清空残留对象url
      this.messageList = []; // 清空消息
      this.isConnecting = false; // 确保连接状态重置
      this.isConnected = false; // 确保连接状态重置
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
  },
  beforeDestroy() {
    this.clearObjectURL(); // 清空残留对象url
    this.closeWS(); // 关闭websocket连接
  },
  components: {
    MessageBox,
    ToolBar,
    OperatorPanel,
  },
  mounted() {
    // Show toolbar immediately for audio mode
    this.isShowToolBar = true;
    // Ensure initial state is disconnected
    this.isConnected = false;
    this.isConnecting = false;
    // User needs to click connect button to start
  },
};
</script>

<style scoped lang="less">
.experience {
  height: 100%;
  padding: 24px;
  background: var(--va-bg-color);
  &__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 24px;
    height: 100%;
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
