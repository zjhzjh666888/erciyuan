/**
 * scripts/check-assets.ts
 *
 * 资产清单启动校验脚本（design.md §5.1 + R29.49–56）
 *
 * 用法：
 *   npm run check:assets           # 普通模式（不校验 hash）
 *   npm run check:assets:strict    # 严格模式（STRICT_HASH=true，校验 sha256）
 *
 * 退出码：
 *   0  全部断言通过
 *   1  任一致命错误（缺资产 / license 缺失 / 体积超限 / hash 不匹配）
 *
 * 设计要点：
 *   - 单一事实来源：assets/MANIFEST.yaml
 *   - 拒绝 silent fallback：缺资产必须显式 fatal（R29.51）
 *   - 不依赖网络、不依赖 Phaser/React/Node fs.watch；纯同步 IO
 *   - Pre-Slice 早期 manifest 可能为空（assets: []），脚本须允许通过以便
 *     predev / prebuild 钩子在任务 1.6 之后即可工作；类别下限聚合检查
 *     由任务 10.1 引入的 strict 通道延后执行（详见 MANIFEST_VERSION_THRESHOLD）
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

// ───────────────────────────────────────────────────────────────────
// 类型定义（与 design.md §Asset Manifest Data Model 一致）
// ───────────────────────────────────────────────────────────────────

type AssetCategory =
  | 'tilemap'
  | 'mascot'
  | 'npc'
  | 'ui'
  | 'audio'
  | 'font'
  | 'fallback'
  | 'mock'
  | 'mock-data'

type LicenseType =
  | 'CC0'
  | 'CC-BY'
  | 'CC-BY-SA'
  | 'GPL'
  | 'OFL'
  | 'Pixabay'
  | 'Unsplash'
  | 'SELF'

interface AssetEntry {
  path: string
  category: AssetCategory
  hash?: string
  size_kb: number
  license: LicenseType | string
  source_url: string
  author: string
  required_for_demo: boolean
  // 类别专属可选字段
  mascot_type?: string
  frame?: string
  persona_tag?: string
  npc_index?: number
  landmark_for_zone?: string
}

interface AssetManifest {
  version: number
  generated_at?: string
  total_count?: number
  total_size_kb?: number
  assets: AssetEntry[]
}

// ───────────────────────────────────────────────────────────────────
// 常量与体积上限（R29.53–56）
// ───────────────────────────────────────────────────────────────────

/** 单文件硬上限（R29.53） */
const MAX_FILE_KB = 1024

/** tileset 体积上限（R29.54） */
const MAX_TILESET_KB = 512

/** sprite sheet 体积上限（R29.55） */
const MAX_SPRITE_SHEET_KB = 256

/**
 * 字体单文件体积上限（R29.53 在视觉资产语境下设为 1 MB；字体文件天然
 * 较大——例如 Vonwaon / Ark Pixel 覆盖完整 GB2312 字符集时常达数 MB——
 * 因此对 category=font 的条目放宽到 8 MB，仍受总包 50 MB 上限约束）。
 */
const MAX_FONT_KB = 8 * 1024

/** 总包体积上限（R29.56） */
const MAX_TOTAL_KB = 50 * 1024

/**
 * 每类别软上限（task 10.4）。
 *
 * R29.56 把"总包 ≤ 50 MB"定义为硬上限，超出即 fail。为防止某一类素材
 * 单方面吞掉预算（例如音乐 BGM 不慎打包未压缩 wav），下表对每个类别
 * 设软上限：超过即 warn，但不阻塞构建。这些数值是 design.md §5.1 与
 * Pre-Slice 资产采购的工程经验值，加总（5 + 5 + 8 + 15 + 15 + 余量）
 * 仍小于 50 MB 总上限。
 */
const CATEGORY_SOFT_CAPS_KB: Record<string, number> = {
  audio: 5 * 1024,
  ui: 5 * 1024,
  font: 8 * 1024,
  mascot: 15 * 1024,
  npc: 15 * 1024,
  // 以下类别没有显式软上限；体积通常很小，仅受总包 50 MB 约束。
  tilemap: 5 * 1024,
  fallback: 2 * 1024,
  mock: 2 * 1024,
  'mock-data': 2 * 1024,
}

