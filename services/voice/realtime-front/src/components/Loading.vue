<template>
  <div class="loading">
    <div class="loading__dot"></div>
    <div class="loading__dot" style="animation-delay: 0.2s"></div>
    <div class="loading__dot" style="animation-delay: 0.4s"></div>
    <div class="loading__dot" style="animation-delay: 0.6s"></div>
    <div class="loading__dot" style="animation-delay: 0.8s"></div>
    <p class="mt10">连接中，请稍后...</p>
  </div>
</template>

<style lang="less" scoped>
.loading {
  padding: 20px 16px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid var(--va-soft-border);
  box-shadow: 0 12px 30px -22px rgba(0, 0, 0, 0.28);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  p {
    color: var(--va-text-sub);
    font-size: 14px;
    line-height: 22px;
  }
  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    animation: bounce 2s infinite;
    margin: 0 2px;
  }
  /* 定义关键帧动画 */
  @keyframes bounce {
    0%,
    100% {
      transform: scale(0.5);
      background: linear-gradient(135deg, #bae6fd, #60a5fa);
    }
    50% {
      transform: scale(1);
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
    }
  }
}
</style>
