<template>
  <div class="voice-shell">
    <header class="voice-shell__header">
      <div>
        <p class="voice-shell__tag">Voice</p>
        <h1>Live Voice Chat</h1>
        <p class="voice-shell__subtitle">
          Talk with the AI companion while it quietly considers nearby spots for your next break.
        </p>
      </div>
      <div class="voice-shell__actions">
        <button
          class="voice-shell__btn voice-shell__btn--primary"
          :disabled="isConnecting || isConnected"
          @click="$emit('start')"
        >
          {{ isConnecting ? "Connecting..." : "Start" }}
        </button>
        <button class="voice-shell__btn" :disabled="!isConnected" @click="$emit('stop')">Stop</button>
      </div>
    </header>

    <section class="voice-shell__status">
      <div class="status-pill" :class="statusClass">
        <span class="dot" />
        <span>
          {{
            locationStatus === 'granted'
              ? 'Browser location live'
              : locationStatus === 'loading'
                ? 'Getting location...'
                : locationStatus === 'denied'
                  ? 'Location denied — using fallback'
                  : locationStatus === 'error'
                    ? 'Location unavailable — using fallback'
                    : 'Location idle'
          }}
        </span>
      </div>
      <div class="status-message" v-if="locationError">ℹ️ {{ locationError }}</div>
      <button class="voice-shell__btn voice-shell__btn--ghost" @click="$emit('refreshLocation')">Retry location</button>
      <div class="status-message" v-if="systemPrompt">
        Context ready for model prompt. {{ promptPreview }}
      </div>
    </section>

    <section class="voice-shell__body">
      <slot />
    </section>
  </div>
</template>

<script>
export default {
  name: "VoiceShell",
  props: {
    isConnecting: Boolean,
    isConnected: Boolean,
    locationStatus: {
      type: String,
      default: "idle",
    },
    locationError: {
      type: String,
      default: null,
    },
    systemPrompt: {
      type: String,
      default: null,
    },
  },
  computed: {
    statusClass() {
      if (this.locationStatus === "granted") return "status-pill--ok";
      if (this.locationStatus === "loading") return "status-pill--warn";
      return "status-pill--neutral";
    },
    promptPreview() {
      if (!this.systemPrompt) return "";
      return this.systemPrompt.length > 80
        ? `${this.systemPrompt.slice(0, 80)}...`
        : this.systemPrompt;
    },
  },
};
</script>

<style scoped>
.voice-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.voice-shell__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.voice-shell__tag {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  margin: 0 0 4px;
  color: #38bdf8;
}

.voice-shell__subtitle {
  margin: 4px 0 0;
  color: #94a3b8;
}

.voice-shell__actions {
  display: flex;
  gap: 8px;
}

.voice-shell__btn {
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.voice-shell__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voice-shell__btn--primary {
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  border: none;
  color: #0b1220;
}

.voice-shell__btn--ghost {
  border-style: dashed;
}

.voice-shell__status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  font-weight: 600;
}

.status-pill--ok {
  border-color: #22c55e;
}

.status-pill--warn {
  border-color: #f59e0b;
}

.status-pill--neutral {
  border-color: #475569;
}

.status-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-message {
  color: #cbd5e1;
  font-size: 14px;
}

.voice-shell__body {
  background: #0b1220;
  border: 1px solid #1f2937;
  border-radius: 20px;
  padding: 16px;
}
</style>
