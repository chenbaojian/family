import request from '@/utils/request'

// 用户注册
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

// 用户登录
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 获取当前用户信息
export function getProfile() {
  return request({
    url: '/auth/profile',
    method: 'get'
  })
}

// 更新用户信息
export function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}

// 获取所有用户（管理员）
export function getAllUsers() {
  return request({
    url: '/auth/users',
    method: 'get'
  })
}

// 更新用户状态（管理员）
export function updateUserStatus(userId, data) {
  return request({
    url: `/auth/users/${userId}`,
    method: 'put',
    data
  })
}

// 删除用户（管理员）
export function deleteUser(userId) {
  return request({
    url: `/auth/users/${userId}`,
    method: 'delete'
  })
}
