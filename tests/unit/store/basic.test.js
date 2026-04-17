import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

const { cookieGet, cookieSet, cookieRemove, toggleDark, darkState, useDynamicTitle } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  cookieRemove: vi.fn(),
  toggleDark: vi.fn(),
  darkState: { value: false },
  useDynamicTitle: vi.fn()
}))

vi.mock('js-cookie', () => ({
  default: {
    get: cookieGet,
    set: cookieSet,
    remove: cookieRemove
  }
}))

vi.mock('@vueuse/core', () => ({
  useDark: () => darkState,
  useToggle: () => toggleDark
}))

vi.mock('@/utils/dynamicTitle', () => ({
  useDynamicTitle
}))

import store from '@/store'
import useAppStore from '@/store/modules/app'
import useDictStore from '@/store/modules/dict'
import useLockStore from '@/store/modules/lock'
import useSettingsStore from '@/store/modules/settings'

describe('basic Pinia stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    cookieGet.mockReset()
    cookieSet.mockReset()
    cookieRemove.mockReset()
    toggleDark.mockReset()
    useDynamicTitle.mockReset()
    darkState.value = false
    localStorage.clear()
  })

  it('exports a Pinia instance from store/index.js', () => {
    expect(store).toBeDefined()
    expect(typeof store.install).toBe('function')
  })

  it('mounts a component with pinia through vue test utils', () => {
    const pinia = createPinia()
    const Host = defineComponent({
      setup() {
        const appStore = useAppStore()
        return () => h('div', {
          'data-device': appStore.device,
          'data-opened': String(appStore.sidebar.opened)
        }, appStore.device)
      }
    })

    const wrapper = mount(Host, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.attributes('data-device')).toBe('desktop')
    expect(wrapper.attributes('data-opened')).toBe('true')
    expect(wrapper.text()).toBe('desktop')
  })

  it('handles sidebar and UI actions in app store', () => {
    cookieGet.mockImplementation((key) => {
      if (key === 'sidebarStatus') return '1'
      if (key === 'size') return 'large'
      return undefined
    })

    const appStore = useAppStore()
    expect(appStore.sidebar.opened).toBe(true)
    expect(appStore.size).toBe('large')

    appStore.toggleSideBar(true)
    expect(appStore.sidebar.opened).toBe(false)
    expect(appStore.sidebar.withoutAnimation).toBe(true)
    expect(cookieSet).toHaveBeenCalledWith('sidebarStatus', 0)

    appStore.closeSideBar({ withoutAnimation: false })
    expect(appStore.sidebar.opened).toBe(false)
    expect(appStore.sidebar.withoutAnimation).toBe(false)

    appStore.toggleDevice('mobile')
    appStore.setSize('small')
    appStore.toggleSideBarHide(true)

    expect(appStore.device).toBe('mobile')
    expect(appStore.size).toBe('small')
    expect(appStore.sidebar.hide).toBe(true)
    expect(cookieSet).toHaveBeenCalledWith('size', 'small')
    expect(appStore.toggleSideBar(false)).toBe(false)
  })

  it('stores and removes dictionary entries', () => {
    const dictStore = useDictStore()

    dictStore.setDict('stationStatus', [{ label: '在线', value: 'online' }])
    expect(dictStore.getDict('stationStatus')).toEqual([{ label: '在线', value: 'online' }])
    expect(dictStore.removeDict('stationStatus')).toBe(true)
    expect(dictStore.getDict('stationStatus')).toBeUndefined()

    dictStore.setDict('alertLevel', ['warning'])
    dictStore.cleanDict()
    expect(dictStore.dict).toEqual([])
  })

  it('persists screen lock state', () => {
    localStorage.setItem('screen-lock', 'true')
    localStorage.setItem('screen-lock-path', '/pv/gateway')

    const lockStore = useLockStore()
    expect(lockStore.isLock).toBe(true)
    expect(lockStore.lockPath).toBe('/pv/gateway')

    lockStore.lockScreen('/pv/inverter')
    expect(lockStore.isLock).toBe(true)
    expect(lockStore.lockPath).toBe('/pv/inverter')
    expect(localStorage.getItem('screen-lock')).toBe('true')
    expect(localStorage.getItem('screen-lock-path')).toBe('/pv/inverter')

    lockStore.unlockScreen()
    expect(lockStore.isLock).toBe(false)
    expect(lockStore.lockPath).toBe('/pv/dashboard')
    expect(localStorage.getItem('screen-lock')).toBe('false')
    expect(localStorage.getItem('screen-lock-path')).toBe('/pv/dashboard')
  })

  it('updates settings state and title hooks', () => {
    const settingsStore = useSettingsStore()

    settingsStore.changeSetting({ key: 'theme', value: '#123456' })
    settingsStore.changeSetting({ key: 'missing', value: 'ignored' })
    settingsStore.setTitle('监控大屏')
    settingsStore.toggleTheme()

    expect(settingsStore.theme).toBe('#123456')
    expect(settingsStore.title).toBe('监控大屏')
    expect(settingsStore.isDark).toBe(true)
    expect(useDynamicTitle).toHaveBeenCalledTimes(1)
    expect(toggleDark).toHaveBeenCalledTimes(1)
  })
})
