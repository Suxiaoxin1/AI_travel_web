<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <path d="M16 2L6 12l2 2 8-8 8 8 2-2L16 2z" fill="#1A8A7A"/>
              <circle cx="16" cy="18" r="5" fill="#D4A84B" opacity="0.8"/>
              <circle cx="16" cy="18" r="2" fill="#F8F6F0"/>
            </svg>
            <span>星际行者</span>
          </div>
          <p class="footer-desc">让AI成为你的星际导航员，开启穿行34个星际省域的奇幻旅程。</p>
          <div class="footer-social">
            <a class="social-icon" href="#" aria-label="微信">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B8B9E"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.129 6.129 0 0 1-.263-1.757c0-3.629 3.39-6.57 7.57-6.57.259 0 .51.022.764.042C16.833 4.904 13.14 2.188 8.691 2.188zm-2.6 4.408c.56 0 1 .425 1 .95 0 .526-.44.95-.999.95-.557 0-1.001-.424-1.001-.95 0-.525.444-.95 1.001-.95zm5.198 0c.56 0 1 .425 1 .95 0 .526-.44.95-.999.95-.557 0-1.001-.424-1.001-.95 0-.525.444-.95 1.001-.95zm4.506 3.332c-3.546 0-6.428 2.438-6.428 5.444 0 3.006 2.882 5.444 6.428 5.444a7.6 7.6 0 0 0 2.223-.332.643.643 0 0 1 .533.074l1.415.828a.24.24 0 0 0 .123.04c.119 0 .215-.098.215-.218 0-.053-.021-.105-.035-.157l-.29-1.102a.437.437 0 0 1 .157-.492C21.606 19.39 22.578 17.7 22.578 15.83c0-3.314-2.882-6.002-6.783-6.002h.6zM12.32 14.24c.433 0 .784.343.784.766a.778.778 0 0 1-.784.767.778.778 0 0 1-.784-.767c0-.423.35-.766.784-.766zm4.44 0c.433 0 .784.343.784.766a.778.778 0 0 1-.784.767.778.778 0 0 1-.784-.767c0-.423.35-.766.784-.766z"/></svg>
            </a>
            <a class="social-icon" href="#" aria-label="微博">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B8B9E"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.583.631.283.822.997.442 1.574zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.307-.364-.168-.596.138-.227.436-.346.672-.246.239.09.315.36.185.589zm.176-2.719c-1.893-.494-4.039.454-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.642 4.318-.341 5.132-2.179.8-1.793-.143-3.643-2.161-4.149zm7.563-1.223c-.346-.105-.579-.18-.4-.791.388-1.382.341-2.557-.224-3.317-.96-1.289-3.283-1.194-5.346-1.102-.223.008-.37-.149-.328-.371.144-.7.288-1.591-.511-1.835-.844-.26-1.744.196-2.463.798-.176.146-.466.032-.539-.197-.266-1.027.07-2.025.878-2.733 1.163-1.003 2.823-1.354 4.325-1.039 1.592.329 2.784 1.382 3.164 2.848.183.719.139 1.482-.088 2.157-.476 1.376-.048 2.377.088 2.732.135.355-.074.653-.247.571z"/></svg>
            </a>
            <a class="social-icon" href="#" aria-label="小红书">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B8B9E"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
            </a>
            <a class="social-icon" href="#" aria-label="抖音">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8B8B9E"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
          </div>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>功能入口</h4>
            <router-link to="/plan">旅行规划</router-link>
            <router-link to="/destinations">热门景点</router-link>
            <router-link to="/routes">行程路线</router-link>
            <router-link to="/share">旅途分享</router-link>
            <router-link to="/journal">旅游手账</router-link>
          </div>
          <div class="footer-col">
            <h4>关于平台</h4>
            <a href="#">关于我们</a>
            <a href="#">联系方式</a>
            <a href="#">加入我们</a>
            <a href="#">品牌合作</a>
          </div>
          <div class="footer-col">
            <h4>帮助支持</h4>
            <a href="#">帮助中心</a>
            <a href="#">反馈建议</a>
            <a href="#">隐私政策</a>
            <a href="#">用户协议</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 星际行者 Interstellar Traveler. All rights reserved.</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useRouter } from 'vue-router'
</script>

<style scoped>
.footer {
  background: #1A1A2E;
  color: #B8C5B0;
  padding: 64px 32px 28px;
  font-family: 'Noto Sans SC', sans-serif;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.footer-brand {
  max-width: 300px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 14px;
}

.footer-desc {
  font-size: 13px;
  line-height: 1.8;
  color: #8B8B9E;
  margin: 0 0 20px;
}

.footer-social {
  display: flex;
  gap: 14px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.25s;
}

.social-icon:hover {
  background: rgba(13, 107, 92, 0.2);
  border-color: #1A8A7A;
}

.footer-links {
  display: flex;
  gap: 60px;
}

.footer-col h4 {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 18px 0;
}

.footer-col a {
  display: block;
  font-size: 13px;
  color: #8B8B9E;
  margin-bottom: 12px;
  transition: color 0.25s;
  text-decoration: none;
}

.footer-col a:hover {
  color: #D4A84B;
}

.footer-bottom {
  padding-top: 28px;
  font-size: 12px;
  color: #6B6B7D;
  text-align: center;
}
</style>
