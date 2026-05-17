import request from '@/utils/request'

// 获取家族简介
export function getFamilyIntro() {
  return request({
    url: '/family-intro',
    method: 'get'
  })
}

// 更新家族简介
export function updateFamilyIntro(data) {
  return request({
    url: '/family-intro',
    method: 'put',
    data
  })
}