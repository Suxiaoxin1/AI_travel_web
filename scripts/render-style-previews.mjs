/**
 * 用本地 DiaryNext 模板渲染三种风格样例，写入 public/images/journal-styles。
 * 用法：node scripts/render-style-previews.mjs
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'images', 'journal-styles')
const photos = [
  '/images/landmarks/鼓浪屿.jpg',
  '/images/landmarks/厦门大学.jpg',
  '/images/landmarks/南普陀寺.jpg',
  '/images/landmarks/中山路.jpg',
  '/images/landmarks/xiamen_01_xida.jpg',
  '/images/landmarks/xiamen_02_nanputuo.jpg',
  '/images/landmarks/xiamen_03_zhongshan.jpg'
]

const styles = [
  { id: 'vintage', file: 'preview-retro.jpg', count: 5 },
  { id: 'minimal', file: 'preview-clean.jpg', count: 4 },
  { id: 'colorful', file: 'preview-vivid.jpg', count: 7 }
]

const html = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
<script src="/journal/js/diary-next-data.js"></script>
<script src="/journal/js/diary-templates.js"></script>
<script src="/journal/js/diary-skin-pipeline.js"></script>
<script src="/journal/js/diary-next-render.js"></script>
</body></html>`

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--allow-file-access-from-files']
})
const page = await browser.newPage()
await page.route('**/*', async (route) => {
  const url = new URL(route.request().url())
  if (url.pathname === '/preview.html') {
    await route.fulfill({ contentType: 'text/html', body: html })
    return
  }
  const file = path.join(root, 'public', decodeURIComponent(url.pathname))
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    await route.fulfill({ path: file })
    return
  }
  await route.abort()
})

await page.goto('http://local.test/preview.html')
await page.waitForFunction(() => window.DiaryNextRenderer && window.DiaryTemplates && window.applyDiarySkin)

fs.mkdirSync(outDir, { recursive: true })

for (const style of styles) {
  const dataUrl = await page.evaluate(async ({ styleId, photoCount, photos }) => {
    const layout = window.DiaryTemplates.buildLayout(styleId, photoCount)
    if (!layout) throw new Error('no layout ' + styleId)
    window.applyDiarySkin(layout, styleId)
    const result = await window.DiaryNextRenderer.render(layout, {
      photos: photos.slice(0, photoCount),
      scale: 0.5
    })
    return result.toDataURL('image/jpeg', 0.86)
  }, { styleId: style.id, photoCount: style.count, photos })

  const buf = Buffer.from(dataUrl.replace(/^data:image\/jpeg;base64,/, ''), 'base64')
  const out = path.join(outDir, style.file)
  fs.writeFileSync(out, buf)
  console.log(`OK ${style.file} ${buf.length}`)
}

await browser.close()
