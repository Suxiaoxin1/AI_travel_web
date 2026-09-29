<template>
  <section class="admin-panel">
    <div class="panel-title">
      <div>
        <h2>模型密钥</h2>
        <p>保存后立即生效，无需改服务器 .env。列表只显示脱敏结果，不会回显明文。</p>
      </div>
    </div>

    <p v-if="loading" class="admin-muted">加载中…</p>
    <p v-else-if="error" class="admin-flash error">{{ error }}</p>

    <div v-else class="form-grid keys-grid">
      <label v-for="item in items" :key="item.key" class="full key-card">
        <span class="key-head">
          <strong>{{ item.label }}</strong>
          <em :class="item.source">{{ sourceLabel(item.source) }}</em>
        </span>
        <span class="key-hint">{{ item.hint }}</span>
        <input
          v-model="drafts[item.key]"
          type="password"
          autocomplete="new-password"
          :placeholder="item.configured ? `已配置（${item.masked}），输入新值可覆盖` : '尚未配置，在此粘贴新密钥'"
        />
        <span class="key-actions">
          <button
            v-if="item.source === 'admin'"
            type="button"
            class="secondary-btn"
            :disabled="saving"
            @click="clearKey(item.key)"
          >
            清除后台覆盖
          </button>
        </span>
      </label>
    </div>

    <div class="keys-footer">
      <button type="button" class="primary-btn" :disabled="saving || !hasDraft" @click="saveAll">
        {{ saving ? '保存中…' : '保存更改' }}
      </button>
      <p class="admin-muted">万相成片需同时配置 DashScope API Key 与 Workspace ID。</p>
    </div>
  </section>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref } from 'vue'
import apiClient from '../../utils/apiClient'
import { getErrorMessage, unwrap } from './adminUtils.js'

const showFlash = inject('adminFlash', () => {})
const items = ref([])
const drafts = reactive({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const hasDraft = computed(() => Object.values(drafts).some((value) => String(value || '').trim()))

function sourceLabel(source) {
  if (source === 'admin') return '后台覆盖'
  if (source === 'env') return '环境变量'
  return '未配置'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = unwrap(await apiClient.get('/admin/model-keys'))
    items.value = data.items || []
    for (const item of items.value) drafts[item.key] = ''
  } catch (err) {
    error.value = getErrorMessage(err, '加载模型密钥失败')
  } finally {
    loading.value = false
  }
}

async function saveAll() {
  const updates = {}
  for (const [key, value] of Object.entries(drafts)) {
    const text = String(value || '').trim()
    if (text) updates[key] = text
  }
  if (!Object.keys(updates).length) return
  saving.value = true
  try {
    const data = unwrap(await apiClient.put('/admin/model-keys', { updates, clears: [] }))
    items.value = data.items || []
    for (const item of items.value) drafts[item.key] = ''
    showFlash('模型密钥已保存')
  } catch (err) {
    showFlash(getErrorMessage(err, '保存失败'), 'error')
  } finally {
    saving.value = false
  }
}

async function clearKey(key) {
  if (!window.confirm('清除后台覆盖后，将回退使用环境变量（若有）。确定？')) return
  saving.value = true
  try {
    const data = unwrap(await apiClient.put('/admin/model-keys', { updates: {}, clears: [key] }))
    items.value = data.items || []
    drafts[key] = ''
    showFlash('已清除后台覆盖')
  } catch (err) {
    showFlash(getErrorMessage(err, '清除失败'), 'error')
  } finally {
    saving.value = false
  }
}

function onRefresh() {
  load()
}

onMounted(() => {
  load()
  window.addEventListener('admin:refresh', onRefresh)
})
onUnmounted(() => window.removeEventListener('admin:refresh', onRefresh))
</script>

<style scoped>
.keys-grid {
  gap: 16px;
}
.key-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid #e7dfd2;
  border-radius: 12px;
  background: #fffefb;
}
.key-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.key-head strong {
  font-size: 15px;
}
.key-head em {
  font-style: normal;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef3f1;
  color: #5f716b;
}
.key-head em.admin {
  background: #e7f5ef;
  color: #116958;
}
.key-head em.env {
  background: #f3efe4;
  color: #8a6a2a;
}
.key-head em.none {
  background: #f7ebe8;
  color: #a35a4f;
}
.key-hint {
  color: #7b8580;
  font-size: 13px;
}
.key-actions {
  display: flex;
  gap: 8px;
}
.keys-footer {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.admin-muted {
  color: #7b8580;
  font-size: 13px;
}
</style>
