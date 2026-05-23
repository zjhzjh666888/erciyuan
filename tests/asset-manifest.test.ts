/**
 * tests/asset-manifest.test.ts
 *
 * 类别 A–L 数量下限单元测试（tasks.md 2.7* / 10.2*）。
 *
 * 来源：requirements.md R29「资产准备契约」、design.md §Pre-Slice、
 *      tasks.md 2.7 / 10.2 子任务清单。
 *
 * 设计要点：
 *   - 单一事实来源：assets/MANIFEST.yaml（通过 js-yaml 解析）
 *   - mock-data 类别（D–H、K）：从 @erciyuan/mock-town 工作区包导入；如果工作区
 *     未 link，则回退到打包后的 dist。
 *   - 仅做"下限"断言（≥ 阈值），保持对未来扩展的兼容性。
 *   - 文件级存在性 / hash / 体积检查由 scripts/check-assets.ts 与 PBT 覆盖，
 *     此处只验证清单层面的"形态契约"。
 */

import { describe, expect, it } from 'vitest'
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── repo paths ────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(REPO_ROOT, 'assets')
const MANIFEST_PATH = path.join(ASSETS_DIR, 'MANIFEST.yaml')

// ─── manifest types (loose — only fields we read here) ─────────────────────

interface AssetEntry {
  path: string
  category: string
  hash?: string
  size_kb: number
  license: string
  source_url: string
  author: string
  required_for_demo: boolean
  mascot_type?: string
  frame?: string
  persona_tag?: string
  npc_index?: number
  landmark_for_zone?: string
  notes?: string
}

interface AssetManifest {
  version: number
  generated_at?: string
  total_count?: number
  total_size_kb?: number
  assets: AssetEntry[]
}

function loadManifest(): AssetManifest {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8')
  return yaml.load(raw) as AssetManifest
}

const manifest = loadManifest()
const byCategory = (cat: string): AssetEntry[] =>
  manifest.assets.filter((a) => a.category === cat)

// ─── mock-town package — workspace import with dist fallback ───────────────
//
// `@erciyuan/mock-town` is wired through npm workspaces; the published
// package points at dist/index.js. If that fails (rare CI scenario), we fall
// back to the source directory through the relative path.

interface MockTownAggregate {
  videos: ReadonlyArray<unknown>
  conventions: ReadonlyArray<{ city: string }>
  companions: ReadonlyArray<{ mascot_type: string }>
  quizzes: ReadonlyArray<unknown>
  doujins: ReadonlyArray<unknown>
  publishTemplates: {
    scripts: ReadonlyArray<unknown>
    captions: ReadonlyArray<unknown>
    hashtags: ReadonlyArray<string>
    duets: ReadonlyArray<unknown>
  }
}

async function loadMockTown(): Promise<MockTownAggregate> {
  try {
    const mod = (await import('@erciyuan/mock-town')) as unknown as MockTownAggregate
    return mod
  } catch {
    // Workspace not linked — fall back to dist (authoritative artifact).
    const distUrl = new URL(
      '../packages/mock-town/dist/index.js',
      import.meta.url,
    ).href
    const mod = (await import(distUrl)) as unknown as MockTownAggregate
    return mod
  }
}

const mockTown = await loadMockTown()

// ─── A — tilemap ────────────────────────────────────────────────────────────

describe('A. Tilemap (R29.1–5)', () => {
  const tilemap = byCategory('tilemap')

  it('manifest registers ≥ 1 main tileset (tileset_main)', () => {
    const tilesets = tilemap.filter((a) => /tileset_main/i.test(a.path))
    expect(tilesets.length).toBeGreaterThanOrEqual(1)
  })

  it('manifest registers ≥ 1 .tmj map file', () => {
    const tmj = tilemap.filter((a) => a.path.endsWith('.tmj'))
    expect(tmj.length).toBeGreaterThanOrEqual(1)
  })

  it('main tileset contains ≥ 20 公用图块 variants (R29.4)', () => {
    // Inspect the .tmj — its tileset.tilecount field is the source of truth.
    const tmjEntry = tilemap.find((a) => a.path.endsWith('.tmj'))
    expect(tmjEntry, 'expected at least one .tmj file in manifest').toBeTruthy()
    const tmjAbs = path.join(ASSETS_DIR, tmjEntry!.path)
    const tmj = JSON.parse(fs.readFileSync(tmjAbs, 'utf-8')) as {
      tilesets: Array<{ name: string; tilecount: number }>
    }
    const main = tmj.tilesets.find((t) => /tileset_main/i.test(t.name))
    expect(main, 'expected tileset named "tileset_main" inside .tmj').toBeTruthy()
    expect(main!.tilecount).toBeGreaterThanOrEqual(20)
  })

  it('manifest covers all 7 landmark zones via landmark_for_zone field', () => {
    const expectedZones = new Set([
      'Convention_Plaza',
      'Cos_Studio',
      'Goods_Bazaar',
      'Doujin_Atelier',
      'Newbie_Lobby',
      'Limited_Info_House',
      'Buzz_Square',
    ])
    const seen = new Set<string>()
    for (const a of tilemap) {
      if (a.landmark_for_zone && expectedZones.has(a.landmark_for_zone)) {
        seen.add(a.landmark_for_zone)
      }
    }
    expect(seen.size, `seen zones: ${[...seen].join(',')}`).toBe(expectedZones.size)
  })
})

