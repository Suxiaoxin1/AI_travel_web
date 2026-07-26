<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <svg class="logo-icon" viewBox="0 0 32 32" width="28" height="28">
            <path d="M16 2L6 12l2 2 8-8 8 8 2-2L16 2z" fill="#1A8A7A"/>
            <circle cx="16" cy="18" r="5" fill="#D4A84B" opacity="0.8"/>
            <circle cx="16" cy="18" r="2" fill="#F8F6F0"/>
            <path d="M8 20l-4 8h24l-4-8" fill="#0D6B5C" opacity="0.6"/>
          </svg>
          <span class="logo-text">星际行者</span>
        </router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link" active-class="active" exact-active-class="active">首页</router-link>
          <router-link to="/plan" class="nav-link" active-class="active">旅行规划</router-link>
          <router-link to="/destinations" class="nav-link" active-class="active">出行偏好</router-link>
          <router-link to="/routes" class="nav-link" active-class="active">行程路线</router-link>
          <router-link to="/share" class="nav-link" active-class="active">旅途分享</router-link>
          <router-link to="/journal" class="nav-link" active-class="active">旅游手账</router-link>
        </div>
      </div>
      <div class="nav-right">
        <template v-if="!auth.currentUser">
          <router-link to="/auth" class="btn-login">登录</router-link>
          <router-link to="/auth" class="btn-register" @click="setReg">注册</router-link>
        </template>
        <template v-else>
          <div class="user-menu" @click="showDropdown = !showDropdown">
            <div class="user-avatar" :style="{ background: auth.currentUser.avatarBg }">
              {{ auth.currentUser.nickname[0] }}
            </div>
            <span class="user-name">{{ auth.currentUser.nickname }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="showDropdown" class="dropdown" @click.stop>
            <div class="dropdown-item" @click="openMy('favorites')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              我的收藏
            </div>
            <div class="dropdown-item" @click="openMy('bookings')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              我的预定
            </div>
            <div class="dropdown-item" @click="openMy('journal')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              我的旅行日记
            </div>
            <div class="dropdown-separator"></div>
            <div class="dropdown-item" @click="handleLogout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              退出登录
            </div>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore.js'

const auth = useAuthStore()
const ui = useUiStore()
const showDropdown = ref(false)

function setReg() { sessionStorage.setItem('authMode', 'register') }

// 打开右侧抽屉（收藏/预定/日记）
function openMy(type) {
  ui.openDrawer(type)
  showDropdown.value = false
}

function handleLogout() {
  auth.logout()
  showDropdown.value = false
}

function handleClickOutside(e) {
  if (!e.target.closest('.nav-right')) showDropdown.value = false
}
onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>

<style scoped>
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(248, 246, 240, 0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid #E5E0D6; height: 64px;
}
.navbar-inner {
  max-width: 1400px; margin: 0 auto; padding: 0 32px; height: 100%;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-left { display: flex; align-items: center; gap: 40px; }
.logo { display: flex; align-items: center; gap: 10px; cursor: default; text-decoration: none; }
.logo-icon { flex-shrink: 0; }
.logo-text {
  font-family: 'Noto Sans SC', sans-serif; font-size: 20px; font-weight: 700;
  color: #0D6B5C; letter-spacing: 1px;
}
.nav-links { display: flex; align-items: center; gap: 4px; }
.nav-right { position: relative; }
.nav-link {
  padding: 8px 16px; font-size: 14px; font-weight: 500; color: #5C5C6E;
  cursor: pointer; border-radius: 8px; transition: all 0.25s ease;
  font-family: 'Noto Sans SC', sans-serif; text-decoration: none;
}
.nav-link:hover { color: #0D6B5C; background: rgba(13, 107, 92, 0.06); }
.nav-link.active { color: #0D6B5C; background: rgba(13, 107, 92, 0.08); font-weight: 600; }

.quick-actions { display: flex; align-items: center; gap: 8px; margin-right: 12px; }
.quick-action-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; font-size: 12px; color: #5C5C6E;
  background: transparent; border: 1px solid #E5E0D6; border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif; text-decoration: none;
}
.quick-action-btn:hover { color: #0D6B5C; border-color: #0D6B5C; background: rgba(13,107,92,0.04); }

.dropdown-separator { height: 1px; background: #E5E0D6; margin: 4px 0; }

.btn-login {
  padding: 8px 20px; font-size: 14px; font-weight: 500; color: #0D6B5C;
  background: transparent; border: 1px solid #0D6B5C; border-radius: 8px;
  cursor: pointer; transition: all 0.25s ease; font-family: 'Noto Sans SC', sans-serif;
  text-decoration: none;
}
.btn-login:hover { background: rgba(13, 107, 92, 0.06); }
.btn-register {
  padding: 8px 20px; font-size: 14px; font-weight: 500; color: #fff;
  background: #0D6B5C; border: none; border-radius: 8px; cursor: pointer;
  transition: all 0.25s ease; font-family: 'Noto Sans SC', sans-serif;
  text-decoration: none;
}
.btn-register:hover { background: #1A8A7A; box-shadow: 0 4px 12px rgba(13, 107, 92, 0.3); }

.user-menu {
  display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px;
  cursor: pointer; border-radius: 24px; transition: background 0.2s;
}
.user-menu:hover { background: rgba(13,107,92,0.06); }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 13px; font-weight: 600; flex-shrink: 0;
}
.user-name { font-size: 13px; color: #1A1A2E; font-weight: 500; font-family: 'Noto Sans SC', sans-serif; }

.dropdown {
  position: absolute; top: calc(100% + 8px); right: 0; background: #fff;
  border: 1px solid #E5E0D6; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 6px; min-width: 200px;
  z-index: 10;
}
.dropdown-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  font-size: 13px; color: #5C5C6E; border-radius: 8px; cursor: pointer;
  transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; border: none; background: none; width: 100%;
}
.dropdown-item:hover { background: rgba(13, 107, 92, 0.06); color: #0D6B5C; }
</style>
