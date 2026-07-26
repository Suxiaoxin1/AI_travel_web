import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore.js'
import apiClient from '../utils/apiClient.js'

export const useShareStore = defineStore('share', () => {
  const posts = ref([])
  const isLoading = ref(false)

  async function loadPosts(search = '') {
    isLoading.value = true
    try {
      const params = search ? { search } : {}
      const { data } = await apiClient.get('/posts', { params })
      posts.value = (data.data || []).map(p => ({ ...p, commentInput: '' }))
      return { ok: true }
    } catch (err) {
      posts.value = []
      return { ok: false, msg: err.message }
    } finally {
      isLoading.value = false
    }
  }

  async function createPost(postData) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const payload = {
        title: postData.title || '',
        content: postData.content || '',
        location: postData.location || '',
        rating: postData.rating || null,
        tags: postData.tags || [],
        images: postData.images || []
      }
      const { data } = await apiClient.post('/posts', payload)
      posts.value.unshift(data.data)
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function deletePost(id) {
    try {
      await apiClient.delete(`/posts/${id}`)
      posts.value = posts.value.filter(p => p.id !== id)
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function toggleLike(id) {
    try {
      const { data } = await apiClient.post(`/posts/${id}/likes`)
      const idx = posts.value.findIndex(p => p.id === id)
      if (idx >= 0) {
        posts.value[idx].likes_count = data.data.likes_count
        posts.value[idx].user_liked = data.data.liked
      }
      return { ok: true, liked: data.data.liked, likes_count: data.data.likes_count }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function addComment(postId, content) {
    try {
      const { data } = await apiClient.post(`/posts/${postId}/comments`, { content })
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        if (!post.comments) post.comments = []
        post.comments.push(data.data)
        post.comments_count = (post.comments_count || 0) + 1
      }
      return { ok: true, record: data.data }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function deleteComment(postId, commentId) {
    try {
      await apiClient.delete(`/posts/${postId}/comments/${commentId}`)
      const post = posts.value.find(p => p.id === postId)
      if (post && post.comments) {
        post.comments = post.comments.filter(c => c.id !== commentId)
        post.comments_count = Math.max((post.comments_count || 0) - 1, 0)
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  async function uploadImage(file) {
    const auth = useAuthStore()
    if (!auth.currentUser) return { ok: false, msg: '请先登录' }
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { ok: true, url: data.data.url }
    } catch (err) {
      return { ok: false, msg: err.message }
    }
  }

  return {
    posts,
    isLoading,
    loadPosts,
    createPost,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    uploadImage
  }
})
