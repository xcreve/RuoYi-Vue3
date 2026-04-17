import request from '@/utils/request'

export function listAlerts(params) {
  return request({
    url: '/pv/alert/list',
    method: 'get',
    params
  })
}

export function resolveAlert(alertId) {
  return request({
    url: `/pv/alert/resolve/${alertId}`,
    method: 'post'
  })
}

export function resolveAllAlerts() {
  return request({
    url: '/pv/alert/resolve-all',
    method: 'post'
  })
}
