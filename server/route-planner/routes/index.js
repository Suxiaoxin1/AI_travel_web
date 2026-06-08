/**
 * 路由汇总模块
 * 统一注册所有API路由
 */

const express = require('express')
const routeRoutes = require('./route.routes')
const addressRoutes = require('./address.routes')

function registerRoutes(app) {
  const apiRouter = express.Router()

  apiRouter.use('/route', routeRoutes)
  apiRouter.use('/address', addressRoutes)

  app.use('/api', apiRouter)

  app.get('/api', (req, res) => {
    res.json({
      name: '多地址路线规划API',
      version: '1.0.0',
      description: '提供多地址路线规划、路径优化、地理编码等功能',
      endpoints: {
        'POST /api/route/plan': '多地址路线规划（主接口）',
        'POST /api/route/optimize': '仅优化途经点顺序',
        'GET /api/route/health': '健康检查',
        'GET /api/address/geocode': '地理编码（地址→坐标）',
        'GET /api/address/reverse': '逆地理编码（坐标→地址）',
        'GET /api/address/search': '地址搜索联想',
        'POST /api/address/batch-geocode': '批量地理编码'
      },
      status: 'running'
    })
  })
}

module.exports = registerRoutes
