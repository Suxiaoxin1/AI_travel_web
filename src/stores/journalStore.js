import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const useJournalStore = defineStore('journal', () => {
  const journals = ref([])
  const isLoading = ref(false)

  // 加载当前用户的手账列表
  async function loadJournals() {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      journals.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/journals')
      journals.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 保存手账
  async function saveJournal(journalData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        title: journalData.title || '',
        style: journalData.style || '',
        location: journalData.location || '',
        travel_date: journalData.travel_date || journalData.travelDate || null,
        mood: journalData.mood || '',
        photos: journalData.photos || [],
        layout_json: journalData.layout_json || journalData.layoutJson || null,
        content_html: journalData.content_html || journalData.contentHtml || '',
        video_url: journalData.video_url || journalData.videoUrl || '',
        cover_url: journalData.cover_url || journalData.coverUrl || ''
      }
      const { data } = await apiClient.post('/journals', payload)
      journals.value.unshift(data.data)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function getJournal(id) {
    try {
      const { data } = await apiClient.get(`/journals/${id}`)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function updateJournal(id, journalData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        title: journalData.title || '',
        style: journalData.style || '',
        location: journalData.location || '',
        travel_date: journalData.travel_date || journalData.travelDate || null,
        mood: journalData.mood || '',
        photos: journalData.photos || [],
        layout_json: journalData.layout_json || journalData.layoutJson || null,
        content_html: journalData.content_html || journalData.contentHtml || '',
        video_url: journalData.video_url || journalData.videoUrl || '',
        cover_url: journalData.cover_url || journalData.coverUrl || ''
      }
      const { data } = await apiClient.put(`/journals/${id}`, payload)
      const index = journals.value.findIndex(item => item.id === id)
      if (index >= 0) journals.value[index] = data.data
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 删除手账
  async function removeJournal(id) {
    try {
      await apiClient.delete(`/journals/${id}`)
      journals.value = journals.value.filter(j => j.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return { journals, isLoading, loadJournals, saveJournal, getJournal, updateJournal, removeJournal }
})
