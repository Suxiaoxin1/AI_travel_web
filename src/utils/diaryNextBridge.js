/**
 * 加载参考工程 DiaryNext 渲染器（public/journal/js），并合成 1080×1440 预览图。
 */

const SCRIPT_IDS = {
  data: 'diary-next-data-js',
  templates: 'diary-templates-js',
  skin: 'diary-skin-pipeline-js',
  render: 'diary-next-render-js'
}

function loadScript(id, src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`加载失败: ${src}`)), { once: true })
      return
    }
    const el = document.createElement('script')
    el.id = id
    el.src = src
    el.async = false
    el.onload = () => {
      el.dataset.loaded = '1'
      resolve()
    }
    el.onerror = () => reject(new Error(`加载失败: ${src}`))
    document.head.appendChild(el)
  })
}

export async function ensureDiaryNextRenderer() {
  if (typeof window !== 'undefined' && window.DiaryNextRenderer && window.DIARY_NEXT_DATA && window.applyDiarySkin) {
    patchLibraryBase()
    return window.DiaryNextRenderer
  }
  await loadScript(SCRIPT_IDS.data, '/journal/js/diary-next-data.js')
  await loadScript(SCRIPT_IDS.templates, '/journal/js/diary-templates.js')
  await loadScript(SCRIPT_IDS.skin, '/journal/js/diary-skin-pipeline.js')
  await loadScript(SCRIPT_IDS.render, '/journal/js/diary-next-render.js')
  if (!window.DiaryNextRenderer) {
    throw new Error('手帐渲染器未就绪，请刷新页面后重试')
  }
  patchLibraryBase()
  return window.DiaryNextRenderer
}

/** 把「复古胶片」等中文风格名解析成 assets/stickers/<id>/ 目录 */
function patchLibraryBase() {
  const data = typeof window !== 'undefined' ? window.DIARY_NEXT_DATA : null
  if (!data || data.__libraryBasePatched) return
  const alias = {
    复古胶片: 'vintage',
    简约清新: 'minimal',
    多彩活泼: 'colorful',
    暗黑质感: 'dark',
    水彩手绘: 'watercolor',
    杂志排版: 'magazine'
  }
  data.libraryBase = function libraryBase(styleKey) {
    const preset = typeof data.lookupPreset === 'function' ? data.lookupPreset(styleKey) : null
    let dir = (preset && preset.id) ? preset.id : String(styleKey || 'vintage').trim()
    if (alias[dir]) dir = alias[dir]
    return `/journal/assets/stickers/${dir}/`
  }
  data.__libraryBasePatched = true
}

/**
 * layout-next 结果套皮肤 + 专属贴纸库（不含抠图）。
 * @param {object} layout
 * @param {string} styleId vintage | minimal | colorful | …
 */
export function applyDiarySkin(layout, styleId) {
  if (typeof window === 'undefined' || typeof window.applyDiarySkin !== 'function') {
    return layout
  }
  const result = window.applyDiarySkin(layout, styleId)
  return result?.layout || layout
}

/**
 * @param {object} layout layout-next JSON
 * @param {string[]} photos
 * @param {object} [opts]
 * @returns {Promise<{ previewUrl: string, layout: object }>}
 */
export async function composeDiaryNextPreview(layout, photos, opts = {}) {
  const Renderer = await ensureDiaryNextRenderer()
  const nextLayout = opts.skipSkin
    ? layout
    : applyDiarySkin(layout, opts.styleId || layout?.style)
  if (document.fonts?.ready) {
    try { await document.fonts.ready } catch { /* ignore */ }
  }
  const result = await Renderer.render(nextLayout, {
    photos,
    scale: opts.scale == null ? 1 : opts.scale,
    cutoutSrcs: opts.cutoutSrcs || {}
  })
  const previewUrl = result.toDataURL('image/jpeg', 0.92)
  return { previewUrl, layout: result.spec || nextLayout }
}

/**
 * 读取照片自然宽高比，供 layout-next aspects 使用。
 * @param {string[]} photos
 * @returns {Promise<Array<{ index: number, aspect: number }>>}
 */
export function loadPhotoAspects(photos) {
  return Promise.all(
    (photos || []).map(
      (src, index) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            const w = img.naturalWidth || 1
            const h = img.naturalHeight || 1
            resolve({ index, aspect: Number((w / h).toFixed(2)) || 1 })
          }
          img.onerror = () => resolve({ index, aspect: 1 })
          img.src = src
        })
    )
  )
}
