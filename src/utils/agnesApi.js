import apiClient from './apiClient.js'

const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay))

function chatOptions(options = {}) {
  return {
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    timeout_ms: options.timeoutMs ?? 60000
  }
}

async function chat(messages, options = {}) {
  const { data } = await apiClient.post('/ai/chat', {
    mode: 'text',
    messages,
    options: chatOptions(options)
  }, { timeout: (options.timeoutMs ?? 60000) + 5000 })
  return data.data
}

async function chatWithVision(messages, options = {}) {
  const { data } = await apiClient.post('/ai/chat', {
    mode: 'vision',
    messages,
    options: chatOptions(options)
  }, { timeout: (options.timeoutMs ?? 60000) + 5000 })
  return data.data
}

async function generateImage(prompt, options = {}) {
  const { data } = await apiClient.post('/ai/images', {
    prompt,
    size: options.size ?? '1024x1024'
  }, { timeout: 125000 })
  return data.data
}

async function generateVideo(prompt, options = {}) {
  const pollInterval = options.pollInterval ?? 3000
  const maxWait = options.maxWait ?? 180000
  const { data } = await apiClient.post('/ai/videos', { prompt }, { timeout: 35000 })
  const taskId = data.data?.id
  if (!taskId) throw new Error('视频生成服务未返回任务标识')

  let elapsed = 0
  while (elapsed < maxWait) {
    await sleep(pollInterval)
    elapsed += pollInterval
    const { data: statusResponse } = await apiClient.get(`/ai/videos/${encodeURIComponent(taskId)}`, { timeout: 35000 })
    const status = statusResponse.data || {}
    if (status.status === 'completed') {
      return { ...status, video_url: status.remixed_from_video_id || status.video_url || '' }
    }
    if (status.status === 'failed' || status.error) {
      throw new Error(status.error || '视频生成失败')
    }
  }
  throw new Error('视频生成超时')
}

/** VOLO 相册成片（旧 Ken Burns 链路，前端已改走 FILM VOLO / odyssee；保留 API 供兼容） */
async function createAlbumVideoStory(payload, options = {}) {
  const { data } = await apiClient.post('/ai/album-video/story', payload, {
    timeout: options.timeoutMs ?? 130000
  })
  return data.data
}

/** VOLO 相册成片：无旁白 Ken Burns 合成 */
async function renderAlbumVideo(payload, options = {}) {
  const { data } = await apiClient.post('/ai/album-video/render', payload, {
    timeout: options.timeoutMs ?? 300000
  })
  return data.data
}

export {
  chat,
  chatWithVision,
  generateImage,
  generateVideo,
  createAlbumVideoStory,
  renderAlbumVideo
}
