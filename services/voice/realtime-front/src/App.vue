<template>
  <!-- 路由出口 -->
  <router-view></router-view>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { onAuthStateChanged, getCurrentUser } from '@/utils/auth';

export default {
  name: "App",
  setup() {
    const router = useRouter();

    onMounted(() => {
      // Listen to authentication state changes
      onAuthStateChanged((user) => {
        if (!user && router.currentRoute.value.meta.requiresAuth) {
          // User signed out, redirect to login if on protected route
          router.push('/login');
        }
      });

      // Initial auth check
      const currentUser = getCurrentUser();
      if (!currentUser && router.currentRoute.value.meta.requiresAuth) {
        router.push('/login');
      }
    });
  },
};
</script>

<style lang="less">
#app {
  height: 100%;
}
</style>
