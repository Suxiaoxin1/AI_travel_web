const fs = require('fs')
const path = require('path')

const out = path.join(__dirname, 'volo-film-flow.svg')

/**
 * 浅色、白话版 VOLO 成片流程图
 * 中文用 \u 转义，避免写入编码损坏
 */
const t = {
  title: 'VOLO \u65c5\u9014\u5c0f\u7535\u5f71\uff1a\u662f\u600e\u4e48\u505a\u51fa\u6765\u7684\uff1f',
  sub: '\u628a\u7167\u7247\u53d8\u6210\u5e26\u65c1\u767d\u7684\u77ed\u89c6\u9891\uff08\u524d\u7aef\u53ea\u8d1f\u8d23\u586b\u8868\u5355\u548c\u7b49\u5f85\uff1b\u771f\u6b63\u7b97\u529b\u5728\u53f3\u8fb9\u89c6\u9891\u670d\u52a1\uff09',
  left: '\u4f60\u770b\u5230\u7684\u9875\u9762\uff08\u524d\u7aef\uff09',
  right: '\u80cc\u540e\u7684\u89c6\u9891\u670d\u52a1\uff08\u9ed8\u8ba4\u7aef\u53e3 3000\uff09',
  s1: '1. \u6253\u5f00\u300cFILM / VOLO \u76f8\u518c\u300d',
  s1b: 'TravelJournal \u9875\u9762',
  s2: '2. \u4e0a\u4f20 3\uff5e8 \u5f20\u7167\u7247\uff0c\u586b\u5730\u70b9\u3001\u5fc3\u5f97\u3001\u53c2\u6570',
  s2b: '\u53ef\u4ee5\u5148\u70b9\u300cAI \u751f\u6210\u65c1\u767d\u300d\u5199\u53f0\u8bcd',
  s3: '3. \u70b9\u300c\u5f00\u59cb\u5408\u6210\u65c5\u9014\u5c0f\u7535\u5f71\u300d',
  s3b: '\u53f3\u4fa7\u51fa\u73b0\uff1a\u7b49\u5f85\u4e2d \u2192 \u6210\u529f / \u5931\u8d25',
  s4: '4. \u64ad\u653e\u6216\u4e0b\u8f7d MP4',
  a: 'A. \u6536\u5230\u7167\u7247',
  ab: 'POST /api/upload',
  b: 'B. \uff08\u53ef\u9009\uff09\u770b\u56fe\u5199\u53f0\u8bcd',
  bb: 'POST /api/analyze\n\u53ea\u751f\u6210\u6587\u5b57\uff0c\u4e0d\u662f\u8bf4\u8bdd',
  c: 'C. \u63a5\u5355\uff1a\u5f00\u59cb\u505a\u7247',
  cb: 'POST /api/video-engine/tasks\n\u5e26\u4e0a\uff1a\u7167\u7247\u8def\u5f84 + \u53f0\u8bcd + \u97f3\u8272',
  d: 'D. \u8bed\u97f3\u5408\u6210 TTS',
  db: '\u628a\u53f0\u8bcd\u53d8\u6210\u4eba\u58f0\n\u5973\u58f0 Aoede / \u7537\u58f0 Fenrir',
  e: 'E. \u7167\u7247\u53d8\u52a8\u753b',
  eb: '\u767e\u70bc wan2.7\n\u6bcf\u5f20\u7167\u751f\u4e00\u6bb5\u52a8\u753b',
  f: 'F. \u526a\u8f91\u5408\u6210',
  fb: 'FFmpeg\n\u628a\u52a8\u753b\u7247\u6bb5 + \u4eba\u58f0\u5408\u6210\u4e00\u6761\u89c6\u9891',
  g: 'G. \u5b58\u6210\u6210\u7247\u6587\u4ef6',
  gb: '/uploads/*.mp4\n\u524d\u7aef\u6bcf 3 \u79d2\u95ee\u4e00\u6b21\uff1a\u505a\u597d\u4e86\u6ca1\uff1f',
  tip1: '\u91cd\u8981\u533a\u5206',
  tip2: '\u300cAI \u751f\u6210\u65c1\u767d\u300d= \u5199\u53f0\u8bcd\u6587\u5b57\uff08analyze\uff09',
  tip3: '\u300c\u8bed\u97f3\u5408\u6210 TTS\u300d= \u628a\u53f0\u8bcd\u8bfb\u6210\u58f0\u97f3\uff08\u5728\u6210\u7247\u4efb\u52a1\u91cc\u9762\uff0c\u4e0d\u662f\u5355\u72ec\u524d\u7aef\u63a5\u53e3\uff09',
  tip4: '\u5173\u6389\u300c\u751f\u6210\u65c1\u767d\u300d\u5f00\u5173\u65f6\uff1a\u8df3\u8fc7 D\uff0c\u505a\u65e0\u58f0\u52a8\u6001\u6210\u7247',
  foot: '\u4e3b\u7ad9 API :8081 \u4e0d\u53c2\u4e0e\u6210\u7247\u3002\u91cd\u542f\u89c6\u9891\u670d\u52a1\u4f1a\u4e22\u8fdb\u5ea6\u3002\u6e90\u7801\uff1asrc/utils/filmCompose.js'
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function multiText(x, y, text, fill, size, anchor, lineH) {
  const lines = String(text).split('\n')
  return lines
    .map((line, i) => {
      const yy = y + i * (lineH || size + 4)
      return `<text x="${x}" y="${yy}" fill="${fill}" font-size="${size}" text-anchor="${anchor || 'middle'}">${esc(line)}</text>`
    })
    .join('\n  ')
}

function card(x, y, w, h, title, body, stroke, fill) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="${y + 28}" fill="#1f2937" font-size="14" font-weight="700" text-anchor="middle">${esc(title)}</text>
  ${multiText(x + w / 2, y + 50, body, '#4b5563', 11, 'middle', 16)}
`
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
  <defs>
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280"/>
    </marker>
    <marker id="arr-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#059669"/>
    </marker>
    <marker id="arr-orange" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#d97706"/>
    </marker>
    <style>
      text { font-family: 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif; }
    </style>
  </defs>

  <!-- light background -->
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <rect x="0" y="0" width="1200" height="96" fill="#eef2ff"/>

  <text x="40" y="42" fill="#111827" font-size="22" font-weight="700">${esc(t.title)}</text>
  <text x="40" y="70" fill="#4b5563" font-size="13">${esc(t.sub)}</text>

  <!-- left panel -->
  <rect x="28" y="118" width="360" height="560" rx="18" fill="#ffffff" stroke="#c7d2fe" stroke-width="2"/>
  <text x="48" y="148" fill="#4338ca" font-size="14" font-weight="700">${esc(t.left)}</text>

  ${card(50, 168, 316, 78, t.s1, t.s1b, '#a5b4fc', '#eef2ff')}
  <line x1="208" y1="246" x2="208" y2="268" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>
  ${card(50, 268, 316, 92, t.s2, t.s2b, '#a5b4fc', '#eef2ff')}
  <line x1="208" y1="360" x2="208" y2="382" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>
  ${card(50, 382, 316, 92, t.s3, t.s3b, '#a5b4fc', '#eef2ff')}
  <line x1="208" y1="474" x2="208" y2="496" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>
  ${card(50, 496, 316, 78, t.s4, 'success \u72b6\u6001\u4e0b\u53ef\u64ad\u653e', '#93c5fd', '#eff6ff')}

  <text x="50" y="620" fill="#6b7280" font-size="11">\u5bf9\u5e94\u4ee3\u7801\uff1aVoloFilmWorkspace.vue</text>
  <text x="50" y="640" fill="#6b7280" font-size="11">\u8bf7\u6c42\u903b\u8f91\uff1afilmCompose.js</text>

  <!-- right panel -->
  <rect x="420" y="118" width="752" height="560" rx="18" fill="#ffffff" stroke="#bbf7d0" stroke-width="2"/>
  <text x="440" y="148" fill="#047857" font-size="14" font-weight="700">${esc(t.right)}</text>

  <!-- A B -->
  ${card(448, 168, 300, 86, t.a, t.ab, '#86efac', '#ecfdf5')}
  ${card(800, 168, 340, 86, t.b, t.bb, '#fcd34d', '#fffbeb')}

  <!-- dashed optional from left form to B -->
  <path d="M 366 330 C 420 330, 760 250, 800 220" fill="none" stroke="#d97706" stroke-width="1.6" stroke-dasharray="6,4" marker-end="url(#arr-orange)"/>
  <text x="620" y="270" fill="#b45309" font-size="11" font-weight="600">${esc('\u53ef\u9009\uff1a\u5148\u5199\u53f0\u8bcd')}</text>

  <!-- main from left to A/C -->
  <path d="M 366 430 C 400 430, 420 210, 448 210" fill="none" stroke="#059669" stroke-width="1.8" marker-end="url(#arr-green)"/>
  <text x="390" y="390" fill="#047857" font-size="11" font-weight="600">${esc('\u2460 \u4e0a\u4f20')}</text>

  <line x1="598" y1="254" x2="598" y2="288" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- C -->
  ${card(448, 288, 692, 78, t.c, t.cb, '#86efac', '#ecfdf5')}
  <path d="M 366 450 C 410 470, 430 330, 448 330" fill="none" stroke="#059669" stroke-width="1.8" marker-end="url(#arr-green)"/>
  <text x="390" y="470" fill="#047857" font-size="11" font-weight="600">${esc('\u2461 \u5f00\u59cb\u505a\u7247')}</text>

  <line x1="794" y1="366" x2="794" y2="398" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- D TTS highlighted -->
  <rect x="448" y="398" width="220" height="100" rx="14" fill="#fff1f2" stroke="#fb7185" stroke-width="2"/>
  <text x="558" y="428" fill="#9f1239" font-size="14" font-weight="700" text-anchor="middle">${esc(t.d)}</text>
  ${multiText(558, 452, t.db, '#be123c', 11, 'middle', 16)}

  <!-- E -->
  <rect x="688" y="398" width="220" height="100" rx="14" fill="#f5f3ff" stroke="#a78bfa" stroke-width="1.8"/>
  <text x="798" y="428" fill="#5b21b6" font-size="14" font-weight="700" text-anchor="middle">${esc(t.e)}</text>
  ${multiText(798, 452, t.eb, '#6d28d9', 11, 'middle', 16)}

  <!-- F -->
  <rect x="928" y="398" width="212" height="100" rx="14" fill="#f5f3ff" stroke="#a78bfa" stroke-width="1.8"/>
  <text x="1034" y="428" fill="#5b21b6" font-size="14" font-weight="700" text-anchor="middle">${esc(t.f)}</text>
  ${multiText(1034, 452, t.fb, '#6d28d9', 11, 'middle', 16)}

  <line x1="668" y1="448" x2="688" y2="448" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>
  <line x1="908" y1="448" x2="928" y2="448" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>

  <line x1="794" y1="498" x2="794" y2="530" stroke="#6b7280" stroke-width="1.5" marker-end="url(#arr)"/>

  <!-- G -->
  ${card(448, 530, 692, 86, t.g, t.gb, '#93c5fd', '#eff6ff')}

  <!-- poll back -->
  <path d="M 448 575 C 390 575, 380 530, 366 530" fill="none" stroke="#2563eb" stroke-width="1.7" marker-end="url(#arr)"/>
  <text x="390" y="556" fill="#1d4ed8" font-size="11" font-weight="600">${esc('\u2462 \u8f6e\u8be2\u8fdb\u5ea6')}</text>

  <!-- tips box -->
  <rect x="28" y="700" width="1144" height="150" rx="16" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
  <text x="52" y="736" fill="#111827" font-size="15" font-weight="700">${esc(t.tip1)}</text>
  <text x="52" y="768" fill="#374151" font-size="13">${esc(t.tip2)}</text>
  <text x="52" y="796" fill="#9f1239" font-size="13" font-weight="600">${esc(t.tip3)}</text>
  <text x="52" y="824" fill="#374151" font-size="13">${esc(t.tip4)}</text>

  <text x="52" y="870" fill="#9ca3af" font-size="11">${esc(t.foot)}</text>
</svg>
`

fs.writeFileSync(out, svg, 'utf8')
console.log('OK', out, fs.statSync(out).size)
