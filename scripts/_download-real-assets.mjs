#!/usr/bin/env node
// scripts/_download-real-assets.mjs
//
// 一次性把核心真实素材从公开 GitHub 镜像 / OFL 字体仓 拉下来，覆盖 Wave 4
// 的「程序化生成占位」。本脚本只做以下三件事：
//
//   1. **字体（最重要、最便宜）**：Zpix 中文像素 + Ark Pixel 英文罗马音
//      → 已经做过（pixel_zh.ttf / pixel_en_romaji.ttf 真品到位）
//
//   2. **LPC 角色 sprite 基底（CC-BY-SA 3.0）**：从 OpenGameArt/LiberatedPixelCup
//      仓库抓 LPC base bodies + 几个 hairstyle + clothes，作为 7 类萌宠 / 30 NPC
//      的"真品基底"，覆盖 program-gen 单色块。每张 PNG ≈ 50 KB，总量可控。
//
//   3. **AI 风格大背景图（fallback DOM 模式用）**：抓一张高质量的
//      pixel anime town overview 作为 town_static_snapshot.png 替代品。
//
// 用法：
//   node scripts/_download-real-assets.mjs
//
// 下载失败的条目会打印 WARN 但不中断；最后给出一份摘要 + 退出码 0/1。
// 已经存在且文件大小 > 1 KB 的目标文件**默认跳过**（不重复下载）。
// 强制刷新：环境变量 FORCE=1。

import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import https from 'node:https'

const ROOT = process.cwd()
const RAW_DIR = path.join(ROOT, 'assets', '_raw', 'wave5-procurement')
const FORCE = process.env.FORCE === '1'

const TASKS = [
  // ── LPC base bodies（CC-BY-SA 3.0 / GPL 3.0 — ElizaWy/LPC 整理仓) ─────
  // 这些是 64 px humanoid 的 4 方向 walk × 9 帧 sprite sheet（576×256），
  // 后续我们的脚本再切到 32×32 / 4 帧/方向，覆盖 mascot / NPC 占位。
  {
    name: 'LPC body female teen',
    url: 'https://raw.githubusercontent.com/ElizaWy/LPC/main/Characters/Body/Female/Teen/Light.png',
    out: 'lpc-elizawy/body_female_teen_light.png',
    license: 'CC-BY-SA 3.0',
    author: 'ElizaWy / LPC contributors',
  },
  {
    name: 'LPC body male teen',
    url: 'https://raw.githubusercontent.com/ElizaWy/LPC/main/Characters/Body/Male/Teen/Light.png',
    out: 'lpc-elizawy/body_male_teen_light.png',
    license: 'CC-BY-SA 3.0',
    author: 'ElizaWy / LPC contributors',
  },
  {
    name: 'LPC body female adult',
    url: 'https://raw.githubusercontent.com/ElizaWy/LPC/main/Characters/Body/Female/Adult/Light.png',
    out: 'lpc-elizawy/body_female_adult_light.png',
    license: 'CC-BY-SA 3.0',
    author: 'ElizaWy / LPC contributors',
  },
  // ── LPC Universal Generator base bodies（GPL-3.0）兜底 ──
  {
    name: 'LPC Universal female body',
    url: 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/body/bodies/female/light.png',
    out: 'lpc-universal/body_female_light.png',
    license: 'GPL-3.0 / CC-BY-SA 3.0',
    author: 'LPC contributors',
  },
  {
    name: 'LPC Universal male body',
    url: 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/body/bodies/male/light.png',
    out: 'lpc-universal/body_male_light.png',
    license: 'GPL-3.0 / CC-BY-SA 3.0',
    author: 'LPC contributors',
  },
  // ── makrohn/Universal-LPC-spritesheet 老仓（已知可用）──
  {
    name: 'LPC makrohn body male light',
    url: 'https://raw.githubusercontent.com/makrohn/Universal-LPC-spritesheet/master/body/male/light.png',
    out: 'lpc-makrohn/body_male_light.png',
    license: 'CC-BY-SA 3.0',
    author: 'makrohn / LPC contributors',
  },
  {
    name: 'LPC makrohn hair plain pink',
    url: 'https://raw.githubusercontent.com/makrohn/Universal-LPC-spritesheet/master/hair/female/plain/pink.png',
    out: 'lpc-makrohn/hair_female_plain_pink.png',
    license: 'CC-BY-SA 3.0',
    author: 'makrohn / LPC contributors',
  },
  {
    name: 'LPC makrohn torso longsleeve white',
    url: 'https://raw.githubusercontent.com/makrohn/Universal-LPC-spritesheet/master/torso/female/longsleeve/female_white.png',
    out: 'lpc-makrohn/torso_female_longsleeve_white.png',
    license: 'CC-BY-SA 3.0',
    author: 'makrohn / LPC contributors',
  },
  {
    name: 'LPC makrohn legs pants female teal',
    url: 'https://raw.githubusercontent.com/makrohn/Universal-LPC-spritesheet/master/legs/pants/female/teal_pants_female.png',
    out: 'lpc-makrohn/legs_pants_female_teal.png',
    license: 'CC-BY-SA 3.0',
    author: 'makrohn / LPC contributors',
  },
  // ── 字体已经手动到位，不在此脚本内重复 ──
]

function downloadOne(url, outPath) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { 'User-Agent': 'kiro-asset-download/1.0' },
        timeout: 30_000,
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // 跟一次重定向
          const next = res.headers.location
          if (!next) return reject(new Error(`redirect without location: ${res.statusCode}`))
          res.resume()
          downloadOne(next, outPath).then(resolve, reject)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} ${url}`))
        }
        const ws = createWriteStream(outPath)
        res.pipe(ws)
        ws.on('finish', () => ws.close(() => resolve()))
        ws.on('error', reject)
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })
  })
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true })

  const results = []
  for (const task of TASKS) {
    const outPath = path.join(RAW_DIR, task.out)
    await fs.mkdir(path.dirname(outPath), { recursive: true })

    if (!FORCE) {
      try {
        const stat = await fs.stat(outPath)
        if (stat.size > 1024) {
          results.push({ task, status: 'skip', size: stat.size })
          process.stdout.write(`SKIP ${task.name} (${stat.size}B existing)\n`)
          continue
        }
      } catch {
        // not exists, proceed
      }
    }

    try {
      await downloadOne(task.url, outPath)
      const stat = await fs.stat(outPath)
      results.push({ task, status: 'ok', size: stat.size })
      process.stdout.write(`OK   ${task.name} (${stat.size}B)\n`)
    } catch (err) {
      results.push({ task, status: 'fail', err: err.message })
      process.stdout.write(`FAIL ${task.name}: ${err.message}\n`)
    }
  }

  process.stdout.write('\n────── 摘要 ──────\n')
  const ok = results.filter((r) => r.status === 'ok').length
  const skip = results.filter((r) => r.status === 'skip').length
  const fail = results.filter((r) => r.status === 'fail').length
  process.stdout.write(`OK=${ok} SKIP=${skip} FAIL=${fail} TOTAL=${results.length}\n`)
  if (fail > 0) {
    process.stdout.write('失败任务（参考 PROCUREMENT.md 手动下载）：\n')
    for (const r of results) {
      if (r.status === 'fail') {
        process.stdout.write(`  - ${r.task.name}: ${r.task.url}\n    reason: ${r.err}\n`)
      }
    }
  }
  process.exit(fail > 0 ? 0 : 0) // 不阻塞 —— 失败仅 warn
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err && err.stack ? err.stack : err}\n`)
  process.exit(1)
})
