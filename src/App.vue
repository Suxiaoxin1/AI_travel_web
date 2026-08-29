<template>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <!-- 全局右侧抽屉：我的收藏/我的预定/我的日记 -->
    <MyDrawer />
    <!-- 订单确认弹窗：从 OTA 平台返回后询问用户 -->
    <BookingConfirmModal />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import AppFooter from './components/AppFooter.vue'
import MyDrawer from './components/MyDrawer.vue'
import BookingConfirmModal from './components/BookingConfirmModal.vue'
</script>

<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;scroll-padding-top:84px;-webkit-font-smoothing:antialiased}
body{font-family:'Noto Sans SC','Inter',sans-serif;background:#F8F6F0;color:#1A1A2E;line-height:1.5;overflow-x:hidden}
::selection{background:rgba(13,107,92,0.2);color:#1A1A2E}
.app{min-height:100vh;display:flex;flex-direction:column}
.main-content{margin-top:72px;display:flex;flex-direction:column;flex:1}
.main-content .page-header {
  position: relative; overflow: hidden; isolation: isolate;
  padding: 30px 34px 28px; margin-bottom: 28px; border: 1px solid rgba(13,107,92,.12);
  border-radius: 22px; background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(239,247,243,.84));
  box-shadow: 0 12px 30px rgba(13,107,92,.08);
}
.main-content .page-header::before {
  content: ''; position: absolute; z-index: -1; width: 180px; height: 180px; right: -54px; top: -76px;
  border-radius: 50%; background: radial-gradient(circle, rgba(212,168,75,.26), rgba(212,168,75,0) 68%);
}
.main-content .page-header::after {
  content: ''; position: absolute; width: 72px; height: 4px; left: 50%; bottom: 14px; transform: translateX(-50%);
  border-radius: 999px; background: linear-gradient(90deg,#D4A84B,#0D6B5C); opacity: .75;
}
.main-content .page-header .page-title {
  position: relative; display: inline-block; margin-bottom: 9px;
  background: linear-gradient(100deg,#153B32 0%,#0D6B5C 58%,#C18B2C 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: .02em;
}
.main-content .page-header .page-subtitle {
  position: relative; max-width: 680px; margin-left: auto; margin-right: auto; padding-left: 0; color: #65736D;
  line-height: 1.8;
}
.main-content .page-header .page-subtitle::before {
  content: none;
}
@media (max-width: 560px) {
  .main-content { margin-top: 60px; }
  .main-content .page-header { padding: 24px 20px 23px; border-radius: 18px; }
  .main-content .page-header::after { left: 50%; }
}
</style>
