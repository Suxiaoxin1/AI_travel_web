<template>
  <div class="dash">
    <section class="todo-panel admin-panel">
      <div class="panel-title">
        <div>
          <h2>待办事项</h2>
          <p>优先处理隐藏内容、草稿景点和近期停用账号。</p>
        </div>
        <strong class="todo-sum">{{ openTodoCount }} 项待跟进</strong>
      </div>
      <ul class="todo-list">
        <li v-for="item in todos" :key="item.key">
          <router-link :to="item.href" class="todo-row">
            <div>
              <strong>{{ item.title }}</strong>
              <span>{{ item.hint }}</span>
            </div>
            <em :class="{ hot: item.count > 0 }">{{ item.count }}</em>
          </router-link>
        </li>
        <li v-if="!todos.length" class="empty">暂无待办</li>
      </ul>
    </section>

    <section class="viz-grid">
      <article class="admin-panel viz-card">
        <h2>内容构成</h2>
        <p>游记、行程、手账与景点的体量对比</p>
        <AdminBarChart :series="dashboard?.content_mix || []" />
      </article>
      <article class="admin-panel viz-card">
        <h2>账号状态</h2>
        <p>正常与停用账号占比</p>
        <AdminDonutChart :series="dashboard?.user_status_mix || []" :colors="['#116958', '#bc5449']" />
      </article>
      <article class="admin-panel viz-card">
        <h2>景点发布</h2>
        <p>已发布、草稿与归档</p>
        <AdminBarChart :series="dashboard?.attraction_status_mix || []" :colors="['#116958', '#a47a2e', '#8a9490']" />
      </article>
      <article class="admin-panel viz-card">
        <h2>审核压力</h2>
        <p>当前需要跟进的运营项</p>
        <AdminBarChart :series="dashboard?.moderation_mix || []" :colors="['#bc5449', '#d47a62', '#a47a2e', '#6f7c77']" />
      </article>
    </section>

    <section class="stat-strip admin-panel">
      <div v-for="item in summaryStats" :key="item.label">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.hint }}</small>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted } from 'vue'
import AdminBarChart from './AdminBarChart.vue'
import AdminDonutChart from './AdminDonutChart.vue'

const dashboard = inject('adminDashboard')
const reloadAdminDashboard = inject('reloadAdminDashboard')

const todos = computed(() => dashboard.value?.todos || [])
const openTodoCount = computed(() => todos.value.filter((item) => Number(item.count) > 0).length)

const summaryStats = computed(() => [
  {
    label: '注册用户',
    value: dashboard.value?.users_total ?? 0,
    hint: `正常 ${dashboard.value?.active_users ?? 0}`,
  },
  {
    label: '已发布景点',
    value: dashboard.value?.published_attractions ?? 0,
    hint: `共维护 ${dashboard.value?.attractions_total ?? 0}`,
  },
  {
    label: '旅行游记',
    value: dashboard.value?.posts_total ?? 0,
    hint: `隐藏 ${dashboard.value?.hidden_posts ?? 0}`,
  },
  {
    label: '旅行行程',
    value: dashboard.value?.plans_total ?? 0,
    hint: `手账 ${dashboard.value?.journals_total ?? 0}`,
  },
])

async function onRefresh() {
  if (reloadAdminDashboard) await reloadAdminDashboard()
}

onMounted(() => window.addEventListener('admin:refresh', onRefresh))
onUnmounted(() => window.removeEventListener('admin:refresh', onRefresh))
</script>

<style scoped>
.dash {
  display: grid;
  gap: 18px;
}

.todo-panel .todo-sum {
  font-size: 14px;
  color: #116958;
  font-weight: 700;
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.todo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e7e1d6;
  border-radius: 10px;
  text-decoration: none;
  background: #faf8f3;
  transition: border-color 0.2s ease, transform 0.15s ease;
}

.todo-row:hover {
  border-color: #b8d5cb;
}

.todo-row:active {
  transform: translateY(1px);
}

.todo-row strong {
  display: block;
  color: #173a32;
  font-size: 15px;
}

.todo-row span {
  display: block;
  margin-top: 4px;
  color: #7b8580;
  font-size: 12px;
}

.todo-row em {
  font-style: normal;
  font-size: 28px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  color: #8a9490;
  min-width: 2ch;
  text-align: right;
}

.todo-row em.hot {
  color: #bc5449;
}

.viz-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.viz-card h2 {
  margin: 0 0 4px;
  font-size: 17px;
  color: #173a32;
}

.viz-card p {
  margin: 0 0 14px;
  color: #7b8580;
  font-size: 13px;
}

.stat-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 8px 4px;
}

.stat-strip > div {
  padding: 12px 14px;
}

.stat-strip span,
.stat-strip small {
  display: block;
  color: #7b8580;
  font-size: 12px;
}

.stat-strip strong {
  display: block;
  margin: 6px 0;
  font-size: 28px;
  color: #163a31;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 900px) {
  .todo-list,
  .viz-grid,
  .stat-strip {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .todo-row {
    transition: none;
  }
}
</style>
