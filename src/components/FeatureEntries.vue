<template>
  <section class="feature-entries">
    <div class="features-grid">
      <div class="feature-card" v-for="feature in features" :key="feature.title">
        <div class="feature-icon" v-html="feature.icon"></div>
        <h3 class="feature-title">{{ feature.title }}</h3>
        <ul class="feature-list">
          <li v-for="item in feature.items" :key="item">{{ item }}</li>
        </ul>
        <router-link :to="feature.link" class="feature-btn">
          {{ feature.btnText }}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
const features = [
  {
    title: 'AI 智能规划',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><path d="M7 11l2 2 4-4"/></svg>`,
    items: [
      '告诉AI你的偏好与预算',
      '智能生成专属旅行行程',
      '实时调整与优化路线',
      '贴心出行提醒'
    ],
    btnText: '立即体验',
    link: '/plan'
  },
  {
    title: '出行偏好',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    items: [
      '选择目的地与出行方式',
      '设定行程节奏与住宿偏好',
      '自定义饮食与特殊需求',
      'AI 智能匹配最佳方案'
    ],
    btnText: '设置偏好',
    link: '/destinations'
  },
  {
    title: '精选路线',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C23B22" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    items: [
      '编辑精选50条星际航线',
      '覆盖东西南北全域风光',
      '最美季节推荐路线',
      '深度人文探索之旅'
    ],
    btnText: '浏览路线',
    link: '/routes'
  },
  {
    title: '旅途分享',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A8A7A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`,
    items: [
      '分享你的星际探险故事',
      '发现同路人的精彩攻略',
      '旅行达人经验交流',
      '记录旅途中的美好瞬间'
    ],
    btnText: '加入社区',
    link: '/share'
  },
  {
    title: '旅游手账',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
    items: [
      '一键生成精美旅行手账',
      '多种风格模板可选',
      'AI 智能排版设计',
      '支持导出与打印分享'
    ],
    btnText: '创建手账',
    link: '/journal'
  },
  {
    title: '互动地图',
    icon: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`,
    items: [
      '点击省份探索详细信息',
      '查看各省域旅游数据',
      '交互式缩放和平移',
      '发现隐藏的旅行宝藏'
    ],
    btnText: '开始探索',
    link: '/'
  }
]
</script>

<style scoped>
.feature-entries {
  padding: 64px 0;
  background: #FFFFFF;
  border-radius: 20px;
}

.features-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  padding: 0 40px;
}

.feature-card {
  padding: 32px 28px;
  background: #FAF9F6;
  border: 1px solid #EFECE4;
  border-radius: 16px;
  transition: all 0.35s ease;
  display: flex;
  flex-direction: column;
}

.feature-card:hover {
  border-color: #D4A84B;
  box-shadow: 0 8px 32px rgba(13, 107, 92, 0.08);
  transform: translateY(-4px);
}

.feature-icon {
  margin-bottom: 16px;
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 16px 0;
  font-family: 'Noto Sans SC', sans-serif;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.feature-list li {
  position: relative;
  padding-left: 20px;
  font-size: 14px;
  color: #5C5C6E;
  line-height: 1.6;
  font-family: 'Noto Sans SC', sans-serif;
}

.feature-list li::before {
  content: '✦';
  position: absolute;
  left: 0;
  color: #1A8A7A;
  font-size: 10px;
  top: 4px;
}

.feature-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #0D6B5C;
  background: transparent;
  border: 1px solid #0D6B5C;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: 'Noto Sans SC', sans-serif;
  align-self: flex-start;
  text-decoration: none;
}

.feature-btn:hover {
  background: #0D6B5C;
  color: #fff;
}

.feature-btn.router-link-active {
  background: #0D6B5C;
  color: #fff;
}

@media (max-width: 900px) {
  .features-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    padding: 0 24px;
  }
}

@media (max-width: 560px) {
  .feature-entries {
    padding: 36px 0;
    border-radius: 18px;
  }

  .features-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    padding: 0 16px;
  }

  .feature-card {
    padding: 24px 20px;
  }
}
</style>