// ─── B — mascot ─────────────────────────────────────────────────────────────

describe('B. Mascot (R29.6–7)', () => {
  const mascot = byCategory('mascot')
  const expectedTypes = [
    'cat_lore',
    'dog_social',
    'hamster_hoard',
    'fox_create',
    'slime_newbie',
    'wolf_limited',
    'pigeon_buzz',
  ] as const

  it('manifest covers all 7 mascot_type values', () => {
    const seen = new Set<string>()
    for (const a of mascot) {
      if (a.mascot_type) seen.add(a.mascot_type)
    }
    expect(seen.size).toBe(expectedTypes.length)
    for (const t of expectedTypes) {
      expect(seen.has(t), `missing mascot_type=${t}`).toBe(true)
    }
  })

  it('each mascot_type has ≥ 22 frames (idle + portrait_64 + 4 dir × 4 walk + ≥ 4 action)', () => {
    const counts: Record<string, number> = {}
    for (const a of mascot) {
      if (!a.mascot_type) continue
      counts[a.mascot_type] = (counts[a.mascot_type] ?? 0) + 1
    }
    for (const t of expectedTypes) {
      expect(counts[t] ?? 0, `mascot_type=${t} frame count`).toBeGreaterThanOrEqual(22)
    }
  })
})

// ─── C — npc ────────────────────────────────────────────────────────────────

describe('C. NPC (R29.8–10)', () => {
  const npcEntries = byCategory('npc')

  it('manifest covers ≥ 30 distinct NPC slots (persona_tag + npc_index)', () => {
    const slots = new Set<string>()
    for (const a of npcEntries) {
      if (a.persona_tag && typeof a.npc_index === 'number') {
        slots.add(`${a.persona_tag}#${a.npc_index}`)
      }
    }
    expect(slots.size).toBeGreaterThanOrEqual(30)
  })

  it('manifest covers all 6 persona_tag values', () => {
    const expected = new Set([
      'tsundere',
      'yandere',
      'tennen',
      'chuuni',
      'sanmu',
      'hara_guro',
    ])
    const seen = new Set<string>()
    for (const a of npcEntries) {
      if (a.persona_tag && expected.has(a.persona_tag)) seen.add(a.persona_tag)
    }
    expect(seen.size).toBe(expected.size)
  })

  it('each persona_tag has ≥ 5 distinct npc_index values', () => {
    const buckets: Record<string, Set<number>> = {}
    for (const a of npcEntries) {
      if (!a.persona_tag || typeof a.npc_index !== 'number') continue
      buckets[a.persona_tag] = buckets[a.persona_tag] ?? new Set<number>()
      buckets[a.persona_tag]!.add(a.npc_index)
    }
    for (const [persona, slotSet] of Object.entries(buckets)) {
      expect(slotSet.size, `persona_tag=${persona} slots`).toBeGreaterThanOrEqual(5)
    }
  })
})

// ─── D — mock-data video ────────────────────────────────────────────────────

describe('D. Mock-data videos (R29.11–12)', () => {
  it('mock-town exports ≥ 12 video cards', () => {
    expect(mockTown.videos.length).toBeGreaterThanOrEqual(12)
  })
})

// ─── E — mock-data quiz ────────────────────────────────────────────────────

describe('E. Mock-data quizzes (R29.13–14)', () => {
  it('mock-town exports ≥ 15 quiz questions', () => {
    expect(mockTown.quizzes.length).toBeGreaterThanOrEqual(15)
  })
})

// ─── F — mock-data conventions ─────────────────────────────────────────────

describe('F. Mock-data conventions (R29.15–17)', () => {
  it('mock-town exports ≥ 6 conventions', () => {
    expect(mockTown.conventions.length).toBeGreaterThanOrEqual(6)
  })

  it('conventions cover ≥ 3 distinct cities', () => {
    const cities = new Set(mockTown.conventions.map((c) => c.city))
    expect(cities.size).toBeGreaterThanOrEqual(3)
  })
})

// ─── G — mock-data companions ──────────────────────────────────────────────

describe('G. Mock-data companions (R29.18–20)', () => {
  it('mock-town exports ≥ 20 companion candidates', () => {
    expect(mockTown.companions.length).toBeGreaterThanOrEqual(20)
  })
})

// ─── H — mock-data publish templates ───────────────────────────────────────