/** size_kb 与磁盘实际大小允许的偏差（KB） */
const SIZE_TOLERANCE_KB = 4

/**
 * Manifest 版本阈值：assets 数组非空时执行类别聚合检查；
 * 当前阶段（任务 1.4）仅校验 schema、单文件约束与总包体积，
 * 类别下限聚合检查由任务 10.1 严格门槛承接。
 */
const MANIFEST_VERSION_THRESHOLD = 1

// ───────────────────────────────────────────────────────────────────
// 路径解析：定位 repo 根（支持从任意 cwd 调用）
// ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(REPO_ROOT, 'assets')
const MANIFEST_PATH = path.join(ASSETS_DIR, 'MANIFEST.yaml')

// ───────────────────────────────────────────────────────────────────
// 日志工具
// ───────────────────────────────────────────────────────────────────

const errors: string[] = []
const warnings: string[] = []

function fatal(msg: string): never {
  console.error('❌', msg)
  process.exit(1)
}

function recordError(msg: string): void {
  errors.push(msg)
  console.error('❌', msg)
}

function recordWarn(msg: string): void {
  warnings.push(msg)
  console.warn('⚠', msg)
}

function info(msg: string): void {
  console.log('ℹ', msg)
}

// ───────────────────────────────────────────────────────────────────
// Schema 校验
// ───────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set<AssetCategory>([
  'tilemap',
  'mascot',
  'npc',
  'ui',
  'audio',
  'font',
  'fallback',
  'mock',
  'mock-data',
])

function validateManifestShape(raw: unknown): asserts raw is AssetManifest {
  if (raw === null || typeof raw !== 'object') {
    fatal('MANIFEST.yaml 顶层结构必须是对象')
  }
  const m = raw as Record<string, unknown>
  if (typeof m.version !== 'number') {
    fatal('MANIFEST.yaml 缺少 version 字段或类型不正确')
  }
  if (!Array.isArray(m.assets)) {
    fatal('MANIFEST.yaml 缺少 assets 数组')
  }
}

function validateAssetEntry(a: AssetEntry, idx: number): void {
  const tag = `assets[${idx}] (${a.path ?? '<no-path>'})`

  if (typeof a.path !== 'string' || a.path.trim() === '') {
    recordError(`${tag} 缺少 path 字段`)
    return
  }
  if (typeof a.category !== 'string' || !VALID_CATEGORIES.has(a.category)) {
    recordError(`${tag} category 字段非法：${String(a.category)}`)
  }
  if (typeof a.size_kb !== 'number' || a.size_kb < 0) {
    recordError(`${tag} size_kb 字段缺失或非法`)
  }
  // license 非空（R29.52）
  if (typeof a.license !== 'string' || a.license.trim() === '') {
    recordError(`${tag} 缺 license（R29.52）`)
  }
  // 第三方资产必须有 source_url
  if (
    typeof a.license === 'string' &&
    a.license !== 'SELF' &&
    (typeof a.source_url !== 'string' || a.source_url.trim() === '')
  ) {
    recordError(`${tag} 第三方资产缺 source_url（license=${a.license}）`)
  }
  if (typeof a.author !== 'string' || a.author.trim() === '') {
    recordError(`${tag} 缺 author 署名`)
  }
  if (typeof a.required_for_demo !== 'boolean') {
    recordError(`${tag} required_for_demo 字段缺失或非布尔`)
  }
}

// ───────────────────────────────────────────────────────────────────
// 文件级校验（存在性 + size + hash + 子类别上限）
// ───────────────────────────────────────────────────────────────────

function isTilesetMain(a: AssetEntry): boolean {
  return a.category === 'tilemap' && /tileset_main/i.test(a.path)
}

function isSpriteSheet(a: AssetEntry): boolean {
  if (a.category !== 'mascot' && a.category !== 'npc') return false
  const frame = a.frame ?? ''
  return /walk|sheet/i.test(frame) || /walk|sheet/i.test(a.path)
}

