import request from '@/utils/request'

export function getDashboardSummary() {
  return request({
    url: '/pv/dashboard/summary',
    method: 'get'
  })
}

export function getPowerSeries() {
  return request({
    url: '/pv/dashboard/power-series',
    method: 'get'
  })
}

export function simulateDashboard() {
  return request({
    url: '/pv/dashboard/simulate',
    method: 'post'
  })
}
