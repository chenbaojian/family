import request from '@/utils/request'

// 获取家族树
export function getFamilyTree() {
  return request({
    url: '/tree',
    method: 'get'
  })
}

// 获取指定代的成员
export function getGenerationMembers(gen) {
  return request({
    url: `/tree/generation/${gen}`,
    method: 'get'
  })
}

// 获取统计数据
export function getStatistics() {
  return request({
    url: '/tree/stats',
    method: 'get'
  })
}

// 搜索成员
export function searchMembers(keyword) {
  return request({
    url: '/tree/search',
    method: 'get',
    params: { q: keyword }
  })
}