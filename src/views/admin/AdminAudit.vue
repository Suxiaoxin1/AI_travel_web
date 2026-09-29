<template>
  <section class="admin-panel">
    <div class="panel-title">
      <div>
        <h2>最近操作</h2>
        <p>展示管理员对用户、景点、分享和评论的操作痕迹。</p>
      </div>
    </div>
    <ul class="audit-list">
      <li v-for="item in auditLogs" :key="item.id">
        <div>
          <strong>{{ auditText(item) }}</strong>
          <span>{{ item.actor_nickname || '系统管理员' }} · {{ formatDate(item.created_at) }}</span>
        </div>
        <small>{{ auditDetail(item) }}</small>
      </li>
      <li v-if="!auditLogs.length" class="empty">暂无管理操作记录</li>
    </ul>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import apiClient from '../../utils/apiClient'
import { auditDetail, auditText, formatDate, unwrap } from './adminUtils.js'

const auditLogs = ref([])

async function load() {
  auditLogs.value = unwrap(await apiClient.get('/admin/audit-logs', { params: { page_size: 50 } })).items
}

async function onRefresh() {
  await load()
}

onMounted(async () => {
  await load()
  window.addEventListener('admin:refresh', onRefresh)
})

onUnmounted(() => window.removeEventListener('admin:refresh', onRefresh))
</script>
