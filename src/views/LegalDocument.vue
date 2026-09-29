<template>
  <section id="top" class="legal-page">
    <header class="legal-hero">
      <div class="orbit orbit-one"></div>
      <div class="orbit orbit-two"></div>
      <div class="hero-inner">
        <router-link class="back-link" to="/">← 返回星际行者</router-link>
        <p class="eyebrow">{{ document.eyebrow }}</p>
        <h1>{{ document.title }}</h1>
        <p class="hero-summary">{{ document.summary }}</p>
        <div class="document-meta">
          <span>版本 {{ document.version }}</span>
          <span>更新于 {{ document.updatedAt }}</span>
          <span>适用状态：测试版本</span>
        </div>
      </div>
    </header>

    <main class="legal-main">
      <aside class="legal-aside" aria-label="文档目录">
        <p class="aside-label">航行坐标</p>
        <nav>
          <a v-for="section in document.sections" :key="section.id" :href="`#${section.id}`">
            <span>{{ section.number }}</span>{{ section.title }}
          </a>
        </nav>
      </aside>

      <article class="legal-document">
        <div class="draft-note">
          <span class="note-icon" aria-hidden="true">!</span>
          <div>
            <strong>上线前信息待完善</strong>
            <p>本页面已按当前功能整理为测试版草案。正式对外提供服务前，请替换运营者全称、联系邮箱、注册地址、实际存储地域及第三方服务清单，并由具备资质的专业人士复核。</p>
          </div>
        </div>

        <section v-for="section in document.sections" :id="section.id" :key="section.id" class="legal-section">
          <p class="section-number">{{ section.number }}</p>
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.items" class="legal-list">
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
          <div v-if="section.table" class="table-wrap">
            <table>
              <thead><tr><th v-for="heading in section.table.headings" :key="heading">{{ heading }}</th></tr></thead>
              <tbody><tr v-for="row in section.table.rows" :key="row[0]"><td v-for="cell in row" :key="cell">{{ cell }}</td></tr></tbody>
            </table>
          </div>
        </section>

        <div class="document-end">
          <span>✦</span>
          <p>感谢你在出发前，花一点时间了解这份约定。</p>
          <a href="#top">回到顶部 ↑</a>
        </div>
      </article>
    </main>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, required: true, validator: (value) => ['terms', 'privacy'].includes(value) }
})

