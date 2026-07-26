import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../utils/apiClient.js'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)

  // 从 localStorage 恢复登录态
  const saved = localStorage.getItem('travelUser')
  const savedToken = localStorage.getItem('travelAccessToken')
  if (saved && savedToken) {
    try { currentUser.value = JSON.parse(saved) } catch {}
  }

  // 内部：设置登录态
  function _setAuth(user, tokens) {
    currentUser.value = user
    localStorage.setItem('travelUser', JSON.stringify(user))
    if (tokens) {
      localStorage.setItem('travelAccessToken', tokens.access_token)
      localStorage.setItem('travelRefreshToken', tokens.refresh_token)
    }
  }

  // 注册
  async function register({ phone, email, password, nickname }) {
    isLoading.value = true
    try {
      const payload = {}
      if (phone) payload.phone = phone.trim()
      if (email) payload.email = email.trim()
      payload.password = password
      payload.nickname = nickname.trim()

      const { data } = await apiClient.post('/auth/register', payload)
      return { ok: true, msg: '注册成功', user: data.data }
    } catch (err) {
      return { ok: false, msg: err.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login({ phone, email, password }) {
    isLoading.value = true
    try {
      const payload = {}
      if (phone) payload.phone = phone.trim()
      if (email) payload.email = email.trim()
      payload.password = password

      const { data } = await apiClient.post('/auth/login', payload)
      const user = {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        nickname: data.user.nickname,
        avatarBg: data.user.avatar_bg
      }
      _setAuth(user, { access_token: data.access_token, refresh_token: data.refresh_token })
      return { ok: true, msg: '登录成功' }
    } catch (err) {
      return { ok: false, msg: err.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 刷新用户信息
  async function fetchUser() {
    try {
      const { data } = await apiClient.get('/users/me')
      const raw = data.data || data
      currentUser.value = {
        id: raw.id,
        phone: raw.phone,
        email: raw.email,
        nickname: raw.nickname,
        avatarBg: raw.avatar_bg
      }
      localStorage.setItem('travelUser', JSON.stringify(currentUser.value))
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 登出
  function logout() {
    currentUser.value = null
    localStorage.removeItem('travelUser')
    localStorage.removeItem('travelAccessToken')
    localStorage.removeItem('travelRefreshToken')
  }

  return { currentUser, isLoading, register, login, logout, fetchUser }
})
