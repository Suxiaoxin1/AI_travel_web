/**
 * 地址处理相关路由
 */

const express = require('express')
const router = express.Router()
const addressService = require('../services/address.service')
const ResponseHelper = require('../utils/response')
const logger = require('../utils/logger')
const { validateGeocode, validateReverseGeocode, validateAddressSearch } = require('../middleware/validate')

router.get('/geocode', validateGeocode, async (req, res, next) => {
  try {
    const { address, city } = req.query
    logger.info(`[GET /api/address/geocode] 地理编码请求`, { address, city })
    const result = await addressService.geocode(address, city || '')
    return ResponseHelper.success(res, result, '地址解析成功')
  } catch (error) {
    next(error)
  }
})

router.get('/reverse', validateReverseGeocode, async (req, res, next) => {
  try {
    const { lng, lat } = req.query
    logger.info(`[GET /api/address/reverse] 逆地理编码请求`, { lng, lat })
    const result = await addressService.reverseGeocode(parseFloat(lng), parseFloat(lat))
    return ResponseHelper.success(res, result, '坐标解析成功')
  } catch (error) {
    next(error)
  }
})

router.get('/search', validateAddressSearch, async (req, res, next) => {
  try {
    const { keyword, city, limit } = req.query
    logger.info(`[GET /api/address/search] 地址搜索`, { keyword, city, limit })
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
    next(error)
  }
})

router.post('/batch-geocode', async (req, res, next) => {
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
    const result = await addressService.batchGeocode(addresses)
    return ResponseHelper.success(res, result, `批量解析完成：成功${result.statistics.success}个`)
  } catch (error) {
    next(error)
  }
})

module.exports = router
