import request, { download } from '@/utils/request'

export function getHourlyYield(params) {
  return request({
    url: '/pv/analysis/hourly-yield',
    method: 'get',
    params
  })
}

export function exportHourlyYield(params) {
  return download('/pv/analysis/hourly-yield/export', params, `发电量统计_${Date.now()}.xlsx`)
}
