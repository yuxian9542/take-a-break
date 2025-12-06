<template>
  <div class="memory-layout">
    <slot />
  </div>
</template>

<script>
export default {
  name: "MemoryLayout",
};
</script>

<style scoped lang="less">
.memory-layout {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background: #03040a;
  color: #f4f7ff;
  overflow-x: hidden;
}
</style>
