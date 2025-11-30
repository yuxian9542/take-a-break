<template>
  <div>
    <!-- Mobile overlay backdrop - moved outside sidebar -->
    <div class="mobile-backdrop" v-if="isMobileVisible" @click="closeMobile"></div>
    
    <div class="settings-sidebar" :class="{ collapsed: isCollapsed, 'mobile-visible': isMobileVisible }">
      <div class="sidebar-header">
        <button class="toggle-btn" @click="isCollapsed = !isCollapsed" v-if="!isCollapsed && !isMobile">
          <span class="icon">‹</span>
        </button>
        <button class="toggle-btn" @click="isCollapsed = !isCollapsed" v-else-if="isCollapsed && !isMobile">
          <span class="icon">›</span>
        </button>
        <h3 v-if="!isCollapsed" class="sidebar-title">Settings</h3>
        <!-- Mobile close button -->
        <button class="mobile-close-btn" @click="closeMobile" v-if="isMobileVisible">
          <span class="icon">×</span>
        </button>
      </div>

      <div v-if="!isCollapsed" class="sidebar-content">
        <!-- Model Selection -->
        <div class="settings-section">
          <h4 class="section-title">Model</h4>
          <div class="options-list">
            <div
              v-for="item in modelList"
              :key="item.value"
              class="option-item"
              :class="{ active: modelId === item.value }"
              @click="selectModel(item.value)"
            >
              <span class="option-label">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Voice Selection -->
        <div class="settings-section">
          <h4 class="section-title">Voice</h4>
          <div class="options-list">
            <div
              v-for="item in voiceTypeArr"
              :key="item.value"
              class="option-item"
              :class="{ active: currentVoice === item.value }"
              @click="selectVoice(item.value)"
            >
              <span class="option-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { MODEL_TIMBRE } from "@/constants/modules/audioVideoCall";

export default {
  name: 'SettingsSidebar',
  props: {
    modelId: {
      type: String,
      default: 'glm-realtime',
    },
    currentVoice: {
      type: String,
      default: MODEL_TIMBRE.TONGTONG,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['model-selected', 'voice-selected'],
  data() {
    return {
      isCollapsed: false,
      isMobileVisible: false,
      isMobile: false,
      modelList: [
        {
          label: "GLM-Realtime-Flash",
          value: "glm-realtime",
        },
        {
          label: "GLM-Realtime-Air",
          value: "glm-4-realtime",
        },
      ],
      voiceTypeArr: [
        { label: "Male Voice", value: MODEL_TIMBRE.XIAOCHEN },
        { label: "Female Voice", value: MODEL_TIMBRE.TONGTONG },
        { label: "Sweet Female", value: MODEL_TIMBRE.TIANMEINVXING },
        { label: "Young Male", value: MODEL_TIMBRE.QINGNIANDAXUESHENG },
        { label: "Elite Youth", value: MODEL_TIMBRE.JINGYIGNQINGNIAN },
        { label: "Cute Girl", value: MODEL_TIMBRE.MENGMENGNVTONG },
        { label: "Young Girl", value: MODEL_TIMBRE.SHAONV },
      ],
    };
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) {
        this.isCollapsed = false;
      }
    },
    selectModel(value) {
      if (!this.isConnected) {
        this.$emit('model-selected', value);
        if (this.isMobile) {
          this.closeMobile();
        }
      }
    },
    selectVoice(value) {
      if (!this.isConnected) {
        this.$emit('voice-selected', value);
        if (this.isMobile) {
          this.closeMobile();
        }
      }
    },
    closeMobile() {
      this.isMobileVisible = false;
    },
    openMobile() {
      this.isMobileVisible = true;
    },
  },
};
</script>

<style scoped lang="less">
.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  pointer-events: auto;
}

.settings-sidebar {
  width: 280px;
  background: var(--va-card-bg);
  border-radius: 24px;
  box-shadow: var(--va-shadow-soft);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, left 0.3s ease;
  overflow: hidden;
  position: fixed;
  right: 24px;
  top: 24px;
  bottom: 24px;
  z-index: 100;
  flex-shrink: 0;

  &.collapsed {
    width: 60px;
  }
  
  // Mobile styles
  @media (max-width: 768px) {
    width: 280px;
    border-radius: 0;
    height: 100vh;
    position: fixed;
    right: -280px;
    top: 0;
    bottom: auto;
    z-index: 1000;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    
    &.mobile-visible {
      right: 0;
    }
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--va-soft-border);
  position: relative;

  .toggle-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--va-soft-border);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--va-muted-surface);
    }

    .icon {
      font-size: 20px;
      font-weight: 300;
      line-height: 1;
      display: inline-block;
    }
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  .sidebar-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--va-text-main);
  }
  
  .mobile-close-btn {
    position: absolute;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--va-soft-border);
    background: #fff;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    
    @media (max-width: 768px) {
      display: flex;
    }
    
    &:hover {
      background: var(--va-muted-surface);
    }
    
    .icon {
      font-size: 24px;
      font-weight: 400;
      color: var(--va-text-main);
    }
  }
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 12px;
  position: relative;
  z-index: 1001;
  pointer-events: auto;
}

.settings-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--va-text-sub);
  padding: 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--va-soft-border);
  padding-bottom: 8px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-item {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;

  &:hover {
    background: var(--va-muted-surface);
    border-color: var(--va-soft-border);
  }

  &.active {
    background: linear-gradient(135deg, rgba(15, 207, 109, 0.1), rgba(11, 143, 80, 0.05));
    border-color: rgba(15, 207, 109, 0.3);
  }

  .option-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--va-text-main);
  }
}

// Scrollbar styling
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: var(--va-soft-border);
  border-radius: 3px;

  &:hover {
    background: #cbd5e1;
  }
}
</style>

