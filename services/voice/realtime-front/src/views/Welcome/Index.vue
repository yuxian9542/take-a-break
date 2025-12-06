<template>
  <MemoryLayout>
    <StarfieldBackground />
    <div class="welcome-shell">
      <div class="hero">
        <p class="eyebrow">Memory Stardust</p>
        <h1>Collect your moments in a night sky.</h1>
        <p class="lede">
          We turn your memories into stardust and keep the stories they hold. Start a voice session
          to let your thoughts drift.
        </p>
        <div class="cta-row">
          <button class="solid" type="button" @click="startChat()">Start a Memory</button>
          <button class="ghost" type="button" @click="startChat(suggestions[0].prompt)">
            Visualize Memory
          </button>
        </div>
        <div class="hint">Ready — tap to begin a voice chat with AI</div>
      </div>

      <div class="suggestions">
        <div class="suggestions-title">Suggested memories</div>
        <div class="suggestions-grid">
          <button
            v-for="item in suggestions"
            :key="item.title"
            type="button"
            class="suggestion-card"
            @click="startChat(item.prompt)"
          >
            <div class="icon">{{ item.emoji }}</div>
            <div class="copy">
              <div class="title">{{ item.title }}</div>
              <div class="desc">{{ item.desc }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </MemoryLayout>
</template>

<script setup>
import { useRouter } from 'vue-router';
import MemoryLayout from '@/components/memory/MemoryLayout.vue';
import StarfieldBackground from '@/components/memory/StarfieldBackground.vue';

const router = useRouter();

const suggestions = [
  { title: 'Vent about your boss', desc: 'Let it out, I am listening', emoji: '🌫️', prompt: 'Vent about your boss' },
  { title: 'Celebrate a small win', desc: 'Relive a happy detail from today', emoji: '✨', prompt: 'Share a small win from today' },
  { title: 'Store a memory', desc: 'Describe a picture in your mind', emoji: '🪞', prompt: 'Tell me about a vivid memory you want to keep' },
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
.welcome-shell {
  position: relative;
  min-height: 100vh;
  padding: 60px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  justify-content: center;
  color: #f4f8ff;
  z-index: 1;
  text-align: center;
}

.hero {
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.eyebrow {
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.7);
}

.hero h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 58px);
  font-weight: 800;
  letter-spacing: -0.6px;
}

.lede {
  margin: 0;
  color: rgba(235, 242, 255, 0.78);
  line-height: 1.65;
  font-size: 16px;
}

.cta-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.solid,
.ghost {
  padding: 14px 22px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f8fbff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.solid {
  background: linear-gradient(135deg, #6ddcff 0%, #7f60ff 100%);
}

.solid:active,
.ghost:active {
  transform: translateY(1px);
}

.hint {
  color: rgba(235, 242, 255, 0.65);
  font-size: 13px;
}

.suggestions {
  width: min(960px, 100%);
  background: rgba(9, 14, 28, 0.6);
  border-radius: 18px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.suggestions-title {
  text-align: left;
  margin: 0 0 12px 2px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: rgba(255, 255, 255, 0.85);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.suggestion-card {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #f1f4ff;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.copy .title {
  font-weight: 700;
}

.copy .desc {
  color: rgba(235, 242, 255, 0.7);
  font-size: 13px;
}

@media (max-width: 720px) {
  .welcome-shell {
    padding: 40px 16px;
    text-align: left;
    align-items: stretch;
  }
  .hero {
    text-align: left;
  }
  .cta-row {
    justify-content: flex-start;
  }
}
</style>
