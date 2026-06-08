/**
 * 路线规划相关路由
 */

const express = require('express')
const router = express.Router()
const routeService = require('../services/route.service')
const ResponseHelper = require('../utils/response')
const logger = require('../utils/logger')
const { validateRoutePlanRequest, validateOptimizeOnly } = require('../middleware/validate')

router.post('/plan', validateRoutePlanRequest, async (req, res, next) => {
  try {
    logger.info('[POST /api/route/plan] 收到路线规划请求', {
      addressCount: req.body.addresses?.length,
      ip: req.ip
    })
    const result = await routeService.planRoute(req.body)
    return ResponseHelper.success(res, result.data, '路线规划成功')
  } catch (error) {
    next(error)
  }
})

router.post('/optimize', validateOptimizeOnly, async (req, res, next) => {
  try {
    logger.info('[POST /api/route/optimize] 收到路径优化请求')
    const result = await routeService.optimizeOnly(req.body)
    return ResponseHelper.success(res, result.data, '路径优化完成')
  } catch (error) {
    next(error)
  }
})

router.get('/health', async (req, res) => {
  return ResponseHelper.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: true,
      amapApi: 'not_tested'
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
