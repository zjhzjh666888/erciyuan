#!/usr/bin/env node
/**
 * scripts/_register-assets.mjs
 *
 * Scans assets/ recursively, computes sha256 + size_kb for each file,
 * derives an AssetEntry, and writes assets/MANIFEST.yaml.
 *
 * Wave 4 supersedes Wave 3:
 *   • placeholder PNGs/SVGs/TMJ are now real procedural pixel art
 *   • the sprites/_placeholder/ tree is deleted
 *   • mascots/, npc/, tilemaps/landmarks/ are populated
 *
 * Header comments from the previous MANIFEST.yaml are preserved.
 *
 * No external deps — pure ESM Node built-ins.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS = path.join(REPO_ROOT, 'assets')
const MANIFEST_PATH = path.join(ASSETS, 'MANIFEST.yaml')
const MOCK_TOWN_SRC = path.join(REPO_ROOT, 'packages', 'mock-town', 'src')

// ───────────────────────────────────────────────────────────────────
// Header (kept verbatim from the previous manifest, with a Wave 4 note)
// ───────────────────────────────────────────────────────────────────
const HEADER = `# =============================================================================
# Asset Manifest — anime-agent-town / 次元萌宠小镇
# -----------------------------------------------------------------------------
# 单一事实来源（Single Source of Truth）：本仓库内全部素材的 metadata 登记表。
#
# 验证脚本：scripts/check-assets.ts        （由 task 1.4 实现）
# 启动钩子：predev / prebuild / predemo    （由 task 1.5 配置）
# 命令入口：npm run check:assets           （非 strict）
#           npm run check:assets:strict    （含 hash 严格匹配）
#
# 设计参考：design.md §5.2  /  requirements.md R29.43–56
# 命名规范：requirements.md R29.48
# =============================================================================
#
# 字段定义（必填）：
#   path:               相对 assets/ 的路径，例 "mascots/cat_lore/idle.png"
#   category:           资产分类，枚举值（详见下方 ALLOWED CATEGORIES）
#   hash:               sha256:<hex>，用于 strict 模式逐字节校验
#   size_kb:            实际文件大小（KB，整数；允许 ±4 KB 抖动以容纳 hash 重算）
#   license:            许可证标识，枚举值（详见下方 ALLOWED LICENSES）
#   source_url:         第三方资产必填 URL；SELF 资产填空字符串 ""
#   author:             第三方作者署名；SELF 资产填 "anime-agent-town team"
#   required_for_demo:  布尔；true 时缺失则启动 fail（R29.50–52）
#
# 字段定义（类别专属，可选）：
#   mascot_type:        7 类萌宠之一：cat_lore | dog_social | hamster_hoard
#                       | fox_create | slime_newbie | wolf_limited | pigeon_buzz
#   frame:              帧位 / 形态：idle | portrait_64 | walk_{dir}_{nn}
#                       | action_{kind}_{nn} 等
#   persona_tag:        6 类 NPC 戏路：tsundere | yandere | tennen
#                       | chuuni | sanmu | hara_guro
#   npc_index:          整数 1–N，同 persona_tag 下 NPC 序号
#   landmark_for_zone:  7 大功能区之一：Convention_Plaza | Cos_Studio
#                       | Goods_Bazaar | Doujin_Atelier | Newbie_Lobby
#                       | Limited_Info_House | Buzz_Square
#   notes:              自由文本备注；占位资产用 'placeholder' 标记
#
# -----------------------------------------------------------------------------
# ALLOWED CATEGORIES (8)
#   tilemap     — 主地图、tileset、地标精灵（task 2 / 3）
#   mascot      — 7 类萌宠精灵 + 立绘（task 4）
#   npc         — 6 类 persona NPC 精灵（task 5）
#   ui          — 气泡 / 红条 / 图标 / 卡片纹理 / 转生粒子（task 6）
#   audio       — 转生音效 / SFX / BGM（task 7.1–7.4）
#   font        — 中文 / 英文像素字体（task 7.5–7.6）
#   fallback    — 异常场景插画 + 全镇静态截图（task 8）
#   mock-data   — packages/mock-town/src/*.ts（task 9）
#
# ALLOWED LICENSES (8)
#   CC0         — 公有领域，无署名义务
#   CC-BY       — 必须在 README#Credits 署名
#   CC-BY-SA    — 必须署名 + 派生作品同许可证
#   GPL         — Tiled / LPC 等含 GPL 资源
#   OFL         — Open Font License（Ark Pixel / Zpix 等）
#   Pixabay     — Pixabay License，免费商用免署名
#   Unsplash    — Unsplash License，仅用于 mock 缩略图占位
#   SELF        — 团队自制（anime-agent-town team）
#
# -----------------------------------------------------------------------------
# Wave 4 — procedural pixel-art upgrade (tasks 2.4 / 2.5 / 3.1 / 4.4 / 5.3 / 6.3
#   / 6.4 / 6.5 / 6.6 / 6.7 / 6.8). All visual placeholders are now structured
#   pixel art emitted by scripts/_generate-real-assets.mjs. Audio + Chinese
#   font remain pending external download (see PROCUREMENT.md).
#
# Wave 5 — mock-town source registration (task 9.11). Files under
#   packages/mock-town/src/*.ts are registered with paths relative to assets/
#   using the convention "../packages/mock-town/src/<name>.ts", so the
#   existing check-assets.ts resolver (path.join(ASSETS_DIR, a.path)) finds
#   them without modification. category=mock-data, license=SELF.
# =============================================================================
`

// ───────────────────────────────────────────────────────────────────
// Walk assets/ and gather every regular file (skip _raw, .gitkeep,
// .PROCUREMENT_PENDING markers, MANIFEST.yaml, PROCUREMENT.md, .metadata.json,
// .PLACEHOLDER files).
// ───────────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['_raw', 'mock-thumbnails'])
const SKIP_FILE_NAMES = new Set([
  'MANIFEST.yaml', 'PROCUREMENT.md', '.gitkeep', '.metadata.json',
])
const SKIP_SUFFIXES = ['.PLACEHOLDER']

function walk(dir, rel = '') {
  const out = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.PROCUREMENT_PENDING') {
      // Allow .PROCUREMENT_PENDING through; skip other dotfiles
      if (SKIP_FILE_NAMES.has(e.name)) continue
    }
    const full = path.join(dir, e.name)
    const r = rel ? `${rel}/${e.name}` : e.name
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      out.push(...walk(full, r))
    } else if (e.isFile()) {
      if (SKIP_FILE_NAMES.has(e.name)) continue
      if (SKIP_SUFFIXES.some(s => e.name.endsWith(s))) continue
      out.push({ abs: full, rel: r.replace(/\\/g, '/') })
    }
  }
  return out
}

// ───────────────────────────────────────────────────────────────────
// Classify a file into an AssetEntry
// ───────────────────────────────────────────────────────────────────
function categorize(rel) {
  if (rel.startsWith('../packages/mock-town/')) return 'mock-data'
  const parts = rel.split('/')
  const top = parts[0]
  switch (top) {
    case 'tilemaps':   return 'tilemap'
    case 'mascots':    return 'mascot'
    case 'npc':        return 'npc'
    case 'ui':         return 'ui'
    case 'audio':      return 'audio'
    case 'fonts':      return 'font'
    case 'fallback':   return 'fallback'
    case 'sprites':    return 'mascot'  // legacy fallback path
    default:           return 'ui'
  }
}

function deriveExtras(rel) {
  // Returns { mascot_type, frame, persona_tag, npc_index, landmark_for_zone }
  const extras = {}
  const parts = rel.split('/')

  // mascots/{type}/{frame}.png
  if (parts[0] === 'mascots' && parts.length === 3) {
    extras.mascot_type = parts[1]
    extras.frame = parts[2].replace(/\.png$/, '')
  }
  // npc/{persona}/{slot}/{frame}.png
  if (parts[0] === 'npc' && parts.length === 4) {
    extras.persona_tag = parts[1]
    extras.npc_index = parseInt(parts[2], 10)
    extras.frame = parts[3].replace(/\.png$/, '')
  }
  // tilemaps/landmarks/landmark_{name}.png → derive zone
  if (parts[0] === 'tilemaps' && parts[1] === 'landmarks') {
    const fname = parts[2] || ''
    const map = {
      landmark_convention_arch: 'Convention_Plaza',
      landmark_cos_studio_reflector: 'Cos_Studio',
      landmark_goods_shelf: 'Goods_Bazaar',
      landmark_doujin_easel: 'Doujin_Atelier',
      landmark_newbie_signpost: 'Newbie_Lobby',
      landmark_limited_sniper_tower: 'Limited_Info_House',
      landmark_buzz_tv_wall: 'Buzz_Square',
    }
    const key = fname.replace(/\.png$/, '')
    if (map[key]) extras.landmark_for_zone = map[key]
  }
  return extras
}

function deriveRequiredForDemo(rel) {
  // .PROCUREMENT_PENDING markers are not required for demo
  if (rel.endsWith('.PROCUREMENT_PENDING')) return false
  // pixel_zh.ttf.PLACEHOLDER is a marker, but skipped above. Real font:
  if (rel === 'fonts/pixel_zh.ttf') return true
  if (rel.startsWith('audio/')) return false // audio still pending download
  // mock-town source files — required for A-link mock playback (R29.57–59)
  if (rel.startsWith('../packages/mock-town/')) return true
  return true
}

function deriveLicense(rel) {
  // Fonts already populated have known licenses (.metadata.json scratch)
  if (rel === 'fonts/pixel_en_romaji.ttf') return 'OFL'
  if (rel === 'fonts/pixel_zh.ttf') return 'CC0'
  return 'SELF'
}

function deriveAuthor(rel) {
  if (rel === 'fonts/pixel_en_romaji.ttf') return 'TakWolf'
  if (rel === 'fonts/pixel_zh.ttf') return 'Haoyu Qiu'
  return 'anime-agent-town team'
}

function deriveSourceUrl(rel) {
  if (rel === 'fonts/pixel_en_romaji.ttf') return 'https://github.com/TakWolf/ark-pixel-font'
  if (rel === 'fonts/pixel_zh.ttf') return 'https://timothyqiu.itch.io/vonwaon-bitmap'
  return ''
}

function deriveNotes(rel) {
  if (rel.endsWith('.PROCUREMENT_PENDING')) return 'pending download — see PROCUREMENT.md tasks 7.1–7.4'
  if (rel.startsWith('../packages/mock-town/')) return 'task 9.11 — mock-town npm package source (out-of-tree, path relative to assets/)'
  if (rel.startsWith('mascots/'))  return 'Wave 4 procedural pixel art — replace with hand-drawn art for higher quality'
  if (rel.startsWith('npc/'))      return 'Wave 4 procedural pixel art — replace with hand-drawn art for higher quality'
  if (rel.startsWith('tilemaps/landmarks/')) return 'Wave 4 procedural pixel art — replace with hand-drawn art for higher quality'
  if (rel === 'tilemaps/tileset_main.png') return 'Wave 4 procedural — 8×8 grid of 32×32 tiles (64 distinct tiles); replace with hand-drawn art for higher quality'
  if (rel === 'tilemaps/town_64x64.tmj')   return 'Wave 4 procedural — Tiled 1.10 schema with Ground/Decoration/Collision layers + zone bounds metadata'
  if (rel.startsWith('ui/icons_mascot/'))     return 'Wave 4 procedural SVG icon'
  if (rel.startsWith('ui/icons_companion/'))  return 'Wave 4 procedural SVG icon'
  if (rel === 'ui/speech_bubble.svg')   return 'Wave 4 — Smallville-style white bubble with bottom tail and drop shadow'
  if (rel === 'ui/degraded_banner.svg') return 'Wave 4 — DEGRADED MODE banner with red→orange gradient'
  if (rel === 'ui/glass_card_bg.png')   return 'Wave 4 — 128×128 noise texture for Glassmorphism cards'
  if (rel.startsWith('ui/isekai_particles/')) return 'Wave 4 — isekai transmigration particle'
  if (rel.startsWith('fallback/'))      return 'placeholder — replace with final art per task 8.x and 11.8'
  return ''
}

// ───────────────────────────────────────────────────────────────────
// Build entries
// ───────────────────────────────────────────────────────────────────
function buildEntries() {
  const files = walk(ASSETS)
  // Mock-town npm package source files (task 9.11) — registered with paths
  // relative to assets/, using a leading `../packages/mock-town/...` convention
  // so check-assets.ts resolves them correctly via path.join(ASSETS_DIR, a.path).
  if (fs.existsSync(MOCK_TOWN_SRC)) {
    const mockFiles = fs
      .readdirSync(MOCK_TOWN_SRC, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.ts'))
      .map((e) => ({
        abs: path.join(MOCK_TOWN_SRC, e.name),
        rel: `../packages/mock-town/src/${e.name}`,
      }))
    files.push(...mockFiles)
  }
  files.sort((a, b) => a.rel.localeCompare(b.rel))
  const entries = []
  for (const f of files) {
    const buf = fs.readFileSync(f.abs)
    const hash = 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
    const size_kb = Math.max(0, Math.round(buf.length / 1024))
    entries.push({
      path: f.rel,
      category: categorize(f.rel),
      hash,
      size_kb,
      license: deriveLicense(f.rel),
      source_url: deriveSourceUrl(f.rel),
      author: deriveAuthor(f.rel),
      required_for_demo: deriveRequiredForDemo(f.rel),
      notes: deriveNotes(f.rel),
      ...deriveExtras(f.rel),
    })
  }
  return entries
}

// ───────────────────────────────────────────────────────────────────
// YAML serializer — minimal, deterministic
// ───────────────────────────────────────────────────────────────────
function yamlEscape(s) {
  if (s === '' || s == null) return '""'
  const str = String(s)
  if (
    /^[A-Za-z_][\w./-]*$/.test(str) &&
    !['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(str.toLowerCase()) &&
    !/^\d/.test(str)
  ) {
    return str
  }
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function dumpEntry(e) {
  const lines = []
  lines.push(`  - path: ${yamlEscape(e.path)}`)
  lines.push(`    category: ${e.category}`)
  if (e.hash) lines.push(`    hash: ${e.hash}`)
  lines.push(`    size_kb: ${e.size_kb}`)
  lines.push(`    license: ${e.license}`)
  lines.push(`    source_url: ${yamlEscape(e.source_url ?? '')}`)
  lines.push(`    author: ${yamlEscape(e.author)}`)
  lines.push(`    required_for_demo: ${e.required_for_demo ? 'true' : 'false'}`)
  if (e.mascot_type) lines.push(`    mascot_type: ${e.mascot_type}`)
  if (e.persona_tag) lines.push(`    persona_tag: ${e.persona_tag}`)
  if (typeof e.npc_index === 'number') lines.push(`    npc_index: ${e.npc_index}`)
  if (e.frame) lines.push(`    frame: ${yamlEscape(e.frame)}`)
  if (e.landmark_for_zone) lines.push(`    landmark_for_zone: ${e.landmark_for_zone}`)
  if (e.notes) lines.push(`    notes: ${yamlEscape(e.notes)}`)
  return lines.join('\n')
}

// ───────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────
function run() {
  const entries = buildEntries()
  const totalCount = entries.length
  const totalSizeKb = entries.reduce((acc, e) => acc + (e.size_kb || 0), 0)
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  const yamlOut = [
    HEADER.trimEnd(),
    '',
    'version: 1',
    `generated_at: ${generatedAt}`,
    `total_count: ${totalCount}`,
    `total_size_kb: ${totalSizeKb}`,
    'assets:',
    entries.map(dumpEntry).join('\n'),
    '',
  ].join('\n')

  fs.writeFileSync(MANIFEST_PATH, yamlOut, 'utf-8')

  // Per-category summary
  const byCat = new Map()
  for (const e of entries) {
    const c = byCat.get(e.category) ?? { count: 0, kb: 0 }
    c.count++
    c.kb += e.size_kb || 0
    byCat.set(e.category, c)
  }

  console.log(`✅ Wrote ${MANIFEST_PATH}`)
  console.log(`   total_count=${totalCount}  total_size_kb=${totalSizeKb} (${(totalSizeKb / 1024).toFixed(2)} MB)`)
  console.log('')
  console.log('   by category:')
  for (const [c, s] of [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`     ${c.padEnd(10)} count=${String(s.count).padStart(4)}   size=${String(s.kb).padStart(6)} KB`)
  }
}

run()
