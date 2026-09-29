<template>
  <nav class="navbar" :class="{ 'is-scrolled': isScrolled }">
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
          <router-link to="/journal" class="nav-link" active-class="active">旅行记忆</router-link>
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
            <router-link v-if="auth.currentUser.isAdmin" to="/admin" class="dropdown-item" @click="showDropdown = false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>
              管理后台
            </router-link>
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
const isScrolled = ref(false)

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
function handleScroll() {
  isScrolled.value = window.scrollY > 12
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.navbar {
  position: fixed; inset: 0 0 auto; z-index: 100;
  height: 72px; background: rgba(248, 246, 240, 0.78);
  backdrop-filter: blur(18px) saturate(125%);
  border-bottom: 1px solid rgba(229, 224, 214, 0.72);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
.navbar::after {
  content: ''; position: absolute; left: 50%; bottom: -1px;
  width: min(1400px, 70%); height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(13,107,92,.24), rgba(212,168,75,.42), transparent);
  pointer-events: none;
}
.navbar.is-scrolled {
  background: rgba(248, 246, 240, 0.94);
  box-shadow: 0 12px 34px rgba(16, 58, 49, 0.1);
}
.navbar-inner {
  max-width: 1400px; width: 70%; margin: 0 auto; padding: 0 24px; height: 100%;
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-left { display: flex; align-items: center; gap: 42px; }
.logo {
  display: flex; align-items: center; gap: 11px; padding: 6px 10px 6px 6px;
  border-radius: 16px; cursor: pointer; text-decoration: none;
  transition: background .25s ease, transform .25s ease;
}
.logo:hover { background: rgba(13, 107, 92, 0.06); transform: translateY(-1px); }
.logo-icon {
  flex-shrink: 0; width: 36px; height: 36px; padding: 5px;
  border-radius: 12px; background: linear-gradient(145deg, #e8f7f2, #fff6d7);
  box-shadow: 0 5px 14px rgba(13,107,92,.13);
}
.logo-text {
  font-family: 'Noto Sans SC', sans-serif; font-size: 21px; font-weight: 750;
  color: #0D6B5C; letter-spacing: .08em;
}
.nav-links { display: flex; align-items: center; gap: 2px; }
.nav-right { position: relative; display: flex; align-items: center; gap: 8px; }
.nav-link {
  position: relative; padding: 10px 14px; font-size: 14px; font-weight: 500; color: #5C5C6E;
  cursor: pointer; border-radius: 12px; transition: all 0.25s ease;
  font-family: 'Noto Sans SC', sans-serif; text-decoration: none;
}
.nav-link::after {
  content: ''; position: absolute; left: 14px; right: 14px; bottom: 5px; height: 2px;
  border-radius: 2px; background: #D4A84B; transform: scaleX(0);
  transform-origin: center; transition: transform .25s ease;
}
.nav-link:hover { color: #0D6B5C; background: rgba(13, 107, 92, 0.06); transform: translateY(-1px); }
.nav-link.active { color: #0D6B5C; background: rgba(13, 107, 92, 0.08); font-weight: 650; }
.nav-link.active::after { transform: scaleX(1); }

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
  display: inline-flex; align-items: center; justify-content: center; min-height: 38px;
  padding: 8px 16px; font-size: 14px; font-weight: 700; color: #0D6B5C;
  background: transparent; border: 1px solid #0D6B5C; border-radius: 12px;
  cursor: pointer; transition: all 0.25s ease; font-family: 'Noto Sans SC', sans-serif;
  text-decoration: none;
}
.btn-login:hover { background: #fff; box-shadow: 0 6px 16px rgba(13,107,92,.1); transform: translateY(-1px); }
.btn-register {
  display: inline-flex; align-items: center; justify-content: center; min-height: 38px;
  padding: 8px 16px; font-size: 14px; font-weight: 700; color: #fff;
  background: #0D6B5C; border: none; border-radius: 12px; cursor: pointer;
  transition: all 0.25s ease; font-family: 'Noto Sans SC', sans-serif;
  text-decoration: none;
}
.btn-register:hover { background: #1A8A7A; box-shadow: 0 4px 12px rgba(13, 107, 92, 0.3); }
.nav-link:focus-visible, .logo:focus-visible, .btn-login:focus-visible,
.btn-register:focus-visible, .user-menu:focus-visible {
  outline: 3px solid rgba(212, 168, 75, .45); outline-offset: 3px;
}

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

@media (max-width: 760px) {
  .navbar { height: 60px; }
  .navbar-inner { width: 100%; max-width: none; padding: 0 16px; }
  .navbar::after { width: calc(100% - 32px); }
  .nav-left { gap: 0; min-width: 0; }
  .nav-links { display: none; }
  .logo { padding-left: 2px; }
  .logo-icon { width: 32px; height: 32px; }
  .logo-text { font-size: 17px; letter-spacing: .04em; }
  .nav-right { display: flex; flex: 0 0 auto; }
  .btn-login, .btn-register { min-height: 34px; padding: 6px 10px; border-radius: 10px; font-size: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .navbar, .logo, .nav-link, .btn-login, .btn-register { transition: none; }
}

</style>
