<template>
  <div class="starfield">
    <canvas ref="canvas" class="starfield__canvas"></canvas>
    <div class="starfield__glow"></div>
  </div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from "vue";

export default {
  name: "StarfieldBackground",
  setup() {
    const canvas = ref(null);
    let ctx = null;
    let animationFrame = null;
    let stars = [];

    const createStars = () => {
      if (!canvas.value) return;
      const density = (window.innerWidth * window.innerHeight) / 9000;
      const count = Math.min(420, Math.max(140, Math.floor(density)));
      const { width, height } = canvas.value;

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.2 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        alpha: Math.random() * 0.5 + 0.4,
      }));
    };

    const resizeCanvas = () => {
      if (!canvas.value) return;
      canvas.value.width = window.innerWidth;
      canvas.value.height = window.innerHeight;
      createStars();
    };

    const draw = () => {
      if (!ctx || !canvas.value) return;
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        star.x += Math.sin(star.y * 0.002) * 0.2;
        if (star.y > canvas.value.height) {
          star.y = -2;
          star.x = Math.random() * canvas.value.width;
        }
      });

      animationFrame = requestAnimationFrame(draw);
    };

    onMounted(() => {
      if (!canvas.value) return;
      ctx = canvas.value.getContext("2d");
      resizeCanvas();
      draw();
      window.addEventListener("resize", resizeCanvas);
    });

    onBeforeUnmount(() => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    });

    return { canvas };
  },
};
</script>

<style scoped>
.starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 20% 20%, rgba(68, 92, 255, 0.1), transparent 30%),
    radial-gradient(circle at 80% 10%, rgba(212, 96, 255, 0.12), transparent 32%),
    #03040a;
  overflow: hidden;
}

.starfield__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.35));
}

.starfield__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 70%, rgba(93, 203, 255, 0.08), transparent 45%),
    radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.05), transparent 38%),
    linear-gradient(180deg, rgba(3, 4, 10, 0) 0%, rgba(3, 4, 10, 0.45) 100%);
  pointer-events: none;
  mix-blend-mode: screen;
}
</style>
