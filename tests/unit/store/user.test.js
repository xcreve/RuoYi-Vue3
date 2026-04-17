import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const {
  routerPush,
  confirmMock,
  loginApi,
  logoutApi,
  getInfoApi,
  getTokenMock,
  setTokenMock,
  removeTokenMock,
  unlockScreenMock
} = vi.hoisted(() => ({
  routerPush: vi.fn(),
  confirmMock: vi.fn(),
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getInfoApi: vi.fn(),
  getTokenMock: vi.fn(),
  setTokenMock: vi.fn(),
  removeTokenMock: vi.fn(),
  unlockScreenMock: vi.fn()
}))

vi.mock('@/router', () => ({
  default: {
    push: routerPush
  }
}))

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: confirmMock
  }
}))

vi.mock('@/api/login', () => ({
  login: loginApi,
  logout: logoutApi,
  getInfo: getInfoApi
}))

vi.mock('@/utils/auth', () => ({
  getToken: getTokenMock,
  setToken: setTokenMock,
  removeToken: removeTokenMock
}))

vi.mock('@/store/modules/lock', () => ({
  default: () => ({
    unlockScreen: unlockScreenMock
  })
}))

import useUserStore from '@/store/modules/user'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routerPush.mockReset()
    confirmMock.mockReset()
    loginApi.mockReset()
    logoutApi.mockReset()
    getInfoApi.mockReset()
    getTokenMock.mockReset()
    setTokenMock.mockReset()
    removeTokenMock.mockReset()
    unlockScreenMock.mockReset()
    getTokenMock.mockReturnValue('persisted-token')
    confirmMock.mockResolvedValue()
  })

  it('logs in with trimmed username and stores token', async () => {
    loginApi.mockResolvedValue({ token: 'jwt-token' })
    const userStore = useUserStore()

    await userStore.login({
      username: ' admin ',
      password: 'secret',
      code: '1234',
      uuid: 'uuid-1'
    })

    expect(loginApi).toHaveBeenCalledWith('admin', 'secret', '1234', 'uuid-1')
    expect(setTokenMock).toHaveBeenCalledWith('jwt-token')
    expect(unlockScreenMock).toHaveBeenCalledTimes(1)
    expect(userStore.token).toBe('jwt-token')
  })

  it('loads user info with roles and preserves http avatar', async () => {
    getInfoApi.mockResolvedValue({
      user: {
        userId: 1,
        userName: 'admin',
        nickName: '管理员',
        avatar: 'https://cdn.example.com/avatar.png'
      },
      roles: ['admin'],
      permissions: ['*:*:*'],
      isDefaultModifyPwd: false,
      isPasswordExpired: false
    })

    const userStore = useUserStore()
    const response = await userStore.getInfo()

    expect(response.user.userName).toBe('admin')
    expect(userStore.roles).toEqual(['admin'])
    expect(userStore.permissions).toEqual(['*:*:*'])
    expect(userStore.avatar).toBe('https://cdn.example.com/avatar.png')
    expect(confirmMock).not.toHaveBeenCalled()
  })

  it('falls back to default role, prefixes local avatar and routes to reset password', async () => {
    getInfoApi.mockResolvedValue({
      user: {
        userId: 2,
        userName: 'operator',
        nickName: '运维',
        avatar: '/profile/avatar/operator.png'
      },
      roles: [],
      permissions: [],
      isDefaultModifyPwd: true,
      isPasswordExpired: false
    })

    const userStore = useUserStore()
    await userStore.getInfo()
    await Promise.resolve()

    expect(userStore.roles).toEqual(['ROLE_DEFAULT'])
    expect(userStore.avatar).toBe('/dev-api/profile/avatar/operator.png')
    expect(confirmMock).toHaveBeenCalledTimes(1)
    expect(routerPush).toHaveBeenCalledWith({ name: 'Profile', params: { activeTab: 'resetPwd' } })
  })

  it('logs out and clears local session state', async () => {
    logoutApi.mockResolvedValue({})
    const userStore = useUserStore()
    userStore.token = 'jwt-token'
    userStore.roles = ['admin']
    userStore.permissions = ['pv:dashboard:view']

    await userStore.logOut()

    expect(logoutApi).toHaveBeenCalledWith('jwt-token')
    expect(removeTokenMock).toHaveBeenCalledTimes(1)
    expect(userStore.token).toBe('')
    expect(userStore.roles).toEqual([])
    expect(userStore.permissions).toEqual([])
  })
})
