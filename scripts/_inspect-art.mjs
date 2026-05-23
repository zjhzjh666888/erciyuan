import fs from 'node:fs'
import path from 'node:path'
const dir = '素材'
const out = 'apps/web/public/assets/art-preview'
fs.mkdirSync(out, { recursive: true })
const files = fs.readdirSync(dir).filter(f => /\.(png|jpg)$/i.test(f))
files.forEach((f, i) => {
  const src = path.join(dir, f)
  const dst = path.join(out, `art-${String(i + 1).padStart(2, '0')}${path.extname(f)}`)
  fs.copyFileSync(src, dst)
  console.log(`art-${i + 1} ← ${f}`)
})
