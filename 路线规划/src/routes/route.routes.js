/**
 * 路线规划相关路由 - 稳定版本
 * 包含：路线规划、路径优化等接口
 */

const express = require('express')
const router = express.Router()
const routeService = require('../services/route.service')
const ResponseHelper = require('../utils/response')
const logger = require('../utils/logger')
const { validateRoutePlanRequest, validateOptimizeOnly } = require('../middleware/validate')

/**
 * POST /api/route/plan
 * 
 * 主接口：多地址路线规划
 */
router.post('/plan', validateRoutePlanRequest, async (req, res) => {
  const startTime = Date.now()
  
  try {
    logger.info('[POST /api/route/plan] 收到路线规划请求', {
      addressCount: req.body.addresses?.length,
      ip: req.ip
    })

    const result = await routeService.planRoute(req.body)
    
    return ResponseHelper.success(res, result.data, '路线规划成功')

  } catch (error) {
    logger.error('[POST /api/route/plan] 处理失败', error)
    throw error
  }
})

/**
 * POST /api/route/optimize
 * 仅优化途经点顺序
 */
router.post('/optimize', validateOptimizeOnly, async (req, res) => {
  try {
    logger.info('[POST /api/route/optimize] 收到路径优化请求')
    const result = await routeService.optimizeOnly(req.body)
    return ResponseHelper.success(res, result.data, '路径优化完成')
  } catch (error) {
    logger.error('[POST /api/route/optimize] 处理失败', error)
    throw error
  }
})

/**
 * GET /api/route/health
 * 健康检查接口 - 简化版（不调用外部API）
 */
router.get('/health', async (req, res) => {
  // 直接返回成功，不做任何可能导致崩溃的操作
  return ResponseHelper.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: true,
      amapApi: 'not_tested' // 不主动测试，避免崩溃
    },
    configuration: {
      apiKeyConfigured: !!(process.env.AMAP_API_KEY && process.env.AMAP_API_KEY !== '你的高德地图API_KEY'),
      message: '✅ 服务运行正常'
    },
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage()
  }, '服务运行正常')
})

module.exports = router
