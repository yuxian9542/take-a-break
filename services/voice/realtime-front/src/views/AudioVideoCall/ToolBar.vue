<template>
  <div class="tool-bar">
    <div v-if="currentBarStatus === toolBarStatus.DISCONNECTED" class="tool-bar__start">
      <button class="tool-bar__start-btn" type="button" @click="clearAndConnect">
        Start New Conversation
      </button>
    </div>
    <div v-else class="tool-bar__inner">
      <el-tooltip placement="top" :disabled="currentAudioStatus === mediaStatus.DISABLED">
        <template #content>
          {{ audioTip }}
        </template>
        <button
          class="tool-bar__btn control"
          :class="{
            opened: currentAudioStatus === mediaStatus.OPENED,
            unclose: currentAudioStatus === mediaStatus.UNCLOSE,
            disabled: currentAudioStatus === mediaStatus.DISABLED,
            paused: currentAudioStatus !== mediaStatus.OPENED,
          }"
          type="button"
          @click="handleAudio"
        >
          <span
            class="shape"
            :class="currentAudioStatus === mediaStatus.OPENED ? 'shape-pause' : 'shape-play'"
            aria-hidden="true"
          ></span>
        </button>
      </el-tooltip>

      <div class="tool-bar__content">
        <img
          v-if="currentBarStatus === toolBarStatus.VOICING"
          src="@/assets/images/user-speaking.gif"
          alt="Recording in progress"
        />
        <label
          :class="{
            disconnected: currentBarStatus === toolBarStatus.DISCONNECTED,
            ready: currentBarStatus === toolBarStatus.READY,
          }"
          >{{ toolBarTxt }}</label
        >
      </div>

      <el-tooltip
        placement="top"
        :disabled="currentBarStatus === toolBarStatus.DISCONNECTING || disabledConnectTip"
      >
        <template #content>
          {{ connectTip }}
        </template>
        <button class="tool-bar__btn stop" type="button" @click="handleDisconnect">
          <span class="shape shape-stop" aria-hidden="true"></span>
          <span class="stop-text">Close</span>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import { sleep } from "@/utils/tools";
import SoundVadClass from "@/utils/soundVad";
import { MEDIA_TYPE, VAD_TYPE } from "@/constants/modules/audioVideoCall";
import emitter from "@/utils/event";

