import request from '@/utils/request'

export function listStation(params) {
  return request({
    url: '/pv/station/list',
    method: 'get',
    params
  })
}

export function getStation(stationId) {
  return request({
    url: `/pv/station/${stationId}`,
    method: 'get'
  })
}

export function addStation(data) {
  return request({
    url: '/pv/station',
    method: 'post',
    data
  })
}

export function updateStation(data) {
  return request({
    url: '/pv/station',
    method: 'put',
    data
  })
}

export function delStation(stationId) {
  return request({
    url: `/pv/station/${stationId}`,
    method: 'delete'
  })
}
