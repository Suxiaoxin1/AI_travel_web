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
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased}
body{font-family:'Noto Sans SC','Inter',sans-serif;background:#F8F6F0;color:#1A1A2E;line-height:1.5;overflow-x:hidden}
::selection{background:rgba(13,107,92,0.2);color:#1A1A2E}
.app{min-height:100vh;display:flex;flex-direction:column}
.main-content{margin-top:64px;display:flex;flex-direction:column;flex:1}
</style>
