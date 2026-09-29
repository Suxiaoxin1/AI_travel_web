<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <header class="auth-header">
        <router-link to="/" class="auth-logo"><span class="logo-icon">⌂</span><span class="logo-text">星际行者</span></router-link>
        <h1 class="auth-title">{{ isRegister ? '创建账号' : '欢迎回来' }}</h1>
        <p class="auth-subtitle">{{ isRegister ? '注册后即可保存你的旅行记录' : '使用账号密码继续你的旅行' }}</p>
      </header>

      <div class="input-group">
        <label for="account">账号</label>
        <input id="account" v-model.trim="form.account" autocomplete="username" maxlength="24" placeholder="4–24 位英文、数字或下划线" />
        <small>账号注册后不可修改。</small>
      </div>

      <div v-if="isRegister" class="input-group">
        <label for="nickname">昵称 <span>（可选）</span></label>
        <input id="nickname" v-model.trim="form.nickname" autocomplete="nickname" maxlength="100" placeholder="留空时默认使用账号" />
      </div>

      <div class="input-group">
        <label for="password">密码</label>
        <div class="password-input">
          <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" :autocomplete="isRegister ? 'new-password' : 'current-password'" minlength="6" placeholder="至少 6 位" />
          <button class="pwd-toggle" type="button" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
        </div>
      </div>

      <div v-if="isRegister" class="input-group">
        <label for="confirmPassword">确认密码</label>
        <input id="confirmPassword" v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="6" placeholder="再次输入密码" />
      </div>

      <p v-if="validationMessage" class="form-message">{{ validationMessage }}</p>
      <button class="submit-btn" :disabled="!canSubmit || auth.isLoading" type="submit">{{ auth.isLoading ? '处理中…' : isRegister ? '注册并登录' : '登录' }}</button>

      <p class="switch-link">
        <template v-if="isRegister">已有账号？<button type="button" @click="switchMode(false)">立即登录</button></template>
        <template v-else>还没有账号？<button type="button" @click="switchMode(true)">立即注册</button></template>
      </p>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isRegister = ref(sessionStorage.getItem('authMode') === 'register')
const showPassword = ref(false)
const form = reactive({ account: '', nickname: '', password: '', confirmPassword: '' })
sessionStorage.removeItem('authMode')

const accountValid = computed(() => /^[A-Za-z0-9_]{4,24}$/.test(form.account))
const passwordValid = computed(() => form.password.length >= 6)
const passwordsMatch = computed(() => !isRegister.value || form.password === form.confirmPassword)
const canSubmit = computed(() => accountValid.value && passwordValid.value && passwordsMatch.value)
const validationMessage = computed(() => {
  if (form.account && !accountValid.value) return '账号需为 4–24 位英文、数字或下划线。'
  if (form.password && !passwordValid.value) return '密码至少需要 6 位。'
  if (isRegister.value && form.confirmPassword && !passwordsMatch.value) return '两次输入的密码不一致。'
  return ''
})

function switchMode(next) {
  isRegister.value = next
  form.password = ''
  form.confirmPassword = ''
}

async function submit() {
  if (!canSubmit.value) return
  const result = isRegister.value
    ? await auth.register(form)
    : await auth.login(form)
  if (result.ok) {
    const redirect = route.query.redirect
    const target = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/'
    router.replace(target)
  }
  else window.alert(result.msg)
}
</script>

<style scoped>
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(135deg,#f8f6f0,#edeae3)}
.auth-card{width:100%;max-width:430px;padding:40px 36px;border-radius:24px;background:#fff;box-shadow:0 8px 40px rgba(0,0,0,.08)}
.auth-header{text-align:center;margin-bottom:28px}.auth-logo{display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:16px;text-decoration:none}.logo-icon{font-size:24px;color:#d4a84b}.logo-text{font-size:18px;font-weight:700;letter-spacing:1px;color:#0d6b5c}.auth-title{margin:0 0 4px;font-size:24px;color:#1a1a2e}.auth-subtitle{margin:0;color:#8b8b9e;font-size:13px}
.input-group{margin-bottom:16px}.input-group label{display:block;margin-bottom:6px;color:#5c5c6e;font-size:13px;font-weight:600}.input-group label span,.input-group small{color:#9a98a4;font-size:12px;font-weight:400}.input-group small{display:block;margin-top:6px}.input-group input{box-sizing:border-box;width:100%;padding:12px 14px;border:1px solid #e5e0d6;border-radius:12px;background:#f8f6f0;color:#1a1a2e;font-size:14px}.input-group input:focus{outline:0;border-color:#0d6b5c;background:#fff;box-shadow:0 0 0 3px rgba(13,107,92,.08)}
.password-input{position:relative}.password-input input{padding-right:64px}.pwd-toggle{position:absolute;top:50%;right:10px;transform:translateY(-50%);border:0;background:transparent;color:#777;cursor:pointer;font-size:12px}.form-message{margin:-2px 0 16px;padding:10px 12px;border-radius:10px;background:#fff8e7;color:#92731e;font-size:12px;line-height:1.5}.submit-btn{width:100%;padding:13px;border:0;border-radius:12px;background:linear-gradient(90deg,#0d6b5c,#1a8a7a);color:#fff;font-size:15px;font-weight:600;cursor:pointer}.submit-btn:disabled{opacity:.5;cursor:not-allowed}.switch-link{margin:20px 0 0;text-align:center;color:#8b8b9e;font-size:13px}.switch-link button{border:0;background:transparent;color:#0d6b5c;font:inherit;font-weight:600;cursor:pointer}
@media(max-width:480px){.auth-card{padding:32px 22px;border-radius:20px}}
</style>
