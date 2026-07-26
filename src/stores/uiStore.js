// 全局 UI 状态管理：右侧抽屉等
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    // 抽屉显示状态：'favorites' | 'bookings' | 'journal' | null
    drawerType: null
  }),
  actions: {
    openDrawer(type) {
      this.drawerType = type
    },
    closeDrawer() {
      this.drawerType = null
    }
  }
})