function validateAssetFile(a: AssetEntry): void {
  const tag = `${a.path}`
  const abs = path.join(ASSETS_DIR, a.path)

  if (!fs.existsSync(abs)) {
    if (a.required_for_demo) {
      recordError(`资产缺失（required_for_demo=true）：${tag}（R29.51 拒绝 silent fallback）`)
    } else {
      recordWarn(`资产缺失（required_for_demo=false）：${tag}`)
    }
    return
  }

  const buf = fs.readFileSync(abs)
  const actualSizeKb = Math.round(buf.length / 1024)

  if (
    typeof a.size_kb === 'number' &&
    Math.abs(actualSizeKb - a.size_kb) > SIZE_TOLERANCE_KB
  ) {
    recordWarn(
      `${tag} size 偏差超容差：manifest=${a.size_kb}KB actual=${actualSizeKb}KB（容差±${SIZE_TOLERANCE_KB}KB）`,
    )
  }

  // 单文件 ≤ 1 MB（R29.53），字体特例放宽到 MAX_FONT_KB
  const fileMaxKb = a.category === 'font' ? MAX_FONT_KB : MAX_FILE_KB
  if (actualSizeKb > fileMaxKb) {
    recordError(`${tag} 单文件 ${actualSizeKb}KB > ${fileMaxKb}KB（R29.53${a.category === 'font' ? ' · font 类别上限' : ''}）`)
  }

  // tileset_main ≤ 512 KB（R29.54）
  if (isTilesetMain(a) && actualSizeKb > MAX_TILESET_KB) {
    recordError(`${tag} tileset 主表 ${actualSizeKb}KB > ${MAX_TILESET_KB}KB（R29.54）`)
  }

  // sprite sheet ≤ 256 KB（R29.55）
  if (isSpriteSheet(a) && actualSizeKb > MAX_SPRITE_SHEET_KB) {
    recordError(
      `${tag} sprite sheet ${actualSizeKb}KB > ${MAX_SPRITE_SHEET_KB}KB（R29.55）`,
    )
  }

  // strict 模式：sha256 必须一致
  if (process.env.STRICT_HASH === 'true') {
    if (typeof a.hash !== 'string' || a.hash.trim() === '') {
      recordError(`${tag} STRICT_HASH 模式下缺 hash 字段`)
    } else {
      const actualHash = 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
      if (actualHash !== a.hash) {
        recordError(`${tag} hash 不匹配 manifest=${a.hash} actual=${actualHash}`)
      }
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// 总包体积聚合 + 类别统计摘要
// ───────────────────────────────────────────────────────────────────

interface CategoryStats {
  count: number
  /** 来自 manifest size_kb 字段的累计（KB，向上整数） */
  manifestSizeKb: number
  /** 实际磁盘字节累计（精确到字节） */
  diskBytes: number
}

function diskBytesOf(a: AssetEntry): number {
  if (typeof a.path !== 'string') return 0
  const abs = path.join(ASSETS_DIR, a.path)
  try {
    const stat = fs.statSync(abs)
    return stat.size
  } catch {
    return 0
  }
}

function summarize(manifest: AssetManifest): {
  totalKb: number
  totalDiskBytes: number
  byCategory: Map<string, CategoryStats>
} {
  const byCategory = new Map<string, CategoryStats>()
  let totalKb = 0
  let totalDiskBytes = 0
  for (const a of manifest.assets) {
    const sz = typeof a.size_kb === 'number' ? a.size_kb : 0
    totalKb += sz
    const diskSz = diskBytesOf(a)
    totalDiskBytes += diskSz
    const cat = a.category ?? '<unknown>'
    const cur = byCategory.get(cat) ?? {
      count: 0,
      manifestSizeKb: 0,
      diskBytes: 0,
    }
    cur.count += 1
    cur.manifestSizeKb += sz
    cur.diskBytes += diskSz
    byCategory.set(cat, cur)
  }
  return { totalKb, totalDiskBytes, byCategory }
}

function statusForCategory(cat: string, diskKb: number): 'pass' | 'warn' | 'n/a' {
  const cap = CATEGORY_SOFT_CAPS_KB[cat]
  if (typeof cap !== 'number') return 'n/a'
  return diskKb > cap ? 'warn' : 'pass'
}

function printSummary(manifest: AssetManifest): void {
  const { totalKb, totalDiskBytes, byCategory } = summarize(manifest)
  const totalDiskKb = Math.round(totalDiskBytes / 1024)
  const totalMb = (totalDiskKb / 1024).toFixed(2)
  const totalManifestMb = (totalKb / 1024).toFixed(2)

  console.log('')
  console.log('────── 资产清单摘要 ──────')
  console.log(`总资产数：${manifest.assets.length}`)
  console.log(
    `总体积  ：disk=${totalDiskKb} KB（${totalMb} MB） / manifest=${totalKb} KB（${totalManifestMb} MB）  上限=${MAX_TOTAL_KB / 1024} MB`,
  )
  if (byCategory.size > 0) {
    console.log('分类别（disk 实测 / 软上限 / 状态）：')
    const sorted = Array.from(byCategory.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    for (const [cat, stats] of sorted) {
      const diskKb = Math.round(stats.diskBytes / 1024)
      const cap = CATEGORY_SOFT_CAPS_KB[cat]
      const capStr = typeof cap === 'number' ? `${cap} KB` : 'n/a'
      const status = statusForCategory(cat, diskKb)
      const icon = status === 'warn' ? '⚠' : status === 'pass' ? '✓' : '·'
      console.log(
        `  ${icon} ${cat.padEnd(12, ' ')} count=${String(stats.count).padStart(4, ' ')}   disk=${String(diskKb).padStart(6, ' ')} KB   cap=${capStr.padStart(10, ' ')}`,
      )
    }
  }
  console.log('──────────────────────────')
}

// ───────────────────────────────────────────────────────────────────
// 体积上限断言（task 10.4 / R29.56 + 类别软上限）
// ───────────────────────────────────────────────────────────────────

/**
 * 在 main() 流程中对总包与各类别体积做断言：
 * - 总包 disk > 50 MB → recordError（fail，R29.56）
 * - 类别 disk > 软上限 → recordWarn（task 10.4 子任务说明：超出则压缩或剔除非 required_for_demo）
 *
 * 同时 manifest size_kb 累计也参与总包断言，保留与 design.md §5.1 第 5 步一致的兜底校验。
 */
function assertSizeBudget(manifest: AssetManifest): void {
  const { totalKb, totalDiskBytes, byCategory } = summarize(manifest)
  const totalDiskKb = Math.round(totalDiskBytes / 1024)

  if (totalDiskKb > MAX_TOTAL_KB) {
    recordError(
      `总包磁盘体积 ${(totalDiskKb / 1024).toFixed(2)}MB > ${MAX_TOTAL_KB / 1024}MB（R29.56 / task 10.4）`,
    )
  }
  if (totalKb > MAX_TOTAL_KB) {
    recordError(
      `总包 manifest 体积 ${(totalKb / 1024).toFixed(2)}MB > ${MAX_TOTAL_KB / 1024}MB（R29.56）`,
    )
  }

  for (const [cat, stats] of byCategory.entries()) {
    const cap = CATEGORY_SOFT_CAPS_KB[cat]
    if (typeof cap !== 'number') continue
    const diskKb = Math.round(stats.diskBytes / 1024)
    if (diskKb > cap) {
      recordWarn(
        `类别 ${cat} 体积 ${diskKb} KB > 软上限 ${cap} KB（task 10.4 — 建议压缩或剔除非 required_for_demo）`,
      )
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// SIZE_BUDGET.md 输出（task 10.4）
// ───────────────────────────────────────────────────────────────────

const SIZE_BUDGET_PATH = path.join(ASSETS_DIR, 'SIZE_BUDGET.md')

function fmtKb(kb: number): string {
  return kb.toLocaleString('en-US')
}

function fmtMb(kb: number): string {
  return (kb / 1024).toFixed(2)
}

function writeSizeBudgetMarkdown(manifest: AssetManifest): void {
  const { totalKb, totalDiskBytes, byCategory } = summarize(manifest)
  const totalDiskKb = Math.round(totalDiskBytes / 1024)
  const totalStatus = totalDiskKb > MAX_TOTAL_KB ? 'fail' : 'pass'

  const sortedCats = Array.from(byCategory.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )

  const lines: string[] = []
  lines.push('# 资产体积预算 / SIZE_BUDGET')
  lines.push('')
  lines.push(
    '> 由 `scripts/check-assets.ts` 在每次 `npm run check:assets -- --write-budget-md` 时重新生成。',
  )
  lines.push(
    '> 关联条款：requirements.md R29.53–56（单文件 ≤ 1 MB、tileset ≤ 512 KB、sprite sheet ≤ 256 KB、总包 ≤ 50 MB）。',
  )
  lines.push('> 关联任务：tasks.md 10.4 检查体积上限。')
  lines.push('')
  lines.push(`- 生成时间：${new Date().toISOString()}`)
  lines.push(`- Manifest version：${manifest.version}`)
  lines.push(`- 总资产数：${manifest.assets.length}`)
  lines.push(
    `- **总体积（磁盘实测）**：${fmtKb(totalDiskKb)} KB / ${fmtMb(totalDiskKb)} MB`,
  )
  lines.push(
    `- **总体积（manifest 累计）**：${fmtKb(totalKb)} KB / ${fmtMb(totalKb)} MB`,
  )
  lines.push(`- **硬上限（R29.56）**：${MAX_TOTAL_KB} KB / 50.00 MB`)
  lines.push(
    `- **状态**：${totalStatus === 'pass' ? '✅ pass（总包 ≤ 50 MB）' : '❌ fail（总包 > 50 MB，必须压缩或剔除）'}`,
  )
  lines.push('')
  lines.push('## 分类别体积明细')
  lines.push('')
  lines.push(
    '| 类别 | 数量 | 磁盘体积 (KB) | 磁盘体积 (MB) | 软上限 (KB) | 状态 |',
  )
  lines.push(
    '| --- | ---: | ---: | ---: | ---: | --- |',
  )
  for (const [cat, stats] of sortedCats) {
    const diskKb = Math.round(stats.diskBytes / 1024)
    const cap = CATEGORY_SOFT_CAPS_KB[cat]
    const capStr = typeof cap === 'number' ? fmtKb(cap) : 'n/a'
    const status = statusForCategory(cat, diskKb)
    const statusStr =
      status === 'pass'
        ? '✅ pass'
        : status === 'warn'
          ? '⚠ warn'
          : '· n/a'
    lines.push(
      `| ${cat} | ${stats.count} | ${fmtKb(diskKb)} | ${fmtMb(diskKb)} | ${capStr} | ${statusStr} |`,
    )
  }
  // 汇总行
  lines.push(
    `| **合计** | **${manifest.assets.length}** | **${fmtKb(totalDiskKb)}** | **${fmtMb(totalDiskKb)}** | **${fmtKb(MAX_TOTAL_KB)} (硬上限)** | **${totalStatus === 'pass' ? '✅ pass' : '❌ fail'}** |`,
  )
  lines.push('')
  lines.push('## 单文件硬约束')
  lines.push('')
  lines.push('| 约束 | 上限 | 关联条款 |')
  lines.push('| --- | ---: | --- |')
  lines.push(`| 单文件（视觉资产） | ${MAX_FILE_KB} KB | R29.53 |`)
  lines.push(`| 字体单文件 | ${MAX_FONT_KB} KB | R29.53（字体特例） |`)
  lines.push(`| tileset 主表 | ${MAX_TILESET_KB} KB | R29.54 |`)
  lines.push(`| sprite sheet | ${MAX_SPRITE_SHEET_KB} KB | R29.55 |`)
  lines.push(`| 总包 | ${MAX_TOTAL_KB} KB / 50 MB | R29.56 |`)
  lines.push('')
  lines.push('## 状态约定')
  lines.push('')
  lines.push('- `✅ pass`：当前体积低于该类别软上限。')
  lines.push(
    '- `⚠ warn`：超过类别软上限，但仍未触及总包硬上限——建议压缩纹理或剔除 `required_for_demo=false` 的条目（task 10.4）。',
  )
  lines.push(
    '- `❌ fail`：总包磁盘体积超过 R29.56 的 50 MB 硬上限——`npm run check:assets` 退出码 1，必须立即治理。',
  )
  lines.push(
    '- `· n/a`：当前类别未设软上限（体积可忽略），仅受总包约束。',
  )
  lines.push('')

  fs.writeFileSync(SIZE_BUDGET_PATH, lines.join('\n'), 'utf-8')
  info(`SIZE_BUDGET.md 已写出：${path.relative(REPO_ROOT, SIZE_BUDGET_PATH)}`)
}

// ───────────────────────────────────────────────────────────────────
// 主流程
// ───────────────────────────────────────────────────────────────────

function main(): void {
  // 1. 加载 MANIFEST.yaml
  if (!fs.existsSync(MANIFEST_PATH)) {
    fatal('assets/MANIFEST.yaml 不存在，请先执行 task 1.6')
  }

  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8')
  let parsed: unknown
  try {
    parsed = yaml.load(raw)
  } catch (e) {
    fatal(`MANIFEST.yaml 解析失败：${(e as Error).message}`)
  }

  validateManifestShape(parsed)
  const manifest = parsed

  // 2. 早期空 manifest 通路（Pre-Slice 任务 1.6 之后、任务 2–9 之前）
  if (manifest.assets.length === 0) {
    info(
      'assets/MANIFEST.yaml 当前为空（Pre-Slice 阶段，资产采购任务 2–9 尚未完成）',
    )
    info(`schema version=${manifest.version}（threshold=${MANIFEST_VERSION_THRESHOLD}）`)
    printSummary(manifest)
    console.log('✅ check:assets passed (empty manifest, schema-only validation)')
    process.exit(0)
  }

  // 3. 逐条 schema 校验
  manifest.assets.forEach((a, i) => validateAssetEntry(a, i))

  // 4. 逐条文件级校验（存在性 / 体积 / hash / 子类别上限）
  for (const a of manifest.assets) {
    if (typeof a.path !== 'string') continue
    validateAssetFile(a)
  }

  // 5. 总包 + 类别软上限断言（task 10.4 / R29.56）
  assertSizeBudget(manifest)

  // 6. 类别下限聚合检查（任务 10.1 严格门槛承接）
  //    当前阶段（任务 1.4）保留聚合检查的脚手架；
  //    具体的类别 A–L 数量断言在任务 10.1 通过 `npm run check:assets:strict`
  //    与 tests/asset-manifest.test.ts 共同覆盖（避免重复实现）。
  if (process.env.STRICT_HASH === 'true') {
    info('STRICT_HASH 模式：聚合类别下限检查由 tests/asset-manifest.test.ts 承担')
  }

  // 7. 摘要输出
  printSummary(manifest)

  // 7.5 可选：写出 assets/SIZE_BUDGET.md（task 10.4）
  //     CLI flag `--write-budget-md` 或环境变量 WRITE_BUDGET_MD=true
  const writeBudgetMd =
    process.argv.includes('--write-budget-md') ||
    process.env.WRITE_BUDGET_MD === 'true'
  if (writeBudgetMd) {
    writeSizeBudgetMarkdown(manifest)
  }

  // 8. 收尾
  if (errors.length > 0) {
    console.error('')
    console.error(`❌ check:assets failed (${errors.length} error(s), ${warnings.length} warning(s))`)
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.warn(`⚠ ${warnings.length} warning(s)，建议修复但不阻塞`)
  }
  console.log('✅ check:assets passed')
  process.exit(0)
}

try {
  main()
} catch (e) {
  fatal(`脚本异常：${(e as Error).message}`)
}
