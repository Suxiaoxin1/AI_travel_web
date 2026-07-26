import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const useRouteStore = defineStore('route', () => {
  const routes = ref([])
  const isLoading = ref(false)

  // 加载当前用户的路线列表
  async function loadRoutes() {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      routes.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/routes')
      routes.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 保存路线
  async function saveRoute(routeData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        plan_id: routeData.plan_id || routeData.planId || null,
        title: routeData.title || '',
        strategy: routeData.strategy || '',
        days_json: routeData.days_json || routeData.daysJson || routeData.days || {}
      }
      const { data } = await apiClient.post('/routes', payload)
      routes.value.unshift(data.data)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 更新路线
  async function updateRoute(id, routeData) {
    try {
      const payload = {
        plan_id: routeData.plan_id || routeData.planId || null,
        title: routeData.title || '',
        strategy: routeData.strategy || '',
        days_json: routeData.days_json || routeData.daysJson || routeData.days || {}
      }
      const { data } = await apiClient.put(`/routes/${id}`, payload)
      const idx = routes.value.findIndex(r => r.id === id)
      if (idx >= 0) routes.value[idx] = data.data
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 删除路线
  async function removeRoute(id) {
    try {
      await apiClient.delete(`/routes/${id}`)
      routes.value = routes.value.filter(r => r.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return { routes, isLoading, loadRoutes, saveRoute, updateRoute, removeRoute }
})
