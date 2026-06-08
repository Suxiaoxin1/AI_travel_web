/**
 * 简化版请求队列管理器 v2.0
 * 
 * 修复问题：
 * 1. 移除复杂的异步队列逻辑，改用简单的串行执行
 * 2. 添加明确的超时控制
 * 3. 简化错误处理流程
 * 
 * 设计原则：简单、可靠、易调试
 */

const logger = require('../utils/logger')

class SimpleRequestQueue {
  constructor(options = {}) {
    this.options = {
      requestsPerSecond: options.requestsPerSecond || 3,
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 300,
      ...options
    }

    // 上次请求时间戳（用于速率限制）
    this.lastRequestTime = 0
    
    // 统计信息
    this.stats = { total: 0, success: 0, failed: 0, retried: 0 }
    
    logger.info('[SimpleRequestQueue] 初始化完成', this.options)
  }

  /**
   * 执行单个任务（带限流和重试）
   */
  async execute(taskFn) {
    this.stats.total++
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        // 速率限制等待
        await this.waitForRateLimit()
        
        console.log(`[SimpleRequestQueue] 执行任务 (尝试 ${attempt + 1}/${this.options.maxRetries + 1})`)
        
        // 执行任务（带10秒超时）
        const result = await Promise.race([
          taskFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TASK_TIMEOUT')), 15000)
          )
        ])
        
        this.stats.success++
        console.log(`[SimpleRequestQueue] 任务成功 ✓`)
        return result
        
      } catch (error) {
        console.log(`[SimpleRequestQueue] 任务失败 (尝试 ${attempt + 1}):`, error.message)
        
        const isLastAttempt = attempt >= this.options.maxRetries
        const shouldRetry = !isLastAttempt && this.isRetryableError(error)
        
        if (shouldRetry) {
          this.stats.retried++
          const delay = this.calculateBackoff(attempt)
          console.log(`[SimpleRequestQueue] ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else if (isLastAttempt) {
          this.stats.failed++
          throw error
        } else {
          // 不可恢复的错误，立即抛出
          this.stats.failed++
          throw error
        }
      }
    }
  }

  /**
   * 串行批量执行（逐个执行，避免并发问题）✅ 关键改进
   */
  async executeBatch(tasks) {
    console.log(`[SimpleRequestQueue] 开始串行批量执行: ${tasks.length} 个任务`)
    const results = []
    const errors = []

    for (let i = 0; i < tasks.length; i++) {
      try {
        console.log(`\n[SimpleRequestQueue] 处理任务 ${i + 1}/${tasks.length}`)
        const result = await this.execute(tasks[i])
        results[i] = result
        console.log(`[SimpleRequestQueue] ✅ 任务 ${i + 1} 完成`)
      } catch (error) {
        console.error(`[SimpleRequestQueue] ❌ 任务 ${i + 1} 失败:`, error.message)
        errors[i] = error
        results[i] = null
        throw error  // 快速失败：任一任务失败则停止
      }
    }

    console.log(`\n[SimpleRequestQueue] 🎉 所有任务完成! 成功: ${results.filter(r => r).length}/${tasks.length}`)
    return { results, errors }
  }

  /**
   * 等待满足速率限制
   */
  async waitForRateLimit() {
    if (this.options.requestsPerSecond <= 0) return
    
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minInterval = 1000 / this.options.requestsPerSecond
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = Math.ceil(minInterval - timeSinceLastRequest)
      console.log(`[SimpleRequestQueue] 速率限制: 等待 ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  /**
   * 判断是否可重试的错误
   */
  isRetryableError(error) {
    const retryableCodes = [
      'CUQPS_HAS_EXCEEDED_THE_LIMIT',
      '10004',
      '20005',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'TASK_TIMEOUT',
      'TIMEOUT',
      'NETWORK_ERROR'
    ]
    
    return retryableCodes.some(code => 
      String(error.code).includes(code) ||
      String(error.message).toUpperCase().includes('QPS') ||
      String(error.message).toUpperCase().includes('TIMEOUT') ||
      String(error.message).toUpperCase().includes('超时')
    )
  }

  /**
   * 计算退避延迟
   */
  calculateBackoff(retryCount) {
    const delay = this.options.baseDelay * Math.pow(2, retryCount)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1)
    return Math.min(Math.max(delay + jitter, this.options.baseDelay), 5000)
  }

  getStats() {
    return { ...this.stats }
  }
}

// 导出单例
module.exports = {
  SimpleRequestQueue,
  globalQueue: new SimpleRequestQueue({
    requestsPerSecond: 2,  // 更保守：每秒2个请求
    maxRetries: 2,         // 最多重试2次
    baseDelay: 500         // 基础延迟500ms
  })
}
