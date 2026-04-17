<template>
  <div :class="['sidebar-theme-wrapper', {'has-logo':showLogo}, sideTheme]" class="sidebar-container myems-sidebar">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="getMenuBackground"
        :text-color="getMenuTextColor"
        :unique-opened="true"
        :active-text-color="theme"
        :collapse-transition="false"
        mode="vertical"
        :class="sideTheme"
      >
        <sidebar-item
          v-for="(route, index) in displayRoutes"
          :key="`${route.routeKey || route.path}-${index}`"
          :item="route"
          :base-path="route.basePath || route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
const showLogo = computed(() => settingsStore.sidebarLogo)
const sideTheme = computed(() => settingsStore.sideTheme)
const theme = computed(() => settingsStore.theme)
const isCollapse = computed(() => !appStore.sidebar.opened)

const displayRoutes = computed(() => {
  const routes = sidebarRouters.value || []
  const pvRoot = routes.find(route => normalizePath(route.path) === '/pv')
  const systemRoot = routes.find(route => normalizePath(route.path) === '/system')

  const pvChildren = (pvRoot?.children || []).map(child => ({
    ...child,
    path: child.children && child.children.length ? child.path : `/pv/${child.path}`,
    basePath: child.children && child.children.length ? '/pv' : undefined,
    routeKey: `pv-${child.path}`
  }))

  const systemChildren = (systemRoot?.children || [])
    .filter(child => ['user', 'role'].includes(child.path))
    .map(child => ({
      ...child,
      routeKey: `system-${child.path}`
    }))

  if (systemChildren.length > 0) {
    pvChildren.push({
      path: '',
      basePath: '/system',
      alwaysShow: true,
      meta: {
        title: '系统管理',
        icon: 'system'
      },
      children: systemChildren,
      routeKey: 'system-group'
    })
  }

  return pvChildren
})

// 获取菜单背景色
const getMenuBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg
})

// 获取菜单文字颜色
const getMenuTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuText : variables.menuLightText
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

function normalizePath(path) {
  if (!path) {
    return ''
  }
  return path.startsWith('/') ? path : `/${path}`
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: v-bind(getMenuBackground);
  
  .scrollbar-wrapper {
    background-color: v-bind(getMenuBackground);
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    
    .el-menu-item, .el-sub-menu__title {
      &:hover {
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-menu-item {
      color: v-bind(getMenuTextColor);
      
      &.is-active {
        color: var(--menu-active-text, #409eff);
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-sub-menu__title {
      color: v-bind(getMenuTextColor);
    }
  }
}

.myems-sidebar {
  border-right: 1px solid var(--pv-border);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);

  :deep(.el-menu) {
    padding: 14px 12px 20px;
    background: transparent;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    margin-bottom: 8px;
    border-radius: 14px;
    font-weight: 600;
  }

  :deep(.el-sub-menu .el-menu-item) {
    margin-top: 6px;
    margin-bottom: 0;
    border-radius: 12px;
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(90deg, var(--pv-accent-soft), transparent) !important;
  }
}
</style>
