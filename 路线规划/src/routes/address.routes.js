/**
 * 地址处理相关路由
 * 包含：地理编码、逆地理编码、地址搜索等接口
 */

const express = require('express')
const router = express.Router()
const addressService = require('../services/address.service')
const ResponseHelper = require('../utils/response')
const logger = require('../utils/logger')
const { validateGeocode, validateReverseGeocode, validateAddressSearch } = require('../middleware/validate')

/**
 * GET /api/address/geocode
 * 
 * 地理编码：将地址文本转换为经纬度坐标
 * 
 * 参数：
 * - address: 地址文本（必填）
 * - city: 城市（可选）
 * 
 * 示例：
 * GET /api/address/geocode?address=北京市朝阳区望京SOHO&city=北京
 */
router.get('/geocode', validateGeocode, async (req, res) => {
  try {
    const { address, city } = req.query

    logger.info(`[GET /api/address/geocode] 地理编码请求`, { address, city })

    // 调用地理编码服务
    const result = await addressService.geocode(address, city || '')

    return ResponseHelper.success(res, result, '地址解析成功')

  } catch (error) {
    logger.error('[GET /api/address/geocode] 处理失败', error)
    throw error
  }
})

/**
 * GET /api/address/reverse
 * 
 * 逆地理编码：将经纬度坐标转换为地址文本
 * 
 * 参数：
 * - lng: 经度（必填）
 * - lat: 纬度（必填）
 * 
 * 示例：
 * GET /api/address/reverse?lng=116.397428&lat=39.90923
 */
router.get('/reverse', validateReverseGeocode, async (req, res) => {
  try {
    const { lng, lat } = req.query

    logger.info(`[GET /api/address/reverse] 逆地理编码请求`, { lng, lat })

    // 调用逆地理编码服务
    const result = await addressService.reverseGeocode(parseFloat(lng), parseFloat(lat))

    return ResponseHelper.success(res, result, '坐标解析成功')

  } catch (error) {
    logger.error('[GET /api/address/reverse] 处理失败', error)
    throw error
  }
})

/**
 * GET /api/address/search
 * 
 * 地址搜索联想（输入提示）
 * 用于用户输入时的实时搜索建议
 * 
 * 参数：
 * - keyword: 搜索关键词（必填）
 * - city: 限定城市（可选）
 * - limit: 返回数量限制，默认10，最大20（可选）
 * 
 * 示例：
 * GET /api/address/search?keyword=天安门&city=北京&limit=5
 */
router.get('/search', validateAddressSearch, async (req, res) => {
  try {
    const { keyword, city, limit } = req.query

    logger.info(`[GET /api/address/search] 地址搜索`, { keyword, city, limit })

    // 调用搜索服务
    const suggestions = await addressService.searchSuggestions(
      keyword,
      city || '',
      parseInt(limit) || 10
    )

    return ResponseHelper.success(res, {
      keyword,
      count: suggestions.length,
      results: suggestions
    }, '搜索完成')

  } catch (error) {
    logger.error('[GET /api/address/search] 处理失败', error)
    throw error
  }
})

/**
 * POST /api/address/batch-geocode
 * 
 * 批量地理编码
 * 一次性解析多个地址
 * 
 * 请求体：
 * {
 *   addresses: [
 *     { address: "地址1", city: "城市1" },
 *     { address: "地址2", city: "城市2" }
 *   ]
 * }
 */
router.post('/batch-geocode', async (req, res) => {
  try {
    const { addresses } = req.body

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return ResponseHelper.validationError(res, [{
        field: 'addresses',
        message: '请提供有效的地址数组'
      }])
    }

    if (addresses.length > 50) {
      return ResponseHelper.validationError(res, [{
        field: 'addresses',
        message: '单次批量解析最多支持50个地址'
      }])
    }

    logger.info(`[POST /api/address/batch-geocode] 批量地理编码`, { count: addresses.length })

    // 调用批量地理编码服务
    const result = await addressService.batchGeocode(addresses)

    return ResponseHelper.success(res, result, `批量解析完成：成功${result.statistics.success}个`)

  } catch (error) {
    logger.error('[POST /api/address/batch-geocode] 处理失败', error)
    throw error
  }
})

module.exports = router
