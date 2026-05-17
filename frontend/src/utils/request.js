import axios from 'axios'

// 生产环境用相对路径 /api（由 Nginx 反向代理到后端）
// 开发环境用 http://localhost:3000/api（由 vite proxy 处理）
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          console.error('权限不足')
          break
        default:
          console.error(error.response.data.message || '请求失败')
      }
    }
    return Promise.reject(error)
  }
)

// 导出获取服务器地址的方法（用于照片等静态资源）
export function getServerBaseURL() {
  // 生产环境: baseURL=/api → 返回空字符串（同源）
  // 开发环境: baseURL=http://localhost:3000/api → 返回 http://localhost:3000
  if (baseURL.startsWith('/')) {
    return ''  // 同源，照片路径直接用 /uploads/xxx
  }
  return baseURL.replace(/\/api$/, '')
}

export default request