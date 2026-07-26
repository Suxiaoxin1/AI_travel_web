<template>
  <div class="page-container">
    <!-- ============ 欢迎页：可选MBTI + 统一答题入口 ============ -->
    <div v-if="currentQ === -1" class="welcome-screen">
      <h1 class="welcome-title">个性化旅行偏好测试</h1>
      <p class="welcome-desc">60 道多元化情景题，精准描绘你的旅行人格</p>

      <!-- MBTI 可选选择（选了直接用，没选则通过答题推断） -->
      <div class="mbti-section">
        <div class="mbti-optional-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          <span>已知 MBTI？可选填以提升精度；不填则由答题自动推断</span>
        </div>

        <div class="mbti-groups">
          <!-- 分析家 -->
          <div class="mbti-group">
            <div class="mbti-group-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7BA4D4" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              分析家 ANALYSTS
            </div>
            <div class="mbti-grid">
              <button v-for="t in mbtiTypes.analysts" :key="t.code"
                :class="['mbti-card', 'analyst', { selected: selectedMbti === t.code }]"
                @click="toggleMbti(t.code)">
                <span class="mbti-code">{{ t.code }}</span>
                <span class="mbti-name">{{ t.name }}</span>
              </button>
            </div>
          </div>
          <!-- 外交家 -->
          <div class="mbti-group">
            <div class="mbti-group-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7BC8A0" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              外交家 DIPLOMATS
            </div>
            <div class="mbti-grid">
              <button v-for="t in mbtiTypes.diplomats" :key="t.code"
                :class="['mbti-card', 'diplomat', { selected: selectedMbti === t.code }]"
                @click="toggleMbti(t.code)">
                <span class="mbti-code">{{ t.code }}</span>
                <span class="mbti-name">{{ t.name }}</span>
              </button>
            </div>
          </div>
          <!-- 守护者 -->
          <div class="mbti-group">
            <div class="mbti-group-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4B86A" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              守护者 SENTINELS
            </div>
            <div class="mbti-grid">
              <button v-for="t in mbtiTypes.sentinels" :key="t.code"
                :class="['mbti-card', 'sentinel', { selected: selectedMbti === t.code }]"
                @click="toggleMbti(t.code)">
                <span class="mbti-code">{{ t.code }}</span>
                <span class="mbti-name">{{ t.name }}</span>
              </button>
            </div>
          </div>
          <!-- 探险家 -->
          <div class="mbti-group">
            <div class="mbti-group-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D48A7B" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              探险家 EXPLORERS
            </div>
            <div class="mbti-grid">
              <button v-for="t in mbtiTypes.explorers" :key="t.code"
                :class="['mbti-card', 'explorer', { selected: selectedMbti === t.code }]"
                @click="toggleMbti(t.code)">
                <span class="mbti-code">{{ t.code }}</span>
                <span class="mbti-name">{{ t.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- MBTI 描述（选中后显示） -->
        <div class="mbti-description" v-if="selectedMbti">
          <div class="mbti-desc-card">
            <span class="mbti-desc-code">{{ selectedMbti }}</span>
            <span class="mbti-desc-name">{{ getMbtiDetail(selectedMbti).name }}</span>
            <p class="mbti-desc-text">{{ getMbtiDetail(selectedMbti).desc }}</p>
            <p class="mbti-desc-travel">{{ getMbtiDetail(selectedMbti).travelStyle }}</p>
          </div>
        </div>
      </div>

      <!-- 统一入口按钮 -->
      <button class="quiz-start-btn" @click="startQuiz">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        {{ selectedMbti ? '已选 ' + selectedMbti + '，开始情景答题' : '开始 60 道情景答题' }}
      </button>
      <p class="start-hint">答满 20 题即可生成报告，也可答完全部 60 题</p>
    </div>

    <!-- ============ 统一答题页 ============ -->
    <div v-else-if="currentQ < questions.length" class="quiz-screen">
      <div class="question-card">
        <div class="q-category">
          <span class="q-cat-tag">{{ questions[currentQ].scenario }}</span>
          <span class="q-progress-inline">第 {{ currentQ + 1 }} / {{ questions.length }} 题</span>
        </div>
        <h2 class="q-text">{{ questions[currentQ].question }}</h2>
        <div class="q-options">
          <button
            v-for="(opt, oi) in questions[currentQ].options"
            :key="oi"
            :class="['q-option', { selected: selectedAnswers[currentQ] === oi }]"
            @click="selectAndAdvance(currentQ, oi)"
          >
            <span class="opt-letter">{{ ['A','B','C','D'][oi] }}</span>
            <span class="opt-text">{{ opt.text }}</span>
            <span class="opt-check" v-if="selectedAnswers[currentQ] === oi">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </button>
        </div>
        <div class="q-nav">
          <button class="q-prev" :disabled="currentQ === 0" @click="currentQ--">上一题</button>
          <button v-if="getAnsweredCount() >= MIN_ANSWERS" class="q-finish" @click="generateReport">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            立即生成报告
          </button>
          <button class="q-next" :disabled="selectedAnswers[currentQ] === undefined" @click="nextQuestion()">
            {{ currentQ === questions.length - 1 ? '查看报告' : '下一题' }}
            <svg v-if="currentQ < questions.length - 1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div class="q-hint" v-if="getAnsweredCount() >= MIN_ANSWERS && currentQ < questions.length - 1">
          已答 {{ getAnsweredCount() }} / {{ questions.length }} 题，点击"立即生成报告"可提前结束
        </div>
      </div>
    </div>

    <!-- ============ 报告页 ============ -->
    <div v-else class="report-screen">
      <div class="report-card">
        <div class="report-header">
          <div class="report-avatar">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="report-title-area">
            <h2 class="report-title">你的旅行偏好报告</h2>
            <div class="report-persona">
              <span class="persona-badge" :style="{ background: persona.color }">{{ persona.title }}</span>
              <span class="persona-score">{{ persona.score }}%</span>
              <span class="persona-mbti" v-if="persona.mbti">{{ persona.mbti }}</span>
            </div>
          </div>
        </div>

        <div class="report-body">
          <!-- 人格画像总结 -->
          <div v-if="reportData.summary" class="report-summary">
            <span class="summary-tag">人格画像</span>
            <p>{{ reportData.summary }}</p>
          </div>

          <!-- MBTI 维度 -->
          <div class="report-mbti-bar" v-if="persona.mbti && mbtiDimensions.length">
            <h3 class="dim-title">MBTI 旅行人格</h3>
            <div class="mbti-dim-bars">
              <div v-for="d in mbtiDimensions" :key="d.key" class="mbti-dim-row">
                <span :class="['mbti-dim-label', { active: d.left }]">{{ d.leftLabel }}</span>
                <div class="mbti-dim-track">
                  <div class="mbti-dim-fill" :class="{ left: d.left, right: !d.left }" :style="{ width: d.left ? d.value : (100 - d.value) + '%' }"></div>
                </div>
                <span :class="['mbti-dim-label', { active: !d.left }]">{{ d.rightLabel }}</span>
              </div>
            </div>
          </div>

          <!-- 旅行维度条形图 -->
          <div class="report-dimensions">
            <h3 class="dim-title">旅行维度分析</h3>
            <div class="dim-bars">
              <div v-for="d in dimensions" :key="d.key" class="dim-row">
                <span class="dim-label">{{ d.label }}</span>
                <div class="dim-track">
                  <div class="dim-fill" :style="{ width: d.value + '%', background: d.color }"></div>
                </div>
                <span class="dim-val">{{ d.value }}%</span>
              </div>
            </div>
          </div>

          <!-- 偏好详情 -->
          <div class="report-details">
            <div class="detail-block">
              <h4 class="detail-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                目的地倾向
              </h4>
              <p class="detail-text">{{ reportData.destination }}</p>
            </div>
            <div class="detail-block">
              <h4 class="detail-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 10h16"/></svg>
                出行方式
              </h4>
              <p class="detail-text">{{ reportData.transport }}</p>
            </div>
            <div class="detail-block">
              <h4 class="detail-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
                饮食偏好
              </h4>
              <p class="detail-text">{{ reportData.diet }}</p>
            </div>
            <div class="detail-block">
              <h4 class="detail-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/></svg>
                住宿风格
              </h4>
              <p class="detail-text">{{ reportData.hotel }}</p>
            </div>
            <div class="detail-block">
              <h4 class="detail-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6B5C" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                旅行节奏
              </h4>
              <p class="detail-text">{{ reportData.pace }}</p>
            </div>
          </div>

          <!-- 推荐语 -->
          <div class="report-recommendation">
            <h4 class="rec-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              个性化推荐
            </h4>
            <p class="rec-text">{{ reportData.recommendation }}</p>
          </div>
        </div>

        <div class="report-actions">
          <button class="action-btn action-primary" @click="saveAndGoPlan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            用此偏好规划行程
          </button>
          <button class="action-btn action-secondary" @click="resetQuiz">
            重新测试
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ==================== 状态管理 ====================
const currentQ = ref(-1)              // 当前题目索引，-1 表示欢迎页
const selectedAnswers = reactive({})  // 用户答题记录 { 题号: 选项索引 }
const selectedMbti = ref('')          // 用户可选预选的 MBTI 类型（空则由答题推断）
const MIN_ANSWERS = 20                // 最少答题数，达到即可生成报告

// 人格画像数据
const persona = reactive({ title: '', color: '#0D6B5C', score: 0, mbti: '' })
// 旅行维度数据（条形图）
const dimensions = reactive([])
// MBTI 维度数据（条形图，仅答题推断时显示）
const mbtiDimensions = reactive([])
// 报告详情数据
const reportData = reactive({ summary: '', destination: '', transport: '', diet: '', hotel: '', pace: '', recommendation: '' })

// ==================== MBTI 类型数据 ====================
const mbtiTypes = {
  analysts: [
    { code: 'INTJ', name: '建筑师' }, { code: 'INTP', name: '逻辑学家' },
    { code: 'ENTJ', name: '指挥官' }, { code: 'ENTP', name: '辩论家' }
  ],
  diplomats: [
    { code: 'INFJ', name: '提倡者' }, { code: 'INFP', name: '调停者' },
    { code: 'ENFJ', name: '主人公' }, { code: 'ENFP', name: '竞选者' }
  ],
  sentinels: [
    { code: 'ISTJ', name: '物流师' }, { code: 'ISFJ', name: '守卫者' },
    { code: 'ESTJ', name: '总经理' }, { code: 'ESFJ', name: '执政官' }
  ],
  explorers: [
    { code: 'ISTP', name: '鉴赏家' }, { code: 'ISFP', name: '探险家' },
    { code: 'ESTP', name: '企业家' }, { code: 'ESFP', name: '表演者' }
  ]
}

// MBTI 详细描述
const mbtiDetailMap = {
  INTJ: { name: '建筑师', desc: '富有想象力和战略性的思想家，一切皆是一种计划', travelStyle: '喜欢制定详细的旅行计划，追求高效和深度体验' },
  INTP: { name: '逻辑学家', desc: '具有创造力的发明家，不可遏制的好奇心', travelStyle: '喜欢探索新奇事物，随性地发现隐藏景点' },
  ENTJ: { name: '指挥官', desc: '大胆富有想象力领导者，天生是个领袖', travelStyle: '喜欢带领团队旅行，擅长组织集体活动' },
  ENTP: { name: '辩论家', desc: '聪明好奇的思想者，不会放弃任何智力上的机会', travelStyle: '喜欢即兴冒险，享受旅行中的不确定性' },
  INFJ: { name: '提倡者', desc: '安静而神秘，同时鼓舞人心不知疲倦的理想主义者', travelStyle: '追求心灵之旅，喜欢有深度的文化和精神体验' },
  INFP: { name: '调停者', desc: '诗意，善良的利他主义者，总是热情地帮助正义事业', travelStyle: '喜欢安静的自然风光，享受独处和写作' },
  ENFJ: { name: '主人公', desc: '鼓舞人心的领导者，有能力让听众着迷', travelStyle: '喜欢社交型旅行，结交各地朋友' },
  ENFP: { name: '竞选者', desc: '热情有创造力爱自由的人，总能找到理由微笑', travelStyle: '喜欢充满惊喜的旅行，拥抱每一个新体验' },
  ISTJ: { name: '物流师', desc: '实际独立注重事实的人', travelStyle: '喜欢按部就班的行程，重视经典景点和历史文化' },
  ISFJ: { name: '守卫者', desc: '非常专注温暖而有条理的人，守护家庭的英雄', travelStyle: '喜欢舒适安全的旅行环境，重视家人陪伴' },
  ESTJ: { name: '总经理', desc: '优秀的管理者不能忽视任何细节', travelStyle: '喜欢高效有组织的旅行，擅长预算管理' },
  ESFJ: { name: '执政官', desc: '极有同情心爱交往受欢迎的人们', travelStyle: '喜欢与亲友结伴出行，注重旅途中的温馨互动' },
  ISTP: { name: '鉴赏家', desc: '大胆而实际的实验家，擅长使用各种工具', travelStyle: '喜欢户外探险和动手体验，追求刺激感' },
  ISFP: { name: '探险家', desc: '灵活有魅力的艺术家，随时准备探索体验新事物', travelStyle: '喜欢沉浸式美学体验，用感官感受世界' },
  ESTP: { name: '企业家', desc: '聪明精力充沛的人，真正享受生活在边缘', travelStyle: '喜欢充满活力和刺激的旅行，追求即时体验' },
  ESFP: { name: '表演者', desc: '自发精力充沛热情的表演者', travelStyle: '喜欢热闹欢乐的旅行，享受每一刻的快乐' }
}

// ==================== MBTI 偏好配置表 ====================
// 每个类型的结构化旅行画像
const mbtiProfileMap = {
  INTJ: { destination: '京都/布拉格/爱丁堡等历史与秩序并重的城市', transport: '高铁和包车，避开人潮的高效路线', diet: '精致怀石/法餐，重视用餐仪式感', hotel: '设计型精品酒店，安静且有书卷气', pace: '深度慢游，每天 1-2 个深度点' },
  INTP: { destination: '冰岛/新西兰/云南等充满自然奇观的地方', transport: '自驾或徒步，路线可灵活调整', diet: '小众咖啡馆和街边小吃，挖掘隐藏美味', hotel: '设计师民宿或特色青旅', pace: '随性而至，走到哪算哪' },
  ENTJ: { destination: '东京/新加坡/上海等高效国际大都会', transport: '飞机 + 专车，时间管理至上', diet: '米其林和商务宴请餐，高效体验', hotel: '五星商务酒店，地段决定效率', pace: '紧凑打卡式，重点优先' },
  ENTP: { destination: '巴塞罗那/曼谷/重庆等充满惊喜的城市', transport: '公共交通 + 临时租车', diet: '什么都愿意尝一遍，是美食冒险家', hotel: '潮牌酒店或主题民宿', pace: '即兴冒险型，享受意外' },
  INFJ: { destination: '不丹/奈良/林芝等宁静的精神之地', transport: '慢速火车/包车，欣赏沿途风景', diet: '素食和有机食物，与自然共鸣', hotel: '禅意民宿或生态酒店', pace: '慢节奏冥想式，每地停留 3 天+' },
  INFP: { destination: '婺源/普罗旺斯/京都等诗意的远方', transport: '徒步和自行车，贴近土地', diet: '小馆子和手作甜品', hotel: '有故事的老宅或森林小屋', pace: '慢游 + 创作型，记录所看所感' },
  ENFJ: { destination: '伊斯坦布尔/里斯本/广州等多元文化熔炉', transport: '公共交通，深入本地生活', diet: '家庭式餐厅和当地人推荐', hotel: '有温度的 boutique 酒店', pace: '张弛有度，留足社交时间' },
  ENFP: { destination: '清迈/里斯本/巴厘岛等自由浪漫之地', transport: '突突车/摩托车/包车', diet: '夜市小吃到网红餐厅，样样都想试', hotel: '有泳池或花园的度假酒店', pace: '随时改变计划，拥抱意外' },
  ISTJ: { destination: '西安/罗马/伦敦等经典文化地标', transport: '高铁和正规出租，按图索骥', diet: '正规餐厅，菜单明码标价', hotel: '知名连锁酒店，品质稳定', pace: '按部就班的密集行程' },
  ISFJ: { destination: '青岛/苏州/北海道等舒适温柔之地', transport: '家人包车或正规专车', diet: '清淡家常，熟悉的味道最安心', hotel: '舒适型酒店，床品要软', pace: '舒适优先，不要太赶' },
  ESTJ: { destination: '香港/首尔/深圳等高效现代之城', transport: '商务舱/专车，效率第一', diet: '正规餐厅和商务套餐', hotel: '高端商务酒店', pace: '高效打卡，每天 3+ 景点' },
  ESFJ: { destination: '厦门/丽江/夏威夷等适合家人朋友之地', transport: '包车/跟团，省心为主', diet: '热门餐厅和打卡美食', hotel: '知名连锁或度假村', pace: '群体节奏统一，留合影时间' },
  ISTP: { destination: '新西兰/阿拉斯加/西藏等极限之地', transport: '摩托/越野车/徒步', diet: '路餐和当地小馆', hotel: '露营或特色客栈', pace: '高强度户外 + 自由探索' },
  ISFP: { destination: '泸沽湖/圣托里尼/镰仓等文艺之地', transport: '自驾或租摩托', diet: '小馆和甜品店，重视氛围', hotel: '海景房或森林小屋', pace: '沉浸式慢游，记录美好' },
  ESTP: { destination: '三亚/芭提雅/塞班等海岛派对之地', transport: '飞机 + 当地玩乐', diet: '海鲜烧烤和派对酒吧', hotel: '度假村或海景酒店', pace: '紧凑刺激型，晚上是主场' },
  ESFP: { destination: '迪士尼/普吉/巴塞罗那等热闹之地', transport: '包车/打车，到处去热闹的地方', diet: '网红餐厅和人气美食', hotel: '有泳池和派对的度假酒店', pace: '满档快乐，社交不停' }
}

// MBTI 推荐语模板
const mbtiTravelTips = {
  INTJ: ['安排 4-5 天的深度行程，提前 1 个月做好研究。', '避开网红打卡点，寻找有历史厚度的小众目的地。', '推荐目的地：京都/布拉格/爱丁堡——这里的秩序与深度会打动你。'],
  INTP: ['留出足够的弹性时间，3-7 天都可以。', '带上相机和笔记本，记录你的奇思妙想。', '推荐目的地：冰岛环岛/新西兰南岛/云南大环线。'],
  ENTJ: ['5-7 天的高效商务型旅行，每分钟都有安排。', '选择有顶级服务和基础设施的目的地。', '推荐目的地：东京/新加坡/上海——效率与品质并重。'],
  ENTP: ['行程越灵活越好，准备 1-2 个必去，其他随缘。', '带上开放的心态和与人交流的欲望。', '推荐目的地：巴塞罗那/曼谷/重庆——每条街都藏着惊喜。'],
  INFJ: ['安排 5-7 天的慢节奏行程，每天不超过 2 个点。', '选择有精神共鸣的地方，写下你的感受。', '推荐目的地：不丹/奈良/林芝——与内心对话。'],
  INFP: ['带上手帐和喜欢的书，4-6 天的诗意之旅。', '选择能激发灵感的地方，留足独处时间。', '推荐目的地：婺源/普罗旺斯/京都。'],
  ENFJ: ['安排 5-7 天，留出与人交流的时间。', '加入当地体验活动，结识新朋友。', '推荐目的地：伊斯坦布尔/里斯本/广州。'],
  ENFP: ['3-5 天即兴之旅，每天醒来再决定去哪。', '带足社交能量，准备好接住所有惊喜。', '推荐目的地：清迈/里斯本/巴厘岛。'],
  ISTJ: ['提前 1 个月规划好所有细节，按时执行。', '选择有完善基础设施的目的地。', '推荐目的地：西安/罗马/伦敦——经典不踩雷。'],
  ISFJ: ['舒适优先，4-6 天的轻松行程。', '和家人朋友一起，留下温馨回忆。', '推荐目的地：青岛/苏州/北海道。'],
  ESTJ: ['5-7 天的商务型行程，效率最大化。', '预订好所有酒店和交通，避免意外。', '推荐目的地：香港/首尔/深圳。'],
  ESFJ: ['5 天左右的群体行程，所有人开心最重要。', '选热门餐厅和景点，留足合影时间。', '推荐目的地：厦门/丽江/夏威夷。'],
  ISTP: ['5-10 天的户外冒险之旅，带上装备。', '挑战自我极限，记录冒险过程。', '推荐目的地：新西兰/阿拉斯加/西藏。'],
  ISFP: ['3-5 天的文艺慢游，住好看的地方。', '带上相机，记录光影与色彩。', '推荐目的地：泸沽湖/圣托里尼/镰仓。'],
  ESTP: ['3-5 天的海岛派对之旅，放飞自我。', '晚上才是重头戏，选有夜生活的地方。', '推荐目的地：三亚/芭提雅/塞班。'],
  ESFP: ['3-5 天的欢乐之旅，社交不停歇。', '加入派对和体验活动，认识新朋友。', '推荐目的地：迪士尼/普吉/巴塞罗那。']
}

// ==================== 统一题库：60 道多元化情景题 ====================
// 每道题涵盖生活/工作/社交/旅行等多种场景
// 每个选项同时映射 MBTI 维度（E/I/S/N/T/F/J/P）和生活方式标签
// 生活方式标签覆盖：目的地(nature/culture/city/beach)、节奏(intense/balanced/leisure/slow)、
//   住宿(boutique/standard/luxury/budget)、饮食(street/fancy/market/cafe)、
//   同伴(solo/couple/friends/family)、动机(adventure/peace/learning/social)
const questions = [
  // ========== 周末生活 (6) ==========
  { scenario: '周末生活', question: '难得的周末，你更想怎样度过？', options: [
    { text: '约一群朋友去热闹的街区逛吃', mbti: 'E', tags: ['friends', 'social', 'city'] },
    { text: '独自在家看书喝茶，享受安静', mbti: 'I', tags: ['solo', 'peace', 'slow'] },
    { text: '和伴侣去郊外徒步，呼吸新鲜空气', mbti: 'I', tags: ['couple', 'nature', 'adventure'] }
  ]},
  { scenario: '周末生活', question: '朋友临时约你出门，你的第一反应？', options: [
    { text: '太好了，立刻收拾出门', mbti: 'E', tags: ['friends', 'social', 'intense'] },
    { text: '有点犹豫，想先看看有没有其他安排', mbti: 'J', tags: ['balanced', 'standard'] },
    { text: '更想待在已计划好的节奏里', mbti: 'I', tags: ['solo', 'peace', 'slow'] }
  ]},
  { scenario: '周末生活', question: '周末的早晨，你通常？', options: [
    { text: '7 点起床，跑步或去早市', mbti: 'J', tags: ['intense', 'market', 'adventure'] },
    { text: '睡到自然醒，慢慢吃个brunch', mbti: 'P', tags: ['leisure', 'cafe', 'slow'] },
    { text: '起来就看手机回复消息，随时待命', mbti: 'E', tags: ['social', 'city'] }
  ]},
  { scenario: '周末生活', question: '理想的周末晚上？', options: [
    { text: '去酒吧或livehouse，热闹到凌晨', mbti: 'E', tags: ['friends', 'social', 'intense'] },
    { text: '在家看一部老电影', mbti: 'I', tags: ['solo', 'peace', 'slow'] },
    { text: '约两三好友在家做饭聊天', mbti: 'F', tags: ['couple', 'social', 'cafe'] }
  ]},
  { scenario: '周末生活', question: '你如何看待"无所事事的周末"？', options: [
    { text: '简直是浪费时间，应该做点什么', mbti: 'J', tags: ['intense', 'adventure'] },
    { text: '偶尔这样挺好的，充电嘛', mbti: 'P', tags: ['leisure', 'peace', 'slow'] },
    { text: '可以接受，但会忍不住刷手机找人聊天', mbti: 'E', tags: ['social', 'balanced'] }
  ]},
  { scenario: '周末生活', question: '周末打扫完房间后，你更想？', options: [
    { text: '出门逛逛新开的店', mbti: 'E', tags: ['city', 'social', 'cafe'] },
    { text: '泡杯茶欣赏整洁的房间', mbti: 'I', tags: ['solo', 'peace', 'boutique'] },
    { text: '开始规划下周的行程表', mbti: 'J', tags: ['intense', 'planned'] }
  ]},

  // ========== 工作学习 (6) ==========
  { scenario: '工作学习', question: '面对一个新项目，你的第一步？', options: [
    { text: '列出详细的任务清单和时间表', mbti: 'J', tags: ['intense', 'planned'] },
    { text: '先搜集资料，看看别人怎么做', mbti: 'S', tags: ['learning', 'balanced'] },
    { text: '找同事讨论，头脑风暴', mbti: 'E', tags: ['friends', 'social'] }
  ]},
  { scenario: '工作学习', question: '同事犯了错影响了你的进度，你？', options: [
    { text: '直接指出问题，讨论解决方案', mbti: 'T', tags: ['intense', 'planned'] },
    { text: '先理解对方处境，再委婉沟通', mbti: 'F', tags: ['social', 'balanced'] },
    { text: '自己默默补上，下次注意', mbti: 'I', tags: ['solo', 'peace'] }
  ]},
  { scenario: '工作学习', question: '你更喜欢哪种工作环境？', options: [
    { text: '开放式办公，随时可以交流', mbti: 'E', tags: ['friends', 'social', 'city'] },
    { text: '安静独立的空间，专注不被打扰', mbti: 'I', tags: ['solo', 'peace', 'boutique'] },
    { text: '灵活办公，在哪都可以', mbti: 'P', tags: ['balanced', 'adventure'] }
  ]},
  { scenario: '工作学习', question: 'deadline 临近，你的状态？', options: [
    { text: '早就做完了，提前一天交付', mbti: 'J', tags: ['intense', 'planned'] },
    { text: '最后一天高效冲刺', mbti: 'P', tags: ['intense', 'adventure'] },
    { text: '焦虑但会找人倾诉缓解压力', mbti: 'F', tags: ['social', 'balanced'] }
  ]},
  { scenario: '工作学习', question: '学习新技能时你更倾向？', options: [
    { text: '按教程一步步来，打好基础', mbti: 'S', tags: ['learning', 'slow', 'planned'] },
    { text: '直接上手试，遇到问题再查', mbti: 'N', tags: ['adventure', 'intense'] },
    { text: '报班跟着老师学，有人带更快', mbti: 'E', tags: ['social', 'learning'] }
  ]},
  { scenario: '工作学习', question: '如何看待加班？', options: [
    { text: '效率优先，能在工作时间做完就不加', mbti: 'T', tags: ['balanced', 'planned'] },
    { text: '为了团队目标可以接受', mbti: 'F', tags: ['social', 'friends'] },
    { text: '看心情，有意思的项目无所谓', mbti: 'P', tags: ['leisure', 'adventure'] }
  ]},

  // ========== 社交场合 (6) ==========
  { scenario: '社交场合', question: '走进一个全是陌生人的聚会，你？', options: [
    { text: '主动找人聊天，很快融入', mbti: 'E', tags: ['social', 'friends', 'intense'] },
    { text: '找个角落观察，等别人来搭话', mbti: 'I', tags: ['solo', 'slow', 'peace'] },
    { text: '找一个看起来友好的小群体加入', mbti: 'F', tags: ['social', 'balanced'] }
  ]},
  { scenario: '社交场合', question: '朋友之间产生矛盾，你通常？', options: [
    { text: '理性分析谁对谁错', mbti: 'T', tags: ['planned', 'balanced'] },
    { text: '站在每个人角度想，希望大家和好', mbti: 'F', tags: ['social', 'peace'] },
    { text: '不想卷入，保持距离', mbti: 'I', tags: ['solo', 'slow'] }
  ]},
  { scenario: '社交场合', question: '你的朋友圈通常是？', options: [
    { text: '很多朋友，各种圈子都有', mbti: 'E', tags: ['friends', 'social', 'city'] },
    { text: '几个知心好友足矣', mbti: 'I', tags: ['solo', 'couple', 'peace'] },
    { text: '以家人和同事为主', mbti: 'S', tags: ['family', 'balanced'] }
  ]},
  { scenario: '社交场合', question: '社交一整天后，你？', options: [
    { text: '精力充沛，还想继续', mbti: 'E', tags: ['social', 'intense', 'friends'] },
    { text: '需要独处充电', mbti: 'I', tags: ['solo', 'peace', 'slow'] },
    { text: '还好，但要睡个好觉', mbti: 'F', tags: ['balanced', 'standard'] }
  ]},
  { scenario: '社交场合', question: '聚会上有人提议玩游戏，你？', options: [
    { text: '第一个举手参加', mbti: 'E', tags: ['friends', 'social', 'intense'] },
    { text: '看看规则再决定', mbti: 'S', tags: ['balanced', 'planned'] },
    { text: '更愿意在旁边看大家玩', mbti: 'I', tags: ['solo', 'peace', 'slow'] }
  ]},
  { scenario: '社交场合', question: '你更享受哪种交流方式？', options: [
    { text: '面对面长聊，越深入越好', mbti: 'F', tags: ['couple', 'social', 'cafe'] },
    { text: '群聊打字，轻松无压力', mbti: 'E', tags: ['friends', 'social', 'city'] },
    { text: '写信或邮件，有条理地表达', mbti: 'I', tags: ['solo', 'peace', 'slow'] }
  ]},

  // ========== 决策方式 (6) ==========
  { scenario: '决策方式', question: '做一个重要决定时，你更依赖？', options: [
    { text: '数据和事实，理性分析利弊', mbti: 'T', tags: ['planned', 'balanced', 'learning'] },
    { text: '直觉和感受，相信第一感觉', mbti: 'F', tags: ['adventure', 'peace'] },
    { text: '过去的经验和先例', mbti: 'S', tags: ['standard', 'slow', 'planned'] }
  ]},
  { scenario: '决策方式', question: '面对两个差不多好的选项，你？', options: [
    { text: '列出优缺点表格，选分高的', mbti: 'T', tags: ['planned', 'balanced'] },
    { text: '跟着感觉走', mbti: 'F', tags: ['adventure', 'leisure'] },
    { text: '问问朋友家人的意见', mbti: 'E', tags: ['social', 'friends', 'family'] }
  ]},
  { scenario: '决策方式', question: '你做决定的速度？', options: [
    { text: '很快，拍板就行', mbti: 'J', tags: ['intense', 'adventure'] },
    { text: '要纠结很久，反复权衡', mbti: 'P', tags: ['slow', 'balanced'] },
    { text: '看事情大小，大的慢小的快', mbti: 'S', tags: ['balanced', 'standard'] }
  ]},
  { scenario: '决策方式', question: '计划赶不上变化时，你？', options: [
    { text: '迅速调整，随机应变', mbti: 'P', tags: ['adventure', 'leisure'] },
    { text: '很焦虑，尽量回到原计划', mbti: 'J', tags: ['planned', 'intense'] },
    { text: '接受现实，顺其自然', mbti: 'F', tags: ['peace', 'slow'] }
  ]},
  { scenario: '决策方式', question: '买东西时你更看重？', options: [
    { text: '性价比和实用性', mbti: 'T', tags: ['budget', 'standard', 'planned'] },
    { text: '颜值和设计感', mbti: 'N', tags: ['boutique', 'luxury'] },
    { text: '品牌和口碑', mbti: 'S', tags: ['standard', 'luxury'] }
  ]},
  { scenario: '决策方式', question: '朋友请你帮忙但你很忙，你？', options: [
    { text: '先评估自己的时间再答复', mbti: 'T', tags: ['balanced', 'planned'] },
    { text: '不好意思拒绝，先答应再说', mbti: 'F', tags: ['social', 'friends'] },
    { text: '直接说不方便，理解万岁', mbti: 'I', tags: ['solo', 'balanced'] }
  ]},

  // ========== 压力应对 (6) ==========
  { scenario: '压力应对', question: '工作/学习压力大时，你如何释放？', options: [
    { text: '去户外运动，出汗解压', mbti: 'S', tags: ['adventure', 'nature', 'intense'] },
    { text: '一个人安静待着，听音乐冥想', mbti: 'I', tags: ['solo', 'peace', 'slow'] },
    { text: '找朋友倾诉，吃顿好的', mbti: 'E', tags: ['friends', 'social', 'fancy'] }
  ]},
  { scenario: '压力应对', question: '面对未知和不确定，你？', options: [
    { text: '兴奋，未知才有意思', mbti: 'N', tags: ['adventure', 'intense'] },
    { text: '紧张，想提前了解清楚', mbti: 'S', tags: ['planned', 'standard'] },
    { text: '焦虑但会找人聊聊缓解', mbti: 'F', tags: ['social', 'peace'] }
  ]},
  { scenario: '压力应对', question: '遇到突发状况（如航班取消），你？', options: [
    { text: '立刻寻找替代方案，行动起来', mbti: 'T', tags: ['planned', 'intense', 'adventure'] },
    { text: '先平复情绪，再慢慢想', mbti: 'F', tags: ['peace', 'slow', 'balanced'] },
    { text: '发个朋友圈吐槽一下', mbti: 'E', tags: ['social', 'friends'] }
  ]},
  { scenario: '压力应对', question: '你最怕旅行中发生什么？', options: [
    { text: '行程被打乱，计划全白做', mbti: 'J', tags: ['planned', 'intense'] },
    { text: '一个人孤独无助', mbti: 'E', tags: ['social', 'friends'] },
    { text: '住的吃的太差，受罪', mbti: 'S', tags: ['luxury', 'standard', 'peace'] }
  ]},
  { scenario: '压力应对', question: '你觉得旅行最大的意义是？', options: [
    { text: '挑战自我，突破舒适区', mbti: 'N', tags: ['adventure', 'intense', 'nature'] },
    { text: '放松身心，回归平静', mbti: 'I', tags: ['peace', 'slow', 'beach'] },
    { text: '学习新知识，开阔眼界', mbti: 'S', tags: ['learning', 'culture', 'balanced'] }
  ]},
  { scenario: '压力应对', question: '旅行中丢了护照/钱包，你？', options: [
    { text: '冷静去大使馆/警局补办', mbti: 'T', tags: ['planned', 'balanced'] },
    { text: '联系家人朋友寻求帮助', mbti: 'F', tags: ['family', 'social'] },
    { text: '先懵一会儿，再想办法', mbti: 'P', tags: ['leisure', 'slow'] }
  ]},

  // ========== 饮食选择 (6) ==========
  { scenario: '饮食选择', question: '到了一个新城市，第一顿吃什么？', options: [
    { text: '钻进小巷找当地人排队的老店', mbti: 'S', tags: ['street', 'market', 'adventure'] },
    { text: '查米其林和网红餐厅', mbti: 'N', tags: ['fancy', 'luxury', 'city'] },
    { text: '先找杯好咖啡安定一下', mbti: 'I', tags: ['cafe', 'peace', 'slow'] }
  ]},
  { scenario: '饮食选择', question: '你愿意为陌生食物冒险吗？', options: [
    { text: '当然！虫子生腌都敢试', mbti: 'N', tags: ['adventure', 'street', 'intense'] },
    { text: '看情况，有底线', mbti: 'S', tags: ['balanced', 'standard'] },
    { text: '不冒险，选熟悉的', mbti: 'I', tags: ['cafe', 'peace', 'slow'] }
  ]},
  { scenario: '饮食选择', question: '旅行中一顿大餐你愿意花多少？', options: [
    { text: '一两百吃到当地味就行', mbti: 'S', tags: ['street', 'budget', 'market'] },
    { text: '三四百体验精致', mbti: 'F', tags: ['fancy', 'balanced', 'cafe'] },
    { text: '上千不设上限', mbti: 'N', tags: ['luxury', 'fancy', 'intense'] }
  ]},
  { scenario: '饮食选择', question: '夜市/小吃街对你的吸引力？', options: [
    { text: '必须逛，体验当地胃', mbti: 'E', tags: ['street', 'market', 'social'] },
    { text: '逛一两次就够了', mbti: 'S', tags: ['balanced', 'standard'] },
    { text: '不如去安静的小馆子', mbti: 'I', tags: ['cafe', 'peace', 'slow'] }
  ]},
  { scenario: '饮食选择', question: '旅行中你最想喝什么？', options: [
    { text: '当地特色饮品/凉茶', mbti: 'S', tags: ['street', 'market', 'adventure'] },
    { text: '顶级葡萄酒/威士忌', mbti: 'N', tags: ['fancy', 'luxury'] },
    { text: '手冲咖啡/精酿啤酒', mbti: 'I', tags: ['cafe', 'boutique', 'peace'] }
  ]},
  { scenario: '饮食选择', question: '你对待"吃"的态度？', options: [
    { text: '民以食为天，吃好才能玩好', mbti: 'S', tags: ['fancy', 'market', 'intense'] },
    { text: '能吃饱就行，不挑剔', mbti: 'T', tags: ['budget', 'standard', 'balanced'] },
    { text: '吃是一种仪式感和社交', mbti: 'F', tags: ['cafe', 'social', 'friends'] }
  ]},

  // ========== 居住审美 (6) ==========
  { scenario: '居住审美', question: '理想的住处是什么样的？', options: [
    { text: '有设计感的精品民宿', mbti: 'N', tags: ['boutique', 'culture', 'adventure'] },
    { text: '干净舒适的连锁酒店', mbti: 'S', tags: ['standard', 'peace', 'balanced'] },
    { text: '顶级五星，服务至上', mbti: 'E', tags: ['luxury', 'city', 'intense'] }
  ]},
  { scenario: '居住审美', question: '你愿意为"网红民宿"多付钱吗？', options: [
    { text: '愿意，体验感很重要', mbti: 'N', tags: ['boutique', 'adventure', 'social'] },
    { text: '不溢价，品质达标即可', mbti: 'S', tags: ['standard', 'balanced', 'budget'] },
    { text: '住就要顶级，不计较价格', mbti: 'E', tags: ['luxury', 'intense'] }
  ]},
  { scenario: '居住审美', question: '你心目中"家"的风格？', options: [
    { text: '简约北欧风，干净利落', mbti: 'T', tags: ['standard', 'balanced', 'planned'] },
    { text: '复古混搭，充满故事', mbti: 'N', tags: ['boutique', 'culture', 'adventure'] },
    { text: '温馨实用，家人舒适最重要', mbti: 'F', tags: ['family', 'peace', 'standard'] }
  ]},
  { scenario: '居住审美', question: '旅行住宿最在意的三点？', options: [
    { text: '位置、位置、位置', mbti: 'J', tags: ['city', 'intense', 'planned'] },
    { text: '氛围、设计、独特性', mbti: 'N', tags: ['boutique', 'culture', 'adventure'] },
    { text: '干净、安静、性价比', mbti: 'S', tags: ['budget', 'peace', 'standard'] }
  ]},
  { scenario: '居住审美', question: '你如何看待露营/住帐篷？', options: [
    { text: '必须试一次！亲近自然', mbti: 'N', tags: ['adventure', 'nature', 'boutique'] },
    { text: '可以体验但不会常住', mbti: 'S', tags: ['balanced', 'standard'] },
    { text: '算了吧，不舒服', mbti: 'F', tags: ['luxury', 'peace', 'standard'] }
  ]},
  { scenario: '居住审美', question: '你希望窗外看到什么？', options: [
    { text: '山川湖海，壮阔自然', mbti: 'N', tags: ['nature', 'adventure', 'boutique'] },
    { text: '安静的庭院或花园', mbti: 'I', tags: ['peace', 'slow', 'boutique'] },
    { text: '繁华的城市夜景', mbti: 'E', tags: ['city', 'social', 'luxury'] }
  ]},

  // ========== 旅行偏好 (6) ==========
  { scenario: '旅行偏好', question: '假期终于来了，你最想奔向哪里？', options: [
    { text: '人迹罕至的大自然', mbti: 'I', tags: ['nature', 'adventure', 'solo'] },
    { text: '历史悠久的古城', mbti: 'S', tags: ['culture', 'learning', 'slow'] },
    { text: '繁华热闹的都市', mbti: 'E', tags: ['city', 'social', 'intense'] }
  ]},
  { scenario: '旅行偏好', question: '你的旅行日程一般是？', options: [
    { text: '行程拉满，每个景点都不错过', mbti: 'J', tags: ['intense', 'planned'] },
    { text: '几个重点，其余随缘', mbti: 'P', tags: ['balanced', 'leisure'] },
    { text: '睡到自然醒，走到哪算哪', mbti: 'P', tags: ['slow', 'peace', 'leisure'] }
  ]},
  { scenario: '旅行偏好', question: '旅行中的交通方式偏好？', options: [
    { text: '自驾，说停就停', mbti: 'S', tags: ['adventure', 'nature', 'intense'] },
    { text: '高铁/火车，安稳看风景', mbti: 'I', tags: ['balanced', 'peace', 'standard'] },
    { text: '飞机，尽快到达', mbti: 'J', tags: ['intense', 'planned', 'city'] }
  ]},
  { scenario: '旅行偏好', question: '一个城市你愿意待几天？', options: [
    { text: '1-2 天打卡走人', mbti: 'E', tags: ['intense', 'city', 'adventure'] },
    { text: '3-4 天兼顾重点', mbti: 'S', tags: ['balanced', 'standard'] },
    { text: '5 天以上慢慢逛', mbti: 'I', tags: ['slow', 'peace', 'culture'] }
  ]},
  { scenario: '旅行偏好', question: '你最理想的旅行同伴？', options: [
    { text: '独自一人，自由自在', mbti: 'I', tags: ['solo', 'adventure', 'nature'] },
    { text: '伴侣二人，浪漫之旅', mbti: 'F', tags: ['couple', 'peace', 'boutique'] },
    { text: '三五好友，热闹开心', mbti: 'E', tags: ['friends', 'social', 'intense'] }
  ]},
  { scenario: '旅行偏好', question: '旅行结束时你最想带什么回去？', options: [
    { text: '当地特产和美食', mbti: 'S', tags: ['street', 'market', 'family'] },
    { text: '照片和日记，记录回忆', mbti: 'I', tags: ['culture', 'peace', 'solo'] },
    { text: '什么都不买，回忆就够了', mbti: 'N', tags: ['adventure', 'minimal'] }
  ]},

  // ========== 兴趣爱好 (6) ==========
  { scenario: '兴趣爱好', question: '空闲时间你最想做什么？', options: [
    { text: '户外运动：徒步/骑行/攀岩', mbti: 'S', tags: ['adventure', 'nature', 'intense'] },
    { text: '看书/看电影/写东西', mbti: 'I', tags: ['solo', 'peace', 'culture', 'slow'] },
    { text: '约朋友聚餐/打球/桌游', mbti: 'E', tags: ['friends', 'social', 'city'] }
  ]},
  { scenario: '兴趣爱好', question: '你的音乐品味？', options: [
    { text: '摇滚/电子，节奏感强', mbti: 'E', tags: ['intense', 'social', 'adventure'] },
    { text: '民谣/古典，安静悠远', mbti: 'I', tags: ['peace', 'slow', 'culture'] },
    { text: '流行/Jazz，好听就行', mbti: 'S', tags: ['balanced', 'cafe', 'standard'] }
  ]},
  { scenario: '兴趣爱好', question: '你更喜欢哪种阅读/观影题材？', options: [
    { text: '科幻/奇幻，脑洞大开', mbti: 'N', tags: ['adventure', 'learning'] },
    { text: '历史/纪录片，真实有料', mbti: 'S', tags: ['culture', 'learning', 'slow'] },
    { text: '喜剧/综艺，开心就好', mbti: 'E', tags: ['social', 'friends', 'leisure'] }
  ]},
  { scenario: '兴趣爱好', question: '你对"手作"的态度？', options: [
    { text: '很感兴趣，愿意花时间做', mbti: 'S', tags: ['culture', 'slow', 'boutique'] },
    { text: '看情况，简单的可以试试', mbti: 'P', tags: ['balanced', 'leisure'] },
    { text: '没耐心，不如直接买', mbti: 'T', tags: ['standard', 'budget'] }
  ]},
  { scenario: '兴趣爱好', question: '你的购物习惯？', options: [
    { text: '逛实体店，试了再买', mbti: 'E', tags: ['city', 'social', 'fancy'] },
    { text: '网购，省时省力', mbti: 'I', tags: ['standard', 'budget', 'balanced'] },
    { text: '看中就买，不纠结', mbti: 'P', tags: ['adventure', 'luxury', 'intense'] }
  ]},
  { scenario: '兴趣爱好', question: '你最想学的新技能？', options: [
    { text: '摄影/绘画，记录美', mbti: 'N', tags: ['culture', 'boutique', 'solo'] },
    { text: '潜水/滑雪，挑战极限', mbti: 'S', tags: ['adventure', 'nature', 'intense'] },
    { text: '烹饪/调酒，分享快乐', mbti: 'F', tags: ['social', 'friends', 'fancy'] }
  ]},

  // ========== 人生规划 (6) ==========
  { scenario: '人生规划', question: '你对未来五年的态度？', options: [
    { text: '有清晰的目标和计划', mbti: 'J', tags: ['planned', 'intense', 'standard'] },
    { text: '大方向有，细节随缘', mbti: 'P', tags: ['balanced', 'leisure', 'adventure'] },
    { text: '走一步看一步，活在当下', mbti: 'P', tags: ['slow', 'peace', 'leisure'] }
  ]},
  { scenario: '人生规划', question: '你认为人生最重要的是？', options: [
    { text: '不断成长和突破', mbti: 'N', tags: ['adventure', 'learning', 'intense'] },
    { text: '内心的平静和满足', mbti: 'I', tags: ['peace', 'slow', 'solo'] },
    { text: '和爱的人在一起', mbti: 'F', tags: ['family', 'social', 'friends'] }
  ]},
  { scenario: '人生规划', question: '如果有一笔积蓄，你优先？', options: [
    { text: '投资自己，学习新技能', mbti: 'N', tags: ['learning', 'adventure', 'culture'] },
    { text: '出去旅行，看世界', mbti: 'E', tags: ['adventure', 'nature', 'social'] },
    { text: '买房安家，稳定第一', mbti: 'S', tags: ['standard', 'peace', 'family'] }
  ]},
  { scenario: '人生规划', question: '退休后你最想过的生活？', options: [
    { text: '周游世界，永不停步', mbti: 'N', tags: ['adventure', 'nature', 'intense'] },
    { text: '海边小镇，开个小店', mbti: 'I', tags: ['beach', 'peace', 'slow', 'boutique'] },
    { text: '和家人在一起，含饴弄孙', mbti: 'F', tags: ['family', 'social', 'standard'] }
  ]},
  { scenario: '人生规划', question: '你最向往的生活节奏？', options: [
    { text: '充实高效，每天都有产出', mbti: 'J', tags: ['intense', 'planned', 'city'] },
    { text: '张弛有度，工作生活平衡', mbti: 'S', tags: ['balanced', 'standard'] },
    { text: '慢悠悠，享受每一刻', mbti: 'P', tags: ['slow', 'peace', 'leisure'] }
  ]},
  { scenario: '人生规划', question: '你觉得"完美人生"应该包含？', options: [
    { text: '丰富的经历和故事', mbti: 'N', tags: ['adventure', 'culture', 'learning'] },
    { text: '内心的宁静和自由', mbti: 'I', tags: ['peace', 'solo', 'nature'] },
    { text: '深爱的人际关系', mbti: 'F', tags: ['family', 'friends', 'social'] }
  ]}
]

// ==================== 生活方式标签分组配置 ====================
// 每组对应报告中的一个维度，含标签键、中文标签、描述文案
const LIFESTYLE_GROUPS = [
  {
    key: 'destination', label: '目的地倾向', color: '#0D6B5C',
    items: [
      { tag: 'nature', label: '大自然' },
      { tag: 'culture', label: '文化古城' },
      { tag: 'city', label: '现代都市' },
      { tag: 'beach', label: '海滨度假' }
    ],
    descriptions: ['沉浸在大自然中，山川湖海是你的最爱', '偏爱历史文化名城，古迹和博物馆是你的首选', '喜欢现代化的都市，购物娱乐美食样样不落', '阳光、沙滩、海浪，海滨小城是你的理想国']
  },
  {
    key: 'transport', label: '出行方式', color: '#1A8A7A',
    items: [
      { tag: 'road', label: '自驾' },
      { tag: 'rail', label: '高铁/火车' },
      { tag: 'flight', label: '飞机' },
      { tag: 'walk', label: '徒步' }
    ],
    descriptions: ['自驾是你的首选，随时可以停车欣赏风景', '偏爱高铁/火车，安稳舒适还能看沿途风景', '飞机是最佳选择，尽快到达才能开始享受', '用脚步丈量世界，背包徒步才是真旅行']
  },
  {
    key: 'hotel', label: '住宿品味', color: '#D4A84B',
    items: [
      { tag: 'boutique', label: '特色民宿' },
      { tag: 'standard', label: '标准连锁' },
      { tag: 'luxury', label: '豪华五星' },
      { tag: 'budget', label: '经济实惠' }
    ],
    descriptions: ['特色民宿和树屋让你兴奋，体验当地生活', '品质优先，知名连锁酒店让你安心', '奢华享受不能少，五星级酒店才是标配', '干净实惠最重要，省下的钱去吃喝玩乐']
  },
  {
    key: 'diet', label: '美食指数', color: '#C23B22',
    items: [
      { tag: 'street', label: '街头小吃' },
      { tag: 'fancy', label: '精致餐厅' },
      { tag: 'market', label: '菜市场' },
      { tag: 'cafe', label: '咖啡馆' }
    ],
    descriptions: ['钻进小巷找老店，地道风味才是王道', '精致餐厅和米其林是你目标', '最大的菜市场里才有最真实的人间烟火', '先找杯咖啡安定精神，再慢慢探索']
  },
  {
    key: 'pace', label: '旅行节奏', color: '#7BA4D4',
    items: [
      { tag: 'intense', label: '充实紧凑' },
      { tag: 'balanced', label: '张弛有度' },
      { tag: 'leisure', label: '悠闲自在' },
      { tag: 'slow', label: '深度慢游' }
    ],
    descriptions: ['行程拉满，每个景点都要打卡', '几个重点景点，其余随缘', '睡到自然醒，走到哪算哪', '一天就待一个地方，慢慢感受']
  }
]

// ==================== 核心逻辑函数 ====================

/** 获取 MBTI 详细信息 */
function getMbtiDetail(code) {
  return mbtiDetailMap[code] || { name: '', desc: '', travelStyle: '' }
}

/** 切换 MBTI 选择（可取消） */
function toggleMbti(code) {
  selectedMbti.value = selectedMbti.value === code ? '' : code
}

/** 开始答题 */
function startQuiz() {
  currentQ.value = 0
}

/** 选择选项并自动前进 */
function selectAndAdvance(qIndex, optIndex) {
  selectedAnswers[qIndex] = optIndex
  // 不自动前进，让用户主动点"下一题"
  // 但如果当前题已选且不是最后一题，可自动前进
  if (qIndex < questions.length - 1) {
    // 延迟前进让用户看到选中效果
    setTimeout(() => {
      if (selectedAnswers[qIndex] === optIndex) {
        currentQ.value++
      }
    }, 300)
  }
}

/** 下一题/查看报告 */
function nextQuestion() {
  if (currentQ.value < questions.length - 1) {
    currentQ.value++
  } else {
    generateReport()
  }
}

/** 已答题数 */
function getAnsweredCount() {
  return Object.keys(selectedAnswers).length
}

// ==================== 报告生成（本地，毫秒级） ====================

/** 生成报告主入口 */
function generateReport() {
  // 第一步：计算 MBTI（用户预选 或 答题推断）
  const mbtiCode = selectedMbti.value || calculateMbtiFromAnswers()
  persona.mbti = mbtiCode

  // 第二步：计算生活方式维度
  calculateLifestyleDimensions()

  // 第三步：根据 MBTI + 生活方式生成报告
  buildReport(mbtiCode)

  // 第四步：跳转到报告页（currentQ >= questions.length 时模板显示报告）
  currentQ.value = questions.length
}

/**
 * 从答题数据推断 MBTI 类型
 * - 统计 E/I、S/N、T/F、J/P 各维度得分
 * - 每个维度的多数方决定该字母
 */
function calculateMbtiFromAnswers() {
  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  Object.keys(selectedAnswers).forEach(qi => {
    const q = questions[Number(qi)]
    if (!q) return
    const opt = q.options[selectedAnswers[qi]]
    if (opt && opt.mbti && counts[opt.mbti] !== undefined) {
      counts[opt.mbti]++
    }
  })
  // 各维度取多数方
  const code = [
    counts.E >= counts.I ? 'E' : 'I',
    counts.S >= counts.N ? 'S' : 'N',
    counts.T >= counts.F ? 'T' : 'F',
    counts.J >= counts.P ? 'J' : 'P'
  ].join('')

  // 同时填充 MBTI 维度条数据
  mbtiDimensions.length = 0
  const totalEI = counts.E + counts.I || 1
  const totalSN = counts.S + counts.N || 1
  const totalTF = counts.T + counts.F || 1
  const totalJP = counts.J + counts.P || 1
  mbtiDimensions.push(
    { key: 'EI', leftLabel: 'E 外向', rightLabel: 'I 内向', value: Math.round(counts.E / totalEI * 100), left: counts.E >= counts.I },
    { key: 'SN', leftLabel: 'S 实感', rightLabel: 'N 直觉', value: Math.round(counts.S / totalSN * 100), left: counts.S >= counts.N },
    { key: 'TF', leftLabel: 'T 思考', rightLabel: 'F 情感', value: Math.round(counts.T / totalTF * 100), left: counts.T >= counts.F },
    { key: 'JP', leftLabel: 'J 计划', rightLabel: 'P 随性', value: Math.round(counts.J / totalJP * 100), left: counts.J >= counts.P }
  )
  return code
}

/**
 * 计算生活方式维度
 * - 统计所有生活方式标签的得分
 * - 每组取最高分标签作为该维度结果
 */
function calculateLifestyleDimensions() {
  // 统计所有标签得分
  const tagScores = {}
  Object.keys(selectedAnswers).forEach(qi => {
    const q = questions[Number(qi)]
    if (!q) return
    const opt = q.options[selectedAnswers[qi]]
    if (opt && opt.tags) {
      opt.tags.forEach(tag => {
        tagScores[tag] = (tagScores[tag] || 0) + 1
      })
    }
  })

  // 计算每个维度的百分比和最高标签
  dimensions.length = 0
  LIFESTYLE_GROUPS.forEach(group => {
    const groupTags = group.items.map(it => it.tag)
    const groupTotal = groupTags.reduce((sum, t) => sum + (tagScores[t] || 0), 0) || 1
    const maxTag = groupTags.reduce((best, t) => (tagScores[t] || 0) > (tagScores[best] || 0) ? t : best, groupTags[0])
    const pct = Math.round((tagScores[maxTag] || 0) / groupTotal * 100)
    dimensions.push({
      key: group.key,
      label: group.label,
      value: Math.min(pct, 99),
      color: group.color,
      topTag: maxTag,
      topIndex: groupTags.indexOf(maxTag)
    })
  })
}

/**
 * 构建完整报告
 * - MBTI 来源：用户预选 或 答题推断
 * - 生活方式来源：答题统计
 * - 两者结合生成综合性报告
 */
function buildReport(mbtiCode) {
  const detail = getMbtiDetail(mbtiCode)
  const mbtiProfile = mbtiProfileMap[mbtiCode] || {}

  // 人格标题和分数
  persona.title = detail.name || '旅行者'
  persona.mbti = mbtiCode

  // 人格分数：基于答题一致性（已答题中 MBTI 维度匹配的比例）
  const mbtiLetters = mbtiCode.split('')
  let matchCount = 0
  let totalCount = 0
  Object.keys(selectedAnswers).forEach(qi => {
    const q = questions[Number(qi)]
    if (!q) return
    const opt = q.options[selectedAnswers[qi]]
    if (opt && opt.mbti) {
      totalCount++
      const dim = { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 }[opt.mbti]
      const userDim = { E: 0, I: 1, S: 0, N: 1, T: 0, F: 1, J: 0, P: 1 }[mbtiLetters[dim < 2 ? dim : dim]]
      if (dim !== undefined) {
        const isLeft = ['E', 'S', 'T', 'J'].includes(opt.mbti)
        const userIsLeft = mbtiLetters[['E', 'S', 'T', 'J'].indexOf(opt.mbti)] === opt.mbti
        if (userIsLeft === isLeft || opt.mbti === mbtiCode[Math.floor(['E','S','T','J'].indexOf(opt.mbti))]) {
          matchCount++
        }
      }
    }
  })
  persona.score = totalCount > 0 ? Math.round(matchCount / totalCount * 100) : 75

  // 人格颜色
  const colorMap = { NT: '#7BA4D4', NF: '#7BC8A0', SJ: '#D4B86A', SP: '#D48A7B' }
  const temp = mbtiCode[1] + mbtiCode[2]
  persona.color = colorMap[temp] || '#0D6B5C'

  // 画像总结：MBTI 描述 + 旅行风格
  reportData.summary = `${mbtiCode}（${detail.name}）：${detail.desc}。${detail.travelStyle}。`

  // 生活方式偏好：优先使用 MBTI 配置表，生活方式统计做微调
  // 如果用户预选了 MBTI，以 MBTI 配置表为主；如果靠答题推断，两者各占一半
  const useMbtiProfile = !!selectedMbti.value

  // 从 dimensions 获取最高标签的描述
  const getDescByGroup = (groupIdx) => {
    const dim = dimensions[groupIdx]
    if (!dim) return ''
    return LIFESTYLE_GROUPS[groupIdx].descriptions[dim.topIndex] || ''
  }

  // 偏好详情：MBTI 配置表 + 生活方式统计取较好者
  reportData.destination = useMbtiProfile ? (mbtiProfile.destination || getDescByGroup(0)) : getDescByGroup(0)
  reportData.transport = useMbtiProfile ? (mbtiProfile.transport || '') : ''
  // 如果出行方式维度未覆盖（travel questions 可能不够），用 MBTI 配置补充
  if (!reportData.transport) {
    const transMap = { road: '自驾是你的首选，随时可以停车欣赏风景', rail: '偏爱高铁/火车，安稳舒适还能看沿途风景', flight: '飞机是最佳选择，尽快到达才能开始享受', walk: '用脚步丈量世界，背包徒步才是真旅行' }
    // 从 transport 组查找
    const transportGroup = LIFESTYLE_GROUPS.find(g => g.key === 'transport')
    const dim = dimensions.find(d => d.key === 'transport')
    if (dim && transportGroup) {
      reportData.transport = transMap[dim.topTag] || ''
    }
    if (!reportData.transport && mbtiProfile.transport) {
      reportData.transport = mbtiProfile.transport
    }
  }
  reportData.diet = useMbtiProfile ? (mbtiProfile.diet || getDescByGroup(3)) : getDescByGroup(3)
  reportData.hotel = useMbtiProfile ? (mbtiProfile.hotel || getDescByGroup(2)) : getDescByGroup(2)
  reportData.pace = useMbtiProfile ? (mbtiProfile.pace || getDescByGroup(4)) : getDescByGroup(4)

  // 推荐语：MBTI 模板 + 生活方式维度综合
  const tips = mbtiTravelTips[mbtiCode] || [`作为一位"${persona.title}"，建议安排 3-5 天行程，选择适合自己节奏的目的地。`]
  // 从生活方式维度获取补充信息
  const topDest = dimensions.find(d => d.key === 'destination')
  const topPace = dimensions.find(d => d.key === 'pace')
  const paceWord = topPace ? LIFESTYLE_GROUPS[4].items[topPace.topIndex].label : '张弛有度'
  const destWord = topDest ? LIFESTYLE_GROUPS[0].items[topDest.topIndex].label : '多元'

  const extraRec = `\n基于你的答题分析，你的旅行风格偏向"${paceWord}"，目的地偏好"${destWord}"。建议选择与此匹配的行程安排，让旅途更加舒适愉悦。`
  reportData.recommendation = tips.join('\n') + extraRec
}

// ==================== 操作函数 ====================

/** 保存偏好并跳转到行程规划页，将报告以文本形式注入规划页文本框 */
function saveAndGoPlan() {
  // 将偏好报告格式化为可读文本，供规划页文本框使用
  const lines = [
    `【出行偏好报告】`,
    `MBTI类型：${persona.mbti}（${persona.title}）`,
    reportData.summary ? `人格画像：${reportData.summary}` : '',
    reportData.destination ? `目的地倾向：${reportData.destination}` : '',
    reportData.transport ? `出行方式：${reportData.transport}` : '',
    reportData.diet ? `饮食偏好：${reportData.diet}` : '',
    reportData.hotel ? `住宿风格：${reportData.hotel}` : '',
    reportData.pace ? `旅行节奏：${reportData.pace}` : '',
    reportData.recommendation ? `个性化推荐：${reportData.recommendation.replace(/\n/g, ' ')}` : ''
  ].filter(Boolean)
  const prefsText = lines.join('\n')

  // 存入 sessionStorage，规划页 onMounted 时读取并填入文本框
  sessionStorage.setItem('travelPrefsText', prefsText)
  router.push('/plan')
}

/** 重置测试 */
function resetQuiz() {
  currentQ.value = -1
  Object.keys(selectedAnswers).forEach(k => delete selectedAnswers[k])
  dimensions.length = 0
  mbtiDimensions.length = 0
  persona.title = ''
  persona.color = '#0D6B5C'
  persona.score = 0
  persona.mbti = ''
  reportData.summary = ''
  reportData.destination = ''
  reportData.transport = ''
  reportData.diet = ''
  reportData.hotel = ''
  reportData.pace = ''
  reportData.recommendation = ''
  selectedMbti.value = ''
}
</script>

<style scoped>
.page-container { max-width: 720px; margin: 0 auto; padding: 40px 24px 60px; }

/* 欢迎页 */
.welcome-screen { text-align: center; padding: 20px 0; }
.welcome-title { font-size: 28px; font-weight: 800; color: #1A1A2E; margin: 0 0 8px; font-family: 'Noto Sans SC', sans-serif; }
.welcome-desc { font-size: 14px; color: #8B8B9E; margin: 0 0 32px; }

/* MBTI 可选提示 */
.mbti-optional-hint { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #8B8B9E; margin-bottom: 20px; }
.mbti-section { display: flex; flex-direction: column; gap: 24px; margin-bottom: 32px; }

/* MBTI 矩阵 */
.mbti-groups { display: flex; flex-direction: column; gap: 20px; }
.mbti-group { display: flex; flex-direction: column; gap: 12px; }
.mbti-group-label {
  display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600;
  color: #8B8B9E; text-transform: uppercase; letter-spacing: 1px;
  padding-bottom: 8px; border-bottom: 1px solid #F0EDE6;
}
.mbti-group-label svg { flex-shrink: 0; }
.mbti-grid { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.mbti-card {
  width: 100px; height: 80px; border-radius: 14px; border: 2px solid transparent;
  cursor: pointer; transition: all 0.25s; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px; font-family: 'Noto Sans SC', sans-serif;
  position: relative; overflow: hidden;
}
.mbti-card::before { content: ''; position: absolute; inset: 0; opacity: 0.15; transition: opacity 0.25s; }
.mbti-card.analyst { background: rgba(123, 164, 212, 0.1); border-color: rgba(123, 164, 212, 0.3); }
.mbti-card.analyst::before { background: #7BA4D4; }
.mbti-card.diplomat { background: rgba(123, 200, 160, 0.1); border-color: rgba(123, 200, 160, 0.3); }
.mbti-card.diplomat::before { background: #7BC8A0; }
.mbti-card.sentinel { background: rgba(212, 184, 106, 0.1); border-color: rgba(212, 184, 106, 0.3); }
.mbti-card.sentinel::before { background: #D4B86A; }
.mbti-card.explorer { background: rgba(212, 138, 123, 0.1); border-color: rgba(212, 138, 123, 0.3); }
.mbti-card.explorer::before { background: #D48A7B; }
.mbti-card:hover { transform: translateY(-2px); }
.mbti-card:hover::before { opacity: 0.25; }
.mbti-card.selected { border-width: 2px; transform: translateY(-2px); }
.mbti-card.analyst.selected { border-color: #7BA4D4; box-shadow: 0 4px 16px rgba(123,164,212,0.3); }
.mbti-card.analyst.selected::before { opacity: 0.3; }
.mbti-card.diplomat.selected { border-color: #7BC8A0; box-shadow: 0 4px 16px rgba(123,200,160,0.3); }
.mbti-card.diplomat.selected::before { opacity: 0.3; }
.mbti-card.sentinel.selected { border-color: #D4B86A; box-shadow: 0 4px 16px rgba(212,184,106,0.3); }
.mbti-card.sentinel.selected::before { opacity: 0.3; }
.mbti-card.explorer.selected { border-color: #D48A7B; box-shadow: 0 4px 16px rgba(212,138,123,0.3); }
.mbti-card.explorer.selected::before { opacity: 0.3; }
.mbti-code { font-size: 14px; font-weight: 800; letter-spacing: 0.5px; position: relative; z-index: 1; }
.mbti-card.analyst .mbti-code { color: #5A8ABF; }
.mbti-card.diplomat .mbti-code { color: #5AAC80; }
.mbti-card.sentinel .mbti-code { color: #B8960C; }
.mbti-card.explorer .mbti-code { color: #BF6A5A; }
.mbti-card.selected .mbti-code { color: #1A1A2E; }
.mbti-name { font-size: 11px; color: #5C5C6E; position: relative; z-index: 1; }
.mbti-card.selected .mbti-name { color: #1A1A2E; font-weight: 600; }

/* MBTI 描述 */
.mbti-description { padding: 0 20px; }
.mbti-desc-card { background: #F8F6F0; border: 1px solid #E5E0D6; border-radius: 16px; padding: 20px 24px; text-align: left; }
.mbti-desc-code { font-size: 20px; font-weight: 800; color: #0D6B5C; letter-spacing: 1px; }
.mbti-desc-name { font-size: 14px; color: #5C5C6E; margin-left: 12px; }
.mbti-desc-text { font-size: 13px; color: #5C5C6E; margin: 10px 0 6px; line-height: 1.7; }
.mbti-desc-travel { font-size: 13px; color: #0D6B5C; margin: 0; padding: 8px 14px; background: rgba(13,107,92,0.06); border-radius: 8px; }

/* 统一入口按钮 */
.quiz-start-btn {
  width: 100%; max-width: 360px; margin: 0 auto; padding: 14px 28px;
  background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff;
  border: none; border-radius: 14px; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.25s; font-family: 'Noto Sans SC', sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.quiz-start-btn:hover { box-shadow: 0 8px 28px rgba(13,107,92,0.4); transform: translateY(-2px); }
.start-hint { font-size: 12px; color: #8B8B9E; margin: 12px 0 0; }

/* 答题页 */
.quiz-screen { padding: 20px 0; }
.question-card {
  background: #fff; border: 1px solid #E5E0D6; border-radius: 24px;
  padding: 64px 80px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  max-width: 800px; margin: 0 auto;
}
.q-category { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.q-cat-tag {
  display: inline-block; padding: 3px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 600; color: #0D6B5C;
  background: rgba(13,107,92,0.08);
}
.q-progress-inline { font-size: 12px; color: #8B8B9E; }
.q-text { font-size: 22px; font-weight: 700; color: #1A1A2E; margin: 0 0 28px; line-height: 1.5; font-family: 'Noto Sans SC', sans-serif; }
.q-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.q-option {
  display: flex; align-items: center; gap: 14px; padding: 20px 24px;
  border: 2px solid #E5E0D6; border-radius: 14px; background: #F8F6F0;
  cursor: pointer; transition: all 0.2s; text-align: left; width: 100%;
  font-family: 'Noto Sans SC', sans-serif; min-height: 56px;
}
.q-option:hover { border-color: #1A8A7A; background: rgba(26, 138, 122, 0.04); }
.q-option.selected { border-color: #0D6B5C; background: #0D6B5C; }
.opt-letter { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #D4C8B8; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #8B8B9E; flex-shrink: 0; transition: all 0.2s; }
.q-option.selected .opt-letter { border-color: #fff; color: #fff; }
.opt-text { flex: 1; font-size: 16px; color: #1A1A2E; line-height: 1.6; transition: color 0.2s; }
.q-option.selected .opt-text { color: #fff; }
.opt-check { width: 20px; height: 20px; flex-shrink: 0; }
.q-nav { display: flex; justify-content: space-between; gap: 12px; }
.q-prev, .q-next { padding: 10px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center; gap: 6px; }
.q-prev { background: #F8F6F0; border: 1px solid #E5E0D6; color: #5C5C6E; }
.q-prev:disabled { opacity: 0.4; cursor: not-allowed; }
.q-prev:not(:disabled):hover { border-color: #0D6B5C; color: #0D6B5C; }
.q-next { background: linear-gradient(135deg, #0D6B5C, #1A8A7A); border: none; color: #fff; }
.q-next:disabled { opacity: 0.4; cursor: not-allowed; }
.q-next:not(:disabled):hover { box-shadow: 0 4px 16px rgba(13, 107, 92, 0.3); }

/* 提前生成报告按钮 */
.q-finish { padding: 10px 22px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #D4A84B, #C2960C); border: none; color: #fff; box-shadow: 0 2px 8px rgba(212,168,75,0.25); }
.q-finish:hover { box-shadow: 0 4px 16px rgba(212,168,75,0.4); transform: translateY(-1px); }
.q-hint { margin-top: 12px; text-align: center; font-size: 12px; color: #D4A84B; font-weight: 500; }

/* 报告页 */
.report-screen { padding: 20px 0; }

/* 人格画像总结 */
.report-summary { display: flex; gap: 12px; padding: 16px 18px; background: linear-gradient(135deg, rgba(13,107,92,0.06), rgba(26,138,122,0.04)); border: 1px solid rgba(13,107,92,0.15); border-radius: 14px; margin-bottom: 24px; }
.report-summary p { margin: 0; font-size: 14px; line-height: 1.8; color: #1A1A2E; flex: 1; }
.summary-tag { display: inline-block; padding: 4px 10px; background: #0D6B5C; color: #fff; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; flex-shrink: 0; align-self: flex-start; }

.report-card {
  background: #fff; border: 1px solid #E5E0D6; border-radius: 20px;
  padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.report-header { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #F0EDE6; }
.report-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #0D6B5C, #1A8A7A); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.report-title-area { flex: 1; }
.report-title { font-size: 22px; font-weight: 700; color: #1A1A2E; margin: 0 0 8px; font-family: 'Noto Sans SC', sans-serif; }
.report-persona { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.persona-badge { padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #fff; }
.persona-score { font-size: 14px; color: #0D6B5C; font-weight: 700; }
.persona-mbti { padding: 4px 12px; border-radius: 10px; font-size: 13px; font-weight: 800; color: #0D6B5C; background: rgba(13,107,92,0.08); letter-spacing: 0.5px; }

/* MBTI 维度条 */
.report-mbti-bar { margin-bottom: 28px; }
.mbti-dim-bars { display: flex; flex-direction: column; gap: 14px; }
.mbti-dim-row { display: flex; align-items: center; gap: 8px; }
.mbti-dim-label { font-size: 12px; color: #8B8B9E; width: 70px; text-align: center; flex-shrink: 0; transition: color 0.3s; }
.mbti-dim-label.active { color: #0D6B5C; font-weight: 700; }
.mbti-dim-track { flex: 1; height: 8px; background: #F0EDE6; border-radius: 4px; overflow: hidden; position: relative; }
.mbti-dim-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.mbti-dim-fill.left { background: linear-gradient(90deg, #0D6B5C, #1A8A7A); }
.mbti-dim-fill.right { background: linear-gradient(90deg, #D4C8B8, #E5E0D6); float: right; }

/* 维度条形图 */
.report-dimensions { margin-bottom: 28px; }
.dim-title { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0 0 16px; }
.dim-bars { display: flex; flex-direction: column; gap: 12px; }
.dim-row { display: flex; align-items: center; gap: 12px; }
.dim-label { width: 80px; font-size: 13px; color: #5C5C6E; text-align: right; flex-shrink: 0; }
.dim-track { flex: 1; height: 10px; background: #F0EDE6; border-radius: 5px; overflow: hidden; }
.dim-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
.dim-val { width: 36px; font-size: 13px; font-weight: 700; color: #0D6B5C; text-align: right; flex-shrink: 0; }

/* 偏好详情 */
.report-details { display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.detail-block { padding: 16px; background: #F8F6F0; border-radius: 12px; }
.detail-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #1A1A2E; margin: 0 0 8px; }
.detail-text { font-size: 13px; color: #5C5C6E; margin: 0; line-height: 1.7; }

/* 推荐语 */
.report-recommendation { padding: 18px; background: rgba(212, 168, 75, 0.08); border: 1px solid rgba(212, 168, 75, 0.2); border-radius: 14px; margin-bottom: 24px; }
.rec-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #1A1A2E; margin: 0 0 10px; }
.rec-text { font-size: 13px; color: #5C5C6E; margin: 0; line-height: 1.8; white-space: pre-line; }

/* 操作按钮 */
.report-actions { display: flex; gap: 12px; }
.action-btn { flex: 1; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'Noto Sans SC', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
.action-primary { background: linear-gradient(135deg, #0D6B5C, #1A8A7A); color: #fff; border: none; }
.action-primary:hover { box-shadow: 0 8px 28px rgba(13, 107, 92, 0.35); transform: translateY(-2px); }
.action-secondary { background: #F8F6F0; color: #5C5C6E; border: 1px solid #E5E0D6; }
.action-secondary:hover { border-color: #0D6B5C; color: #0D6B5C; }

/* 响应式 */
@media (max-width: 640px) {
  .page-container { padding: 20px 16px 40px; }
  .question-card { padding: 32px 24px; }
  .q-text { font-size: 18px; }
  .opt-text { font-size: 14px; }
  .report-card { padding: 20px; }
  .mbti-card { width: 80px; height: 68px; }
}
</style>
