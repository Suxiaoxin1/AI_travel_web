<template>
  <section class="admin-panel">
    <div class="panel-title">
      <div>
        <h2>用户列表</h2>
        <p>按账号、昵称或状态筛选；可直接创建管理员账号。</p>
      </div>
      <div class="filters">
        <input v-model.trim="filters.keyword" placeholder="账号或昵称" @keyup.enter="load(true)" />
        <select v-model="filters.status" @change="load(true)">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">已停用</option>
        </select>
        <button type="button" @click="load(true)">查询</button>
        <button type="button" class="primary-btn" @click="openCreateForm">添加管理员</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>账号</th>
            <th>内容统计</th>
            <th>状态</th>
            <th>权限</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td><strong>{{ user.nickname }}</strong></td>
            <td><span class="account">{{ user.account }}</span></td>
            <td>{{ user.posts_count }} 游记 · {{ user.plans_count }} 行程 · {{ user.journals_count }} 手账</td>
            <td><span :class="['status', user.status]">{{ user.status === 'active' ? '正常' : '已停用' }}</span></td>
            <td>{{ user.is_admin ? '管理员' : '普通用户' }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <div class="actions">
                <button type="button" @click="viewUser(user)">详情</button>
                <button type="button" :disabled="user.id === currentUserId || actionTarget === 'user-' + user.id" @click="toggleStatus(user)">
                  {{ user.status === 'active' ? '停用' : '恢复' }}
                </button>
                <button type="button" :disabled="user.id === currentUserId || actionTarget === 'user-' + user.id" @click="toggleAdmin(user)">
                  {{ user.is_admin ? '移除管理' : '设为管理' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length"><td colspan="7" class="empty">暂无符合条件的用户</td></tr>
        </tbody>
      </table>
    </div>

    <footer class="panel-footer">
      <span>共 {{ total }} 位用户</span>
      <AdminPager :page="page" :total="total" :size="PAGE_SIZE" @change="changePage" />
    </footer>

    <div v-if="createForm.visible" class="modal-mask" @click.self="closeCreateForm">
      <form class="editor-card" @submit.prevent="createAdmin">
        <header>
          <div>
            <span class="eyebrow">ADMIN ACCOUNT</span>
            <h2>添加管理员</h2>
          </div>
          <button type="button" class="icon-btn" @click="closeCreateForm">关闭</button>
        </header>
        <div class="form-grid">
          <label>
            账号
            <input
              v-model.trim="createForm.account"
              required
              minlength="4"
              maxlength="24"
              pattern="[A-Za-z0-9_]{4,24}"
              placeholder="4-24 位字母、数字或下划线"
              autocomplete="off"
            />
          </label>
          <label>
            昵称
            <input v-model.trim="createForm.nickname" maxlength="100" placeholder="可留空，默认与账号相同" />
          </label>
          <label class="full">
            初始密码
            <input
              v-model="createForm.password"
              type="password"
              required
              minlength="6"
              maxlength="128"
              placeholder="至少 6 位"
              autocomplete="new-password"
            />
          </label>
          <label class="full">
            确认密码
            <input
              v-model="createForm.passwordConfirm"
              type="password"
              required
              minlength="6"
              maxlength="128"
              placeholder="再次输入密码"
              autocomplete="new-password"
            />
          </label>
        </div>
        <p v-if="createForm.error" class="form-error">{{ createForm.error }}</p>
        <footer>
          <button type="button" class="secondary-btn" @click="closeCreateForm">取消</button>
          <button type="submit" class="primary-btn" :disabled="creating">{{ creating ? '创建中…' : '创建管理员' }}</button>
        </footer>
      </form>
    </div>

    <div v-if="selectedUser" class="modal-mask" @click.self="selectedUser = null">
      <section class="editor-card detail-card">
        <header>
          <div>
            <span class="eyebrow">USER PROFILE</span>
            <h2>{{ selectedUser.nickname }} 的数据概览</h2>
          </div>
          <button type="button" class="icon-btn" @click="selectedUser = null">关闭</button>
        </header>
        <div class="profile-data">
          <p><span>账号</span><strong>{{ selectedUser.account }}</strong></p>
          <p><span>主页城市</span><strong>{{ selectedUser.home_city || '未填写' }}</strong></p>
          <p><span>最近登录</span><strong>{{ formatDate(selectedUser.last_login_at) }}</strong></p>
          <p>
            <span>内容统计</span>
            <strong>
              {{ selectedUser.posts_count }} 游记 · {{ selectedUser.plans_count }} 行程 ·
              {{ selectedUser.routes_count }} 路线 · {{ selectedUser.favorites_count }} 收藏 ·
              {{ selectedUser.journals_count }} 手账
            </strong>
          </p>
        </div>
        <h3>近期活动</h3>
        <ul class="activity-list">
          <li v-for="item in selectedUser.recent_activity || []" :key="item.type + item.title + item.created_at">
            <strong>{{ activityText(item.type) }}</strong>
            <span>{{ item.title }} · {{ formatDate(item.created_at) }}</span>
          </li>
          <li v-if="!(selectedUser.recent_activity || []).length" class="empty">暂未记录到公开活动</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../utils/apiClient'
import AdminPager from './AdminPager.vue'
import {
  PAGE_SIZE,
  activityText,
  formatDate,
  getErrorMessage,
  unwrap,
} from './adminUtils.js'

const auth = useAuthStore()
const route = useRoute()
const showFlash = inject('adminFlash')
const reloadAdminDashboard = inject('reloadAdminDashboard')

const users = ref([])
const total = ref(0)
const page = ref(1)
const filters = reactive({ keyword: '', status: '' })
const selectedUser = ref(null)
const actionTarget = ref('')
const creating = ref(false)
const currentUserId = computed(() => auth.currentUser?.id)

const emptyCreateForm = () => ({
  visible: false,
  account: '',
  nickname: '',
  password: '',
  passwordConfirm: '',
  error: '',
})
const createForm = reactive(emptyCreateForm())

async function load(reset = false) {
  if (reset) page.value = 1
  const data = unwrap(await apiClient.get('/admin/users', {
    params: {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      page: page.value,
      page_size: PAGE_SIZE,
    },
  }))
  users.value = data.items
  total.value = data.total
}

function openCreateForm() {
  Object.assign(createForm, emptyCreateForm(), { visible: true })
}

function closeCreateForm() {
  Object.assign(createForm, emptyCreateForm())
}

async function createAdmin() {
  createForm.error = ''
  if (createForm.password !== createForm.passwordConfirm) {
    createForm.error = '两次输入的密码不一致'
    return
  }
  creating.value = true
  try {
    await apiClient.post('/admin/users', {
      account: createForm.account,
      nickname: createForm.nickname || undefined,
      password: createForm.password,
      is_admin: true,
    })
    showFlash(`管理员账号“${createForm.account}”已创建`)
    closeCreateForm()
    await Promise.all([load(true), reloadAdminDashboard?.()])
  } catch (err) {
    createForm.error = getErrorMessage(err, '创建管理员失败')
  } finally {
    creating.value = false
  }
}

async function viewUser(user) {
  try {
    selectedUser.value = unwrap(await apiClient.get(`/admin/users/${user.id}`))
  } catch (err) {
    showFlash(getErrorMessage(err, '用户详情加载失败'), 'error')
  }
}

async function runUserAction(user, endpoint, payload, message) {
  actionTarget.value = `user-${user.id}`
  try {
    await apiClient.patch(endpoint, payload)
    showFlash(message)
    await Promise.all([load(), reloadAdminDashboard?.()])
  } catch (err) {
    showFlash(getErrorMessage(err, '操作失败，请稍后重试'), 'error')
  } finally {
    actionTarget.value = ''
  }
}

async function toggleStatus(user) {
  if (!confirm(`确认${user.status === 'active' ? '停用' : '恢复'}“${user.nickname}”吗？`)) return
  await runUserAction(
    user,
    `/admin/users/${user.id}/status`,
    { status: user.status === 'active' ? 'suspended' : 'active' },
    `已更新账号“${user.account}”状态。`,
  )
}

async function toggleAdmin(user) {
  if (!confirm(`确认${user.is_admin ? '移除' : '授予'}“${user.nickname}”的管理员权限吗？`)) return
  await runUserAction(
    user,
    `/admin/users/${user.id}/admin`,
    { is_admin: !user.is_admin },
    `已更新“${user.account}”的管理员权限。`,
  )
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

<style scoped>
.form-error {
  margin: 14px 0 0;
  color: #a2473d;
  font-size: 13px;
}
</style>
