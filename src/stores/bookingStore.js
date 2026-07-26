import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref([])
  const isLoading = ref(false)

  const currentUserBookings = computed(() => {
    return [...bookings.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  })

  // 加载当前用户的预定列表
  async function loadBookings() {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      bookings.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/bookings')
      bookings.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // 添加一条预定
  async function addBooking({ province, keyword, url, platform, orderNo, travelDate, amount }) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const { data } = await apiClient.post('/bookings', {
        province,
        keyword,
        url,
        platform,
        order_no: orderNo,
        travel_date: travelDate,
        amount
      })
      bookings.value.unshift(data.data)
      return { ok: true, msg: '已添加到我的预定', record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  // 删除一条预定
  async function removeBooking(id) {
    try {
      await apiClient.delete(`/bookings/${id}`)
      bookings.value = bookings.value.filter(b => b.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return { bookings, isLoading, currentUserBookings, loadBookings, addBooking, removeBooking }
})
