<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/pv/dashboard">
        <span class="sidebar-mark">
          <svg-icon icon-class="sunny" />
        </span>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/pv/dashboard">
        <span class="sidebar-mark">
          <svg-icon icon-class="sunny" />
        </span>
        <div class="sidebar-brand">
          <h1 class="sidebar-title">{{ title }}</h1>
          <p class="sidebar-slogan">分布式光伏电站管理系统</p>
        </div>
      </router-link>
    </transition>
  </div>
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = import.meta.env.VITE_APP_TITLE
const settingsStore = useSettingsStore()
const getLogoBackground = computed(() => settingsStore.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)')
const getLogoTextColor = computed(() => settingsStore.isDark ? 'var(--pv-text)' : 'var(--pv-text)')
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  height: 86px;
  background: v-bind(getLogoBackground);
  overflow: hidden;
  border-bottom: 1px solid var(--pv-border);

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 18px;

    & .sidebar-mark {
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--pv-accent) 0%, var(--pv-accent-strong) 100%);
      color: #fff;
      font-size: 20px;
    }

    & .sidebar-brand {
      min-width: 0;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: v-bind(getLogoTextColor);
      font-weight: 700;
      line-height: 1;
      font-size: 18px;
      vertical-align: middle;
    }

    & .sidebar-slogan {
      margin: 7px 0 0;
      font-size: 12px;
      color: var(--pv-text-muted);
      white-space: nowrap;
    }
  }

  &.collapse {
    .sidebar-logo-link {
      justify-content: center;
      padding: 0;
    }
  }
}
</style>
