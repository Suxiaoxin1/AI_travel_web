<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- 登录 -->
      <div v-if="mode === 'login'" class="auth-form">
        <div class="auth-header">
          <router-link to="/" class="auth-logo">
            <svg class="logo-icon" viewBox="0 0 32 32" width="32" height="32">
              <path d="M16 2L6 12l2 2 8-8 8 8 2-2L16 2z" fill="#1A8A7A"/>
              <circle cx="16" cy="18" r="5" fill="#D4A84B" opacity="0.8"/>
              <circle cx="16" cy="18" r="2" fill="#F8F6F0"/>
            </svg>
            <span class="logo-text">星际行者</span>
          </router-link>
          <h1 class="auth-title">欢迎回来</h1>
          <p class="auth-subtitle">登录你的旅行账号</p>
        </div>

        <div class="tab-bar">
          <button :class="['tab', { active: tab === 'phone' }]" @click="tab = 'phone'">手机号</button>
          <button :class="['tab', { active: tab === 'email' }]" @click="tab = 'email'">邮箱</button>
        </div>

        <div class="input-group">
          <label>{{ tab === 'phone' ? '手机号' : '邮箱' }}</label>
          <input
            v-if="tab === 'phone'"
            type="tel"
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="11"
            @keydown.enter="handleLogin"
          />
          <input
            v-else
            type="email"
            v-model="form.email"
            placeholder="请输入邮箱地址"
            maxlength="100"
            @keydown.enter="handleLogin"
          />
        </div>

        <div class="input-group">
          <label>密码</label>
          <div class="password-input">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="form.password"
              placeholder="请输入密码"
              @keydown.enter="handleLogin"
            />
            <button class="pwd-toggle" @click="showPwd = !showPwd" type="button">
              <svg v-if="showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <button class="submit-btn" :disabled="!canLogin || auth.isLoading" @click="handleLogin">
          {{ auth.isLoading ? '登录中…' : '登录' }}
        </button>

        <p class="switch-link">还没有账号？<a @click="mode = 'register'">立即注册</a></p>
      </div>

      <!-- 注册 -->
      <div v-else class="auth-form">
        <div class="auth-header">
          <router-link to="/" class="auth-logo">
            <svg class="logo-icon" viewBox="0 0 32 32" width="32" height="32">
              <path d="M16 2L6 12l2 2 8-8 8 8 2-2L16 2z" fill="#1A8A7A"/>
              <circle cx="16" cy="18" r="5" fill="#D4A84B" opacity="0.8"/>
              <circle cx="16" cy="18" r="2" fill="#F8F6F0"/>
            </svg>
            <span class="logo-text">星际行者</span>
          </router-link>
          <h1 class="auth-title">创建账号</h1>
          <p class="auth-subtitle">开启你的星际旅行</p>
        </div>

        <div class="input-group">
          <label>昵称</label>
          <input v-model="form.nickname" placeholder="请输入昵称" @keydown.enter="handleRegister" />
        </div>

        <div class="tab-bar">
          <button :class="['tab', { active: regTab === 'phone' }]" @click="regTab = 'phone'">手机号</button>
          <button :class="['tab', { active: regTab === 'email' }]" @click="regTab = 'email'">邮箱</button>
        </div>

        <div class="input-group">
          <label>{{ regTab === 'phone' ? '手机号' : '邮箱' }}</label>
          <input
            v-if="regTab === 'phone'"
            type="tel"
            v-model="form.phone"
            placeholder="请输入手机号"
            maxlength="11"
            @keydown.enter="handleRegister"
          />
          <input
            v-else
            type="email"
            v-model="form.email"
            placeholder="请输入邮箱地址"
            maxlength="100"
            @keydown.enter="handleRegister"
          />
        </div>

        <div class="input-group">
          <label>密码</label>
          <div class="password-input">
            <input
              type="password"
              v-model="form.password"
              placeholder="设置密码（至少6位）"
              @keydown.enter="handleRegister"
            />
            <button class="pwd-toggle" type="button" @click="showRegPwd = !showRegPwd">
              <svg v-if="showRegPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <button class="submit-btn" :disabled="!canRegister || auth.isLoading" @click="handleRegister">
          {{ auth.isLoading ? '注册中…' : '注册' }}
        </button>

        <p class="switch-link">已有账号？<a @click="mode = 'login'">立即登录</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const mode = ref(sessionStorage.getItem('authMode') === 'register' ? 'register' : 'login')
