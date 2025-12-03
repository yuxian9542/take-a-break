<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>{{ isSignUp ? 'Sign Up' : 'Sign into Vently' }}</h2>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="Email"
            size="large"
            prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Password"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item v-if="isSignUp" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm Password"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleSubmit"
            class="submit-button"
          >
            {{ isSignUp ? 'Sign Up' : 'Sign In' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="oauth-divider">
        <span>or continue with</span>
      </div>
      <el-button
        class="google-button"
        plain
        size="large"
        :loading="googleLoading"
        @click="handleGoogleSignIn"
      >
        Continue with Google
      </el-button>

      <div class="toggle-mode">
        <span>{{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}</span>
        <el-link type="primary" @click="toggleMode">
          {{ isSignUp ? 'Sign In' : 'Sign Up' }}
        </el-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { signIn, signUp, signInWithGoogle } from '@/utils/auth';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    const isSignUp = ref(false);
    const loading = ref(false);
    const googleLoading = ref(false);
    const errorMessage = ref('');

    const form = reactive({
      email: '',
      password: '',
      confirmPassword: '',
    });

    const validateEmail = (rule, value, callback) => {
      if (!value) {
        callback(new Error('Please input email'));
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback(new Error('Please input a valid email'));
      } else {
        callback();
      }
    };

    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('Please input password'));
      } else if (value.length < 6) {
        callback(new Error('Password must be at least 6 characters'));
      } else {
        callback();
      }
    };

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('Please confirm password'));
      } else if (value !== form.password) {
        callback(new Error('Passwords do not match'));
      } else {
        callback();
      }
    };

    const rules = {
      email: [{ validator: validateEmail, trigger: 'blur' }],
      password: [{ validator: validatePassword, trigger: 'blur' }],
      confirmPassword: [
        { validator: validateConfirmPassword, trigger: 'blur' },
      ],
    };

    const toggleMode = () => {
      isSignUp.value = !isSignUp.value;
      errorMessage.value = '';
      form.password = '';
      form.confirmPassword = '';
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    };

    const handleSubmit = async () => {
      if (!formRef.value) return;

      try {
        await formRef.value.validate();
        loading.value = true;
        errorMessage.value = '';

        if (isSignUp.value) {
          await signUp(form.email, form.password);
        } else {
          await signIn(form.email, form.password);
        }

        // Redirect to conversation page after successful authentication
        const redirect = router.currentRoute.value.query.redirect || '/conversation';
        router.push(redirect);
      } catch (error) {
        console.error('Authentication error:', error);
        if (error.code) {
          switch (error.code) {
            case 'auth/user-not-found':
              errorMessage.value = 'No account found with this email.';
              break;
            case 'auth/wrong-password':
              errorMessage.value = 'Incorrect password.';
              break;
            case 'auth/email-already-in-use':
              errorMessage.value = 'This email is already registered.';
              break;
            case 'auth/weak-password':
              errorMessage.value = 'Password is too weak.';
              break;
            case 'auth/invalid-email':
              errorMessage.value = 'Invalid email address.';
              break;
            default:
              errorMessage.value = error.message || 'Authentication failed. Please try again.';
          }
        } else if (error.message) {
          errorMessage.value = error.message;
        } else {
          errorMessage.value = 'Authentication failed. Please try again.';
        }
      } finally {
        loading.value = false;
      }
    };

    const handleGoogleSignIn = async () => {
      try {
        errorMessage.value = '';
        googleLoading.value = true;
        await signInWithGoogle();
        const redirect = router.currentRoute.value.query.redirect || '/conversation';
        router.push(redirect);
      } catch (error) {
        console.error('Google authentication error:', error);
        errorMessage.value =
          error.message || 'Google authentication failed. Please try again.';
      } finally {
        googleLoading.value = false;
      }
    };

    return {
      formRef,
      form,
      rules,
      isSignUp,
      loading,
      googleLoading,
      errorMessage,
      toggleMode,
      handleSubmit,
      handleGoogleSignIn,
    };
  },
};
</script>

<style lang="less" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--va-bg-color);
  padding: 24px;
}

.login-card {
  background: var(--va-card-bg);
  border-radius: 32px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  min-height: 680px;
  box-shadow: var(--va-shadow-soft);
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--va-text-main);
  }

  .subtitle {
    margin: 0;
    color: var(--va-text-sub);
    font-size: 14px;
  }
}

:deep(.el-form) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.error-alert {
  margin-bottom: 16px;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.toggle-mode {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--va-text-sub);

  .el-link {
    margin-left: 8px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-button--primary) {
  background-color: #5C9E7F;
  border-color: #5C9E7F;
  
  &:hover {
    background-color: #4d8a6d;
    border-color: #4d8a6d;
  }
  
  &:active {
    background-color: #3d7a5d;
    border-color: #3d7a5d;
  }
}

:deep(.el-link--primary) {
  color: #5C9E7F;
  
  &:hover {
    color: #4d8a6d;
  }
}

.oauth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 16px;
  color: var(--va-text-sub);
  font-size: 13px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #ebeef5;
  }
}

.google-button {
  width: 100%;
  margin-top: 12px;
}
</style>
