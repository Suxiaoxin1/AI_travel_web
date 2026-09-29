// 全局 UI 状态管理：右侧抽屉、轻提示等
import { defineStore } from 'pinia'

let toastTimer = null

export const useUiStore = defineStore('ui', {
  state: () => ({
    // 抽屉显示状态：'favorites' | 'bookings' | 'journal' | null
    drawerType: null,
    toast: {
      visible: false,
      message: '',
      type: 'info' // success | error | warn | info
    }
  }),
  actions: {
    openDrawer(type) {
      this.drawerType = type
    },
    closeDrawer() {
      this.drawerType = null
    },
    showToast(message, type = 'info', durationMs = 2800) {
      if (toastTimer) {
        clearTimeout(toastTimer)
        toastTimer = null
      }
      this.toast = {
        visible: true,
        message: String(message || ''),
        type: type || 'info'
      }
      toastTimer = setTimeout(() => {
        this.toast.visible = false
        toastTimer = null
      }, durationMs)
    },
    hideToast() {
      if (toastTimer) {
        clearTimeout(toastTimer)
        toastTimer = null
      }
      this.toast.visible = false
    }
  }
})
