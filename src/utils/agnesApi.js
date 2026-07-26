// DeepSeek 官方 API 配置（用于 chat 文本对话）
const API_BASE = 'https://api.deepseek.com/v1'
const API_KEY = 'sk-955ae0fe3dbd49c0af38b4ecc4cc2795'

// 图片/视频生成 API 地址（DeepSeek 不支持多模态生成，后续可改为 Zhipu/OpenAI 等）
const MEDIA_API_BASE = 'https://apihub.agnes-ai.com/v1'

// 智谱 AI 视觉模型配置（用于图片+文本输入的旅行规划场景）
// DeepSeek 文本模型不支持图像，故图片输入走 Zhipu 多模态
const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPU_API_KEY = '2f4adb9727fb4eeb9e0938bb3a36654d.ecci7XWm8iYAmhFh'
const VISION_MODEL = 'glm-4v-plus-0111'

function normalizeVisionMessages(messages) {
  return messages.map(message => ({
    ...message,
    content: Array.isArray(message.content)
      ? message.content.map(part => {
          if (part.type !== 'image_url' || !part.image_url?.url) return part
          const url = part.image_url.url
          const base64Prefix = url.match(/^data:image\/[^;]+;base64,/i)
          return base64Prefix
            ? { ...part, image_url: { ...part.image_url, url: url.slice(base64Prefix[0].length) } }
            : part
        })
      : message.content
  }))
}

// 聊天模型：使用 deepseek-v4-flash（一个模型即可同时满足对话与推理需求）
const CHAT_MODELS = ['deepseek-v4-flash']

/**
 * 调用 Agnes AI 聊天接口
 * 支持多模态模型（文本 + 图片），自动回退可用模型
 *
 * @param {Array} messages - 消息数组，每条消息格式：
 *   文本消息: { role: 'user', content: '你好' }
 *   图片消息: { role: 'user', content: [{ type: 'text', text: '描述' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,xxx' } }] }
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} API 响应数据
 */
async function chat(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048, stream = false, retries = 2 } = options
  let lastError

  // 遍历模型回退列表，找到第一个可用模型
  for (const model of CHAT_MODELS) {
    for (let attempt = 0; attempt <= (model === CHAT_MODELS[0] ? retries : 0); attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s 超时

        const body = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }

        const resp = await fetch(`${API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!resp.ok) {
          const errText = await resp.text()
          console.warn(`模型 ${model} 请求失败 (${resp.status}):`, errText)
          // 503 / model_not_found 时跳到下一个模型
          if (resp.status === 503 || errText.includes('model_not_found')) {
            lastError = new Error(`模型 ${model} 不可用 (${resp.status})`)
            break // 跳出重试循环，尝试下一个模型
          }
          lastError = new Error(`AI 服务暂时不可用 (${resp.status})`)
          continue
        }

        const data = await resp.json()
        console.log(`✅ 聊天模型 ${model} 调用成功`)
        if (stream) return resp
        return data
      } catch (err) {
        console.error(`请求失败 (模型=${model}, 第${attempt + 1}次):`, err.message)
        lastError = err
        // 指数退避重试（仅对首选模型）
        if (model === CHAT_MODELS[0] && attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt)
          console.log(`等待 ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
  }

  throw lastError || new Error('AI 服务暂时不可用')
}

/**
 * 调用智谱 AI 视觉模型
 * 用于图片 + 文本混合输入的场景（如含图片的旅行规划）
 * 智谱 OpenAI 兼容接口：https://open.bigmodel.cn/api/paas/v4/chat/completions
 *
 * @param {Array} messages - 多模态消息数组，例如：
 *   [{ role: 'user', content: [
 *       { type: 'text', text: '描述这张图' },
 *       { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
 *   ]}]
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} API 响应数据
 */
async function chatWithVision(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048, retries = 2 } = options
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s 超时

      const body = {
        model: VISION_MODEL,
        messages: normalizeVisionMessages(messages),
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }

      const resp = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZHIPU_API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const errText = await resp.text()
        console.warn(`智谱视觉模型请求失败 (${resp.status}):`, errText)
        lastError = new Error(`智谱视觉模型不可用 (${resp.status})`)
        continue
      }

      const data = await resp.json()
      console.log(`✅ 智谱视觉模型 ${VISION_MODEL} 调用成功`)
      return data
    } catch (err) {
      console.error(`智谱视觉请求失败 (第${attempt + 1}次):`, err.message)
      lastError = err
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('智谱视觉模型不可用')
}

/**
 * 调用 Agnes AI 生成图片
 * 使用 Agnes-2.0-Flash 的图片生成能力
 *
 * @param {string} prompt - 图片描述
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} 包含 image_url 的响应
 */
async function generateImage(prompt, options = {}) {
  const { size = '1024x1024', retries = 2 } = options
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      const resp = await fetch(`${MEDIA_API_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'Agnes-2.0-Flash',
          prompt,
          n: 1,
          size
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const err = await resp.text()
        console.error(`图片生成错误 (第${attempt + 1}次):`, err)
        lastError = new Error(`图片生成服务暂时不可用 (${resp.status})`)
        continue
      }

      return await resp.json()
    } catch (err) {
      console.error(`图片生成失败 (第${attempt + 1}次):`, err.message)
      lastError = err
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('图片生成服务暂时不可用')
}

/**
 * 调用 Agnes AI 生成视频
 * 使用 agnes-video-v2.0 模型，异步轮询结果
 *
 * @param {string} prompt - 视频描述
 * @param {Object} options - 可选参数
 * @returns {Promise<Object>} 包含 video_url 的响应
 */
async function generateVideo(prompt, options = {}) {
  const { retries = 2, pollInterval = 3000, maxWait = 180000 } = options
  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const resp = await fetch(`${MEDIA_API_BASE}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'agnes-video-v2.0',
          prompt,
          ...options
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        const err = await resp.text()
        console.error('视频生成错误:', err)
        lastError = new Error('视频生成服务暂时不可用')
        continue
      }

      const data = await resp.json()
      const taskId = data.id

      // 轮询等待完成
      let elapsed = 0
      while (elapsed < maxWait) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        elapsed += pollInterval

        const statusResp = await fetch(`${MEDIA_API_BASE}/videos/${taskId}`, {
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        })

        if (!statusResp.ok) continue

        const status = await statusResp.json()
        console.log('视频进度:', status.status, status.progress + '%')

        if (status.status === 'completed') {
          const videoUrl = status.remixed_from_video_id || status.video_url || ''
          return { ...status, video_url: videoUrl }
        }
        if (status.status === 'failed' || status.error) {
          throw new Error(status.error || '视频生成失败')
        }
      }

      throw new Error('视频生成超时')
    } catch (err) {
      console.error('视频请求失败:', err.message)
      lastError = err
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt)
        console.log(`等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('视频生成服务暂时不可用')
}

export { chat, chatWithVision, generateImage, generateVideo }