const documents = {
  terms: {
    eyebrow: 'STARWALK TERMS · 用户协议',
    title: '在抵达之前，先读懂彼此的约定',
    summary: '这份协议说明你使用星际行者旅行服务时的权利、责任与使用边界。',
    version: '0.1', updatedAt: '2026 年 9 月 3 日',
    sections: [
      { id: 'terms-scope', number: '01', title: '协议的适用范围', paragraphs: ['欢迎使用星际行者。本协议适用于你通过网站使用旅行规划、景点探索、路线生成、旅行手账、旅行分享及与之相关的服务。', '你开始注册、登录或使用服务，即表示你已阅读并同意本协议及《隐私政策》。如你不同意其中任何内容，请停止使用相关服务。'] },
      { id: 'terms-service', number: '02', title: '我们提供的服务', paragraphs: ['星际行者帮助你记录旅行偏好、生成旅行建议、查看路线信息、制作手账并发布旅行内容。不同功能可能因网络、第三方服务状态、测试安排或后续版本调整而发生变化。'], items: ['旅行偏好与行程规划', '热门景点浏览与路线参考', '旅行手账的制作、保存与编辑', '旅行分享、评论与互动'] },
      { id: 'terms-account', number: '03', title: '账号与使用安全', paragraphs: ['部分功能需要账号登录后才能使用。请提供真实、准确、完整的注册信息，并妥善保管账号与密码。你应对使用该账号发生的操作负责。', '如发现账号异常使用，请尽快通过本页公布的正式联系渠道通知我们。当前测试版本尚未提供对外客服渠道，请勿在测试环境中提交敏感身份信息。'] },
      { id: 'terms-content', number: '04', title: '你的内容与发布规范', paragraphs: ['你对上传、填写或发布的图片、文字、行程和评论负责，并应确保你拥有必要权利或已取得授权。', '不得借助本服务发布违法、有害、侵权、虚假、骚扰他人或侵犯他人隐私的内容。对公开分享内容，我们可依照法律要求或平台规则采取隐藏、删除、限制展示等措施。'] },
      { id: 'terms-ai', number: '05', title: 'AI 与路线信息说明', paragraphs: ['AI 生成的行程、景点推荐、预算和路线内容仅供旅行灵感与行前参考，不构成医疗、安全、签证、交通、天气或其他专业建议，也不保证实时性、完整性或适合你的具体情况。', '出行前请自行核实目的地开放状态、交通规则、天气、费用、预约要求与安全风险，并根据自身情况作出决定。'] },
      { id: 'terms-rights', number: '06', title: '知识产权与服务调整', paragraphs: ['星际行者的名称、界面、程序及其内容所涉权利归相关权利人所有。未经许可，不得复制、反向工程、抓取或以其他方式不当使用服务。', '为提供、维护与改进服务，我们可能更新功能或本协议。重大变更将以适当方式提示；你继续使用变更后的服务，即视为接受更新后的协议。'] },
      { id: 'terms-contact', number: '07', title: '联系与适用', paragraphs: ['正式上线前，请在此补充运营者全称、注册地址、统一社会信用代码（如适用）、联系邮箱及争议处理方式。当前页面为测试版协议草案，不应替代正式上线所需的法律文本。', '本协议的解释、效力与争议处理，应以服务实际运营地适用的法律法规及正式发布版本为准。'] }
    ]
  },
  privacy: {
    eyebrow: 'PRIVACY NOTE · 隐私政策',
    title: '你的旅行，只由你决定如何被记录',
    summary: '我们以最小必要为原则处理信息，并说明信息的用途、保存方式与可行使的权利。',
    version: '0.1', updatedAt: '2026 年 9 月 3 日',
    sections: [
      { id: 'privacy-intro', number: '01', title: '我们如何理解隐私', paragraphs: ['本隐私政策适用于星际行者提供的网站服务。我们仅在实现相应功能所必需的范围内处理个人信息，并以清晰方式说明处理目的、方式、种类、保存期限及你行使权利的路径。', '目前项目处于测试阶段。请不要在测试环境中提交身份证件、金融账户、精确住址、医疗健康等与旅行服务无关的敏感信息。'] },
      { id: 'privacy-collection', number: '02', title: '我们处理哪些信息', paragraphs: ['以下内容基于当前已实现的功能整理；你不使用相应功能时，我们不会因该功能而要求你提供对应信息。'], table: { headings: ['功能场景', '信息类型', '处理目的'], rows: [['注册与登录', '账号、昵称、密码哈希、登录会话信息', '创建账号、验证身份、保障会话安全'], ['个人资料', '头像、个人简介、常住城市', '展示和维护你的个人资料'], ['旅行规划与路线', '旅行偏好、行程文本、日期、预算、目的地与路线点位', '生成、保存和展示旅行规划与路线'], ['手账与分享', '你上传的图片、文字、地点、旅行日期、评论和互动记录', '制作手账、发布分享、提供社区互动与内容审核'], ['服务安全', '设备标识、浏览器标识、IP 地址、认证与管理操作记录', '预防异常访问、维护服务安全、排查故障']] } },
      { id: 'privacy-sharing', number: '03', title: '第三方服务与信息共享', paragraphs: ['当你主动使用地图、路线、AI 生成或图片存储功能时，为实现该功能，相关内容可能由相应的地图服务、AI 服务或对象存储服务处理。我们不会出售你的个人信息。', '正式上线前，应逐项披露实际启用的第三方服务名称、接收信息类型、处理目的、隐私政策链接、服务器所在地及是否涉及向境外提供信息；未实际启用的服务不应列入正式版本。'], items: ['地图与路线服务：用于查询地点和生成路线参考。', 'AI 服务：仅在你主动发起生成时处理相应的文本或图片输入。', '对象存储服务：用于保存你主动上传的图片和手账素材。'] },
      { id: 'privacy-storage', number: '04', title: '保存、公开与删除', paragraphs: ['我们在实现功能所需的最短期限内保存信息。你主动删除的行程、路线、手账或分享内容，会按照系统能力及适用法律处理；因法律义务、争议处理或安全审计需要依法留存的除外。', '你主动发布为公开分享的内容，可能被其他用户查看、评论或互动。请谨慎决定公开内容，避免在标题、图片、地点或文字中透露自己或他人的敏感信息。'] },
      { id: 'privacy-security', number: '05', title: '信息安全与未成年人', paragraphs: ['我们会采取访问控制、身份验证、密码哈希、最小权限和日志审计等合理措施保护信息安全。但互联网传输并非绝对安全，请同时保护好账号凭证与设备。', '本服务不面向未满十四周岁的儿童提供独立服务。若实际业务将面向未成年人，应在正式上线前补充监护人同意、专门告知与保护措施。'] },
      { id: 'privacy-rights', number: '06', title: '你可以如何管理信息', paragraphs: ['你可以在已提供的功能内查询、修改或删除部分旅行内容，并可退出登录。对于查询、更正、删除、撤回同意、注销账号或获取隐私政策说明等请求，正式上线后应通过本页公布的联系渠道提交。', '当前测试版本尚未配置对外个人信息保护联系人和账号注销入口，因此不应作为正式面向公众的隐私服务承诺。'] },
      { id: 'privacy-update', number: '07', title: '更新与联系我们', paragraphs: ['当个人信息处理目的、方式、种类、保存期限、接收方或你的权利行使方式发生实质变化时，我们会更新本政策并以适当方式提示。', '正式上线前，请在此补充运营者名称、个人信息保护联系人、联系邮箱、联系地址和响应机制。更新后的正式政策应便于查阅和保存。'] }
    ]
  }
}

