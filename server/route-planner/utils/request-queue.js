/**
 * 简化版请求队列管理器 v2.0
 */

const logger = require('./logger')

class SimpleRequestQueue {
  constructor(options = {}) {
    this.options = {
      requestsPerSecond: options.requestsPerSecond || 3,
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 300,
      ...options
    }
    this.lastRequestTime = 0
    this.stats = { total: 0, success: 0, failed: 0, retried: 0 }
    logger.info('[SimpleRequestQueue] 初始化完成', this.options)
  }

  async execute(taskFn) {
    this.stats.total++
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit()
        const result = await Promise.race([
          taskFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TASK_TIMEOUT')), 15000)
          )
        ])
        this.stats.success++
        return result
      } catch (error) {
        const isLastAttempt = attempt >= this.options.maxRetries
        const shouldRetry = !isLastAttempt && this.isRetryableError(error)
        if (shouldRetry) {
          this.stats.retried++
          const delay = this.calculateBackoff(attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else if (isLastAttempt) {
          this.stats.failed++
          throw error
        } else {
          this.stats.failed++
          throw error
        }
      }
    }
  }

  async executeBatch(tasks) {
    const results = []
    const errors = []
    for (let i = 0; i < tasks.length; i++) {
      try {
        const result = await this.execute(tasks[i])
        results[i] = result
      } catch (error) {
        errors[i] = error
        results[i] = null
        throw error
      }
    }
    return { results, errors }
  }

  async waitForRateLimit() {
    if (this.options.requestsPerSecond <= 0) return
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minInterval = 1000 / this.options.requestsPerSecond
    if (timeSinceLastRequest < minInterval) {
      const waitTime = Math.ceil(minInterval - timeSinceLastRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    this.lastRequestTime = Date.now()
  }

  isRetryableError(error) {
    const retryableCodes = [
      'CUQPS_HAS_EXCEEDED_THE_LIMIT', '10004', '20005',
      'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
      'TASK_TIMEOUT', 'TIMEOUT', 'NETWORK_ERROR'
    ]
    return retryableCodes.some(code =>
      String(error.code).includes(code) ||
      String(error.message).toUpperCase().includes('QPS') ||
      String(error.message).toUpperCase().includes('TIMEOUT') ||
      String(error.message).toUpperCase().includes('超时')
    )
  }

  calculateBackoff(retryCount) {
    const delay = this.options.baseDelay * Math.pow(2, retryCount)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1)
    return Math.min(Math.max(delay + jitter, this.options.baseDelay), 5000)
  }

  getStats() { return { ...this.stats } }
}

module.exports = {
  SimpleRequestQueue,
  globalQueue: new SimpleRequestQueue({
    requestsPerSecond: 2,
    maxRetries: 2,
    baseDelay: 500
  })
}
