import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const usePlanStore = defineStore('plan', () => {
  const plans = ref([])
  const isLoading = ref(false)

  // 加载当前用户的行程列表
  async function loadPlans() {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      plans.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/plans')
      plans.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 保存行程
  async function savePlan(planData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        title: planData.title || '',
        preference_text: planData.preferenceText || planData.preference_text || '',
        content_json: planData.contentJson || planData.content_json || planData,
        input_text: planData.inputText || planData.input_text || '',
        input_images: planData.inputImages || planData.input_images || null,
        style: planData.style || '',
        people: planData.people || '',
        budget: planData.budget || '',
        days: planData.days || null,
        start_date: planData.startDate || planData.start_date || null
      }
      const { data } = await apiClient.post('/plans', payload)
      plans.value.unshift(data.data)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 更新已保存行程内容，用于保存路线调整后的每日景点顺序
  async function updatePlan(id, planData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        title: planData.title || '',
        preference_text: planData.preferenceText || planData.preference_text || '',
        content_json: planData.contentJson || planData.content_json || {},
        input_text: planData.inputText || planData.input_text || '',
        input_images: planData.inputImages || planData.input_images || null,
        style: planData.style || '',
        people: planData.people || '',
        budget: planData.budget || '',
        days: planData.days || null,
        start_date: planData.startDate || planData.start_date || null
      }
      const { data } = await apiClient.put(`/plans/${id}`, payload)
      const index = plans.value.findIndex(plan => plan.id === id)
      if (index >= 0) plans.value[index] = data.data
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 删除行程
  async function removePlan(id) {
    try {
      await apiClient.delete(`/plans/${id}`)
      plans.value = plans.value.filter(p => p.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return { plans, isLoading, loadPlans, savePlan, updatePlan, removePlan }
})
