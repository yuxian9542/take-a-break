<template>
  <section class="memory-preview">
    <div class="card">
      <div class="card__particle card__particle--left"></div>
      <div class="card__particle card__particle--right"></div>
      <div class="card__image" :style="{ backgroundImage: imageGradient }">
        <div class="card__mask"></div>
      </div>
      <div class="card__copy">
        <div class="eyebrow">Memory Frame</div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
        <div class="actions">
          <button class="ghost" type="button" @click="$emit('try-another')">Try Another</button>
          <button class="solid" type="button" @click="$emit('visualize')">
            {{ ctaText }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "MemoryPreview",
  props: {
    title: {
      type: String,
      default: "Your Memory Awaits",
    },
    description: {
      type: String,
      default: "Choose the story you want to revisit. Particles stream outward, ready to become words.",
    },
    gradient: {
      type: String,
      default: "linear-gradient(135deg, #7c8aff 0%, #2a2c60 50%, #0f152f 100%)",
    },
    ctaText: {
      type: String,
      default: "Visualize Memory",
    },
  },
  computed: {
    imageGradient() {
      return this.gradient ? `${this.gradient}, radial-gradient(circle, rgba(255,255,255,0.1), rgba(0,0,0,0))` : "";
    },
  },
};
</script>

<style scoped lang="less">
.memory-preview {
  display: flex;
  justify-content: center;
  padding: 24px 12px 12px;
  color: #f1f4ff;
  width: 100%;
  z-index: 2;
}

.card {
  position: relative;
  width: min(1040px, 96vw);
  background: rgba(10, 15, 34, 0.7);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 320px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(14px);
}

.card__image {
  position: relative;
  background-size: cover;
  background-position: center;
  min-height: 320px;
}

.card__mask {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.08), transparent 30%),
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.08), transparent 35%),
    linear-gradient(180deg, rgba(12, 17, 36, 0.5), rgba(10, 13, 28, 0.8));
}

.card__copy {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 700;
}

p {
  margin: 0;
  color: rgba(235, 240, 255, 0.78);
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.actions button {
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #eaf1ff;
  background: transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.actions .ghost:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
}

.actions .solid {
  background: linear-gradient(135deg, #6ddcff 0%, #7f60ff 100%);
  box-shadow: 0 14px 34px rgba(91, 150, 255, 0.35);
}

.actions .solid:active {
  transform: translateY(1px);
}

.card__particle {
  position: absolute;
  width: 180px;
  height: 320px;
  top: 0;
  filter: blur(8px);
  opacity: 0.75;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 55%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.card__particle--left {
  left: -80px;
  animation: drift 6s ease-in-out infinite alternate;
}

.card__particle--right {
  right: -80px;
  animation: drift 7s ease-in-out 0.5s infinite alternate;
}

@keyframes drift {
  from {
    transform: translateY(0) translateX(0);
    opacity: 0.7;
  }
  to {
    transform: translateY(-18px) translateX(12px);
    opacity: 0.35;
  }
}

@media (max-width: 900px) {
  .card {
    grid-template-columns: 1fr;
  }
  .card__image {
    min-height: 200px;
  }
}
</style>