export default {
  name: "ToolBar",
  props: {
    // 是否开启视频
    enableVideo: {
      type: Boolean,
      default: false,
    },
    // 是否已连接
    isConnected: {
      type: Boolean,
      default: false,
    },
    // vad类型
    vadType: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      vadStatus: false, // 是否检测到声音
      audioChunks: [], // 录音数据块
      audioMediaRecorder: null, // 录音媒体录制器
      audioMediaSrtream: null, // 录音媒体流
      audioPcmData: {
        data: [], // 录音数据
        size: 0, // 数据大小
        sampleRate: 0, // 采样率
        channelCount: 0, // 声道数
      },
      audioContext: null, // 录音上下文
      mediaStreamSource: null, // 录音源
      scriptProcessorNode: null, // 录音处理节点
      disabledConnectTip: false,
      MEDIA_TYPE, // 媒体类型
      // audioContext: null, //   需要一个AudioContext来创建AnalyserNode
      // analyser: null, //   需要一个AnalyserNode来获取录音数据
      // isSpeaking: false, // 是否正在说话
      currentAudioStatus: "closed", // 当前录音按钮状态
      currentVideoStatus: "closed", // 当前视频按钮状态
      // 媒体按钮状态
      mediaStatus: {
        OPENED: "opened", // 开启录音
        CLOSED: "closed", // 停止录音监听
        UNCLOSE: "unclose", // 不能关闭
        DISABLED: "disabled", // 禁用
      },
      currentBarStatus: "disconnected", // 当前工具条状态 - Start disconnected
      // 工具条状态
      toolBarStatus: {
        READY: "ready", // 准备好
        VOICING: "voicing", // 录音中
        CENNECTED: "cennected", // 已连接
        DISCONNECTING: "disconnecting", // 正在断开
        DISCONNECTED: "disconnected", // 已断开
      },
    };
  },
  watch: {
    vadStatus(val) {
      this.handleVadStatus(val);
    },
    isConnected: {
      handler(val) {
        if (val) {
          this.currentAudioStatus = this.mediaStatus.CLOSED; // 就绪录音
          this.currentVideoStatus = this.mediaStatus.CLOSED; // 就绪视频
          this.currentBarStatus = this.toolBarStatus.CENNECTED; // 已连接
        } else {
          this.currentAudioStatus = this.mediaStatus.DISABLED; // 禁用录音
          this.currentVideoStatus = this.mediaStatus.DISABLED; // 禁用视频
          this.currentBarStatus = this.toolBarStatus.DISCONNECTED; // 已断开
          emitter.emit("onStopAudio"); // 停止音频
          this.$emit("onCloseVideoOrScreen"); // 关闭视频或屏幕共享
        }
      },
      immediate: true, // Trigger immediately on mount to set initial state
    },
  },
  computed: {
    toolBarTxt() {
      switch (this.currentBarStatus) {
        case this.toolBarStatus.READY:
          return "Please start speaking...";
        case this.toolBarStatus.CENNECTED:
          return "Connected, you can start recording";
        case this.toolBarStatus.DISCONNECTING:
          return "Disconnecting...";
        case this.toolBarStatus.DISCONNECTED:
          return "Ready to chat";
        default:
          return "";
      }
    },
    audioTip() {
      switch (this.currentAudioStatus) {
        case this.mediaStatus.OPENED:
          return "Stop recording";
        case this.mediaStatus.CLOSED:
          return "Start recording";
        case this.mediaStatus.UNCLOSE:
          return "Smart detection mode cannot manually stop recording";
        default:
          return "";
      }
    },
    videoTip() {
      switch (this.currentVideoStatus) {
        case this.mediaStatus.OPENED:
          return "Stop recording";
        case this.mediaStatus.CLOSED:
          return "Stop recording";
        case this.mediaStatus.UNCLOSE:
          return "Smart detection mode cannot manually stop recording";
        default:
          return "";
      }
    },
    connectTip() {
      switch (this.currentBarStatus) {
        case this.toolBarStatus.DISCONNECTED:
          return "Clear conversation and reconnect";
        default:
          return "Disconnect";
      }
    },
  },
  async mounted() {
    // 创建音频vad对象
    this.soundVad = new SoundVadClass({
      onVadStatus: (value) => {
        this.vadStatus = value;
      },
      onListenAudioData: (data) => {
        this.$emit("onListenAudioData", data);
      },
      onPermissionError: () => {
        this.$emit("onPermissionError");
      },
    });
  },
  methods: {
    handleVadStatus(val) {
      if (this.currentAudioStatus !== this.mediaStatus.CLOSED) {
        if (this.vadType === VAD_TYPE.SERVER_VAD) {
          this.soundVad.isSpeeching = val;
        }
        if (val) {
          this.currentBarStatus = this.toolBarStatus.VOICING;
          console.log("--Speaking status--: Started speaking");
        } else {
          this.currentBarStatus = this.toolBarStatus.READY;
          console.log("--Speaking status--: Stopped speaking");

          // 获取收集的录音数据
          const wavBlob = this.soundVad.getRecordWavData();
          this.$emit("onAudioData", wavBlob);
          this.soundVad.clearRecordPCMData();

          // 视频停止录制，收集视频数据
          emitter.emit("onStopVideoRecorder");
        }
        this.$emit("onVadStatus", val);
      }
    },
    // 打开录音监听
    startRecordVad() {
      this.soundVad.startListen({
        isClientVad: this.vadType === VAD_TYPE.CLIENT_VAD,
      });
      this.currentAudioStatus = this.mediaStatus.OPENED; // 录音按钮呈现正在录音状态
      this.currentBarStatus = this.toolBarStatus.READY; // 工具条呈现正在录音状态
    },
    // 停止录音监听
    async stopRecordVad() {
      if (this.vadStatus && this.vadType === VAD_TYPE.CLIENT_VAD) {
        // 手动模式
        this.handleVadStatus(false); // 如果正在说话中，强制关闭，触发发送录音数据
      }
      this.soundVad.closeListen();
      this.currentAudioStatus = this.mediaStatus.CLOSED; // 录音按钮呈现停止录音状态
      this.currentBarStatus = this.toolBarStatus.CENNECTED; // 工具条呈现已连接，可以录音或开视频
      await sleep();
      this.closeVideoOrScreen(); // 如果视频已打开，关闭音频同时关闭视频或屏幕
    },
    // 开关录音
    handleAudio() {
      if (this.currentAudioStatus === this.mediaStatus.CLOSED) {
        this.startRecordVad(); // 打开录音监听
        this.$emit("onOpenAudio");
      } else if (this.currentAudioStatus === this.mediaStatus.OPENED) {
        this.stopRecordVad(); // 停止录音监听
        this.$emit("onCloseAudio");
      }
    },
    // 开启视频或屏幕
    openVideoOrScreen(command) {
      this.$emit("onOpenVideoOrScreen", command);
    },
    // 开启视频或屏幕成功
    openVideoOrScreenSuccess() {
      this.currentVideoStatus = this.mediaStatus.OPENED;
      if (this.currentAudioStatus === this.mediaStatus.CLOSED) {
        this.startRecordVad(); // 开启视频，同时开启录音
      }
    },
    // 关闭视频或屏幕
    closeVideoOrScreen() {
      if (this.currentVideoStatus !== this.mediaStatus.DISABLED) {
        this.currentVideoStatus = this.mediaStatus.CLOSED;
        this.$emit("onCloseVideoOrScreen"); // 关闭视频或屏幕分享
      }
    },
    // 断开连接
    handleDisconnect() {
      if (
        (this.enableVideo && this.currentVideoStatus === this.mediaStatus.OPENED) ||
        !this.enableVideo
      ) {
        this.currentBarStatus = this.toolBarStatus.DISCONNECTING; // 正在断开
        this.currentAudioStatus = this.mediaStatus.DISABLED; // 禁用录音
        this.currentVideoStatus = this.mediaStatus.DISABLED; // 禁用视频
        this.soundVad.closeListen();
        this.$emit("onDisconnect");
      }
    },
    // 清除历史并重新连接
    async clearAndConnect() {
      this.$emit("onClearAndConnect");
      this.disabledConnectTip = true;
      await sleep(1000);
      this.disabledConnectTip = false;
    },
  },
  beforeDestroy() {
    this.soundVad.closeListen();
  },
};
</script>

