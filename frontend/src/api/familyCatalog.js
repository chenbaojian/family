import request from '@/utils/request'

// 获取族谱目录列表
export function getCatalogs() {
  return request({
    url: '/family-catalog',
    method: 'get'
  })
}

// 获取族谱目录详情
export function getCatalogById(id) {
  return request({
    url: `/family-catalog/${id}`,
    method: 'get'
  })
}

// 创建族谱目录（上传PDF）
export function createCatalog(data) {
  const formData = new FormData()
  formData.append('title', data.title)
  if (data.description) formData.append('description', data.description)
  formData.append('pdf', data.pdfFile)
  return request({
    url: '/family-catalog',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 更新族谱目录
export function updateCatalog(id, data) {
  const formData = new FormData()
  if (data.title) formData.append('title', data.title)
  if (data.description) formData.append('description', data.description)
  if (data.pdfFile) formData.append('pdf', data.pdfFile)
  return request({
    url: `/family-catalog/${id}`,
    method: 'put',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除族谱目录
export function deleteCatalog(id) {
  return request({
    url: `/family-catalog/${id}`,
    method: 'delete'
  })
}