const document = computed(() => documents[props.type])
</script>

<style scoped>
.legal-page { min-height: 100%; background: #f7f5ef; color: #263039; }
.legal-hero { position: relative; isolation: isolate; overflow: hidden; color: #f9f7f0; background: linear-gradient(118deg, #133831, #1a4640 58%, #203d3a); }
.hero-inner { width: min(1160px, calc(100% - 64px)); margin: 0 auto; padding: 62px 0 72px; }
.orbit { position: absolute; z-index: -1; border: 1px solid rgba(231,211,168,.25); border-radius: 50%; transform: rotate(-18deg); }.orbit-one { width: 420px; height: 152px; right: 10%; top: 32px; }.orbit-two { width: 260px; height: 94px; right: 4%; top: 116px; opacity: .7; }
.back-link { display: inline-flex; margin-bottom: 38px; color: rgba(255,255,255,.78); font-size: 13px; text-decoration: none; }.back-link:hover { color: #f4c35e; }
.eyebrow, .aside-label, .section-number { margin: 0; color: #e3b75c; font-size: 11px; font-weight: 700; letter-spacing: .16em; }
h1 { max-width: 720px; margin: 13px 0 16px; font-family: 'Noto Serif SC', 'Songti SC', serif; font-size: clamp(34px, 5vw, 56px); letter-spacing: -.045em; line-height: 1.13; }.hero-summary { max-width: 560px; margin: 0; color: rgba(255,255,255,.75); font-size: 16px; line-height: 1.8; }
.document-meta { display: flex; flex-wrap: wrap; gap: 9px 14px; margin-top: 30px; color: rgba(255,255,255,.62); font-size: 12px; }.document-meta span + span { padding-left: 14px; border-left: 1px solid rgba(255,255,255,.2); }
.legal-main { display: grid; grid-template-columns: 180px minmax(0,760px); justify-content: center; align-items: start; gap: 70px; width: min(1160px, calc(100% - 64px)); margin: 0 auto; padding: 54px 0 88px; }.legal-aside { position: sticky; top: 98px; padding-top: 16px; }.legal-aside nav { display: grid; gap: 13px; margin-top: 20px; border-left: 1px solid #d9ded7; }.legal-aside a { padding-left: 15px; color: #74807a; font-size: 13px; line-height: 1.35; text-decoration: none; }.legal-aside a:hover { color: #0d6b5c; }.legal-aside a span { display: inline-block; width: 25px; color: #b2924d; font-size: 10px; }
.draft-note { display: grid; grid-template-columns: 28px 1fr; gap: 14px; margin-bottom: 50px; padding: 18px 20px; border: 1px solid #ead8af; border-radius: 14px; background: #fffaf0; color: #615637; }.note-icon { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #d6a945; color: #fff; font-family: Georgia,serif; font-weight: 700; }.draft-note strong { color: #4f462d; font-size: 14px; }.draft-note p { margin: 5px 0 0; font-size: 12px; line-height: 1.75; }
.legal-section { scroll-margin-top: 96px; padding: 0 0 38px; margin-bottom: 39px; border-bottom: 1px solid #e1e3dc; }.legal-section h2 { margin: 8px 0 18px; color: #183d36; font-family: 'Noto Serif SC', 'Songti SC', serif; font-size: 25px; }.legal-section p { margin: 0 0 12px; color: #4e5a56; font-size: 14px; line-height: 1.9; }.legal-list { display: grid; gap: 9px; padding: 0; margin: 18px 0 0; list-style: none; }.legal-list li { position: relative; padding-left: 19px; color: #4e5a56; font-size: 14px; line-height: 1.75; }.legal-list li::before { content: '✦'; position: absolute; left: 0; color: #c89d45; font-size: 11px; }
.table-wrap { overflow-x: auto; margin-top: 20px; border: 1px solid #e0e3dc; border-radius: 12px; background: #fff; }table { width: 100%; border-collapse: collapse; color: #4e5a56; font-size: 13px; line-height: 1.65; text-align: left; }th,td { min-width: 145px; padding: 13px 15px; vertical-align: top; border-bottom: 1px solid #edf0eb; }th { background: #f1f5f0; color: #244a42; font-size: 12px; }tbody tr:last-child td { border-bottom: 0; }
.document-end { display: grid; justify-items: start; gap: 6px; }.document-end > span { color: #d6a945; font-size: 20px; }.document-end p { margin: 0; color: #6b7772; font-size: 13px; }.document-end a { color: #0d6b5c; font-size: 13px; font-weight: 700; text-decoration: none; }.document-end a:hover { color: #b6852b; }
@media (max-width: 780px) { .hero-inner,.legal-main { width: min(100% - 36px,680px); }.hero-inner { padding: 42px 0 50px; }.back-link { margin-bottom: 30px; }.legal-main { display: block; padding: 34px 0 58px; }.legal-aside { position: static; padding: 0 0 28px; }.legal-aside nav { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 11px 8px; border-left: 0; }.legal-aside a { padding: 0; font-size: 12px; } }
@media (max-width: 480px) { .orbit-one { width: 280px; right: -70px; }h1 { font-size: 35px; }.hero-summary { font-size: 14px; }.document-meta { display: grid; gap: 5px; }.document-meta span + span { padding-left: 0; border-left: 0; }.draft-note { grid-template-columns: 24px 1fr; padding: 16px; }.legal-aside nav { grid-template-columns: 1fr; }.legal-section h2 { font-size: 22px; }.legal-section p,.legal-list li { font-size: 13px; }th,td { min-width: 132px; padding: 11px 12px; } }
</style>