if (mode.value === 'register') sessionStorage.removeItem('authMode')
const tab = ref('phone')
const regTab = ref('phone')
const showPwd = ref(false)
const showRegPwd = ref(false)

const form = reactive({ nickname: '', phone: '', email: '', password: '' })

const canLogin = computed(() => {
  if (tab.value === 'phone') return /^1\d{10}$/.test(form.phone) && form.password.length >= 6
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.password.length >= 6
})
const canRegister = computed(() => {
  if (regTab.value === 'phone') return form.nickname && /^1\d{10}$/.test(form.phone) && form.password.length >= 6
  return form.nickname && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.password.length >= 6
})

async function handleLogin() {
  const result = await auth.login({
    phone: tab.value === 'phone' ? form.phone : undefined,
    email: tab.value === 'email' ? form.email : undefined,
    password: form.password
  })
  if (result.ok) router.push('/')
  else alert(result.msg)
}

async function handleRegister() {
  const regResult = await auth.register({
    phone: regTab.value === 'phone' ? form.phone : undefined,
    email: regTab.value === 'email' ? form.email : undefined,
    password: form.password,
    nickname: form.nickname
  })
  if (!regResult.ok) {
    alert(regResult.msg)
    return
  }
  // 注册成功后自动登录
  const loginResult = await auth.login({
    phone: regTab.value === 'phone' ? form.phone : undefined,
    email: regTab.value === 'email' ? form.email : undefined,
    password: form.password
  })
  if (loginResult.ok) router.push('/')
  else alert(loginResult.msg)
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F8F6F0 0%, #EDEAE3 100%);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
}

.auth-header { text-align: center; margin-bottom: 28px; }

.auth-logo {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  text-decoration: none; margin-bottom: 16px;
}
.logo-icon { flex-shrink: 0; }
.logo-text {
  font-family: 'Noto Sans SC', sans-serif; font-size: 18px; font-weight: 700;
  color: #0D6B5C; letter-spacing: 1px;
}

.auth-title { font-size: 24px; font-weight: 700; color: #1A1A2E; margin: 0 0 4px; }
.auth-subtitle { font-size: 13px; color: #8B8B9E; margin: 0; }

/* Tab */
.tab-bar {
  display: flex; gap: 0; margin-bottom: 20px; background: #F8F6F0;
  border-radius: 10px; padding: 3px;
}
.tab {
  flex: 1; padding: 8px; border: none; background: none; border-radius: 8px;
  font-size: 13px; font-weight: 500; color: #8B8B9E; cursor: pointer;
  transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.tab.active { background: #fff; color: #0D6B5C; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

/* 输入框 */
.input-group { margin-bottom: 16px; }
.input-group label {
  display: block; font-size: 13px; font-weight: 600; color: #5C5C6E; margin-bottom: 6px;
}
.input-group input {
  width: 100%; padding: 12px 14px; border: 1px solid #E5E0D6; border-radius: 12px;
  font-size: 14px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E;
  background: #F8F6F0; transition: all 0.2s; box-sizing: border-box;
}
.input-group input:focus { outline: none; border-color: #0D6B5C; background: #fff; box-shadow: 0 0 0 3px rgba(13,107,92,0.08); }

.password-input { position: relative; }
.password-input input { padding-right: 44px; }
.pwd-toggle {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px; border: none; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0;
}

/* 提交按钮 */
.submit-btn {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff;
  font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.25s;
  font-family: 'Noto Sans SC', sans-serif; margin-top: 8px;
}
.submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.submit-btn:not(:disabled):hover { box-shadow: 0 4px 16px rgba(13,107,92,0.3); transform: translateY(-1px); }

/* 切换链接 */
.switch-link { text-align: center; font-size: 13px; color: #8B8B9E; margin: 20px 0 0; }
.switch-link a { color: #0D6B5C; cursor: pointer; font-weight: 600; text-decoration: none; }
.switch-link a:hover { text-decoration: underline; }
</style>
