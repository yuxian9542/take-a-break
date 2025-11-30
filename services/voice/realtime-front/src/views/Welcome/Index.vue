<template>
  <div class="va-page welcome-page">
    <div class="app-container welcome-card">
      <header class="header">
        <div class="header-left">
          <div class="app-subtitle">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            AI Voice Assistant
          </div>
          <div class="app-title">Voice Companion</div>
        </div>
        <div class="header-right">
          <div class="status-badge ready">
            <span class="status-dot"></span>
            Ready
          </div>
        </div>
      </header>

      <div class="view-wrapper">
        <div class="view-welcome">
          <div class="hero-section">
            <button class="mic-button-large" type="button" @click="startChat()">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
            <div class="hero-text">
              <div class="hero-title">Ready to start chatting?</div>
              <div class="hero-sub">Tap the mic or pick a topic below</div>
            </div>
          </div>

          <div class="suggestions-section">
            <div class="suggestions-title">💡 Suggested topics</div>
            <button
              v-for="item in suggestions"
              :key="item.title"
              type="button"
              class="suggestion-card-v"
              @click="startChat(item.prompt)"
            >
              <div class="card-icon" :aria-label="item.title">{{ item.emoji }}</div>
              <div class="card-info">
                <div class="card-title">{{ item.title }}</div>
                <div class="card-desc">{{ item.desc }}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="bottom-interaction-area">
        <button class="talk-btn" type="button" @click="startChat()">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
          Start a conversation
        </button>
        <div class="hint-text">Tap to begin a voice chat with AI</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const suggestions = [
  { title: 'Vent about your boss', desc: 'Let it out, I am listening', emoji: '😤', prompt: 'Vent about your boss' },
];

const startChat = (prompt) => {
  const redirect = prompt ? `/conversation?prompt=${encodeURIComponent(prompt)}` : '/conversation';

  router.push({
    path: '/login',
    query: { redirect },
  });
};
</script>

<style scoped lang="less">
.welcome-page {
  background: var(--bg-color);
}

.welcome-card {
  background: var(--card-bg);
}

.header {
  padding: 20px 24px 10px 24px;
  padding-top: max(20px, env(safe-area-inset-top));
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--card-bg);
  z-index: 10;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-subtitle {
  font-size: 0.85rem;
  color: var(--text-sub);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
  letter-spacing: -0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-badge.ready {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.status-badge.ready .status-dot {
  background: #10b981;
}

.view-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.view-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 28px;
  animation: fadeIn 0.4s ease;
  background: var(--card-bg);
}

.hero-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.mic-button-large {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-btn);
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 40px;
  position: relative;
}

.mic-button-large::before {
  content: "";
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
  z-index: -1;
  border-radius: 50%;
}

.mic-button-large:active {
  transform: scale(0.95);
}

.mic-button-large svg {
  width: 50px;
  height: 50px;
  color: white;
}

.hero-text {
  text-align: center;
}

.hero-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.hero-sub {
  font-size: 0.9rem;
  color: var(--text-sub);
}

.suggestions-section {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestions-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestion-card-v {
  width: 100%;
  border: 1px solid #f3f4f6;
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s ease;
  background: #fff;
}

.suggestion-card-v:active {
  transform: scale(0.98);
  background: #f9fafb;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fff1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-info {
  flex: 1;
  text-align: left;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 0.85rem;
  color: var(--text-sub);
}

.bottom-interaction-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--card-bg);
  padding-bottom: max(30px, env(safe-area-inset-bottom));
  border-top: 1px solid #f3f4f6;
}

.talk-btn {
  width: 100%;
  height: 56px;
  border-radius: 28px;
  border: none;
  background: #22c55e;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
}

.talk-btn:active {
  transform: scale(0.98);
}

.hint-text {
  font-size: 0.85rem;
  color: var(--text-sub);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