<style scoped lang="less">
.tool-bar {
  width: 100%;
  &__start {
    width: 100%;
  }
  &__start-btn {
    width: 100%;
    height: 48px;
    border-radius: 20px;
    border: none;
    background: linear-gradient(135deg, #0fcf6d, #0b8f50);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 16px 40px -18px rgba(11, 143, 80, 0.55);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 44px -18px rgba(11, 143, 80, 0.65);
    }
    &:active {
      transform: translateY(0);
    }
  }
  &__inner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #f3f4f6;
    border-radius: 22px;
    border: 1px solid var(--va-soft-border);
    box-shadow: 0 12px 30px -20px rgba(0, 0, 0, 0.2), inset 0 1px 0 #fff;
  }
  &__btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--va-soft-border);
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 10px 30px -20px rgba(0, 0, 0, 0.25);
    &.control {
      color: var(--va-text-main);
      background: linear-gradient(145deg, #ffffff, #f6f7fb);
      position: relative;
      overflow: hidden;
    }
    &.stop {
      background: #c0162c;
      color: #ffffff;
      border-color: #c0162c;
      box-shadow: 0 14px 30px -18px rgba(192, 22, 44, 0.45);
      gap: 6px;
      padding: 0 12px;
      border-radius: 18px;
      height: 44px;
      min-width: 92px;
      justify-content: center;
    }
    i {
      color: inherit;
    }
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 28px -18px rgba(0, 0, 0, 0.3);
    }
    &.disabled {
      cursor: not-allowed;
      opacity: 0.45;
      box-shadow: none;
    }
    &.opened {
      background: #fff;
      border-color: #d1d5db;
      color: #111827;
    }
    &.unclose {
      background: rgba(241, 52, 58, 0.08);
      border-color: rgba(241, 52, 58, 0.2);
      color: #f1343a;
      opacity: 0.7;
      cursor: not-allowed;
    }
    .shape {
      display: block;
      position: relative;
      font-size: 18px;
      line-height: 1;
    }
    .shape-play {
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 12px solid currentColor;
      margin-left: 2px;
    }
    .shape-pause {
      display: flex;
      gap: 4px;
    }
    .shape-pause::before,
    .shape-pause::after {
      content: "";
      display: block;
      width: 4px;
      height: 14px;
      background: currentColor;
      border-radius: 2px;
    }
    .shape-stop {
      width: 14px;
      height: 14px;
      background: currentColor;
      border-radius: 3px;
    }
  }
  &__content {
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border-radius: 16px;
    background: #fff;
    border: 1px solid var(--va-soft-border);
    padding: 10px 12px;
    min-height: 44px;
    img {
      height: 34px;
    }
      label {
      color: var(--va-text-sub);
      font-size: 14px;
      font-weight: 600;
      &.ready {
        color: var(--va-primary-blue);
      }
      &.disconnected {
        color: var(--va-text-sub);
      }
    }
  }
  i {
    display: block;
    font-size: 22px;
    color: #111827;
    width: 22px;
    height: 22px;
    &.icon-loading {
      background-image: url("@/assets/images/loading.gif");
      background-repeat: no-repeat;
      background-position: center;
      &:hover {
        background-color: #fff;
      }
    }
  }
  .stop-text {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    line-height: 1;
  }
}
</style>
