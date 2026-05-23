#!/usr/bin/env node
/**
 * scripts/_write-manifest.mjs
 *
 * Reads scripts/_wave3-entries.json (produced by _generate-placeholders.mjs)
 * and writes assets/MANIFEST.yaml with:
 *   - all original header comments preserved
 *   - bumped generated_at / total_count / total_size_kb
 *   - assets array containing every Wave 3 placeholder entry
 *
 * The original MANIFEST.yaml header documents the schema and is
 * preserved verbatim so future maintainers still see it.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const MANIFEST_PATH = path.join(REPO_ROOT, 'assets', 'MANIFEST.yaml')
const ENTRIES_PATH = path.join(__dirname, '_wave3-entries.json')

const entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'))

// ───────────────────────────────────────────────────────────────────
// Header (preserved from original MANIFEST.yaml — schema documentation)
// ───────────────────────────────────────────────────────────────────
const HEADER = `# =============================================================================
# Asset Manifest — anime-agent-town / 次元萌宠小镇
# -----------------------------------------------------------------------------
# 单一事实来源（Single Source of Truth）：本仓库内全部素材的 metadata 登记表。
# Pre-Slice (任务 1–9) 完成填充，task 10 启动校验全量门槛。
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
# Wave 3（资产采购批次 — 任务 2.1/2.2/2.3/4.1/4.2/4.3/5.1/6.1/6.2/7.1–7.4/8.1–8.4）
# ⚠ 当前下方 assets 列表内全部条目均为 PLACEHOLDER：
#    - PNG 文件确为合法可解码 PNG（带 89 50 4E 47 0D 0A 1A 0A 头）
#    - SVG / TMJ / TXT 均为合法语法
#    - 但内容是占位图（粉色 grid / 单色块 / 简易 SVG），不是最终素材
#    - 团队需按 PROCUREMENT.md 逐项替换为真实下载产物
#    - 替换时须重算 hash + size_kb，并把 license/source_url/author 改为真实值
# =============================================================================
`

// ───────────────────────────────────────────────────────────────────
// YAML serializer — minimal, deterministic, no external deps.
// js-yaml is available but its default flow-vs-block heuristic for
// long strings is unpredictable; hand-rolling keeps output stable
// and trivially diffable across re-runs.
// ───────────────────────────────────────────────────────────────────
function yamlEscape(s) {
  if (s === '') return '""'
  // Quote anything that could be misparsed (contains : # @ , [ ] { } & * ! | > ' " % ` ?
  // or starts with whitespace, or could be a YAML literal like true/false/null/numbers).
  if (/^[A-Za-z_][\w./-]*$/.test(s) && !['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(s.toLowerCase())) {
    return s
  }
  // Use double quotes; escape backslash and double quote.
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
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
  if (e.notes) lines.push(`    notes: ${yamlEscape(e.notes)}`)
  return lines.join('\n')
}

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
console.log(`✅ Wrote ${MANIFEST_PATH}`)
console.log(`   total_count=${totalCount}  total_size_kb=${totalSizeKb}`)
