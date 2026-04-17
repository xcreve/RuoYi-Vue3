import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  axiosCreateMock,
  axiosRequestMock,
  axiosPostMock,
  loadingServiceMock,
  loadingCloseMock,
  saveAsMock,
  messageMock,
  messageErrorMock,
  notificationErrorMock,
  messageBoxConfirmMock,
  blobValidateMock,
  getTokenMock,
  sessionGetJSONMock,
  sessionSetJSONMock,
  sessionRemoveMock,
  userLogOutMock
} = vi.hoisted(() => {
  const axiosRequestMock = vi.fn((config) => Promise.resolve({
    data: { code: 200, payload: config },
    request: { responseType: config?.responseType }
  }))
  const axiosPostMock = vi.fn(() => Promise.resolve(new Blob(['ok'])))
  const loadingCloseMock = vi.fn()
  const loadingServiceMock = vi.fn(() => ({ close: loadingCloseMock }))
  const saveAsMock = vi.fn()
  const messageErrorMock = vi.fn()
  const messageMock = Object.assign(vi.fn(), { error: messageErrorMock })
  const notificationErrorMock = vi.fn()
  const messageBoxConfirmMock = vi.fn(() => Promise.resolve())
  const blobValidateMock = vi.fn(() => true)
  const getTokenMock = vi.fn(() => '')
  const sessionGetJSONMock = vi.fn(() => null)
  const sessionSetJSONMock = vi.fn()
  const sessionRemoveMock = vi.fn()
  const userLogOutMock = vi.fn(() => Promise.resolve())
  const axiosInstance = Object.assign(axiosRequestMock, {
    post: axiosPostMock,
    interceptors: {
      request: {
        use: vi.fn()
      },
      response: {
        use: vi.fn()
      }
    }
  })
  const axiosCreateMock = vi.fn(() => axiosInstance)
  return {
    axiosCreateMock,
    axiosRequestMock,
    axiosPostMock,
    loadingServiceMock,
    loadingCloseMock,
    saveAsMock,
    messageMock,
    messageErrorMock,
    notificationErrorMock,
    messageBoxConfirmMock,
    blobValidateMock,
    getTokenMock,
    sessionGetJSONMock,
    sessionSetJSONMock,
    sessionRemoveMock,
    userLogOutMock
  }
})

vi.mock('axios', () => ({
  default: {
    defaults: {
      headers: {}
    },
    create: axiosCreateMock
  }
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    error: notificationErrorMock
  },
  ElMessageBox: {
    confirm: messageBoxConfirmMock
  },
  ElMessage: messageMock,
  ElLoading: {
    service: loadingServiceMock
  }
}))

vi.mock('@/utils/auth', () => ({
  getToken: getTokenMock
}))

vi.mock('@/utils/errorCode', () => ({
  default: {}
}))

vi.mock('@/utils/ruoyi', () => ({
  tansParams: (params) => new URLSearchParams(params).toString(),
  blobValidate: blobValidateMock
}))

vi.mock('@/plugins/cache', () => ({
  default: {
    session: {
      getJSON: sessionGetJSONMock,
      setJSON: sessionSetJSONMock,
      remove: sessionRemoveMock
    }
  }
}))

vi.mock('file-saver', () => ({
  saveAs: saveAsMock
}))

vi.mock('@/store/modules/user', () => ({
  default: () => ({
    logOut: userLogOutMock
  })
}))

import { listAlerts, resolveAlert, resolveAllAlerts } from '@/api/pv/alert'
import { getHourlyYield, exportHourlyYield } from '@/api/pv/analysis'
import {
  listStationTag,
  getStationTag,
  addStationTag,
  updateStationTag,
  delStationTag,
  listModel,
  getModel,
  addModel,
  updateModel,
  delModel
} from '@/api/pv/catalog'
import { getDashboardSummary, getPowerSeries, simulateDashboard } from '@/api/pv/dashboard'
import { listGateway, getGateway, addGateway, updateGateway, delGateway } from '@/api/pv/gateway'
import { listInverter, getInverter, addInverter, updateInverter, delInverter } from '@/api/pv/inverter'
import { listStation, getStation, addStation, updateStation, delStation } from '@/api/pv/station'

