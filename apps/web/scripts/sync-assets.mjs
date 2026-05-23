#!/usr/bin/env node
/**
 * apps/web/scripts/sync-assets.mjs
 *
 * 把仓库根目录的 `assets/<category>/` 拷贝到 `apps/web/public/assets/<category>/`
 * 让 Next.js dev / build 输出阶段都能通过 `/assets/...` 路径直接访问素材。
 *
 * 设计要点：
 *  - 单向同步：source = `<repo>/assets`，target = `<repo>/apps/web/public/assets`
 *  - 仅拷贝 `SYNC_CATEGORIES` 列表中的目录，避免把内部 `_raw/` 等放进 web bundle
 *  - 增量：mtime + size 一致就跳过，避免每次都重写大文件
 *  - 不依赖 npm 包：纯 ESM Node built-ins
 *
 * 由 task 11.7 落地。task 11.4（RenderEngine 加载 tilemap）会复用这份脚本，
 * 因此 SYNC_CATEGORIES 已经把 `tilemaps` / `mascots` 等纳入。
 *
 * 运行：
 *   node apps/web/scripts/sync-assets.mjs              （从仓库根目录）
 *   npm run sync:assets --workspace=@erciyuan/web      （workspace 入口）
 *
 * 退出码：
 *   0 — 同步完成（含全部 skip 的情况）
 *   1 — 源目录缺失或硬错误
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// `apps/web/scripts/` → `apps/web/` → `apps/` → 仓库根
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
const SOURCE_ROOT = path.join(REPO_ROOT, 'assets')
const TARGET_ROOT = path.join(REPO_ROOT, 'apps', 'web', 'public', 'assets')

/**
 * 需要同步到 public/ 的资产类别。
 *  - fallback：任务 11.7 / R29.39–42（Phaser 跑不起来时 DomFallbackStage 用）
 *  - tilemaps：任务 11.4 RenderEngine 加载 town_64x64.tmj + tileset_main.png
 *  - mascots：任务 11.4–11.5 spawnSprite 用 7 类萌宠 sprite sheet
 *  - ui：任务 12 / 13 Bento Grid + Smallville 气泡 / DEGRADED 红条
 *  - fonts：任务 11.3 像素字体 @font-face
 *  - audio：任务 14.6 异世界转生音效 / 弹框 SFX
 */
const SYNC_CATEGORIES = [
  'fallback',
  'tilemaps',
  'mascots',
  'npc',
  'ui',
  'fonts',
  'audio',
]

/** 跳过 procurement / 占位 / 元数据文件，public bundle 里不需要它们。 */
const SKIP_FILE_PATTERNS = [
  /\.PROCUREMENT_PENDING$/i,
  /\.PLACEHOLDER$/i,
  /\.gitkeep$/i,
  /^\.metadata\.json$/i,
]

let copiedCount = 0
let skippedCount = 0
let unchangedCount = 0

/**
 * 递归同步一个目录。
 * 增量策略：mtime + size 一致就跳过；不一致或目标缺失才覆写。
 * 不会反向删除目标里多余的文件（避免误删 11.4 子任务可能直接 vendored 的资源）。
 */
function syncDirectory(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) {
    // 缺源目录不算硬错误：可能某些类别还没采购到位。
    console.warn(`[sync-assets] skip missing source: ${path.relative(REPO_ROOT, srcDir)}`)
    return
  }

  fs.mkdirSync(dstDir, { recursive: true })

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name)
    const dstPath = path.join(dstDir, entry.name)

    if (entry.isDirectory()) {
      syncDirectory(srcPath, dstPath)
      continue
    }

    if (!entry.isFile()) continue

    if (SKIP_FILE_PATTERNS.some((re) => re.test(entry.name))) {
      skippedCount += 1
      continue
    }

    const srcStat = fs.statSync(srcPath)
    let needsCopy = true
    if (fs.existsSync(dstPath)) {
      const dstStat = fs.statSync(dstPath)
      if (
        dstStat.size === srcStat.size &&
        Math.abs(dstStat.mtimeMs - srcStat.mtimeMs) < 1500
      ) {
        needsCopy = false
      }
    }

    if (needsCopy) {
      fs.copyFileSync(srcPath, dstPath)
      // 保留 mtime，让下次 incremental 检查命中。
      fs.utimesSync(dstPath, srcStat.atime, srcStat.mtime)
      copiedCount += 1
    } else {
      unchangedCount += 1
    }
  }
}

function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(
      `[sync-assets] FATAL: source root not found: ${SOURCE_ROOT}\n` +
        `  Did the asset pipeline (Pre-Slice tasks 1–10) run?`,
    )
    process.exit(1)
  }

  console.log(`[sync-assets] source=${path.relative(REPO_ROOT, SOURCE_ROOT)}`)
  console.log(`[sync-assets] target=${path.relative(REPO_ROOT, TARGET_ROOT)}`)
  console.log(`[sync-assets] categories=${SYNC_CATEGORIES.join(', ')}`)

  for (const category of SYNC_CATEGORIES) {
    syncDirectory(
      path.join(SOURCE_ROOT, category),
      path.join(TARGET_ROOT, category),
    )
  }

  console.log(
    `[sync-assets] done. copied=${copiedCount} unchanged=${unchangedCount} skipped=${skippedCount}`,
  )

  // 任务 11.7 硬断言：fallback 里的 town_static_snapshot.png 必须最终落到 public/。
  const fallbackSnapshot = path.join(TARGET_ROOT, 'fallback', 'town_static_snapshot.png')
  if (!fs.existsSync(fallbackSnapshot)) {
    console.error(
      `[sync-assets] FATAL: ${path.relative(REPO_ROOT, fallbackSnapshot)} missing after sync.\n` +
        `  task 11.7 DomFallbackStage 依赖此文件作为底图（R29.42 / design.md §1.8）。`,
    )
    process.exit(1)
  }
}

main()
