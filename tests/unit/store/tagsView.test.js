import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { cacheLocal, persistState } = vi.hoisted(() => ({
  cacheLocal: {
    setJSON: vi.fn(),
    getJSON: vi.fn(),
    remove: vi.fn()
  },
  persistState: { enabled: true }
}))

vi.mock('@/plugins/cache', () => ({
  default: {
    local: cacheLocal
  }
}))

vi.mock('@/store/modules/settings', () => ({
  default: () => ({
    tagsViewPersist: persistState.enabled
  })
}))

import useTagsViewStore from '@/store/modules/tagsView'

function makeView(path, overrides = {}) {
  return {
    path,
    fullPath: path,
    name: path.replace(/\//g, '_'),
    query: {},
    meta: {
      title: `${path}标题`,
      noCache: false,
      affix: false,
      ...overrides.meta
    },
    ...overrides
  }
}

describe('tagsView store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    cacheLocal.setJSON.mockReset()
    cacheLocal.getJSON.mockReset()
    cacheLocal.remove.mockReset()
    persistState.enabled = true
  })

  it('adds visited and cached views and persists non-affix tags', () => {
    const tagsViewStore = useTagsViewStore()
    const dashboard = makeView('/pv/dashboard')

    tagsViewStore.addView(dashboard)
    tagsViewStore.addView(dashboard)

    expect(tagsViewStore.visitedViews).toHaveLength(1)
    expect(tagsViewStore.cachedViews).toEqual([dashboard.name])
    expect(cacheLocal.setJSON).toHaveBeenCalledWith('tags-view-visited', [
      expect.objectContaining({ path: '/pv/dashboard', title: '/pv/dashboard标题' })
    ])
  })

  it('skips persistence when tagsViewPersist is disabled', () => {
    persistState.enabled = false
    const tagsViewStore = useTagsViewStore()

    tagsViewStore.addVisitedView(makeView('/pv/station'))
    expect(cacheLocal.setJSON).not.toHaveBeenCalled()
  })

  it('deletes current view from visited and cached collections', async () => {
    const tagsViewStore = useTagsViewStore()
    const station = makeView('/pv/station')

    tagsViewStore.addView(station)
    const snapshot = await tagsViewStore.delView(station)

    expect(snapshot.visitedViews).toEqual([])
    expect(snapshot.cachedViews).toEqual([])
    expect(tagsViewStore.visitedViews).toEqual([])
    expect(tagsViewStore.cachedViews).toEqual([])
  })

  it('keeps affix tags when removing other views', async () => {
    const tagsViewStore = useTagsViewStore()
    const affix = makeView('/pv/dashboard', { meta: { affix: true } })
    const station = makeView('/pv/station')
    const gateway = makeView('/pv/gateway')

    tagsViewStore.addAffixView(affix)
    tagsViewStore.addView(station)
    tagsViewStore.addView(gateway)
    const result = await tagsViewStore.delOthersViews(station)

    expect(result.visitedViews.map((item) => item.path)).toEqual(['/pv/dashboard', '/pv/station'])
    expect(tagsViewStore.cachedViews).toEqual([station.name])
  })

  it('removes left and right tags while clearing caches and iframes', async () => {
    const tagsViewStore = useTagsViewStore()
    const affix = makeView('/pv/dashboard', { meta: { affix: true } })
    const station = makeView('/pv/station')
    const gateway = makeView('/pv/gateway', { meta: { link: 'https://example.com' } })
    const inverter = makeView('/pv/inverter')

    tagsViewStore.addAffixView(affix)
    tagsViewStore.addView(station)
    tagsViewStore.addView(gateway)
    tagsViewStore.addIframeView(gateway)
    tagsViewStore.addView(inverter)

    await tagsViewStore.delLeftTags(gateway)
    expect(tagsViewStore.visitedViews.map((item) => item.path)).toEqual(['/pv/dashboard', '/pv/gateway', '/pv/inverter'])
    expect(tagsViewStore.cachedViews).toEqual([gateway.name, inverter.name])

    await tagsViewStore.delRightTags(gateway)
    expect(tagsViewStore.visitedViews.map((item) => item.path)).toEqual(['/pv/dashboard', '/pv/gateway'])
    expect(tagsViewStore.cachedViews).toEqual([gateway.name])
    expect(tagsViewStore.iframeViews).toEqual([expect.objectContaining({ path: '/pv/gateway' })])
  })

  it('loads persisted views and clears all views', async () => {
    cacheLocal.getJSON.mockReturnValue([makeView('/pv/analysis')])
    const tagsViewStore = useTagsViewStore()

    tagsViewStore.loadPersistedViews()
    expect(tagsViewStore.visitedViews).toHaveLength(1)

    const result = await tagsViewStore.delAllViews()
    expect(result.visitedViews).toEqual([])
    expect(result.cachedViews).toEqual([])
    expect(cacheLocal.remove).toHaveBeenCalledWith('tags-view-visited')
  })
})
