<template>
  <div class="message-box">
    <div v-if="!isConnecting" class="message-box__viewport">
      <div v-if="isShowWelcome" class="welcome">
        <div class="welcome__orb"></div>
        <h3 class="welcome__title">How are you feeling?</h3>
        <p class="welcome__subtitle">Tap the mic to start a quick voice chat.</p>
      </div>
      <div v-else class="chat-shell">
        <div class="chat-area scroll-display-none" ref="refMsgBox" id="msgBox">
          <div v-if="messageList.length === 0" class="empty-state">
            <div class="welcome__orb small"></div>
            <h4>Voice Call Ready</h4>
            <p>Click the microphone button to start speaking</p>
          </div>
          <div
            v-else
            v-for="(item, index) in messageList"
            :key="index"
            :class="['message-row', item.type === MSG_TYPE.CLIENT ? 'is-user' : 'is-ai']"
          >
            <el-image
              :src="item.type === MSG_TYPE.CLIENT ? userAvatar : robotAvatar"
              class="avatar"
            />
            <div class="bubble">
              <!-- 历史记录模式：只显示文本 -->
              <template v-if="isHistoryMode">
                <p v-if="item.textContent && item.textContent.length > 0">
                  {{ item.textContent.join("") }}
                </p>
              </template>
              <!-- 实时聊天模式：显示完整内容 -->
              <template v-else>
                <template v-if="item.type === MSG_TYPE.CLIENT">
                  <video
                    v-if="item.videoUrlContent"
                    class="mb10"
                    :src="item.videoUrlContent"
                    controls
                    preload="auto"
                  />
                  <AudioBox
                    v-if="item.audioUrl"
                    :audioUrl="item.audioUrl"
                    width="100%"
                    height="38"
                    :uniqueIndex="index"
                  />
                  <p v-if="item.textContent && item.textContent.length > 0">
                    {{ item.textContent.join("") }}
                  </p>
                </template>
                <template v-else>
                  <OutputAudio
                    v-if="item.responseType === RESPONSE_TYPE.AUDIO"
                    ref="refOutputAudio"
                    :readonly="true"
                    :options="item.audioData"
                    :status="item.answerStatus"
                    @onStopped="audioStopped"
                  />
                  <p
                    v-if="item.textContent && item.textContent.length > 0"
                    :class="{ 'only-text': item.responseType !== RESPONSE_TYPE.AUDIO }"
                  >
                    {{ item.textContent.join("") }}
                  </p>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="message-box__loading flex flex-center">
      <Loading />
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";
import AudioBox from "@/components/AudioBox.vue";
import OutputAudio from "@/components/OutputAudio.vue";
import userAvatar from "@/assets/images/user.svg";
import robotAvatar from "@/assets/images/robot_color.png";
import { MEDIA_TYPE, MSG_TYPE, RESPONSE_TYPE } from "@/constants/modules/audioVideoCall";
import { sleep } from "@/utils/tools";
import {
  listenWheel,
  removeListenWheel,
  scrollBottom,
  clearScrollBottomTimer,
} from "@/utils/autoScroll";
import emitter from "@/utils/event";

export default {
  name: "MessageBox",
  props: {
    // 消息列表
    messageList: {
      type: Array,
      default: () => [],
    },
    // 是否正在连接
    isConnecting: {
      type: Boolean,
      default: false,
    },
    // 是否显示欢迎页
    isShowWelcome: {
      type: Boolean,
      default: true,
    },
    // 是否是历史记录模式
    isHistoryMode: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Loading,
    AudioBox,
    OutputAudio,
    // TextPrint
  },
  data() {
    return {
      RESPONSE_TYPE, // 响应类型
      MSG_TYPE, // 消息类型
      MEDIA_TYPE, // 媒体类型
      userAvatar,
      robotAvatar,
    };
  },
  mounted() {
    emitter.on("onStopAudio", this.stopAudio);
  },
  methods: {
    // 当音频播放停止时
    async audioStopped() {
      await sleep(1000);
      this.stopScrollToBotton();
    },
    // 循环滚动到最底部
    loopScrollToBotton() {
      scrollBottom("msgBox");
      listenWheel("msgBox", false, 2);
    },
    // 停止循环滚动到底部
    stopScrollToBotton() {
      clearScrollBottomTimer();
      removeListenWheel("msgBox", false, 2);
    },
    // 滚动条在最底部
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.refMsgBox;
        if (container) {
          container.scrollTop = container.scrollHeight - container.offsetHeight;
        }
      });
    },
    // 停止所有音频播放
    stopAudio() {
      if (this.$refs.refOutputAudio && this.$refs.refOutputAudio.length > 0) {
        this.$refs.refOutputAudio.forEach((item) => {
          if (item.isPlaying) {
            item.stopAudio();
          }
        });
      }
    },
  },
  beforeDestroy() {
    emitter.off("onStopAudio", this.stopAudio);
  },
};
</script>

<style scoped lang="less">
.message-box {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f7f8fb 100%);
  border-radius: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  font-family: var(--va-font-family);
  overflow: hidden;
  &__viewport {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  &__loading {
    height: 100%;
    background: #fff;
    border-radius: 24px;
  }
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px 24px;
  text-align: center;
  gap: 12px;
}

.welcome__orb {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #a5f3fc, #3b82f6, #4f46e5);
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
  margin-bottom: 8px;
  animation: breathe 4s infinite ease-in-out;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border-radius: 50%;
    background: inherit;
    filter: blur(24px);
    opacity: 0.6;
    z-index: -1;
  }
  &.small {
    width: 70px;
    height: 70px;
    margin-bottom: 0;
  }
}

.welcome__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--va-text-main);
}

.welcome__subtitle {
  color: var(--va-text-sub);
  font-size: 14px;
  line-height: 22px;
}

.chat-shell {
  flex: 1;
  min-height: 0;
  padding: 4px 4px 8px;
}

.chat-area {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 12px;
}

.empty-state {
  height: 100%;
  border: 1px dashed var(--va-soft-border);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--va-text-sub);
  background: #ffffff;
  h4 {
    margin: 8px 0 0;
    color: var(--va-text-main);
    font-size: 18px;
  }
  p {
    margin: 0;
    color: var(--va-text-sub);
  }
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: slideUp 0.3s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.message-row.is-user {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 10px 22px -12px rgba(0, 0, 0, 0.25);
  :deep(.el-image__inner) {
    border-radius: 50%;
  }
}

.bubble {
  flex: 1;
  max-width: 85%;
  background: #ffffff;
  border-radius: 18px;
  padding: 14px 16px;
  border: 1px solid var(--va-soft-border);
  box-shadow: 0 8px 20px -16px rgba(0, 0, 0, 0.12);
  color: var(--va-text-main);
}

.message-row.is-ai .bubble {
  border-top-left-radius: 6px;
}

.message-row.is-user .bubble {
  background: var(--va-user-bubble-bg);
  color: var(--va-user-bubble-text);
  border-color: transparent;
  border-top-right-radius: 6px;
}

.bubble video {
  width: 100%;
  border-radius: 12px;
  display: block;
  margin-bottom: 10px;
}

.bubble p {
  margin-top: 10px;
  font-size: 15px;
  line-height: 22px;
  color: inherit;
  &.only-text {
    margin-top: 2px;
    font-size: 16px;
  }
}

:deep(.audio-box) {
  width: 100%;
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 60px rgba(59, 130, 246, 0.6);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
