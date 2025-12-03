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
        <!-- Microphone Icon -->
        <div class="mic-icon-container">
          <div class="mic-icon-rectangle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
              <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H3V12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12V10H19Z" fill="currentColor"/>
              <path d="M11 22H13V24H11V22Z" fill="currentColor"/>
            </svg>
          </div>
        </div>

        <!-- Model Selection -->
        <div class="settings-section">
          <h4 class="section-title">MODEL</h4>
          <div class="options-list">
            <div
              v-for="item in modelList"
              :key="item.value"
              class="option-item model-option"
              :class="{ active: modelId === item.value }"
              @click="selectModel(item.value)"
            >
              <span class="option-label">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Voice Selection -->
        <div class="settings-section">
          <h4 class="section-title">VOICE</h4>
          <div class="options-list">
            <div
              v-for="item in voiceTypeArr"
              :key="item.value"
              class="option-item voice-option"
              :class="{ 
                active: currentVoice === item.value,
                disabled: currentVoice !== item.value
              }"
              @click="selectVoice(item.value)"
            >
              <div class="voice-content">
                <svg class="speaker-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
                </svg>
                <span class="option-label">{{ item.label }}</span>
              </div>
              <svg v-if="currentVoice === item.value" class="checkmark-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
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
  padding: 20px;
  position: relative;
  z-index: 1001;
  pointer-events: auto;
}

.mic-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 32px;
}

.mic-icon-rectangle {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #E8E4D8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B7355;
}

.settings-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  padding: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.model-option {
    background: #fff;
    border: 1px solid #D1D5DB;
    
    &.active {
      background: #E8E4D8;
      border-color: #D1D5DB;
    }
    
    &:hover:not(.active) {
      background: #f5f5f5;
      border-color: #9CA3AF;
    }
  }

  &.voice-option {
    background: #fff;
    border: none;
    
    &.active {
      background: rgba(76, 130, 105, 0.2); // Darker version of #5C9E7F
    }
    
    &.disabled {
      background: #D1D5DB;
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    &:hover:not(.disabled):not(.active) {
      background: #f5f5f5;
    }
  }

  .voice-content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .speaker-icon {
    color: #6B7280;
    flex-shrink: 0;
  }

  .checkmark-icon {
    color: #5C9E7F;
    flex-shrink: 0;
  }

  .option-label {
    font-size: 14px;
    font-weight: 500;
    color: #1F2937;
  }
  
  &.disabled .option-label {
    color: #9CA3AF;
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