describe('PV API modules', () => {
  beforeEach(() => {
    axiosRequestMock.mockClear()
    axiosPostMock.mockClear()
    loadingServiceMock.mockClear()
    loadingCloseMock.mockClear()
    saveAsMock.mockClear()
    messageMock.mockClear()
    messageErrorMock.mockClear()
    notificationErrorMock.mockClear()
    messageBoxConfirmMock.mockClear()
    blobValidateMock.mockClear()
    getTokenMock.mockClear()
    sessionGetJSONMock.mockClear()
    sessionSetJSONMock.mockClear()
    sessionRemoveMock.mockClear()
    userLogOutMock.mockClear()
  })

  it('builds alert requests with axios instance', async () => {
    await listAlerts({ status: 'active' })
    await resolveAlert(12)
    await resolveAllAlerts()

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/alert/list', method: 'get', params: { status: 'active' } }],
      [{ url: '/pv/alert/resolve/12', method: 'post' }],
      [{ url: '/pv/alert/resolve-all', method: 'post' }]
    ])
  })

  it('builds analysis requests and export download with axios', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1710000000000)

    await getHourlyYield({ tagId: 9 })
    await exportHourlyYield({ startDate: '2026-04-15', endDate: '2026-04-15' })

    expect(axiosRequestMock).toHaveBeenCalledWith({
      url: '/pv/analysis/hourly-yield',
      method: 'get',
      params: { tagId: 9 }
    })
    expect(axiosPostMock).toHaveBeenCalledWith(
      '/pv/analysis/hourly-yield/export',
      { startDate: '2026-04-15', endDate: '2026-04-15' },
      expect.objectContaining({
        responseType: 'blob',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
    )
    expect(loadingServiceMock).toHaveBeenCalledTimes(1)
    expect(blobValidateMock).toHaveBeenCalledTimes(1)
    expect(saveAsMock).toHaveBeenCalledWith(expect.any(Blob), '发电量统计_1710000000000.xlsx')
    expect(loadingCloseMock).toHaveBeenCalledTimes(1)

    nowSpy.mockRestore()
  })

  it('builds catalog requests for station tags and models', async () => {
    const payload = { tagName: '工商业' }
    const model = { brand: 'Huawei', modelName: 'SUN2000' }

    await listStationTag({ pageNum: 1 })
    await getStationTag(1)
    await addStationTag(payload)
    await updateStationTag(payload)
    await delStationTag(1)
    await listModel({ brand: 'Huawei' })
    await getModel(2)
    await addModel(model)
    await updateModel(model)
    await delModel(2)

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/stationTag/list', method: 'get', params: { pageNum: 1 } }],
      [{ url: '/pv/stationTag/1', method: 'get' }],
      [{ url: '/pv/stationTag', method: 'post', data: payload }],
      [{ url: '/pv/stationTag', method: 'put', data: payload }],
      [{ url: '/pv/stationTag/1', method: 'delete' }],
      [{ url: '/pv/model/list', method: 'get', params: { brand: 'Huawei' } }],
      [{ url: '/pv/model/2', method: 'get' }],
      [{ url: '/pv/model', method: 'post', data: model }],
      [{ url: '/pv/model', method: 'put', data: model }],
      [{ url: '/pv/model/2', method: 'delete' }]
    ])
  })

  it('builds dashboard requests', async () => {
    await getDashboardSummary()
    await getPowerSeries()
    await simulateDashboard()

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/dashboard/summary', method: 'get' }],
      [{ url: '/pv/dashboard/power-series', method: 'get' }],
      [{ url: '/pv/dashboard/simulate', method: 'post' }]
    ])
  })

  it('builds gateway requests', async () => {
    const gateway = { gatewayCode: 'GW-001' }

    await listGateway({ stationId: 3 })
    await getGateway(3)
    await addGateway(gateway)
    await updateGateway(gateway)
    await delGateway(3)

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/gateway/list', method: 'get', params: { stationId: 3 } }],
      [{ url: '/pv/gateway/3', method: 'get' }],
      [{ url: '/pv/gateway', method: 'post', data: gateway }],
      [{ url: '/pv/gateway', method: 'put', data: gateway }],
      [{ url: '/pv/gateway/3', method: 'delete' }]
    ])
  })

  it('builds inverter requests', async () => {
    const inverter = { serialNumber: 'INV-001' }

    await listInverter({ gatewayId: 5 })
    await getInverter(5)
    await addInverter(inverter)
    await updateInverter(inverter)
    await delInverter(5)

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/inverter/list', method: 'get', params: { gatewayId: 5 } }],
      [{ url: '/pv/inverter/5', method: 'get' }],
      [{ url: '/pv/inverter', method: 'post', data: inverter }],
      [{ url: '/pv/inverter', method: 'put', data: inverter }],
      [{ url: '/pv/inverter/5', method: 'delete' }]
    ])
  })

  it('builds station requests', async () => {
    const station = { stationName: '杭州屋顶电站' }

    await listStation({ tagId: 8 })
    await getStation(8)
    await addStation(station)
    await updateStation(station)
    await delStation(8)

    expect(axiosRequestMock.mock.calls).toEqual([
      [{ url: '/pv/station/list', method: 'get', params: { tagId: 8 } }],
      [{ url: '/pv/station/8', method: 'get' }],
      [{ url: '/pv/station', method: 'post', data: station }],
      [{ url: '/pv/station', method: 'put', data: station }],
      [{ url: '/pv/station/8', method: 'delete' }]
    ])
  })
})
