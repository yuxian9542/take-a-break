<template>
  <section class="idle-screen">
    <div class="eyebrow">Memory Stardust</div>
    <h1>{{ title }}</h1>
    <p class="subtitle">{{ subtitle }}</p>
    <button class="cta" type="button" @click="$emit('start')">
      {{ ctaText }}
    </button>
    <div class="status">{{ statusText }}</div>
  </section>
</template>

<script>
export default {
  name: "IdleScreen",
  props: {
    title: {
      type: String,
      default: "Memory Stardust",
    },
    subtitle: {
      type: String,
      default:
        "A sanctuary for your moments. We turn your memories into stardust and keep the stories they hold.",
    },
    ctaText: {
      type: String,
      default: "Start a Memory",
    },
    statusText: {
      type: String,
      default: "Ready",
    },
  },
};
</script>

<style scoped lang="less">
.idle-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px 10px;
  text-align: center;
  color: #f3f6ff;
  max-width: 720px;
  margin: 0 auto;
  z-index: 2;
}

.eyebrow {
  font-size: 14px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
}

h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 64px);
  font-weight: 700;
  letter-spacing: -0.6px;
  text-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.subtitle {
  margin: 0;
  max-width: 640px;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(235, 242, 255, 0.85);
}

.cta {
  margin-top: 6px;
  padding: 14px 28px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, #5dc6ff 0%, #7a5dff 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 16px 40px rgba(74, 145, 255, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta:active {
  transform: translateY(1px) scale(0.99);
}

.status {
  margin-top: 6px;
  font-size: 13px;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.55);
}
</style>
