<template>
  <section class="admin-panel">
    <div class="panel-title">
      <div>
        <h2>景点列表</h2>
        <p>维护前台热门目的地；封面图会同步到前台展示。</p>
      </div>
      <button type="button" class="primary-btn" @click="openForm()">新增景点</button>
    </div>

    <div class="filters wide">
      <input v-model.trim="filters.keyword" placeholder="景点、省份或城市" @keyup.enter="load(true)" />
      <select v-model="filters.status" @change="load(true)">
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="published">已发布</option>
        <option value="archived">已归档</option>
      </select>
      <button type="button" @click="load(true)">查询</button>
    </div>

    <div class="list-wrap">
      <div class="list-head list-row" aria-hidden="true">
        <span>封面</span>
        <span>景点</span>
        <span>地区</span>
        <span>评分</span>
        <span>适宜季节</span>
        <span>排序</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      <div v-if="!attractions.length" class="list-empty">暂无景点，可通过“新增景点”建立首批运营内容</div>

      <article v-for="item in attractions" :key="item.id" class="list-row list-item">
        <div class="cover-cell">
          <img
            v-if="item.cover_image_url"
            :src="item.cover_image_url"
            :alt="item.name"
            width="72"
            height="54"
            loading="lazy"
          />
          <span v-else class="cover-empty">无图</span>
        </div>
        <div class="name-cell">
          <strong>{{ item.name }}</strong>
          <small>{{ item.short_desc || '暂无简介' }}</small>
        </div>
        <div>{{ item.province }}{{ item.city ? ' · ' + item.city : '' }}</div>
        <div>{{ item.rating ?? '未设置' }}</div>
        <div>{{ item.best_season || '未设置' }}</div>
        <div>{{ item.sort_order }}</div>
        <div><span :class="['status', item.status]">{{ statusText(item.status) }}</span></div>
        <div class="actions">
          <button type="button" @click="openForm(item)">编辑</button>
          <button v-if="item.status !== 'published'" type="button" @click="updateItem(item, { status: 'published' }, '景点已发布')">发布</button>
          <button v-else type="button" @click="updateItem(item, { status: 'draft' }, '景点已转为草稿')">下架</button>
          <button type="button" class="danger" :disabled="item.status === 'archived'" @click="archiveItem(item)">归档</button>
        </div>
      </article>
    </div>

    <footer class="panel-footer">
      <span>共 {{ total }} 个景点</span>
      <AdminPager :page="page" :total="total" :size="PAGE_SIZE" @change="changePage" />
    </footer>

    <div v-if="form.visible" class="modal-mask" @click.self="closeForm">
      <form class="editor-card" @submit.prevent="save">
        <header>
          <div>
            <span class="eyebrow">DESTINATION</span>
            <h2>{{ form.id ? '编辑景点' : '新增景点' }}</h2>
          </div>
          <button type="button" class="icon-btn" @click="closeForm">关闭</button>
        </header>
        <div class="form-grid">
          <label>景点名称<input v-model.trim="form.name" required maxlength="160" /></label>
          <label>省份<input v-model.trim="form.province" required maxlength="80" /></label>
          <label>城市<input v-model.trim="form.city" maxlength="80" /></label>
          <label>评分<input v-model.number="form.rating" type="number" min="0" max="5" step="0.1" /></label>
          <label>适宜季节<input v-model.trim="form.best_season" maxlength="120" /></label>
          <label>推荐游览时长<input v-model.trim="form.recommended_duration" maxlength="60" /></label>
          <label>排序值<input v-model.number="form.sort_order" type="number" min="0" /></label>
          <label>
            状态
            <select v-model="form.status">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </label>
          <label class="full">
            封面图地址
            <input v-model.trim="form.cover_image_url" maxlength="2048" placeholder="例如 /images/landmarks/beijing_01_gugong.jpg" />
          </label>
          <div v-if="form.cover_image_url" class="cover-preview full">
            <img :src="form.cover_image_url" :alt="form.name || '封面预览'" />
          </div>
          <label class="full">标签<input v-model.trim="form.tagsText" placeholder="使用英文逗号分隔，例如：自然风光,亲子" /></label>
          <label class="full">简短介绍<textarea v-model.trim="form.short_desc" maxlength="1000" rows="3" /></label>
          <label class="full">详细介绍<textarea v-model.trim="form.description" maxlength="5000" rows="4" /></label>
        </div>
        <footer>
          <button type="button" class="secondary-btn" @click="closeForm">取消</button>
          <button type="submit" class="primary-btn" :disabled="saving">{{ saving ? '保存中…' : '保存景点' }}</button>
        </footer>
      </form>
    </div>
  </section>
</template>

