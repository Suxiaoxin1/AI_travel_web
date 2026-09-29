import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '../utils/apiClient.js'

function normalizeUser(raw) {
  return {
    id: raw.id,
    account: raw.account,
    nickname: raw.nickname,
    avatarBg: raw.avatar_bg,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    homeCity: raw.home_city,
    isAdmin: Boolean(raw.is_admin),
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)
  const saved = localStorage.getItem('travelUser')
  const savedToken = localStorage.getItem('travelAccessToken')
  if (saved && savedToken) {
    try { currentUser.value = JSON.parse(saved) } catch { localStorage.removeItem('travelUser') }
  }

  function setAuth(rawUser, tokens) {
    currentUser.value = normalizeUser(rawUser)
    localStorage.setItem('travelUser', JSON.stringify(currentUser.value))
    if (tokens) {
      localStorage.setItem('travelAccessToken', tokens.access_token)
      localStorage.setItem('travelRefreshToken', tokens.refresh_token)
    }
  }

  function consumeTokenResponse(data) {
    setAuth(data.user, { access_token: data.access_token, refresh_token: data.refresh_token })
  }

  async function register({ account, password, nickname }) {
    isLoading.value = true
    try {
      const payload = { account: account.trim(), password }
      if (nickname?.trim()) payload.nickname = nickname.trim()
      const { data } = await apiClient.post('/auth/register', payload)
      consumeTokenResponse(data)
      return { ok: true, msg: '注册成功，已登录' }
    } catch (err) {
      return { ok: false, msg: err.message || '注册失败' }
    } finally {
      isLoading.value = false
    }
  }

  async function login({ account, password }) {
    isLoading.value = true
    try {
      const { data } = await apiClient.post('/auth/login', { account: account.trim(), password })
      consumeTokenResponse(data)
      return { ok: true, msg: '登录成功' }
    } catch (err) {
      return { ok: false, msg: err.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUser() {
    try {
      const { data } = await apiClient.get('/users/me')
      setAuth(data.data || data)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message || '获取用户信息失败' }
    }
  }

  async function logout({ remote = true } = {}) {
    if (remote && localStorage.getItem('travelAccessToken')) {
      try { await apiClient.post('/auth/logout') } catch { /* 本地仍需清除会话 */ }
    }
    currentUser.value = null
    localStorage.removeItem('travelUser')
    localStorage.removeItem('travelAccessToken')
    localStorage.removeItem('travelRefreshToken')
  }

  return { currentUser, isLoading, register, login, logout, fetchUser }
})