describe('H. Mock-data publishTemplates (R29.21–24)', () => {
  it('publishTemplates has ≥ 5 video script templates', () => {
    expect(mockTown.publishTemplates.scripts.length).toBeGreaterThanOrEqual(5)
  })

  it('publishTemplates has ≥ 5 caption templates', () => {
    expect(mockTown.publishTemplates.captions.length).toBeGreaterThanOrEqual(5)
  })

  it('publishTemplates has ≥ 10 hashtags including #次元小镇', () => {
    expect(mockTown.publishTemplates.hashtags.length).toBeGreaterThanOrEqual(10)
    expect(mockTown.publishTemplates.hashtags).toContain('#次元小镇')
  })

  it('publishTemplates has ≥ 3 duet templates', () => {
    expect(mockTown.publishTemplates.duets.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── I — UI ────────────────────────────────────────────────────────────────

describe('I. UI (R29.25–30)', () => {
  const ui = byCategory('ui')
  const uiPaths = new Set(ui.map((a) => a.path))

  it('speech_bubble.svg, degraded_banner.svg and glass_card_bg.png are registered', () => {
    expect(uiPaths.has('ui/speech_bubble.svg')).toBe(true)
    expect(uiPaths.has('ui/degraded_banner.svg')).toBe(true)
    expect(uiPaths.has('ui/glass_card_bg.png')).toBe(true)
  })

  it('manifest registers 7 mascot icons', () => {
    const mascotIcons = ui.filter((a) => a.path.startsWith('ui/icons_mascot/'))
    expect(mascotIcons.length).toBeGreaterThanOrEqual(7)
  })

  it('manifest registers 11 companion icons', () => {
    const companionIcons = ui.filter((a) =>
      a.path.startsWith('ui/icons_companion/'),
    )
    expect(companionIcons.length).toBeGreaterThanOrEqual(11)
  })

  it('manifest registers ≥ 3 isekai particles', () => {
    const particles = ui.filter((a) =>
      a.path.startsWith('ui/isekai_particles/'),
    )
    expect(particles.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── J — audio + font ──────────────────────────────────────────────────────

describe('J. Audio + Font (R29.31–36)', () => {
  it('pixel_zh.ttf placeholder or font file is present on disk', () => {
    const real = fs.existsSync(path.join(ASSETS_DIR, 'fonts/pixel_zh.ttf'))
    const placeholder = fs.existsSync(
      path.join(ASSETS_DIR, 'fonts/pixel_zh.ttf.PLACEHOLDER'),
    )
    expect(real || placeholder).toBe(true)
  })

  it('pixel_en_romaji.ttf is registered and non-empty (size > 0)', () => {
    const font = byCategory('font').find(
      (a) => a.path === 'fonts/pixel_en_romaji.ttf',
    )
    expect(font, 'pixel_en_romaji.ttf manifest entry').toBeTruthy()
    expect(font!.size_kb).toBeGreaterThan(0)
    const abs = path.join(ASSETS_DIR, font!.path)
    expect(fs.existsSync(abs), `${abs} on disk`).toBe(true)
    const stat = fs.statSync(abs)
    expect(stat.size).toBeGreaterThan(0)
  })

  it('manifest registers ≥ 4 SFX entries (placeholder or real)', () => {
    // Each of the 4 SFX (popup_drop, click_01, click_02, click_03) must exist
    // as either a real .mp3 or a .PROCUREMENT_PENDING placeholder under audio/.
    const audio = byCategory('audio').filter((a) =>
      a.path.startsWith('audio/'),
    )
    const sfxNames = ['popup_drop', 'click_01', 'click_02', 'click_03']
    const seen = new Set<string>()
    for (const a of audio) {
      for (const name of sfxNames) {
        if (a.path.includes(name)) seen.add(name)
      }
    }
    expect(
      seen.size,
      `expected 4 SFX placeholders, got: ${[...seen].join(',')}`,
    ).toBeGreaterThanOrEqual(4)
  })
})

// ─── K — mock-data doujins ─────────────────────────────────────────────────

describe('K. Mock-data doujins (R29.37–38)', () => {
  it('mock-town exports ≥ 5 doujin entries', () => {
    expect(mockTown.doujins.length).toBeGreaterThanOrEqual(5)
  })
})

// ─── L — fallback ──────────────────────────────────────────────────────────

describe('L. Fallback (R29.39–42)', () => {
  it('manifest registers exactly the 4 named fallback entries with required_for_demo=true', () => {
    const expected = new Set([
      'fallback/network_disconnected.png',
      'fallback/isekai_failed.png',
      'fallback/fallback_character.png',
      'fallback/town_static_snapshot.png',
    ])
    const fallback = byCategory('fallback').filter(
      (a) => a.required_for_demo === true,
    )
    const seen = new Set(fallback.map((a) => a.path))
    expect(seen.size).toBeGreaterThanOrEqual(expected.size)
    for (const p of expected) {
      expect(seen.has(p), `missing fallback ${p}`).toBe(true)
    }
  })
})