<script setup>
import { inject, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '../../utils/apiClient'
import AdminPager from './AdminPager.vue'
import { PAGE_SIZE, getErrorMessage, statusText, unwrap } from './adminUtils.js'

const route = useRoute()
const showFlash = inject('adminFlash')
const reloadAdminDashboard = inject('reloadAdminDashboard')

const attractions = ref([])
const total = ref(0)
const page = ref(1)
const filters = reactive({ keyword: '', status: '' })
const saving = ref(false)

const emptyForm = () => ({
  visible: false,
  id: null,
  name: '',
  province: '',
  city: '',
  rating: null,
  best_season: '',
  recommended_duration: '',
  sort_order: 0,
  status: 'draft',
  cover_image_url: '',
  tagsText: '',
  short_desc: '',
  description: '',
})

const form = reactive(emptyForm())

async function load(reset = false) {
  if (reset) page.value = 1
  const data = unwrap(await apiClient.get('/admin/attractions', {
    params: {
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      page: page.value,
      page_size: PAGE_SIZE,
    },
  }))
  attractions.value = data.items
  total.value = data.total
}

function openForm(item = null) {
  Object.assign(
    form,
    emptyForm(),
    item
      ? { ...item, visible: true, tagsText: (item.tags || []).join(', ') }
      : { visible: true },
  )
}

function closeForm() {
  Object.assign(form, emptyForm())
}

async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      province: form.province,
      city: form.city || null,
      rating: form.rating === '' || form.rating == null ? null : Number(form.rating),
      best_season: form.best_season || null,
      recommended_duration: form.recommended_duration || null,
      sort_order: Number(form.sort_order || 0),
      status: form.status,
      cover_image_url: form.cover_image_url || null,
      tags: form.tagsText.split(',').map((item) => item.trim()).filter(Boolean),
      short_desc: form.short_desc || null,
      description: form.description || null,
    }
    if (form.id) await apiClient.patch(`/admin/attractions/${form.id}`, payload)
    else await apiClient.post('/admin/attractions', payload)
    showFlash(form.id ? '景点已更新' : '景点已创建')
    closeForm()
    await Promise.all([load(), reloadAdminDashboard?.()])
  } catch (err) {
    showFlash(getErrorMessage(err, '景点保存失败'), 'error')
  } finally {
    saving.value = false
  }
}

async function updateItem(item, payload, message) {
  try {
    await apiClient.patch(`/admin/attractions/${item.id}`, payload)
    showFlash(message)
    await Promise.all([load(), reloadAdminDashboard?.()])
  } catch (err) {
    showFlash(getErrorMessage(err, '景点更新失败'), 'error')
  }
}

async function archiveItem(item) {
  if (!confirm(`确认归档“${item.name}”吗？归档后它不会出现在前台。`)) return
  try {
    await apiClient.delete(`/admin/attractions/${item.id}`)
    showFlash('景点已归档')
    await Promise.all([load(), reloadAdminDashboard?.()])
  } catch (err) {
    showFlash(getErrorMessage(err, '景点归档失败'), 'error')
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

<style scoped>
.list-wrap {
  overflow-x: auto;
}

.list-row {
  display: grid;
  grid-template-columns: 80px minmax(180px, 1.6fr) 88px 64px 96px 56px 72px 200px;
  gap: 12px;
  align-items: center;
  min-width: 980px;
}

.list-head {
  padding: 0 4px 10px;
  border-bottom: 1px solid #eee9df;
  color: #89918e;
  font-size: 13px;
  font-weight: 600;
}

.list-item {
  padding: 12px 4px;
  border-bottom: 1px solid #eee9df;
  color: #53615c;
  font-size: 13px;
}

.list-empty {
  padding: 28px 8px;
  text-align: center;
  color: #949b98;
}

.name-cell {
  min-width: 0;
}

.name-cell strong,
.name-cell small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-cell strong {
  color: #243f37;
}

.name-cell small {
  margin-top: 3px;
  color: #7b8580;
  font-size: 12px;
}

.cover-cell {
  width: 72px;
  height: 54px;
  border-radius: 8px;
  overflow: hidden;
  background: #ece7dc;
  display: grid;
  place-items: center;
}

.cover-cell img {
  width: 72px;
  height: 54px;
  object-fit: cover;
  display: block;
}

.cover-empty {
  font-size: 11px;
  color: #8a9490;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.cover-preview {
  grid-column: 1 / -1;
  border: 1px solid #e4ddd2;
  border-radius: 10px;
  overflow: hidden;
  background: #f3efe6;
  max-height: 220px;
}

.cover-preview img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}

@media (max-width: 900px) {
  .list-row {
    grid-template-columns: 72px minmax(140px, 1fr) 200px;
  }

  .list-head span:nth-child(n + 3):nth-child(-n + 7),
  .list-item > :nth-child(n + 3):nth-child(-n + 7) {
    display: none;
  }
}
</style>
