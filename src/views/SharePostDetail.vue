<template>
  <div class="public-share-page">
    <header class="public-share-header">
      <RouterLink to="/share" class="brand-link">星际行者</RouterLink>
      <RouterLink to="/share" class="back-link">返回旅行分享</RouterLink>
    </header>

    <main class="public-share-main">
      <div v-if="isLoading" class="state-card">正在加载游记…</div>
      <div v-else-if="error" class="state-card error-state">
        <h1>游记暂时无法打开</h1>
        <p>{{ error }}</p>
        <RouterLink to="/share" class="back-button">返回分享页</RouterLink>
      </div>
      <article v-else-if="post" class="public-post-card">
        <div class="post-topline">
          <div class="author-block">
            <div class="author-avatar" :style="{ background: post.author_avatar }">{{ post.author?.[0] || '旅' }}</div>
            <div>
              <strong>{{ post.author || '旅行者' }}</strong>
              <span>{{ formatDate(post.created_at) }}</span>
            </div>
          </div>
          <span v-if="post.location" class="location-pill">⌖ {{ post.location }}</span>
        </div>

        <h1>{{ post.title || '旅行游记' }}</h1>
        <p class="post-content">{{ post.content }}</p>
        <div class="rating" aria-label="评分">
          <span v-for="star in 5" :key="star" :class="{ filled: star <= (post.rating || 0) }">★</span>
        </div>
        <div v-if="post.tags?.length" class="tag-list">
          <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
        </div>

        <div v-if="images.length" class="post-gallery">
          <img v-for="(image, index) in images" :key="`${post.id}-${index}`" :src="image" :alt="`${post.title || '游记'}图片${index + 1}`" @error="hideImage" />
        </div>

        <div class="post-actions">
          <button @click="copyLink">{{ copied ? '链接已复制' : '复制分享链接' }}</button>
          <button @click="nativeShare">系统分享</button>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useShareStore } from '../stores/shareStore'

const route = useRoute()
const shareStore = useShareStore()
const post = ref(null)
const isLoading = ref(true)
const error = ref('')
const copied = ref(false)

const images = computed(() => Array.isArray(post.value?.images) ? post.value.images.filter(Boolean) : [])
const shareUrl = computed(() => `${window.location.origin}/share/post/${route.params.id}`)

function formatDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

function hideImage(event) {
  event.currentTarget.style.display = 'none'
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {
    const input = document.createElement('textarea')
    input.value = shareUrl.value
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.focus()
    input.select()
    document.execCommand('copy')
    input.remove()
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2200)
}

async function nativeShare() {
  if (!navigator.share) {
    await copyLink()
    return
  }
  try {
    await navigator.share({ title: post.value?.title || '旅行游记', text: post.value?.content || '', url: shareUrl.value })
  } catch (err) {
    if (err?.name !== 'AbortError') console.warn('系统分享不可用', err)
  }
}

onMounted(async () => {
  const result = await shareStore.getPublicPost(route.params.id)
  if (result.ok) {
    post.value = result.record
    document.title = `${post.value.title || '旅行游记'} · 星际行者`
  } else {
    error.value = result.msg || '请稍后重试'
  }
  isLoading.value = false
})
</script>

<style scoped>
.public-share-page { min-height: 100vh; background: #F7F5EF; color: #1A1A2E; }
.public-share-header { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 max(24px, calc((100vw - 1040px) / 2)); background: rgba(255,255,255,.82); border-bottom: 1px solid #E7E2D8; }
.brand-link { color: #0D6B5C; font-size: 20px; font-weight: 800; text-decoration: none; letter-spacing: .08em; }
.back-link { color: #5C5C6E; font-size: 13px; text-decoration: none; }
.back-link:hover { color: #0D6B5C; }
.public-share-main { width: min(92vw, 820px); margin: 42px auto 72px; }
.state-card, .public-post-card { background: #fff; border: 1px solid #E7E2D8; border-radius: 22px; box-shadow: 0 12px 34px rgba(44, 54, 45, .08); }
.state-card { padding: 56px 24px; text-align: center; color: #8B8B9E; }
.error-state h1 { margin: 0 0 10px; color: #1A1A2E; font-size: 22px; }
.error-state p { margin: 0 0 22px; }
.back-button { display: inline-block; padding: 10px 18px; border-radius: 10px; background: #1A3A2E; color: #fff; text-decoration: none; font-size: 13px; }
.public-post-card { padding: clamp(24px, 5vw, 48px); }
.post-topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.author-block { display: flex; align-items: center; gap: 10px; }
.author-avatar { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 700; }
.author-block strong, .author-block span { display: block; }
.author-block strong { font-size: 14px; }
.author-block span { margin-top: 4px; color: #A1A1B0; font-size: 11px; }
.location-pill, .tag-list span { color: #0D6B5C; background: #EFF7F3; border-radius: 999px; padding: 5px 10px; font-size: 11px; }
.public-post-card h1 { margin: 30px 0 12px; font-size: clamp(24px, 4vw, 34px); line-height: 1.25; }
.post-content { margin: 0; color: #5C5C6E; font-size: 15px; line-height: 1.9; white-space: pre-wrap; }
.rating { display: flex; gap: 3px; margin-top: 18px; color: #D8D2C6; }
.rating .filled { color: #D4A84B; }
.tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.post-gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 28px; }
.post-gallery img { display: block; width: 100%; aspect-ratio: 1 / .82; object-fit: cover; border-radius: 12px; background: #F8F6F0; }
.post-actions { display: flex; gap: 10px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #EDEAE3; }
.post-actions button { border: 1px solid #D9E5DF; border-radius: 10px; padding: 10px 15px; background: #F5FAF7; color: #0D6B5C; cursor: pointer; font-size: 13px; }
.post-actions button:hover { border-color: #0D6B5C; }
@media (max-width: 560px) { .public-share-header { padding: 0 18px; } .public-share-main { margin-top: 22px; } .post-topline { align-items: flex-start; flex-direction: column; } .post-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } }
</style>
