import { createRouter, createWebHistory } from 'vue-router';
import AudioVideoCall from '../views/AudioVideoCall/Index.vue';
import Login from '../views/Login/Index.vue';
import Welcome from '../views/Welcome/Index.vue';
import { getCurrentUser } from '@/utils/auth';

// 定义路由
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/conversation',
    name: 'Conversation',
    component: AudioVideoCall,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
    meta: { requiresAuth: false }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：检查认证状态
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const currentUser = getCurrentUser();

  if (requiresAuth && !currentUser) {
    // 需要认证但未登录，重定向到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
  } else if (to.path === '/login' && currentUser) {
    // 已登录用户访问登录页，重定向到会话页
    const redirectTarget = typeof to.query.redirect === 'string' ? to.query.redirect : '/conversation';
    next(redirectTarget);
  } else {
    next();
  }
});

export default router;
