<template>
  <div class="output-audio">
    <AudioBox
      v-if="totalUrl && playedEnd"
      :audioUrl="totalUrl"
      audioType="output"
      width="100%"
      height="36"
      :options="{
        normalize: false,
        autoplay: false,
      }"
      :zoomable="false"
    />
    <span v-if="errorText" class="error-text">{{ errorText }}</span>
    <img
      v-if="showLoading && !errorText"
      class="audio-loading"
      src="@/assets/images/output-loading.gif"
      alt=""
    />
    <AudioBox
      class="auto-play-audio"
      v-if="currentUrl"
      ref="audoplayAudioRef"
      :key="currentUrl"
      audioType="output"
      :options="{
        normalize: false,
        autoplay: true,
        backend: 'WebAudio',
      }"
      :audioUrl="currentUrl"
      :zoomable="false"
      @finish="onFinish"
      @audioprocess="audioprocess"
    />
  </div>
</template>

<script>
import { base64ToArrayBuffer, base64ToBlob, convertPCMBase64ToUrl } from "@/utils/stream";
import AudioBox from "@/components/AudioBox.vue";
import {
  ANSWER_STATUS, // 回答结果状态
  OUTPUT_TYPE, // 输出音频格式
} from "@/constants/modules/audioVideoCall";
import AudioManagerClass from "@/utils/audio/index";

