<template>
  <div>
    <!-- Mobile overlay backdrop - moved outside sidebar -->
    <div class="mobile-backdrop" v-if="isMobileVisible" @click="closeMobile"></div>
    
    <div class="chat-history-sidebar" :class="{ collapsed: isCollapsed, 'mobile-visible': isMobileVisible }">
      <div class="sidebar-header">
        <button class="toggle-btn" @click="isCollapsed = !isCollapsed" v-if="!isCollapsed && !isMobile">
          <span class="icon">‹</span>
        </button>
        <button class="toggle-btn" @click="isCollapsed = !isCollapsed" v-else-if="isCollapsed && !isMobile">
          <span class="icon">›</span>
        </button>
        <div v-if="!isCollapsed" class="header-content">
          <h1 class="sidebar-title">Chat History</h1>
          <button class="new-chat-btn" @click="handleNewSession">
            + New Chat
          </button>
        </div>
      </div>

      <div v-if="!isCollapsed" class="sidebar-content">
        <div class="sessions-list">
          <div
            v-for="(session, index) in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="handleSessionClick(session.id)"
          >
            <div class="session-avatar" v-if="index === 0">
              <div class="avatar-circle"></div>
            </div>
            <div class="session-content">
              <h4 class="session-title">{{ session.title }}</h4>
            </div>
            <div class="session-time" v-if="session.updatedAt">
              {{ formatTime(session.updatedAt) }}
            </div>
            <button
              class="delete-btn"
              @click.stop="$emit('delete-session', session.id)"
              v-if="session.id !== currentSessionId"
            >
              <span class="icon">×</span>
            </button>
          </div>

          <div v-if="sessions.length === 0" class="empty-state">
            <p>No chat history yet</p>
            <p class="hint">Start a conversation to see it here</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatHistorySidebar',
  props: {
    sessions: {
      type: Array,
      default: () => [],
    },
    currentSessionId: {
      type: String,
      default: null,
    },
    userId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isCollapsed: false,
      isMobileVisible: false,
      isMobile: false,
    };
  },
  mounted() {
    // Check if mobile on mount
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      // Show sidebar expanded on mobile when visible
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) {
        this.isCollapsed = false;
      }
    },
    handleSessionClick(sessionId) {
      this.$emit('session-selected', sessionId);
      // Close mobile sidebar after selection
      if (this.isMobile) {
        this.closeMobile();
      }
    },
    handleNewSession() {
      this.$emit('new-session');
      // Close mobile sidebar after creating new session
      if (this.isMobile) {
        this.closeMobile();
      }
    },
    closeMobile() {
      this.isMobileVisible = false;
    },
    openMobile() {
      this.isMobileVisible = true;
    },
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
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

.chat-history-sidebar {
  width: 280px;
  background: var(--va-card-bg);
  border-radius: 24px;
  box-shadow: var(--va-shadow-soft);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, left 0.3s ease;
  overflow: hidden;
  position: relative; // Add relative positioning for z-index context

  &.collapsed {
    width: 60px;
  }
  
  // Mobile styles
  @media (max-width: 768px) {
    width: 280px;
    border-radius: 0;
    height: 100vh;
    position: fixed;
    left: -280px;
    top: 0;
    z-index: 1000; // Higher than backdrop
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    pointer-events: auto; // Ensure sidebar can receive clicks
    
    &.mobile-visible {
      left: 0;
    }
  }
}

.sidebar-header {
  padding: 24px 20px;
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
    margin-bottom: 16px;

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
      display: none; // Hide collapse button on mobile
    }
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .sidebar-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--va-text-main);
    line-height: 1.2;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .new-chat-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    background: #5C9E7F;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;

    &:hover {
      background: #4d8a6d;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
  
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1001; // Ensure content is above backdrop
  pointer-events: auto; // Ensure clicks work
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #E8EBED;
  position: relative;

  &:hover {
    background: #DDE1E4;

    .delete-btn {
      opacity: 1;
    }
  }

  &.active {
    background: #DDE1E4;
  }

  .session-avatar {
    flex-shrink: 0;
  }

  .avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #9CA3AF;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
    font-size: 16px;
  }

  .session-content {
    flex: 1;
    min-width: 0;
  }

  .session-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--va-text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .session-time {
    font-size: 13px;
    color: #9CA3AF;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: auto;
  }

  .delete-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }

    .icon {
      font-size: 18px;
      color: #1F2937;
      font-weight: 400;
    }
  }
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--va-text-sub);

  p {
    margin: 8px 0;
    font-size: 14px;
  }

  .hint {
    font-size: 12px;
    opacity: 0.7;
  }
}

// Scrollbar styling
.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: transparent;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: var(--va-soft-border);
  border-radius: 3px;

  &:hover {
    background: #cbd5e1;
  }
}
</style>
