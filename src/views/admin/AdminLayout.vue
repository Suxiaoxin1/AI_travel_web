<template>
  <div class="admin-shell">
    <aside class="admin-side" aria-label="后台导航">
      <div class="admin-brand">
        <div class="admin-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <path d="M16 2L6 12l2 2 8-8 8 8 2-2L16 2z" fill="#5ec4a8" />
            <circle cx="16" cy="18" r="5" fill="#D4A84B" opacity="0.9" />
            <circle cx="16" cy="18" r="2" fill="#F8F6F0" />
            <path d="M8 20l-4 8h24l-4-8" fill="#9fd9c6" opacity="0.55" />
          </svg>
        </div>
        <div class="admin-brand-copy">
          <strong>星际行者</strong>
          <span class="admin-brand-tag">内容运营台</span>
        </div>
      </div>
      <nav class="admin-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a :href="href" :class="{ 'is-active': isNavActive(item.to) }" @click="navigate">
            <span>{{ item.label }}</span>
            <span v-if="item.badge > 0" class="nav-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
          </a>
        </router-link>
      </nav>
      <div class="admin-side-foot">
        <div v-if="auth.currentUser" class="admin-side-user">
          <div
            class="admin-side-avatar"
            :style="{ background: auth.currentUser.avatarBg || 'linear-gradient(135deg, #0D6B5C, #1A8A7A)' }"
          >
            {{ (auth.currentUser.nickname || auth.currentUser.account || '管').slice(0, 1) }}
          </div>
          <div class="admin-side-user-meta">
            <strong>{{ auth.currentUser.nickname || auth.currentUser.account }}</strong>
            <span>管理员</span>
          </div>
        </div>
        <router-link class="admin-exit" to="/">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
              d="M11 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H11M13.5 13.5 17 10l-3.5-3.5M17 10H8"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>返回前台</span>
        </router-link>
      </div>
    </aside>

    <div class="admin-main">
      <div v-if="bootError" class="admin-state">
        <strong>无法进入管理后台</strong>
        <span>{{ bootError }}</span>
        <router-link to="/">返回首页</router-link>
      </div>
      <template v-else-if="ready">
        <header class="admin-topbar">
          <div>
            <h1>{{ pageTitle }}</h1>
            <p>{{ pageDesc }}</p>
          </div>
          <button class="primary-btn" type="button" :disabled="refreshing" @click="refreshCurrent">
            {{ refreshing ? '刷新中…' : '刷新数据' }}
          </button>
        </header>
        <p v-if="flash.message" :class="['admin-flash', flash.type]">{{ flash.message }}</p>
        <router-view :key="route.fullPath" />
      </template>
      <div v-else class="admin-panel" style="padding: 40px; color: #7b8580;">正在校验管理员权限…</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, provide, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../utils/apiClient'
import { getErrorMessage, unwrap } from './adminUtils.js'
import './adminShared.css'

const auth = useAuthStore()
const route = useRoute()
const ready = ref(false)
const bootError = ref('')
const refreshing = ref(false)
const dashboard = ref(null)
const flash = reactive({ message: '', type: 'success' })
let flashTimer = null

const pageMeta = {
  AdminDashboard: {
    title: '运营总览',
    desc: '用图表看内容结构，用待办推进审核与发布。',
  },
  AdminUsers: {
    title: '用户管理',
    desc: '查看账户资料与内容统计；停用账号会注销其所有会话。',
  },
  AdminAttractions: {
    title: '热门景点',
    desc: '已发布景点会同步到前台首页；归档不会物理删除记录。',
  },
  AdminPosts: {
    title: '旅途分享',
    desc: '隐藏后的游记不会在公开社区展示，可随时恢复。',
  },
  AdminComments: {
    title: '评论审核',
    desc: '评论状态与游记分开管理，隐藏不会删除原始记录。',
  },
  AdminModelKeys: {
    title: '模型密钥',
    desc: '集中更换万相、智谱、DeepSeek 等 API Key，保存后立即生效。',
  },
  AdminAudit: {
    title: '操作记录',
    desc: '记录用户、景点、分享和评论相关的管理员操作。',
  },
}

const pageTitle = computed(() => pageMeta[route.name]?.title || '项目管理后台')
const pageDesc = computed(() => pageMeta[route.name]?.desc || '')

function isNavActive(to) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(`${to}/`)
}

const openTodoCount = computed(() =>
  (dashboard.value?.todos || []).filter((item) => Number(item.count) > 0).length,
)

const navItems = computed(() => [
  { to: '/admin', label: '运营总览', badge: openTodoCount.value },
  { to: '/admin/users', label: '用户管理', badge: 0 },
  { to: '/admin/attractions', label: '热门景点', badge: dashboard.value?.draft_attractions || 0 },
  { to: '/admin/posts', label: '旅途分享', badge: dashboard.value?.hidden_posts || 0 },
  { to: '/admin/comments', label: '评论审核', badge: dashboard.value?.hidden_comments || 0 },
  { to: '/admin/model-keys', label: '模型密钥', badge: 0 },
  { to: '/admin/audit', label: '操作记录', badge: 0 },
])

function showFlash(message, type = 'success') {
  flash.message = message
  flash.type = type
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => {
    flash.message = ''
  }, 3200)
}

async function loadDashboard() {
  dashboard.value = unwrap(await apiClient.get('/admin/dashboard'))
}

async function boot() {
  bootError.value = ''
  try {
    const profile = await auth.fetchUser()
    if (!profile.ok || !auth.currentUser?.isAdmin) {
      throw new Error('请使用具有管理员权限的账号登录')
    }
    await loadDashboard()
    ready.value = true
  } catch (err) {
    bootError.value = getErrorMessage(err, '请使用具有管理员权限的账号登录')
    ready.value = false
  }
}

async function refreshCurrent() {
  refreshing.value = true
  try {
    await loadDashboard()
    window.dispatchEvent(new CustomEvent('admin:refresh'))
  } catch (err) {
    showFlash(getErrorMessage(err, '刷新失败'), 'error')
  } finally {
    refreshing.value = false
  }
}

provide('adminFlash', showFlash)
provide('adminDashboard', dashboard)
provide('reloadAdminDashboard', loadDashboard)

onMounted(boot)
</script>
