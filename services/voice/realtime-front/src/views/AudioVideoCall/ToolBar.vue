<template>
  <div class="tool-bar flex flex-center">
    <el-tooltip placement="top" :disabled="currentAudioStatus === mediaStatus.DISABLED">
      <!-- 使用具名插槽传递内容 -->
      <template #content>
        {{ audioTip }}
      </template>
      <i
        class="iconfont pointer icon-voice1"
        :class="{
          opened: currentAudioStatus === mediaStatus.OPENED,
          unclose: currentAudioStatus === mediaStatus.UNCLOSE,
          disabled: currentAudioStatus === mediaStatus.DISABLED,
        }"
        @click="handleAudio"
      ></i>
    </el-tooltip>
    <!-- Video button removed - only audio mode supported -->
    <div class="tool-bar__content flex1 flex flex-center">
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
      <!-- 使用具名插槽传递内容 -->
      <template #content>
        {{ connectTip }}
      </template>
      <i
        v-if="currentBarStatus === toolBarStatus.DISCONNECTED"
        class="iconfont pointer icon-connect"
        @click="clearAndConnect"
      ></i>
      <i
        v-else-if="currentBarStatus === toolBarStatus.DISCONNECTING"
        class="iconfont pointer icon-loading"
      ></i>
      <i v-else class="iconfont pointer icon-disconnect" @click="handleDisconnect"></i>
    </el-tooltip>
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
          return "Connection disconnected";
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
  height: 50px;
  border-radius: 8px;
  border: 1px solid var(--boxBorderColor-1);
  padding: 0 8px;
  gap: 4px;
  &__content {
    margin: 0 4px;
    border-radius: 8px;
    background: #f7f8fa;
    height: 36px;
    img {
      height: 32px;
    }
    label {
      color: #8d8e99;
      font-size: 16px;
      &.ready {
        color: #4082f5;
      }
      &.disconnected {
        color: #f01d24;
      }
    }
  }
  i {
    display: block;
    font-size: 26px;
    color: #5d6e7f;
    width: 36px;
    height: 36px;
    line-height: 36px;
    border-radius: 6px;
    &.icon-loading {
      background-image: url("@/assets/images/loading.gif");
      background-repeat: no-repeat;
      background-position: center;
      &:hover {
        background-color: #fff;
      }
    }
    &:hover {
      background-color: rgba(19, 18, 18, 0.05);
    }
    &.opened {
      color: #f1343a;
      background-color: rgba(241, 52, 58, 0.08);
      &:hover {
        background-color: rgba(241, 52, 58, 0.12);
      }
    }
    &.unclose {
      color: #f1343a;
      background-color: rgba(241, 52, 58, 0.08);
      &:hover {
        background-color: rgba(241, 52, 58, 0.12);
      }
      opacity: 0.4;
    }
    &.disabled {
      color: #c3c4cc;
      cursor: not-allowed;
      &:hover {
        background-color: #fff;
      }
    }
  }
}
</style>
