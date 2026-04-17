<template>
  <div class="navbar myems-navbar">
    <div class="navbar-left">
      <hamburger id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
      <div class="title-group">
        <div class="system-name">MyEMS 太阳能</div>
        <div class="page-title">{{ pageTitle }}</div>
      </div>
    </div>

    <div class="right-menu">
      <div class="status-pill">
        <span class="status-dot" :class="{ offline: !isOnline }"></span>
        <span>{{ isOnline ? '系统在线' : '网络离线' }}</span>
      </div>
      <div class="clock-pill">{{ nowText }}</div>
      <el-tooltip content="主题切换" effect="dark" placement="bottom">
        <button class="icon-button" type="button" @click="toggleTheme">
          <svg-icon v-if="settingsStore.isDark" icon-class="sunny" />
          <svg-icon v-else icon-class="moon" />
        </button>
      </el-tooltip>
      <el-dropdown @command="handleCommand" class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" />
          <div class="user-meta">
            <span class="user-nickname">{{ displayName }}</span>
            <span class="user-role">{{ userStore.name }}</span>
          </div>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item command="lockScreen">
              <span>锁定屏幕</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import Hamburger from '@/components/Hamburger'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useLockStore from '@/store/modules/lock'
import useSettingsStore from '@/store/modules/settings'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const lockStore = useLockStore()
const settingsStore = useSettingsStore()
const isOnline = ref(navigator.onLine)
const nowText = ref('')

function toggleSideBar() {
  appStore.toggleSideBar()
}

function handleCommand(command) {
  switch (command) {
    case "lockScreen":
      lockScreen()
      break
    case "logout":
      logout()
      break
    default:
      break
  }
}

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      location.href = '/login'
    })
  }).catch(() => { })
}

function lockScreen() {
  const currentPath = route.fullPath
  lockStore.lockScreen(currentPath)
  router.push('/lock')
}

const displayName = computed(() => userStore.nickName || userStore.name || '用户')
const pageTitle = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.length ? matched[matched.length - 1].meta.title : '监控大屏'
})

function setClock() {
  const now = new Date()
  const date = now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  nowText.value = `${date} ${time}`
}

let timer = null

onMounted(() => {
  setClock()
  timer = window.setInterval(setClock, 60 * 1000)
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
})

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
  }
  window.removeEventListener('online', handleNetworkChange)
  window.removeEventListener('offline', handleNetworkChange)
})

function handleNetworkChange() {
  isOnline.value = navigator.onLine
}

async function toggleTheme(event) {
  const x = event?.clientX || window.innerWidth / 2
  const y = event?.clientY || window.innerHeight / 2
  const wasDark = settingsStore.isDark

  const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const isSupported = document.startViewTransition && !isReducedMotion

  if (!isSupported) {
    settingsStore.toggleTheme()
    return
  }

  try {
    const transition = document.startViewTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      settingsStore.toggleTheme()
      await nextTick()
    })
    await transition.ready

    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]
    document.documentElement.animate(
      {
        clipPath: !wasDark ? [...clipPath].reverse() : clipPath
      }, {
        duration: 650,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
        pseudoElement: !wasDark ? "::view-transition-old(root)" : "::view-transition-new(root)"
      }
    )
    await transition.finished
  } catch (error) {
    console.warn("View transition failed, falling back to immediate toggle:", error)
    settingsStore.toggleTheme()
  }
}
</script>

<style lang='scss' scoped>
.navbar {
  height: 72px;
  padding: 0 18px 0 10px;
  position: relative;
  background: rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid var(--pv-border);
  backdrop-filter: blur(18px);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  justify-content: space-between;

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .hamburger-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--pv-surface-soft);
    border: 1px solid var(--pv-border);
  }

  .title-group {
    min-width: 0;
  }

  .system-name {
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--pv-text-muted);
  }

  .page-title {
    margin-top: 6px;
    font-size: 24px;
    line-height: 1;
    font-weight: 700;
    color: var(--pv-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-menu {
    display: flex;
    align-items: center;
    gap: 12px;

    &:focus {
      outline: none;
    }

    .status-pill,
    .clock-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      height: 42px;
      padding: 0 14px;
      border-radius: 14px;
      background: var(--pv-surface-soft);
      border: 1px solid var(--pv-border);
      color: var(--pv-text-soft);
      font-size: 13px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--pv-success);
      box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.14);

      &.offline {
        background: var(--pv-danger);
        box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.16);
      }
    }

    .icon-button {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      border: 1px solid var(--pv-border);
      background: var(--pv-surface-soft);
      color: var(--pv-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .avatar-container {
      height: 42px;
    }

    .avatar-wrapper {
      height: 42px;
      padding: 0 12px 0 8px;
      border-radius: 16px;
      border: 1px solid var(--pv-border);
      background: var(--pv-surface-strong);
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--pv-text);
      cursor: pointer;
    }

    .user-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }

    .user-nickname {
      font-size: 13px;
      font-weight: 700;
    }

    .user-role {
      margin-top: 3px;
      font-size: 11px;
      color: var(--pv-text-muted);
    }
  }
}

@media (max-width: 768px) {
  .navbar {
    height: 64px;
    padding-right: 12px;

    .page-title {
      font-size: 18px;
    }

    .system-name,
    .clock-pill,
    .status-pill .status-dot,
    .user-role {
      display: none;
    }

    .status-pill {
      padding: 0 10px;
    }

    .user-meta {
      display: none;
    }
  }
}
</style>
