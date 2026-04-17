import request from '@/utils/request'

export function listStationTag(params) {
  return request({
    url: '/pv/stationTag/list',
    method: 'get',
    params
  })
}

export function getStationTag(tagId) {
  return request({
    url: `/pv/stationTag/${tagId}`,
    method: 'get'
  })
}

export function addStationTag(data) {
  return request({
    url: '/pv/stationTag',
    method: 'post',
    data
  })
}

export function updateStationTag(data) {
  return request({
    url: '/pv/stationTag',
    method: 'put',
    data
  })
}

export function delStationTag(tagId) {
  return request({
    url: `/pv/stationTag/${tagId}`,
    method: 'delete'
  })
}

export function listModel(params) {
  return request({
    url: '/pv/model/list',
    method: 'get',
    params
  })
}

export function getModel(modelId) {
  return request({
    url: `/pv/model/${modelId}`,
    method: 'get'
  })
}

export function addModel(data) {
  return request({
    url: '/pv/model',
    method: 'post',
    data
  })
}

export function updateModel(data) {
  return request({
    url: '/pv/model',
    method: 'put',
    data
  })
}

export function delModel(modelId) {
  return request({
    url: `/pv/model/${modelId}`,
    method: 'delete'
  })
}
