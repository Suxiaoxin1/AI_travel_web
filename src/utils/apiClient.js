import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8081/api'

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let refreshPromise = null

function clearLocalAuth() {
  localStorage.removeItem('travelUser')
  localStorage.removeItem('travelAccessToken')
  localStorage.removeItem('travelRefreshToken')
}

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
  async (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    const original = error.config
    const refreshToken = localStorage.getItem('travelRefreshToken')
    const isRefreshRequest = original?.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && refreshToken && !original?._retry && !isRefreshRequest) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post(`${baseURL}/auth/refresh`, null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
            timeout: 30000
          }).then(({ data }) => {
            localStorage.setItem('travelAccessToken', data.access_token)
            localStorage.setItem('travelRefreshToken', data.refresh_token)
            if (data.user) localStorage.setItem('travelUser', JSON.stringify({
              id: data.user.id,
              account: data.user.account,
              nickname: data.user.nickname,
              avatarBg: data.user.avatar_bg,
              avatarUrl: data.user.avatar_url,
              bio: data.user.bio,
              homeCity: data.user.home_city,
              isAdmin: Boolean(data.user.is_admin)
            }))
            return data.access_token
          }).finally(() => { refreshPromise = null })
        }
        const token = await refreshPromise
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      } catch {
        clearLocalAuth()
      }
    }
    if (error.response?.status === 401) {
      clearLocalAuth()
    }
    return Promise.reject(new Error(message))
  }
)

export default apiClient
