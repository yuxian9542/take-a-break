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
      @error="handleAudioError"
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
          // Detect if this is a completely new response
          // New response if: oldVal is empty/null, or first chunk data is different, or val is empty (reset)
          const isNewResponse = !oldVal || oldVal.length === 0 || 
                                (val && val.length > 0 && oldVal && oldVal.length > 0 && 
                                 val[0]?.data !== oldVal[0]?.data) ||
                                (!val || val.length === 0);
          
          if (isNewResponse && val && val.length > 0) {
            // New response started - reset everything
            console.log('options: New response detected, resetting state');
            // Stop playback first
            if (this.$refs.audoplayAudioRef) {
              this.$refs.audoplayAudioRef.endedPlay();
            }
            if (this.currentUrl) {
              URL.revokeObjectURL(this.currentUrl);
            }
            // Reset all state
            this.isPlaying = false;
            this.currentUrl = "";
            this.playedEnd = true;
            this.playIndex = 0;
            this.audioDataList = val.map(item => ({ data: item.data }));
            this.cacheChunkArr = [];
            // Don't trigger playback here - let audioDataList watcher handle initial playback
            return;
          }
          
          // Append new chunks to existing response
          if (val && val.length > 0) {
            // Check if this is a new chunk (different from what we already have)
            const existingLength = this.audioDataList.length;
            if (val.length > existingLength) {
              // Append only the new chunks
              for (let i = existingLength; i < val.length; i++) {
                if (val[i]?.data) {
                  this.audioDataList.push({ data: val[i].data });
                  this.lastChunkReceivedTime = Date.now(); // Update timestamp when chunk arrives
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
              // Don't trigger playback here - let audioDataList watcher handle initial playback
              this.audioDataList = val.map(item => ({ data: item.data }));
            }
          } else if (!val || val.length === 0) {
            // Options cleared - reset state
            console.log('options: Options cleared, resetting state');
            this.resetStatus();
            this.audioDataList = [];
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
      handler(val, oldVal) {
        console.log("audioDataList changed", val?.length, "isPlaying:", this.isPlaying, "playIndex:", this.playIndex, "autoplay:", this.autoplay);
        if (val && val.length > 0) {
          // Only start playback if this is the initial load (oldVal is empty/null)
          // Don't trigger playback when chunks are appended - let onFinish and options watcher handle continuation
          const isInitialLoad = !oldVal || oldVal.length === 0;
          
          if (isInitialLoad) {
            // Start playing from index 0
            const hasData = val[0]?.data; // Use index 0, not this.playIndex
            console.log("Checking autoplay conditions (initial load):", {
              autoplay: this.autoplay,
              hasData: !!hasData,
              isPlaying: this.isPlaying,
              playIndex: 0
            });
            if (this.autoplay && hasData && !this.isPlaying) {
              console.log("Starting autoplay!");
              this.isPlaying = true;
              this.playedEnd = false;
              this.playIndex = 0; // Ensure playIndex starts at 0
              this.lastChunkReceivedTime = Date.now(); // Initialize timestamp
              this.playAudio(val[0].data); // Use index 0
            }
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

        // When response is complete, check if we need to continue playing remaining chunks
        // Don't reset immediately - let onFinish handle it after all chunks are played
        this.$nextTick(() => {
          // Only concat audios for PCM, for MP3 we play chunks sequentially
          if (this.outputType === OUTPUT_TYPE.PCM) {
            this.concatAudios();
          } else {
            // For MP3, check if there are remaining chunks to play
            // Only resume if we're not currently playing and there are chunks left
            if (this.playIndex < this.audioDataList.length && !this.isPlaying && !this.currentUrl) {
              const nextChunk = this.audioDataList[this.playIndex];
              if (nextChunk?.data) {
                console.log(`canConnect: Resuming playback of remaining chunks. playIndex=${this.playIndex}, total=${this.audioDataList.length}`);
                this.isPlaying = true;
                this.playedEnd = false;
                this.playAudio(nextChunk.data);
              }
            }
            // Don't reset here - let onFinish handle it when all chunks are actually played
          }
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
    // Clear any pending reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
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
      // Only handle PCM - MP3 chunks are played directly via playAudio()
      if (this.outputType === OUTPUT_TYPE.PCM) {
        try {
          const audioBase64Arr = this.audioDataList.map((item) => item.data);
          this.totalUrl = convertPCMBase64ToUrl(audioBase64Arr.flat(), this.sampleRate);
        } catch (err) {
          console.error("PCM synthesis failed", err);
          this.synthesisError(); // 合成失败
        }
      } else {
        // MP3 output type - chunks are played directly, no synthesis needed
        console.warn("concatAudios() called for MP3 output type - this should not happen");
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
          // Validate data before creating blob
          if (!data || typeof data !== 'string') {
            throw new Error('Invalid MP3 data');
          }
          const blob = base64ToBlob(data, 'audio/mpeg');
          if (!blob || blob.size === 0) {
            throw new Error('Empty MP3 blob');
          }
          this.currentUrl = URL.createObjectURL(blob);
        } else if (this.outputType === OUTPUT_TYPE.PCM) {
          this.currentUrl = convertPCMBase64ToUrl(data, this.sampleRate);
        }
        // DON'T increment playIndex here - do it in onFinish after audio completes
      } catch (error) {
        console.error('playAudio error:', error);
        // Don't show synthesis error for playback failures - just log and continue
        // The error might be temporary (network issue, incomplete chunk, etc.)
        console.warn('Failed to play audio chunk, will retry with next chunk');
        // Clear current URL and mark as not playing so next chunk can be tried
        if (this.currentUrl) {
          URL.revokeObjectURL(this.currentUrl);
        }
        this.currentUrl = "";
        this.isPlaying = false;
        // Don't call stopAudio() as it resets everything - just wait for next chunk
      }
    },
    // 播放结束
    onFinish() {
      console.log(`onFinish: playIndex=${this.playIndex}, audioDataList.length=${this.audioDataList.length}, canConnect=${this.canConnect}, isPlaying=${this.isPlaying}`);
      
      // Increment playIndex AFTER current chunk finishes playing
      this.playIndex++;
      
      // Check if there's a next chunk to play
      const nextData = this.audioDataList[this.playIndex];
      if (nextData?.data) {
        // There's more data - play it immediately
        console.log(`onFinish: Playing next chunk ${this.playIndex}`);
        this.playAudio(nextData.data);
        return;
      }
      
      // No more chunks available at current playIndex
      // Just wait - options watcher will resume when new chunks arrive
      console.log(`onFinish: No next chunk. Waiting for more. playIndex=${this.playIndex}, length=${this.audioDataList.length}, canConnect=${this.canConnect}`);
      this.isPlaying = false;
      this.currentUrl = ""; // Clear so options watcher can resume when new chunks arrive
      
      // Only reset if response is complete AND we've played all chunks
      // No timer needed - if chunks arrive, options watcher handles it
      if (this.canConnect && this.playIndex >= this.audioDataList.length) {
        // Response complete and all chunks played - reset immediately
        console.log('onFinish: Response complete and all chunks played, resetting');
        this.resetStatus();
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
    // 处理音频播放错误
    handleAudioError() {
      console.warn('Audio playback error - chunk may be corrupted or incomplete, trying next chunk');
      // Don't show error to user - just try next chunk
      // This is common on mobile with network issues
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl);
      }
      this.currentUrl = "";
      this.isPlaying = false;
      // Try next chunk if available
      this.$nextTick(() => {
        const nextData = this.audioDataList[this.playIndex];
        if (nextData?.data) {
          this.playAudio(nextData.data);
        }
      });
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying;
    },
    // 重置相关状态
    resetStatus() {
      // Clear any pending reset timer
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
        this.resetTimer = null;
      }
      // Stop any currently playing audio
      if (this.$refs.audoplayAudioRef) {
        this.$refs.audoplayAudioRef.endedPlay();
      }
      // Revoke old URL to free memory
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl);
      }
      this.isPlaying = false; // 重置播放状态
      this.currentUrl = ""; // 重置播放地址
      this.playedEnd = true; // 重置播放结束状态
      this.playIndex = 0; // 重置播放索引
      this.audioDataList = []; // Clear audio data list
      this.cacheChunkArr = []; // Clear cache
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
