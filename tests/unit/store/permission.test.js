import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { routerAddRoute, getRouters, hasPermiOr, hasRoleOr, constantRoutes, dynamicRoutes } = vi.hoisted(() => ({
  routerAddRoute: vi.fn(),
  getRouters: vi.fn(),
  hasPermiOr: vi.fn(),
  hasRoleOr: vi.fn(),
  constantRoutes: [{ path: '/constant', meta: { title: '常量路由' } }],
  dynamicRoutes: [
    { path: '/allowed', permissions: ['pv:extra'] },
    { path: '/role-allowed', roles: ['admin'] },
    { path: '/ignored' }
  ]
}))

vi.mock('@/router', () => ({
  default: { addRoute: routerAddRoute },
  constantRoutes,
  dynamicRoutes
}))

vi.mock('@/api/menu', () => ({
  getRouters
}))

vi.mock('@/plugins/auth', () => ({
  default: {
    hasPermiOr,
    hasRoleOr
  }
}))

vi.mock('@/layout/index', () => ({
  default: { name: 'LayoutStub' }
}))

vi.mock('@/components/ParentView', () => ({
  default: { name: 'ParentViewStub' }
}))

vi.mock('@/layout/components/InnerLink', () => ({
  default: { name: 'InnerLinkStub' }
}))

import usePermissionStore, { filterDynamicRoutes, loadView } from '@/store/modules/permission'

describe('permission store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    routerAddRoute.mockReset()
    getRouters.mockReset()
    hasPermiOr.mockReset()
    hasRoleOr.mockReset()
  })

  it('filters dynamic routes by permissions and roles', () => {
    hasPermiOr.mockImplementation((perms) => perms.includes('pv:extra'))
    hasRoleOr.mockImplementation((roles) => roles.includes('admin'))

    const routes = filterDynamicRoutes(dynamicRoutes)
    expect(routes).toEqual([
      { path: '/allowed', permissions: ['pv:extra'] },
      { path: '/role-allowed', roles: ['admin'] }
    ])
  })

  it('loads views from the views directory', () => {
    const viewLoader = loadView('pv/dashboard/index')
    expect(typeof viewLoader).toBe('function')
  })

  it('generates rewritten routes and registers allowed dynamic routes', async () => {
    hasPermiOr.mockImplementation((perms) => perms.includes('pv:extra'))
    hasRoleOr.mockImplementation((roles) => roles.includes('admin'))
    getRouters.mockResolvedValue({
      data: [
        {
          path: '/pv',
          component: 'Layout',
          redirect: 'noRedirect',
          children: [
            {
              path: 'dashboard',
              component: 'pv/dashboard/index',
              meta: { title: 'Dashboard' }
            },
            {
              path: 'assets',
              component: 'ParentView',
              children: [
                {
                  path: 'station',
                  component: 'pv/station/index',
                  meta: { title: '电站管理' }
                }
              ]
            }
          ]
        }
      ]
    })

    const permissionStore = usePermissionStore()
    const routes = await permissionStore.generateRoutes(['admin'])

    expect(routerAddRoute).toHaveBeenCalledTimes(2)
    expect(routerAddRoute).toHaveBeenNthCalledWith(1, { path: '/allowed', permissions: ['pv:extra'] })
    expect(routerAddRoute).toHaveBeenNthCalledWith(2, { path: '/role-allowed', roles: ['admin'] })

    expect(permissionStore.routes).toHaveLength(2)
    expect(permissionStore.routes[0]).toEqual(constantRoutes[0])
    expect(routes[0].component).toEqual({ name: 'LayoutStub' })
    expect(typeof routes[0].children[0].component).toBe('function')
    expect(routes[0].children[1].path).toBe('assets/station')
    expect(permissionStore.sidebarRouters).toHaveLength(2)
    expect(permissionStore.defaultRoutes).toHaveLength(2)
    expect(permissionStore.topbarRouters).toHaveLength(1)
  })
})
