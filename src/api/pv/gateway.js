import request from '@/utils/request'

export function listGateway(params) {
  return request({
    url: '/pv/gateway/list',
    method: 'get',
    params
  })
}

export function getGateway(gatewayId) {
  return request({
    url: `/pv/gateway/${gatewayId}`,
    method: 'get'
  })
}

export function addGateway(data) {
  return request({
    url: '/pv/gateway',
    method: 'post',
    data
  })
}

export function updateGateway(data) {
  return request({
    url: '/pv/gateway',
    method: 'put',
    data
  })
}

export function delGateway(gatewayId) {
  return request({
    url: `/pv/gateway/${gatewayId}`,
    method: 'delete'
  })
}