export default {
  name: "OutputAudio",
  components: { AudioBox },
  props: {
    options: {
      type: Array,
      default: undefined,
    },
    status: {
      type: String,
      default: "",
    },
    autoplay: {
      type: Boolean,
      default: true,
    },
    outputType: {
      type: String,
      default: OUTPUT_TYPE.PCM,
    },
  },
  data() {
    return {
      cacheChunkSize: 200000, // 缓存音频数据的大小 (单位：字节)
      cacheChunkArr: [], // 缓存音频数据数组
      audioDataList: [], // 音频数据列表
      sampleRate: 24000, // 采样率
      totalUrl: "",
      currentIndex: 0,
      playedEnd: true,
      isPlaying: false,
      queueList: [],
      playIndex: 0,
      errorText: "",
      currentUrl: "",
      canAutoPlay: false, // 是否可以自动播放
    };
  },
  computed: {
    showLoading() {
      return !(this.totalUrl && this.playedEnd);
    },
    canConnect() {
      return this.status === ANSWER_STATUS.COMPLETE || this.status === ANSWER_STATUS.STOP;
    },
  },
  watch: {
    options: {
      handler(val, oldVal) {
        if (this.outputType === OUTPUT_TYPE.MP3) {
          // Append new chunks instead of replacing the entire array
          if (val && val.length > 0) {
            // Check if this is a new chunk (different from what we already have)
            const existingLength = this.audioDataList.length;
            if (val.length > existingLength) {
              // Append only the new chunks
              for (let i = existingLength; i < val.length; i++) {
                if (val[i]?.data) {
                  this.audioDataList.push({ data: val[i].data });
                  console.log(`options: Appended chunk ${i} to audioDataList, total chunks: ${this.audioDataList.length}`);
                }
              }
              // If we're waiting for more chunks (playIndex < audioDataList.length), continue playing
              // This handles the case where onFinish was called but no next chunk was available yet
              if (this.playIndex < this.audioDataList.length && this.autoplay && !this.isPlaying) {
                const nextChunk = this.audioDataList[this.playIndex];
                if (nextChunk?.data) {
                  console.log(`options: Resuming playback from chunk ${this.playIndex} (was waiting for more chunks)`);
                  this.isPlaying = true;
                  this.playedEnd = false;
                  this.playAudio(nextChunk.data);
                }
              }
            } else if (existingLength === 0 && val.length > 0) {
              // First time receiving data, initialize the list
              this.audioDataList = val.map(item => ({ data: item.data }));
            }
          }
        } else if (this.outputType === OUTPUT_TYPE.PCM) {
          if (val?.length > 0) {
            this.cacheChunkArr.push(val[val.length - 1].data);
            if (this.cacheChunkArr.join(",").length >= this.cacheChunkSize) {
              this.audioDataList.push({ data: this.cacheChunkArr });
              this.cacheChunkArr = [];
            }
            console.log("options", this.cacheChunkArr);
          }
        }
      },
      immediate: true,
      deep: true,
    },
    audioDataList: {
      handler(val) {
        console.log("audioDataList changed", val?.length, "isPlaying:", this.isPlaying, "playIndex:", this.playIndex, "autoplay:", this.autoplay);
        if (val && val.length > 0) {
          // 设置了自动播放，且满足播放条件，则开始播放
          const hasData = val[this.playIndex]?.data;
          console.log("Checking autoplay conditions:", {
            autoplay: this.autoplay,
            hasData: !!hasData,
            isPlaying: this.isPlaying,
            playIndex: this.playIndex
          });
          if (this.autoplay && hasData && !this.isPlaying) {
            console.log("Starting autoplay!");
            this.isPlaying = true;
            this.playedEnd = false;
            this.playAudio(val[this.playIndex].data);
          }
        }
      },
      immediate: true,
      deep: true,
    },
    canConnect(val) {
      if (val) {
        // 追加末尾的音频数据
        if (this.cacheChunkArr.length > 0 && this.outputType === OUTPUT_TYPE.PCM) {
          this.audioDataList.push({ data: this.cacheChunkArr });
          this.cacheChunkArr = [];
        }

        this.$nextTick(() => {
          this.concatAudios();
        });
      }
    },
    playedEnd(val) {
      if (val) {
        this.$emit("onStopped");
      } else {
        this.$emit("onPlayed");
      }
    },
  },
  created() {
    if (!this.audioManager) {
      this.audioManager = new AudioManagerClass();
    }
    this.$cacheTimes = [];
  },
  beforeDestroy() {
    if (this.audioManager) {
      this.audioManager.close();
      this.audioManager = null;
    }
    if (this.totalUrl) {
      URL.revokeObjectURL(this.totalUrl);
    }
  },
  methods: {
    // 合成音频
    concatAudios() {
      if (this.outputType === OUTPUT_TYPE.MP3) {
        const decodePromises = this.audioDataList
          .filter((item) => !!item?.data)
          .map((item) => {
            try {
              const buffer = base64ToArrayBuffer(item.data);
              return this.audioManager.decodeAudioData(buffer);
            } catch (err) {
              console.warn("decodeAudioData: base64 解析失败，跳过该分片", err);
              return Promise.reject(err);
            }
          });

        Promise.allSettled(decodePromises)
          .then((results) => {
            const audioBuffers = results
              .filter((r) => r.status === "fulfilled" && !!r.value)
              .map((r) => r.value);

            // 若全部失败，则显示错误；部分失败则继续合成剩余的分片，避免整段报错
            if (!audioBuffers.length) {
              this.synthesisError();
              return;
            }

            const output = this.audioManager.concatAudio(audioBuffers);
            const { url } = this.audioManager.export(output, "audio/mp3");
            this.totalUrl = url;
            this.errorText = "";
          })
          .catch((err) => {
            console.log("合成失败", err);
            this.synthesisError(); // 合成失败
          });
      } else if (this.outputType === OUTPUT_TYPE.PCM) {
        try {
          const audioBase64Arr = this.audioDataList.map((item) => item.data);
          this.totalUrl = convertPCMBase64ToUrl(audioBase64Arr.flat(), this.sampleRate);
        } catch (err) {
          console.log("合成失败", err);
          this.synthesisError(); // 合成失败
        }
      }
    },
    // 合成失败
    synthesisError() {
      if (this.totalUrl) {
        URL.revokeObjectURL(this.totalUrl);
      }
      this.errorText = "Audio synthesis failed";
      this.currentUrl = "";
      this.totalUrl = "";
      this.playedEnd = true;
    },
    // 停止播放
    stopAudio() {
      this.$refs.audoplayAudioRef && this.$refs.audoplayAudioRef.endedPlay();
      this.cacheChunkArr = []; // 重置临时音频数据
      this.resetStatus(); // 重置状态
    },
    // 播放音频
    playAudio(data) {
      try {
        if (this.outputType === OUTPUT_TYPE.MP3) {
          const blob = base64ToBlob(data, 'audio/mpeg');
          this.currentUrl = URL.createObjectURL(blob);
        } else if (this.outputType === OUTPUT_TYPE.PCM) {
          this.currentUrl = convertPCMBase64ToUrl(data, this.sampleRate);
        }
        this.playIndex++;
      } catch (error) {
        console.error('playAudio error:', error);
        this.stopAudio();
      }
    },
    // 播放结束
    onFinish() {
      console.log(`onFinish: playIndex=${this.playIndex}, audioDataList.length=${this.audioDataList.length}, canConnect=${this.canConnect}`);
      const nextData = this.audioDataList[this.playIndex];
      if (nextData?.data) {
        console.log(`onFinish: Playing next chunk ${this.playIndex}`);
        this.playAudio(nextData.data);
      } else {
        if (this.canConnect) {
          // 全返回完成能拼接的状态，则重置所有状态
          console.log('onFinish: Response complete, resetting status');
          this.resetStatus();
        } else {
          // 没有全返回完成，只返回一段或几段音频，后面音频段则延迟比较久返回的情况
          // Set isPlaying to false but keep playIndex unchanged so we can resume when new chunks arrive
          console.log(`onFinish: Waiting for more chunks. Current playIndex=${this.playIndex}, audioDataList.length=${this.audioDataList.length}`);
          this.isPlaying = false;
          this.currentUrl = ""; // Clear current URL so options watcher knows we're waiting
        }
      }
    },
    // 播放进度
    audioprocess(time) {
      // 特殊处理： 针对自动播放时，发现音频时长为大于0，则判断为该浏览器支持自动播放
      if (this.playIndex === 1 && !this.canAutoPlay && this.autoplay && time > 0) {
        this.canAutoPlay = true;
        this.playedEnd = false;
      }
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying;
    },
    // 重置相关状态
    resetStatus() {
      this.isPlaying = false; // 重置播放状态
      this.currentUrl = ""; // 重置播放地址
      this.playedEnd = true; // 重置播放结束状态
      this.playIndex = 0; // 重置播放索引
    },
  },
};
</script>
<style lang="less" scoped>
.output-audio {
  min-width: 280px;
  max-width: 340px;
  width: 100%;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid var(--va-soft-border);
  border-radius: 16px;
  box-shadow: 0 12px 30px -22px rgba(0, 0, 0, 0.3);
  .error-text {
    margin: 2px 0;
    font-size: 12px;
    line-height: 22px;
    color: #f01d24;
  }
  ::v-deep .audio-box.output {
    background: #f7f8fb;
    border-color: var(--va-soft-border);
  }
}
.auto-play-audio {
  display: none;
}
.audio-loading {
  height: 24px;
  margin-right: 8px;
  user-select: none;
  appearance: none;
  -webkit-user-drag: none;
  user-drag: none;
  display: block;
}
</style>
