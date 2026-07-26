import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref([])
  const isLoading = ref(false)

  // 加载当前用户的收藏列表
  async function loadFavorites() {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      favorites.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/favorites')
      favorites.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 添加收藏
  async function addFavorite(item) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        type: item.type || '景点',
        name: item.name,
        description: item.desc || item.description || '',
        image_url: item.image || null,
        plan_json: item.plan || null,
        external_url: item.external_url || null
      }
      const { data } = await apiClient.post('/favorites', payload)
      favorites.value.unshift(data.data)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 删除收藏
  async function removeFavorite(id) {
    try {
      await apiClient.delete(`/favorites/${id}`)
      favorites.value = favorites.value.filter(f => f.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return { favorites, isLoading, loadFavorites, addFavorite, removeFavorite }
})
