<template>
  <div class="page-container">
    <div v-if="publishNotice" class="publish-toast" role="status">{{ publishNotice }}</div>
    <PageHero v-bind="pageHeroConfig.share" @action="showPublishModal = true" />

    <!-- 搜索栏 + 发布按钮 -->
    <div id="share-content" class="search-bar">
      <div class="search-input">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input v-model="searchQuery" type="text" placeholder="搜索目的地、关键词..." />
      </div>
      <div class="share-filters" aria-label="游记排序">
        <button
          v-for="mode in sortModes"
          :key="mode.key"
          :class="['share-filter-btn', { active: sortMode === mode.key }]"
          @click="sortMode = mode.key">
          {{ mode.label }}
        </button>
      </div>
      <button class="publish-btn" @click="showPublishModal = true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        发布旅行评价
      </button>
    </div>

    <!-- 精选游记轮播 -->
    <div class="section-header">
      <span class="section-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#C23B22" stroke="none"><path d="M12 2c.5 2.5 2 4.5 2 7a4 4 0 1 1-8 0c0-2.5 1.5-4.5 3-6 .5 2 2 3 3 3s2.5-1 3-4z"/></svg>
      </span>
      <h2 class="section-title">精选游记</h2>
    </div>

    <div class="carousel-wrapper">
      <button class="carousel-arrow carousel-arrow-left" @click="carouselPrev" :disabled="carouselIndex === 0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <div class="carousel-container" ref="carouselEl">
        <div class="carousel-track" :style="{ transform: `translateX(-${carouselIndex * 100}%)`, transition: isTransitioning ? 'transform 0.5s ease' : 'none' }">
          <div v-for="post in sortedFeatured" :key="post.id" class="carousel-slide">
            <!-- 卡片头部 -->
            <div class="card-head">
              <div class="card-user">
                <div class="card-avatar" :style="{ background: post.author_avatar }">
                  {{ post.author[0] }}
                </div>
                <div class="card-user-info">
                  <span class="card-username">{{ post.author }}</span>
                  <span class="card-date">{{ formatDate(post.created_at) }}</span>
                </div>
              </div>
              <span class="card-location" v-if="post.location">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ post.location }}
              </span>
            </div>

            <!-- 标题 -->
            <h3 class="card-title">{{ post.title }}</h3>

            <!-- 正文 -->
            <p class="card-body">{{ post.content }}</p>

            <!-- 评分 -->
            <div class="card-rating">
              <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= post.rating }">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
            </div>

            <!-- 标签 -->
            <div class="card-tags">
              <span v-for="t in post.tags" :key="t" class="mini-tag">{{ t }}</span>
            </div>

            <!-- 媒体展示 -->
            <div class="card-media-gallery" v-if="hasMedia(post)">
              <img
                v-for="(image, imageIndex) in postImages(post)"
                :key="`${post.id}-featured-${imageIndex}`"
                class="media-image"
                @error="hideBrokenImage"
                :src="image"
                :alt="`${post.title}第${imageIndex + 1}张图片`" />
            </div>

            <div class="card-divider"></div>

            <!-- 互动 -->
            <div class="card-interactions">
              <button :class="['interaction-btn', { liked: post.user_liked }]" @click="toggleLike(post)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" :stroke="post.user_liked ? '#C23B22' : '#8B8B9E'" :fill="post.user_liked ? '#C23B22' : 'none'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>{{ post.likes_count }}</span>
              </button>
              <button class="interaction-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>{{ post.comments_count }}</span>
              </button>
              <button class="interaction-btn" @click="openShareDialog(post)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
                <span>分享</span>
              </button>
            </div>

            <!-- 评论区 -->
            <div class="card-comments">
              <div v-for="c in post.comments" :key="c.id" class="comment-item">
                <div class="comment-mini-avatar" :style="{ background: c.author_avatar }">{{ c.author[0] }}</div>
                <div class="comment-bubble">
                  <span class="comment-author">{{ c.author }}</span>
                  <span class="comment-text">{{ c.content }}</span>
                </div>
              </div>
              <div class="comment-input-row">
                <div class="comment-input-avatar" style="background: linear-gradient(135deg, #0D6B5C, #1A8A7A);">我</div>
                <input v-model="post.commentInput" :placeholder="'写下你的评论…'" class="comment-input-field" @keydown.enter="addComment(post)" />
                <button class="comment-send-btn" @click="addComment(post)" :disabled="!post.commentInput?.trim()">发送</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="carousel-arrow carousel-arrow-right" @click="carouselNext" :disabled="carouselIndex >= sortedFeatured.length - 1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <!-- 轮播指示器 -->
    <div class="carousel-dots">
      <span v-for="(_, i) in sortedFeatured" :key="i"
        :class="['dot', { active: i === carouselIndex }]"
        @click="carouselIndex = i"></span>
    </div>

    <!-- 全部评论 -->
    <div class="all-reviews-header">
      <span class="header-line left"></span>
      <span class="header-text">全部评论</span>
      <span class="review-count">{{ filteredAndShuffled.length }} 篇</span>
      <span class="header-line right"></span>
    </div>

    <!-- 全部评论卡片网格 -->
    <div class="reviews-scroll-wrapper">
      <div ref="reviewsScrollEl" class="reviews-scroll">
        <div v-if="filteredAndShuffled.length === 0" class="empty-share-state">
          <span class="empty-share-icon">⌕</span>
          <strong>暂时没有找到相关游记</strong>
          <span>换个目的地或关键词试试吧</span>
        </div>
        <div v-for="post in paginatedPosts" :key="post.id" class="review-card-full">
          <!-- 卡片头部 -->
          <div class="review-full-header">
            <div class="review-full-user">
              <div class="review-full-avatar" :style="{ background: post.author_avatar }">
                {{ post.author[0] }}
              </div>
              <div class="review-full-user-meta">
                <span class="review-full-username">{{ post.author }}</span>
                <span class="review-full-date">{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
            <span class="review-full-location" v-if="post.location">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ post.location }}
            </span>
          </div>

          <!-- 标题 -->
          <h4 class="review-full-title">{{ post.title }}</h4>

          <!-- 正文 -->
          <p class="review-full-text">{{ post.content }}</p>

          <!-- 评分 -->
          <div class="review-full-rating">
            <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= post.rating }">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4A84B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
          </div>

          <!-- 标签 -->
          <div class="review-full-tags">
            <span v-for="t in post.tags" :key="t" class="review-full-tag">{{ t }}</span>
          </div>

          <!-- 媒体展示 -->
          <div class="review-full-media-gallery" v-if="hasMedia(post)">
            <img
              v-for="(image, imageIndex) in postImages(post)"
              :key="`${post.id}-review-${imageIndex}`"
                class="media-image"
                @error="hideBrokenImage"
              :src="image"
              :alt="`${post.title}第${imageIndex + 1}张图片`" />
          </div>

          <div class="review-full-divider"></div>

          <!-- 互动 -->
          <div class="review-full-interactions">
            <button :class="['interaction-btn-lg', { liked: post.user_liked }]" @click="toggleLike(post)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" :stroke="post.user_liked ? '#C23B22' : '#8B8B9E'" :fill="post.user_liked ? '#C23B22' : 'none'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {{ post.likes_count }}
            </button>
            <button class="interaction-btn-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8B9E" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ post.comments_count }}
            </button>
            <button class="interaction-btn-lg" @click="openShareDialog(post)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
              分享
            </button>
          </div>

          <!-- 评论区 -->
          <div class="review-full-comments">
            <div v-for="c in post.comments" :key="c.id" class="full-comment-item">
              <div class="full-comment-avatar" :style="{ background: c.author_avatar }">{{ c.author[0] }}</div>
              <div class="full-comment-bubble">
                <span class="full-comment-author">{{ c.author }}</span>
                <span class="full-comment-text">{{ c.content }}</span>
              </div>
            </div>
            <div class="full-comment-input-row">
              <input v-model="post.commentInput" placeholder="写下你的评论…" class="full-comment-input" @keydown.enter="addComment(post)" />
              <button class="full-comment-send" @click="addComment(post)" :disabled="!post.commentInput?.trim()">发送</button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 发布弹窗 -->
    <div class="modal-overlay" v-if="shareTarget" @click.self="closeShareDialog">
      <div class="share-modal-card" role="dialog" aria-modal="true" aria-labelledby="share-dialog-title">
        <div class="modal-header">
          <h3 id="share-dialog-title">分享这篇游记</h3>
          <button class="modal-close" @click="closeShareDialog">×</button>
        </div>
        <div class="share-dialog-content">
          <p class="share-dialog-title">{{ shareTarget.post.title || '旅行游记' }}</p>
          <p class="share-dialog-hint">扫码打开游记详情，或复制链接发送给朋友</p>
          <div v-if="shareQrCode" class="share-qr-wrap">
            <img :src="shareQrCode" alt="游记分享二维码" class="share-qr" />
          </div>
          <div v-else class="share-qr-loading">正在生成二维码…</div>
          <div class="share-url-row">
            <input :value="shareTarget.url" readonly aria-label="分享链接" @focus="$event.target.select()" />
          </div>
          <div class="share-actions">
            <button class="share-action-primary" @click="copyShareLink">{{ shareCopied ? '已复制链接' : '复制链接' }}</button>
            <button class="share-action-secondary" @click="nativeShare">系统分享</button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showPublishModal" @click.self="showPublishModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>发布旅行评价</h3>
          <button class="modal-close" @click="showPublishModal = false">×</button>
        </div>
        <div class="modal-body">
          <!-- 媒体类型选择 -->
          <div class="media-type-selector">
            <button
              v-for="mt in mediaTypes" :key="mt.key"
              :class="['media-type-btn', { active: newMediaType === mt.key }]"
              @click="newMediaType = mt.key">
              <span class="media-type-icon" v-html="mt.icon"></span>
              <span>{{ mt.label }}</span>
            </button>
          </div>

          <!-- 文本/标题 -->
          <input v-model="newPost.title" class="modal-input" placeholder="游记标题" />
          <textarea v-model="newPost.text" class="modal-textarea" placeholder="分享你的旅行故事…" rows="3"></textarea>

          <!-- 图片上传 -->
          <div class="media-upload-area" v-if="newMediaType === 'image'">
            <div v-if="newMediaPreviews.length" class="media-preview-grid">
              <div v-for="(preview, index) in newMediaPreviews" :key="preview" class="media-preview-img">
                <img :src="preview" :alt="`第${index + 1}张图片预览`" />
                <span class="media-preview-index">{{ index + 1 }}</span>
                <button class="media-preview-remove" @click="removeMedia(index)">×</button>
              </div>
            </div>
            <button class="media-upload-btn" @click="triggerMediaUpload" :disabled="isUploading || newMediaFiles.length >= maxMediaCount">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8B8C8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span>{{ isUploading ? '上传中…' : `点击上传图片（${newMediaFiles.length}/${maxMediaCount}）` }}</span>
            </button>
            <input ref="mediaInput" type="file" accept="image/*" multiple hidden @change="handleMediaSelect" />
  <span class="media-upload-hint">最多上传 {{ maxMediaCount }} 张图片，单张不超过 10MB，可分批选择</span>
          </div>

          <input v-model="newPost.location" class="modal-input" placeholder="地点（可选）" />
          <div class="modal-tags-input">
            <input v-model="newTag" class="tag-add-input" placeholder="添加标签" @keydown.enter="addNewTag" />
            <span v-for="(t, i) in newPost.tags" :key="i" class="new-tag-chip">
              {{ t }}
              <button class="tag-remove" @click="newPost.tags.splice(i, 1)">×</button>
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel" @click="showPublishModal = false">取消</button>
          <button class="modal-submit" @click="submitNewPost" :disabled="isUploading || !newPost.title.trim() || !newPost.text.trim()">
            {{ isUploading ? '发布中…' : '发布' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="reviewTotalPages > 1" class="reviews-pagination" aria-label="评论分页">
      <button class="pagination-btn" :disabled="reviewPage === 1" @click="reviewPage--">上一页</button>
      <button
        v-for="page in reviewTotalPages"
        :key="page"
        :class="['pagination-number', { active: reviewPage === page }]"
        @click="reviewPage = page">
        {{ page }}
      </button>
      <button class="pagination-btn" :disabled="reviewPage === reviewTotalPages" @click="reviewPage++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useShareStore } from '../stores/shareStore'
import QRCode from 'qrcode'
import PageHero from '../components/PageHero.vue'
import { pageHeroConfig } from '../config/pageHeroConfig.js'

const searchQuery = ref('')
const showPublishModal = ref(false)
const shareTarget = ref(null)
const shareQrCode = ref('')
const shareCopied = ref(false)
const publishNotice = ref('')
let publishNoticeTimer = null
const newTag = ref('')
const newMediaType = ref('text') // 'text' | 'image'
const newMediaPreviews = ref([])
const newMediaFiles = ref([])
const maxMediaCount = 9
const maxMediaSize = 10 * 1024 * 1024
const isUploading = ref(false)
const sortMode = ref('latest')
const reviewPage = ref(1)
const reviewPageSize = 6
const carouselIndex = ref(0)
const isTransitioning = ref(true)
const carouselEl = ref(null)
const reviewsScrollEl = ref(null)
const reviewsScrollPos = ref(0)
const reviewsScrollMax = ref(0)
const auth = useAuthStore()
const shareStore = useShareStore()

const mediaTypes = [
  { key: 'text', label: '文字', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>' },
  { key: 'image', label: '图片', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' }
]

const sortModes = [
  { key: 'latest', label: '最新发布' },
  { key: 'popular', label: '最受欢迎' },
  { key: 'rating', label: '高评分' }
]

const mediaInput = ref(null)

// 从后端加载游记
shareStore.loadPosts()

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const allPosts = computed(() => shareStore.posts)

const newPost = reactive({ title: '', text: '', location: '', tags: [] })

function addNewTag() {
  if (newTag.value.trim() && !newPost.tags.includes(newTag.value.trim())) {
    newPost.tags.push(newTag.value.trim())
  }
  newTag.value = ''
}

async function submitNewPost() {
  if (!newPost.title.trim() || !newPost.text.trim()) return
  if (!auth.currentUser) {
    alert('请先登录后再发布')
    return
  }

  isUploading.value = true
  const imageUrls = []
  if (newMediaType.value === 'image' && newMediaFiles.value.length) {
    for (const file of newMediaFiles.value) {
      const result = await shareStore.uploadImage(file)
      if (!result.ok) {
        alert(result.msg || '图片上传失败')
        isUploading.value = false
        return
      }
      imageUrls.push(result.url)
    }
  }

  const result = await shareStore.createPost({
    title: newPost.title,
    content: newPost.text,
    location: newPost.location,
    rating: 5,
    tags: newPost.tags,
    images: imageUrls
  })

  isUploading.value = false
  if (!result.ok) {
    alert(result.msg || '发布失败')
    return
  }

  newPost.title = ''
  newPost.text = ''
  newPost.location = ''
  newPost.tags = []
  newMediaType.value = 'text'
  newMediaPreviews.value = []
  newMediaFiles.value = []
  showPublishModal.value = false
  publishNotice.value = `发布成功${imageUrls.length ? `，已上传 ${imageUrls.length} 张图片` : ''}`
  clearTimeout(publishNoticeTimer)
  publishNoticeTimer = setTimeout(() => {
    publishNotice.value = ''
  }, 3200)
}

function triggerMediaUpload() { mediaInput.value.click() }
function handleMediaSelect(e) {
  const selectedFiles = Array.from(e.target.files || [])
  const invalidTypeCount = selectedFiles.filter(file => !file.type.startsWith('image/')).length
  const oversizedFiles = selectedFiles.filter(file => file.size > maxMediaSize)
  const files = selectedFiles.filter(file => file.type.startsWith('image/') && file.size <= maxMediaSize)

  if (invalidTypeCount) {
    alert('仅支持上传图片文件，非图片文件已忽略')
  }
  if (oversizedFiles.length) {
    const names = oversizedFiles.slice(0, 2).map(file => file.name).join('、')
    const suffix = oversizedFiles.length > 2 ? '等' : ''
    alert(`${names}${suffix}超过 10MB，已忽略。单张图片不能超过 10MB`)
  }

  const remaining = maxMediaCount - newMediaFiles.value.length
  if (remaining <= 0) {
    e.target.value = ''
    return
  }
  if (files.length > remaining) {
    alert(`最多上传${maxMediaCount}张图片，本次只添加前${remaining}张`)
  }
  files.slice(0, remaining).forEach(file => {
    newMediaFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (ev) => { newMediaPreviews.value.push(ev.target.result) }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

function removeMedia(index) {
  newMediaFiles.value.splice(index, 1)
  newMediaPreviews.value.splice(index, 1)
}

async function toggleLike(post) {
  if (!auth.currentUser) {
    alert('请先登录')
    return
  }
  const result = await shareStore.toggleLike(post.id)
  if (!result.ok) {
    alert(result.msg || '操作失败')
  }
}

async function addComment(post) {
  if (!post.commentInput?.trim()) return
  if (!auth.currentUser) {
    alert('请先登录')
    return
  }
  const result = await shareStore.addComment(post.id, post.commentInput)
  if (!result.ok) {
    alert(result.msg || '评论失败')
    return
  }
  post.commentInput = ''
}

function formatDate(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function postImages(post) {
  return Array.isArray(post.images) ? post.images.filter(Boolean) : []
}

async function openShareDialog(post) {
  const url = `${window.location.origin}/share/post/${post.id}`
  shareTarget.value = { post, url }
  shareQrCode.value = ''
  shareCopied.value = false
  try {
    shareQrCode.value = await QRCode.toDataURL(url, { width: 192, margin: 1, errorCorrectionLevel: 'M' })
  } catch (err) {
    console.error('生成分享二维码失败', err)
  }
}

function closeShareDialog() {
  shareTarget.value = null
  shareQrCode.value = ''
}

async function copyShareLink() {
  if (!shareTarget.value) return
  const url = shareTarget.value.url
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const input = document.createElement('textarea')
    input.value = url
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.focus()
    input.select()
    document.execCommand('copy')
    input.remove()
  }
  shareCopied.value = true
  setTimeout(() => { shareCopied.value = false }, 2200)
}

async function nativeShare() {
  if (!shareTarget.value || !navigator.share) {
    await copyShareLink()
    return
  }
  try {
    await navigator.share({
      title: shareTarget.value.post.title || '旅行游记',
      text: (shareTarget.value.post.content || '').slice(0, 100),
      url: shareTarget.value.url
    })
  } catch (err) {
    if (err?.name !== 'AbortError') console.warn('系统分享不可用', err)
  }
}

function hideBrokenImage(event) {
  event.currentTarget.style.display = 'none'
}

function hasMedia(post) {
  return postImages(post).length > 0
}

const sortedFeatured = computed(() => {
  return [...shareStore.posts]
    .sort((a, b) => engagementScore(b) - engagementScore(a))
    .slice(0, 10)
})

function engagementScore(post) {
  return (Number(post.likes_count) || 0) + (Number(post.comments_count) || 0)
}

const filteredAndShuffled = computed(() => {
  let list = [...shareStore.posts]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.author || '').toLowerCase().includes(q)
    )
  }
  if (sortMode.value === 'popular') {
    return list.sort((a, b) => (b.likes_count + b.comments_count * 2) - (a.likes_count + a.comments_count * 2))
  }
  if (sortMode.value === 'rating') {
    return list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.likes_count - a.likes_count)
  }
  return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
})

const reviewTotalPages = computed(() => Math.max(1, Math.ceil(filteredAndShuffled.value.length / reviewPageSize)))
const paginatedPosts = computed(() => {
  const start = (reviewPage.value - 1) * reviewPageSize
  return filteredAndShuffled.value.slice(start, start + reviewPageSize)
})

watch([searchQuery, sortMode], () => {
  reviewPage.value = 1
})

function carouselNext() {
  if (carouselIndex.value < sortedFeatured.value.length - 1) {
    isTransitioning.value = true
    setTimeout(() => { carouselIndex.value++ }, 50)
  }
}
function carouselPrev() {
  if (carouselIndex.value > 0) {
    isTransitioning.value = true
    setTimeout(() => { carouselIndex.value-- }, 50)
  }
}

// 评论滚动
const reviewsScrollLeft = computed(() => reviewsScrollPos.value <= 0)
const reviewsScrollRight = computed(() => reviewsScrollPos.value >= reviewsScrollMax.value)

function reviewsScrollNext() {
  if (!reviewsScrollEl.value) return
  const scrollAmount = 340
  reviewsScrollPos.value = Math.min(reviewsScrollPos.value + scrollAmount, reviewsScrollMax.value)
  reviewsScrollEl.value.scrollLeft = reviewsScrollPos.value
}
function reviewsScrollPrev() {
  if (!reviewsScrollEl.value) return
  const scrollAmount = 340
  reviewsScrollPos.value = Math.max(reviewsScrollPos.value - scrollAmount, 0)
  reviewsScrollEl.value.scrollLeft = reviewsScrollPos.value
}

// 监听滚动更新状态
function onReviewsScroll() {
  if (!reviewsScrollEl.value) return
  reviewsScrollPos.value = reviewsScrollEl.value.scrollLeft
  reviewsScrollMax.value = reviewsScrollEl.value.scrollWidth - reviewsScrollEl.value.clientWidth
}

// 自动轮播
let autoPlayTimer = null
function startAutoPlay() {
  autoPlayTimer = setInterval(() => {
    if (carouselIndex.value >= sortedFeatured.value.length - 1) {
      carouselIndex.value = 0
    } else {
      carouselIndex.value++
    }
  }, 5000)
}
function stopAutoPlay() {
  clearInterval(autoPlayTimer)
}

startAutoPlay()

onMounted(() => {
  window.addEventListener('resize', onReviewsScroll)
  if (reviewsScrollEl.value) {
    reviewsScrollEl.value.addEventListener('scroll', onReviewsScroll, { passive: true })
    nextTick(() => {
      reviewsScrollMax.value = reviewsScrollEl.value.scrollWidth - reviewsScrollEl.value.clientWidth
    })
  }
})
onUnmounted(() => {
  stopAutoPlay()
  window.removeEventListener('resize', onReviewsScroll)
})
</script>

<style scoped>
.page-container { max-width: 1080px; margin: 0 auto; padding: 36px 24px 64px; }

/* ===== 页面引导 ===== */
.share-hero {
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
  margin-bottom: 24px; padding: 26px 30px; border-radius: 20px;
  background: linear-gradient(120deg, #F1F5EE 0%, #FAF7EF 58%, #F5EEE2 100%);
  border: 1px solid rgba(13,107,92,0.08); overflow: hidden; position: relative;
}
.share-hero::after {
  content: ''; position: absolute; width: 180px; height: 180px; right: 64px; top: -96px;
  border: 1px solid rgba(13,107,92,0.12); border-radius: 50%;
  box-shadow: 0 0 0 18px rgba(13,107,92,0.035), 0 0 0 36px rgba(13,107,92,0.025);
}
.share-eyebrow { margin: 0 0 6px; color: #0D6B5C; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
.share-heading { margin: 0; color: #1A1A2E; font-size: 28px; line-height: 1.25; font-weight: 800; }
.share-subtitle { margin: 8px 0 0; color: #6C756E; font-size: 13px; }
.share-hero-mark { position: relative; z-index: 1; color: #D4A84B; font-size: 54px; line-height: 1; transform: rotate(12deg); }

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex; gap: 10px; margin-bottom: 32px; align-items: stretch; flex-wrap: wrap;
}
.search-input {
  flex: 1; display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #E5E0D6; border-radius: 12px;
  padding: 0 16px; transition: all 0.2s;
}
.search-input:focus-within { border-color: #0D6B5C; box-shadow: 0 0 0 3px rgba(13,107,92,0.08); }
.search-input input {
  flex: 1; border: none; outline: none; font-size: 14px;
  font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: transparent;
}
.search-input input::placeholder { color: #B8B8C8; }

.share-filters { display: flex; align-items: center; gap: 6px; }
.share-filter-btn {
  padding: 0 12px; min-height: 42px; border: 1px solid #E5E0D6; border-radius: 10px;
  background: #fff; color: #8B8B9E; cursor: pointer; white-space: nowrap;
  font: 12px 'Noto Sans SC', sans-serif; transition: all 0.2s;
}
.share-filter-btn:hover { color: #0D6B5C; border-color: #9BC6BC; }
.share-filter-btn.active { color: #0D6B5C; border-color: #0D6B5C; background: rgba(13,107,92,0.06); font-weight: 600; }

.publish-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px;
  background: #1A3A2E; color: #fff; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.25s;
  font-family: 'Noto Sans SC', sans-serif; white-space: nowrap; flex-shrink: 0;
}
.publish-btn:hover { background: #0D6B5C; box-shadow: 0 4px 16px rgba(13,107,92,0.3); }

/* ===== 精选游记标题 ===== */
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.section-icon { display: flex; }
.section-title { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; font-family: 'Noto Sans SC', sans-serif; }

/* ===== 轮播 ===== */
.carousel-wrapper {
  position: relative; display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-bottom: 24px;
}
.carousel-container {
  flex: 0 0 80%; width: 80%; height: auto; min-height: 280px; max-height: none; overflow: hidden;
  border-radius: 20px;
  background: #fff; border: 1px solid #E5E0D6;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
.carousel-track { display: flex; align-items: flex-start; transition: transform 0.5s ease; }
.carousel-slide {
  min-width: 100%; box-sizing: border-box; height: auto; padding: 28px;
  background: linear-gradient(to bottom, #FAFAF8, #fff);
}

.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-user { display: flex; align-items: center; gap: 10px; }
.card-avatar {
  width: 36px; height: 36px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 14px; font-weight: 600; flex-shrink: 0;
}
.card-user-info { display: flex; flex-direction: column; gap: 2px; }
.card-username { font-size: 13px; font-weight: 600; color: #1A1A2E; }
.card-date { font-size: 11px; color: #B8B8C8; }
.card-location {
  display: flex; align-items: center; gap: 3px; font-size: 11px;
  color: #0D6B5C; background: rgba(13,107,92,0.06); padding: 3px 8px;
  border-radius: 6px;
}

.card-title { font-size: 16px; font-weight: 700; color: #1A1A2E; margin: 0 0 8px; font-family: 'Noto Sans SC', sans-serif; }
.card-body { font-size: 13px; color: #5C5C6E; line-height: 1.7; margin: 0 0 12px; }

.card-rating { display: flex; gap: 2px; margin-bottom: 10px; }
.star { display: flex; }
.star.filled svg { fill: #D4A84B; }

.card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.mini-tag {
  font-size: 11px; color: #5C5C6E; background: #F0EDE6;
  padding: 2px 8px; border-radius: 6px;
}

/* 媒体展示 */
.card-media { margin-bottom: 14px; border-radius: 12px; overflow: hidden; }
.media-image, .media-gif {
  width: 100%; aspect-ratio: 16/9; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; object-fit: cover;
}
.card-media-gallery,
.review-full-media-gallery {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px;
  margin-bottom: 14px; border-radius: 12px; overflow: hidden;
}
.card-media-gallery {
  width: 80%; margin-left: auto; margin-right: auto;
}
.card-media-gallery .media-image,
.review-full-media-gallery .media-image {
  width: 100%; aspect-ratio: 1; border-radius: 0;
}
.card-media-gallery .media-image {
  aspect-ratio: 2 / 1;
}
.card-media-gallery .media-image:only-child,
.review-full-media-gallery .media-image:only-child {
  grid-column: 1 / -1; aspect-ratio: 16 / 9; border-radius: 12px;
}
.media-gif { position: relative; }
.gif-badge {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 6px; letter-spacing: 0.5px;
}
.media-audio {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; background: rgba(13,107,92,0.04);
  border: 1px solid rgba(13,107,92,0.12); border-radius: 12px;
}
.audio-waveform-inline { display: flex; align-items: center; gap: 2px; flex: 1; }
.wave-bar {
  width: 3px; border-radius: 2px; background: #0D6B5C;
  animation: wavePulse 1.2s ease-in-out infinite;
}
@keyframes wavePulse {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.4); }
}
.audio-label { font-size: 11px; color: #0D6B5C; white-space: nowrap; flex-shrink: 0; }

.card-divider { height: 1px; background: #F0EDE6; margin-bottom: 14px; }

.card-interactions { display: flex; gap: 16px; }
.interaction-btn {
  display: flex; align-items: center; gap: 4px; border: none; background: none;
  cursor: pointer; font-size: 12px; color: #8B8B9E; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif; padding: 0;
}
.interaction-btn:hover { color: #0D6B5C; }
.interaction-btn.liked { color: #C23B22; }

/* 评论区 */
.card-comments { margin-top: 16px; padding-top: 14px; border-top: 1px solid #F0EDE6; }
.comment-item { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-start; }
.comment-mini-avatar {
  width: 22px; height: 22px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 10px; flex-shrink: 0;
}
.comment-bubble {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
  background: #F8F6F0; padding: 8px 12px; border-radius: 10px;
}
.comment-author { font-size: 11px; font-weight: 600; color: #1A1A2E; }
.comment-text { font-size: 12px; color: #5C5C6E; line-height: 1.5; }

.comment-input-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
.comment-input-avatar {
  width: 24px; height: 24px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 10px; flex-shrink: 0;
}
.comment-input-field {
  flex: 1; border: 1px solid #E5E0D6; border-radius: 8px;
  padding: 6px 12px; font-size: 12px; font-family: 'Noto Sans SC', sans-serif;
  outline: none; transition: border-color 0.2s; background: #fff;
}
.comment-input-field:focus { border-color: #0D6B5C; }
.comment-send-btn {
  padding: 6px 14px; border: none; border-radius: 8px;
  background: #1A3A2E; color: #fff; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif;
}
.comment-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.comment-send-btn:not(:disabled):hover { background: #0D6B5C; }

/* 轮播箭头 */
.carousel-arrow {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #E5E0D6;
  background: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0; color: #5C5C6E;
}
.carousel-arrow:hover:not(:disabled) { border-color: #0D6B5C; color: #0D6B5C; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.carousel-arrow:disabled { opacity: 0.3; cursor: not-allowed; }

/* 轮播指示器 */
.carousel-dots { display: flex; justify-content: center; gap: 8px; margin-bottom: 32px; }
.dot {
  width: 8px; height: 8px; border-radius: 50%; background: #D4C8B8;
  cursor: pointer; transition: all 0.3s;
}
.dot.active { background: #0D6B5C; width: 24px; border-radius: 4px; }

/* ===== 全部评论 ===== */
.all-reviews-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.header-line { flex: 1; height: 1px; background: #E5E0D6; }
.header-text { font-size: 14px; font-weight: 600; color: #8B8B9E; white-space: nowrap; }
.review-count { font-size: 11px; color: #B8B8C8; white-space: nowrap; }

/* 评论卡片网格 */
.reviews-scroll-wrapper {
  width: 100%;
}
.reviews-scroll {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;
  padding: 4px 2px 16px;
}
.empty-share-state {
  grid-column: 1 / -1; min-height: 180px; display: flex; align-items: center;
  justify-content: center; flex-direction: column; gap: 7px; color: #8B8B9E;
  border: 1px dashed #D8D3C8; border-radius: 16px; background: #FAFAF8; font-size: 12px;
}
.empty-share-state strong { color: #5C5C6E; font-size: 14px; }
.empty-share-icon { color: #D4A84B; font-size: 28px; line-height: 1; }
.reviews-pagination {
  display: flex; align-items: center; justify-content: center; gap: 6px; margin: 8px 0 24px;
}
.pagination-btn, .pagination-number {
  min-width: 32px; height: 32px; padding: 0 9px; border: 1px solid #E5E0D6;
  border-radius: 8px; background: #fff; color: #8B8B9E; cursor: pointer;
  font: 12px 'Noto Sans SC', sans-serif; transition: all 0.2s;
}
.pagination-btn:hover:not(:disabled), .pagination-number:hover { color: #0D6B5C; border-color: #9BC6BC; }
.pagination-number.active { color: #fff; border-color: #0D6B5C; background: #0D6B5C; font-weight: 600; }
.pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.reviews-scroll-arrow {
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #E5E0D6;
  background: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0; color: #5C5C6E;
}
.reviews-scroll-arrow:hover:not(:disabled) { border-color: #0D6B5C; color: #0D6B5C; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.reviews-scroll-arrow:disabled { opacity: 0.3; cursor: not-allowed; }

/* 完整评论卡片 */
.review-card-full {
  min-width: 0; max-width: none;
  background: #FAFAF8; border: 1px solid #EDEAE3; border-radius: 20px;
  padding: 20px; flex-shrink: 0;
  transition: all 0.3s;
}
.review-card-full:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-color: #E5E0D6;
}

.review-full-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.review-full-user { display: flex; align-items: center; gap: 8px; }
.review-full-avatar {
  width: 28px; height: 28px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.review-full-user-meta { display: flex; flex-direction: column; gap: 1px; }
.review-full-username { font-size: 12px; font-weight: 600; color: #1A1A2E; }
.review-full-date { font-size: 10px; color: #B8B8C8; }
.review-full-location {
  display: flex; align-items: center; gap: 3px; font-size: 10px;
  color: #0D6B5C; background: rgba(13,107,92,0.06); padding: 3px 8px;
  border-radius: 6px;
}

.review-full-title { font-size: 13px; font-weight: 700; color: #1A1A2E; margin: 0 0 6px; font-family: 'Noto Sans SC', sans-serif; }
.review-full-text { font-size: 12px; color: #5C5C6E; line-height: 1.7; margin: 0 0 8px; }
.review-full-rating { display: flex; gap: 2px; margin-bottom: 8px; }

.review-full-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
.review-full-tag {
  font-size: 10px; color: #5C5C6E; background: #EDEAE3;
  padding: 2px 8px; border-radius: 6px;
}

/* 评论卡片媒体 */
.review-full-media { margin-bottom: 10px; }
.review-full-media-gallery { margin-bottom: 10px; border-radius: 10px; }
.review-full-media .media-image,
.review-full-media .media-gif {
  width: 100%; aspect-ratio: 16/9; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.review-full-media .media-gif { position: relative; }
.review-full-media .media-audio {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; background: rgba(13,107,92,0.04);
  border: 1px solid rgba(13,107,92,0.1); border-radius: 10px;
}
.review-full-media .audio-waveform-inline { display: flex; align-items: center; gap: 2px; flex: 1; }
.review-full-media .wave-bar {
  width: 2px; border-radius: 1px; background: #0D6B5C;
  animation: wavePulse 1.2s ease-in-out infinite;
}
.review-full-media .audio-label { font-size: 10px; color: #0D6B5C; white-space: nowrap; }

.review-full-divider { height: 1px; background: #EDEAE3; margin-bottom: 10px; }

.interaction-btn-lg {
  display: flex; align-items: center; gap: 4px; border: none; background: none;
  cursor: pointer; font-size: 12px; color: #8B8B9E; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif; padding: 0;
}
.interaction-btn-lg:hover { color: #0D6B5C; }
.interaction-btn-lg.liked { color: #C23B22; }

/* 评论区 */
.review-full-comments { margin-top: 12px; padding-top: 10px; border-top: 1px solid #EDEAE3; }
.full-comment-item { display: flex; gap: 6px; margin-bottom: 8px; align-items: flex-start; }
.full-comment-avatar {
  width: 20px; height: 20px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; color: #fff;
  font-size: 9px; flex-shrink: 0;
}
.full-comment-bubble {
  flex: 1; display: flex; flex-direction: column; gap: 1px;
  background: #F5F2EB; padding: 6px 10px; border-radius: 10px;
}
.full-comment-author { font-size: 10px; font-weight: 600; color: #1A1A2E; }
.full-comment-text { font-size: 11px; color: #5C5C6E; line-height: 1.5; }

.full-comment-input-row { display: flex; gap: 6px; margin-top: 8px; }
.full-comment-input {
  flex: 1; border: 1px solid #E5E0D6; border-radius: 8px;
  padding: 6px 10px; font-size: 11px; font-family: 'Noto Sans SC', sans-serif;
  outline: none; transition: border-color 0.2s; background: #fff;
}
.full-comment-input:focus { border-color: #0D6B5C; }
.full-comment-send {
  padding: 6px 12px; border: none; border-radius: 8px;
  background: #9BAF9E; color: #fff; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; font-family: 'Noto Sans SC', sans-serif;
  white-space: nowrap; flex-shrink: 0;
}
.full-comment-send:disabled { opacity: 0.4; cursor: not-allowed; }
.full-comment-send:not(:disabled):hover { background: #0D6B5C; }

/* ===== 发布弹窗 ===== */
.publish-toast {
  position: fixed; top: 22px; left: 50%; transform: translateX(-50%);
  z-index: 300; padding: 10px 18px; border-radius: 10px;
  background: #0D6B5C; color: #fff; font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(13,107,92,0.24);
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(4px);
}
.modal-card {
  background: #fff; border-radius: 20px; padding: 28px; width: 90%; max-width: 480px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.15);
}
.share-modal-card {
  width: min(92vw, 390px); background: #fff; border-radius: 22px; padding: 24px;
  box-shadow: 0 18px 56px rgba(26,58,46,0.2);
}
.share-dialog-content { text-align: center; }
.share-dialog-title { margin: 0; color: #1A1A2E; font-size: 16px; font-weight: 700; }
.share-dialog-hint { margin: 8px 0 16px; color: #8B8B9E; font-size: 12px; line-height: 1.6; }
.share-qr-wrap { display: flex; justify-content: center; margin: 4px 0 16px; }
.share-qr { width: 192px; height: 192px; border-radius: 10px; border: 1px solid #EDEAE3; }
.share-qr-loading { height: 192px; display: flex; align-items: center; justify-content: center; color: #8B8B9E; font-size: 12px; }
.share-url-row input {
  box-sizing: border-box; width: 100%; border: 1px solid #E5E0D6; border-radius: 9px;
  padding: 9px 10px; background: #F8F6F0; color: #5C5C6E; font-size: 11px; outline: none;
}
.share-actions { display: flex; gap: 10px; margin-top: 14px; }
.share-actions button {
  flex: 1; border-radius: 10px; padding: 10px 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans SC', sans-serif; transition: all .2s;
}
.share-action-primary { border: none; background: #1A3A2E; color: #fff; }
.share-action-primary:hover { background: #0D6B5C; }
.share-action-secondary { border: 1px solid #D9E5DF; background: #F5FAF7; color: #0D6B5C; }
.share-action-secondary:hover { border-color: #0D6B5C; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { font-size: 18px; font-weight: 700; color: #1A1A2E; margin: 0; }
.modal-close {
  width: 32px; height: 32px; border: none; background: #F8F6F0;
  border-radius: 50%; font-size: 18px; color: #8B8B9E; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.modal-close:hover { background: #E5E0D6; color: #1A1A2E; }

.modal-body { display: flex; flex-direction: column; gap: 12px; }

/* 媒体类型选择 */
.media-type-selector { display: flex; gap: 8px; }
.media-type-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 8px; border: 2px solid #E5E0D6; border-radius: 10px;
  background: #F8F6F0; cursor: pointer; transition: all 0.2s;
  font-size: 12px; color: #5C5C6E; font-family: 'Noto Sans SC', sans-serif;
}
.media-type-btn:hover { border-color: #1A8A7A; }
.media-type-btn.active { border-color: #0D6B5C; background: rgba(13,107,92,0.06); color: #0D6B5C; font-weight: 600; }
.media-type-icon { display: flex; }

/* 图片/GIF 上传 */
.media-upload-area { display: flex; flex-direction: column; gap: 8px; }
.media-preview-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;
}
.media-preview-img {
  position: relative; width: 100%; aspect-ratio: 1; border-radius: 10px;
  overflow: hidden; border: 1px solid #E5E0D6;
}
.media-preview-img img { width: 100%; height: 100%; object-fit: cover; }
.media-preview-index {
  position: absolute; left: 6px; bottom: 6px; min-width: 18px; height: 18px;
  padding: 0 4px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 5px; background: rgba(0,0,0,0.55); color: #fff; font-size: 10px;
}
.media-preview-remove {
  position: absolute; top: 6px; right: 6px; width: 22px; height: 22px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.5);
  color: #fff; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.media-upload-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px; border: 2px dashed #E5E0D6; border-radius: 10px;
  background: #FAFAF8; cursor: pointer; transition: all 0.2s;
  font-size: 12px; color: #8B8B9E; font-family: 'Noto Sans SC', sans-serif;
}
.media-upload-btn:hover { border-color: #1A8A7A; background: rgba(26,138,122,0.02); }
.media-upload-hint { color: #B8B8C8; font-size: 11px; text-align: center; }

/* 语音上传 */
.media-audio-area { display: flex; flex-direction: column; gap: 8px; }
.audio-player-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 16px; background: rgba(13,107,92,0.04); border: 1px solid rgba(13,107,92,0.12);
  border-radius: 10px;
}
.audio-record-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 20px;
  border: none; border-radius: 20px; background: #C23B22; color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  font-family: 'Noto Sans SC', sans-serif;
}
.audio-record-btn:hover { background: #D44530; }
.audio-hint { font-size: 11px; color: #8B8B9E; margin: 0; }

.audio-playing {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; background: rgba(13,107,92,0.04); border: 1px solid rgba(13,107,92,0.12);
  border-radius: 10px;
}
.audio-waveform { display: flex; align-items: center; gap: 2px; flex: 1; }
.audio-waveform .wave-bar {
  width: 3px; border-radius: 2px; background: #0D6B5C;
  animation: wavePulse 1.2s ease-in-out infinite;
}
.audio-duration { font-size: 12px; color: #0D6B5C; font-weight: 600; flex-shrink: 0; }
.audio-rerecord {
  padding: 4px 10px; border: 1px solid #E5E0D6; border-radius: 6px;
  background: #fff; font-size: 11px; color: #8B8B9E; cursor: pointer;
  font-family: 'Noto Sans SC', sans-serif; transition: all 0.2s;
}
.audio-rerecord:hover { border-color: #C23B22; color: #C23B22; }
.modal-input {
  width: 100%; padding: 10px 14px; border: 1px solid #E5E0D6; border-radius: 10px;
  font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E; background: #F8F6F0;
}
.modal-input:focus, .modal-textarea:focus { outline: none; border-color: #0D6B5C; background: #fff; }
.modal-textarea {
  width: 100%; padding: 10px 14px; border: 1px solid #E5E0D6; border-radius: 10px;
  font-size: 13px; font-family: 'Noto Sans SC', sans-serif; color: #1A1A2E;
  background: #F8F6F0; resize: vertical; line-height: 1.6;
}
.modal-tags-input { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.tag-add-input {
  flex: 1; min-width: 100px; padding: 4px 10px; border: 1px solid #E5E0D6;
  border-radius: 8px; font-size: 12px; font-family: 'Noto Sans SC', sans-serif;
  outline: none; background: #F8F6F0;
}
.tag-add-input:focus { border-color: #0D6B5C; background: #fff; }
.new-tag-chip {
  display: flex; align-items: center; gap: 4px; padding: 3px 8px;
  background: rgba(13,107,92,0.08); border-radius: 8px; font-size: 12px; color: #0D6B5C;
}
.tag-remove {
  width: 14px; height: 14px; border: none; background: none;
  color: #8B8B9E; cursor: pointer; font-size: 12px; display: flex;
  align-items: center; justify-content: center; padding: 0;
}
.tag-remove:hover { color: #C23B22; }

.modal-footer { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
.modal-cancel {
  padding: 8px 20px; border: 1px solid #E5E0D6; border-radius: 10px;
  background: #F8F6F0; color: #5C5C6E; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans SC', sans-serif; transition: all 0.2s;
}
.modal-cancel:hover { border-color: #0D6B5C; color: #0D6B5C; }
.modal-submit {
  padding: 8px 24px; border: none; border-radius: 10px;
  background: #1A3A2E; color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans SC', sans-serif; transition: all 0.2s;
}
.modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-submit:not(:disabled):hover { background: #0D6B5C; }

@media (max-width: 820px) {
  .page-container { padding: 24px 16px 48px; }
  .share-hero { padding: 22px; }
  .share-heading { font-size: 24px; }
  .share-hero-mark { font-size: 42px; }
  .search-input { min-height: 42px; flex-basis: 100%; }
  .share-filters { flex: 1; }
  .share-filter-btn { flex: 1; padding: 0 8px; }
  .publish-btn { flex: 1; justify-content: center; }
  .carousel-container { flex: 1; width: 100%; }
  .card-media-gallery { width: 100%; }
  .reviews-scroll { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .share-hero { min-height: 132px; padding: 20px; }
  .share-hero::after { right: -48px; }
  .share-hero-mark { font-size: 34px; }
  .share-subtitle { max-width: 250px; line-height: 1.6; }
  .reviews-scroll { grid-template-columns: 1fr; }
  .review-card-full { border-radius: 16px; padding: 16px; }
}
</style>
