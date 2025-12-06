<template>
  <div class="mic-control">
    <button
      class="mic-button"
      :class="{
        'is-recording': state === 'recording',
        'is-disabled': disabled,
        'is-connecting': connecting,
      }"
      type="button"
      :disabled="disabled"
      @click="$emit('toggle')"
    >
      <span class="ring ring-1"></span>
      <span class="ring ring-2"></span>
      <span class="ring ring-3"></span>
      <span class="glow"></span>
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line stroke-linecap="round" stroke-linejoin="round" x1="12" y1="19" x2="12" y2="23" />
          <line stroke-linecap="round" stroke-linejoin="round" x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </span>
    </button>
    <div class="mic-copy">
      <div class="mic-copy__title">{{ label }}</div>
      <div class="mic-copy__hint">{{ hint }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MicButton",
  props: {
    state: {
      type: String,
      default: "idle", // idle | recording | disabled
    },
    connecting: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "Tap to speak",
    },
    hint: {
      type: String,
      default: "Hold a moment of silence to stop",
    },
  },
};
</script>

<style scoped lang="less">
.mic-control {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
}

.mic-button {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at 40% 35%, rgba(134, 214, 255, 0.4), rgba(51, 96, 255, 0.7));
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.25s ease, opacity 0.2s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), 0 0 40px rgba(97, 164, 255, 0.35);
}

.mic-button:active {
  transform: scale(0.97);
}

.mic-button.is-disabled,
.mic-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mic-button .icon {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 48px;
}

.mic-button svg {
  width: 54px;
  height: 54px;
}

.glow {
  position: absolute;
  inset: 24px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0));
  border-radius: 50%;
  z-index: 1;
  mix-blend-mode: screen;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 0;
  opacity: 0;
}

.ring-1 {
  animation: pulse 2.8s ease-in-out infinite;
}

.ring-2 {
  animation: pulse 2.8s ease-in-out 0.5s infinite;
}

.ring-3 {
  animation: pulse 2.8s ease-in-out 1s infinite;
}

.mic-button.is-recording {
  background: radial-gradient(circle at 60% 40%, rgba(255, 94, 170, 0.55), rgba(255, 56, 102, 0.85));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(255, 111, 182, 0.5);
}

.mic-button.is-recording .ring {
  border-color: rgba(255, 122, 195, 0.5);
  opacity: 1;
}

.mic-button.is-connecting {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(86, 176, 255, 0.4);
}

.mic-copy {
  text-align: center;
  color: #eef3ff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
}

.mic-copy__title {
  font-size: 15px;
  letter-spacing: 0.3px;
  font-weight: 700;
}

.mic-copy__hint {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.65;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}
</style>
