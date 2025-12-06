<template>
  <div class="subtitle-layer" :class="`align-${align}`">
    <transition-group name="subtitle-fade" tag="div" class="subtitle-list">
      <div
        v-for="item in displayMessages"
        :key="item.key"
        class="subtitle-line"
        :class="{ 'is-user': item.isUser }"
      >
        <span class="subtitle-label">{{ item.isUser ? "YOU" : "AI" }}</span>
        <p class="subtitle-text">{{ item.text }}</p>
      </div>
    </transition-group>

    <div class="sr-audio" aria-hidden="true">
      <OutputAudio
        v-for="(item, index) in audioMessages"
        :key="`${item.id}-${index}`"
        ref="outputRefs"
        :options="item.audioData"
        :status="item.answerStatus"
        :readonly="true"
      />
    </div>
  </div>
</template>

<script>
import OutputAudio from "@/components/OutputAudio.vue";
import emitter from "@/utils/event";
import { MSG_TYPE, RESPONSE_TYPE } from "@/constants/modules/audioVideoCall";

export default {
  name: "SubtitleTranscript",
  components: { OutputAudio },
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
    maxItems: {
      type: Number,
      default: 3,
    },
    align: {
      type: String,
      default: "center",
    },
  },
  data() {
    return {
      MSG_TYPE,
      RESPONSE_TYPE,
    };
  },
  computed: {
    displayMessages() {
      const trimmed = this.messages
        .map((msg) => {
          const text = Array.isArray(msg.textContent)
            ? msg.textContent.join("").trim()
            : (msg.textContent || "").toString();
          return {
            key: `${msg.id}-${text?.slice(0, 12) || "line"}`,
            id: msg.id,
            text,
            isUser: msg.type === this.MSG_TYPE.CLIENT,
          };
        })
        .filter((item) => item.text && item.text.length > 0);

      return trimmed.slice(-this.maxItems);
    },
    audioMessages() {
      const audioMsgs = this.messages.filter(
        (msg) =>
          msg.type === this.MSG_TYPE.SERVER &&
          msg.responseType === this.RESPONSE_TYPE.AUDIO &&
          Array.isArray(msg.audioData) &&
          msg.audioData.length > 0
      );
      return audioMsgs.slice(-6);
    },
  },
  mounted() {
    emitter.on("onStopAudio", this.stopAudio);
  },
  beforeUnmount() {
    emitter.off("onStopAudio", this.stopAudio);
  },
  methods: {
    stopAudio() {
      const refs = this.$refs.outputRefs || [];
      refs.forEach((comp) => {
        if (comp && typeof comp.stopAudio === "function") {
          comp.stopAudio();
        }
      });
    },
  },
};
</script>

<style scoped lang="less">
.subtitle-layer {
  width: min(960px, 96vw);
  margin: 0 auto;
  padding: 12px 18px 18px;
  position: relative;
  z-index: 2;
  pointer-events: none;
  color: #f7fbff;
  text-align: center;
}

.subtitle-layer.align-left {
  text-align: left;
}

.subtitle-layer.align-right {
  text-align: right;
}

.subtitle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtitle-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: center;
  padding: 10px 14px;
  background: rgba(6, 11, 26, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35), 0 0 40px rgba(74, 145, 255, 0.15);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  animation: subtitle-life 9s ease forwards;
}

.subtitle-line.is-user {
  background: rgba(45, 109, 255, 0.18);
  border-color: rgba(118, 169, 255, 0.26);
  align-self: flex-end;
}

.subtitle-label {
  font-size: 11px;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 700;
}

.subtitle-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.6);
}

.subtitle-fade-enter-active,
.subtitle-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.subtitle-fade-enter-from,
.subtitle-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.sr-audio {
  position: absolute;
  inset: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@keyframes subtitle-life {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-12px);
  }
}
</style>
