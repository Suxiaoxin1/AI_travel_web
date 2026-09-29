<template>
  <section class="admin-panel">
    <div class="panel-title">
      <div>
        <h2>分享列表</h2>
        <p>按状态筛选待复核游记；隐藏后前台不可见。</p>
      </div>
      <div class="filters">
        <input v-model.trim="filters.keyword" placeholder="作者、标题、内容或地点" @keyup.enter="load(true)" />
        <select v-model="filters.status" @change="load(true)">
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="hidden">已隐藏</option>
          <option value="deleted">已删除</option>
        </select>
        <button type="button" @click="load(true)">查询</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>分享内容</th>
            <th>作者</th>
            <th>地点</th>
            <th>互动</th>
            <th>状态</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in posts" :key="item.id">
            <td>
              <strong>{{ item.title || '未命名游记' }}</strong>
              <small>{{ truncate(item.content, 54) }}</small>
            </td>
            <td>
              {{ item.author }}
              <small>{{ item.author_account }}</small>
            </td>
            <td>{{ item.location || '未填写' }}</td>
            <td>{{ item.likes_count }} 赞 · {{ item.comments_count }} 评论</td>
            <td><span :class="['status', item.status]">{{ statusText(item.status) }}</span></td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
              <div class="actions">
                <button v-if="item.status !== 'published'" type="button" @click="moderate(item, 'published')">恢复</button>
                <button v-else type="button" @click="moderate(item, 'hidden')">隐藏</button>
                <button v-if="item.status !== 'deleted'" type="button" class="danger" @click="moderate(item, 'deleted')">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="!posts.length"><td colspan="7" class="empty">暂无符合条件的分享内容</td></tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer">
      <span>共 {{ total }} 篇分享</span>
      <AdminPager :page="page" :total="total" :size="PAGE_SIZE" @change="changePage" />
    </footer>
  </section>
</template>

<script setup>
import { inject, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '../../utils/apiClient'
import AdminPager from './AdminPager.vue'
import {
  PAGE_SIZE,
  formatDate,
  getErrorMessage,
  moderationReason,
  statusText,
  truncate,
  unwrap,
} from './adminUtils.js'

const route = useRoute()
const showFlash = inject('adminFlash')
const reloadAdminDashboard = inject('reloadAdminDashboard')

const posts = ref([])
const total = ref(0)
const page = ref(1)
const filters = reactive({ keyword: '', status: '' })

async function load(reset = false) {
  if (reset) page.value = 1
  const data = unwrap(await apiClient.get('/admin/posts', {
    params: {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      page: page.value,
      page_size: PAGE_SIZE,
    },
  }))
  posts.value = data.items
  total.value = data.total
}

async function moderate(item, status) {
  if (!confirm(`确认将该游记设为“${statusText(status)}”吗？`)) return
  try {
    await apiClient.patch(`/admin/posts/${item.id}/status`, {
      status,
      reason: moderationReason(statusText(status), item) || null,
    })
    showFlash('游记状态已更新')
    await Promise.all([load(), reloadAdminDashboard?.()])
  } catch (err) {
    showFlash(getErrorMessage(err, '游记状态更新失败'), 'error')
  }
}

async function changePage(next) {
  page.value = next
  await load()
}

async function onRefresh() {
  await load()
}

onMounted(async () => {
  if (typeof route.query.status === 'string') filters.status = route.query.status
  await load()
  window.addEventListener('admin:refresh', onRefresh)
})

onUnmounted(() => window.removeEventListener('admin:refresh', onRefresh))
</script>
