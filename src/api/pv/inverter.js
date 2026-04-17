import request from '@/utils/request'

export function listInverter(params) {
  return request({
    url: '/pv/inverter/list',
    method: 'get',
    params
  })
}

export function getInverter(inverterId) {
  return request({
    url: `/pv/inverter/${inverterId}`,
    method: 'get'
  })
}

export function addInverter(data) {
  return request({
    url: '/pv/inverter',
    method: 'post',
    data
  })
}

export function updateInverter(data) {
  return request({
    url: '/pv/inverter',
    method: 'put',
    data
  })
}

export function delInverter(inverterId) {
  return request({
    url: `/pv/inverter/${inverterId}`,
    method: 'delete'
  })
}
