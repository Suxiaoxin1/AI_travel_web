import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8081/api'

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travelAccessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    if (error.response?.status === 401) {
      localStorage.removeItem('travelAccessToken')
      localStorage.removeItem('travelRefreshToken')
      // 可选：触发全局登录态失效事件
    }
    return Promise.reject(new Error(message))
  }
)

export default apiClient
