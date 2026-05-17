import request from '@/utils/request'

// 获取成员列表
export function getMembers(params) {
  return request({
    url: '/members',
    method: 'get',
    params
  })
}

// 获取成员详情
export function getMemberById(id) {
  return request({
    url: `/members/${id}`,
    method: 'get'
  })
}

// 添加成员
export function createMember(data) {
  return request({
    url: '/members',
    method: 'post',
    data
  })
}

// 更新成员
export function updateMember(id, data) {
  return request({
    url: `/members/${id}`,
    method: 'put',
    data
  })
}

// 删除成员
export function deleteMember(id) {
  return request({
    url: `/members/${id}`,
    method: 'delete'
  })
}

// 获取祖先链
export function getAncestors(id) {
  return request({
    url: `/members/${id}/ancestors`,
    method: 'get'
  })
}

// 获取后代
export function getDescendants(id) {
  return request({
    url: `/members/${id}/descendants`,
    method: 'get'
  })
}

// 获取亲属关系
export function getRelatives(id) {
  return request({
    url: `/members/${id}/relatives`,
    method: 'get'
  })
}

// 上传照片
export function uploadPhoto(id, file) {
  const formData = new FormData()
  formData.append('photo', file)
  return request({
    url: `/members/${id}/photo`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
