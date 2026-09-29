import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'
import { normalizePlatform } from '../utils/bookingLinks.js'

function apiErrorMessage(err, fallback = '请求失败') {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}

function upsertLocal(list, record) {
  const idx = list.findIndex((b) => b.id === record.id)
  if (idx >= 0) {
    const next = [...list]
    next[idx] = record
    return next
  }
  return [record, ...list]
}

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref([])
  const isLoading = ref(false)

  const currentUserBookings = computed(() => {
    return [...bookings.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  })

  const intentBookings = computed(() =>
    currentUserBookings.value.filter((b) => (b.kind || 'intent') === 'intent')
  )

  const orderBookings = computed(() =>
    currentUserBookings.value.filter((b) => b.kind === 'order')
  )

  async function loadBookings(kind) {
    const auth = useAuthStore()
    if (!auth.currentUser) {
      bookings.value = []
      return { ok: false, msg: '请先登录' }
    }
    isLoading.value = true
    try {
      const { data } = await apiClient.get('/bookings', {
        params: kind ? { kind } : undefined
      })
      bookings.value = data.data || []
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: apiErrorMessage(err) }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create or upsert an intent/order booking.
   * Backend dedupes by normalized URL for the same user.
   */
  async function addBooking(payload) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const {
        url,
        kind = 'intent',
        title,
        note,
        sourceType,
        sourceName,
        linkType,
        province,
        keyword,
        platform,
        orderNo,
        travelDate,
        amount
      } = payload

      const { data } = await apiClient.post('/bookings', {
        url,
        kind,
        title,
        note,
        source_type: sourceType,
        source_name: sourceName,
        link_type: linkType,
        province,
        keyword,
        platform: normalizePlatform(platform, url),
        order_no: orderNo,
        travel_date: travelDate,
        amount
      })

      const record = data.data
      bookings.value = upsertLocal(bookings.value, record)
      return {
        ok: true,
        msg: data.message || '已添加到我的预定',
        record,
        deduped: String(data.message || '').includes('已在收藏中')
      }
    } catch (err) {
      return { ok: false, msg: apiErrorMessage(err, '添加失败') }
    }
  }

  async function updateBooking(id, patch) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const body = {}
      if (patch.title !== undefined) body.title = patch.title
      if (patch.note !== undefined) body.note = patch.note
      if (patch.url !== undefined) body.url = patch.url
      if (patch.linkType !== undefined) body.link_type = patch.linkType
      if (patch.platform !== undefined) body.platform = patch.platform
      if (patch.keyword !== undefined) body.keyword = patch.keyword
      if (patch.sourceType !== undefined) body.source_type = patch.sourceType
      if (patch.sourceName !== undefined) body.source_name = patch.sourceName
      if (patch.province !== undefined) body.province = patch.province

      const { data } = await apiClient.patch(`/bookings/${id}`, body)
      const record = data.data
      bookings.value = upsertLocal(bookings.value, record)
      return { ok: true, msg: data.message || '已更新', record }
    } catch (err) {
      return { ok: false, msg: apiErrorMessage(err, '更新失败') }
    }
  }

  async function removeBooking(id) {
    try {
      await apiClient.delete(`/bookings/${id}`)
      bookings.value = bookings.value.filter((b) => b.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: apiErrorMessage(err, '删除失败') }
    }
  }

  return {
    bookings,
    isLoading,
    currentUserBookings,
    intentBookings,
    orderBookings,
    loadBookings,
    addBooking,
    updateBooking,
    removeBooking
  }
})
