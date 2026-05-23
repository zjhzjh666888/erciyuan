/**
 * tests/mascot-resolver.test.ts
 *
 * Mascot_System 向量推断单元测试（tasks.md 14.4）。
 *
 * 来源：requirements.md R19.1（7 类枚举）、R19.3（getMascotProfile 9 字段）、
 *      R19.5（向量近邻冲突 → fallback slime_newbie）。
 *
 * 设计要点：
 *   - 仅验证 task 14.4 范围内的契约；不触碰 14.1 / 14.2 / 14.3。
 *   - 通过 `@erciyuan/mock-town` workspace 包消费 API（与 asset-manifest.test
 *     的链路保持一致）。
 */

import { describe, expect, it } from 'vitest'
import type { MascotType, MascotWeightVector } from '@erciyuan/types'
import {
  getMascotProfile,
  resolveMascotFromVector,
  NEIGHBOR_TIE_EPSILON,
} from '@erciyuan/mock-town'

const ALL_MASCOTS: MascotType[] = [
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
]

/** 工具：构造一个全部为 base 的向量，再覆盖部分键。 */
function vec(
  overrides: Partial<MascotWeightVector>,
  base = 0,
): MascotWeightVector {
  const out = {} as MascotWeightVector
  for (const m of ALL_MASCOTS) out[m] = base
  for (const k of Object.keys(overrides) as MascotType[]) {
    out[k] = overrides[k] as number
  }
  return out
}

// ─── R19.3 — getMascotProfile 9 字段 ───────────────────────────────────────

describe('getMascotProfile (R19.3)', () => {
  const REQUIRED_FIELDS = [
    'mascot_type',
    'display_name_zh',
    'display_name_romaji',
    'core_traits',
    'recommended_zone',
    'companion_types',
    'catchphrase',
    'core_functions',
    'persona_color',
  ] as const

  it('returns all 9 fields for every mascot_type', () => {
    for (const m of ALL_MASCOTS) {
      const p = getMascotProfile(m)
      for (const f of REQUIRED_FIELDS) {
        expect(p, `mascot=${m} field=${f}`).toHaveProperty(f)
      }
      // 关键子字段：catchphrase 必带 zh + romaji，core_traits ≥ 3 条
      expect(p.catchphrase.zh.length, `${m} catchphrase.zh`).toBeGreaterThan(0)
      expect(p.catchphrase.romaji.length, `${m} catchphrase.romaji`).toBeGreaterThan(0)
      expect(p.core_traits.length, `${m} core_traits ≥ 3`).toBeGreaterThanOrEqual(3)
      expect(p.persona_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('returns the mascot_type that was queried', () => {
    for (const m of ALL_MASCOTS) {
      expect(getMascotProfile(m).mascot_type).toBe(m)
    }
  })
})

// ─── R19.1 / R19.5 — resolveMascotFromVector ───────────────────────────────

describe('resolveMascotFromVector (R19.1 / R19.5)', () => {
  it('returns the strict-max mascot_type when the gap exceeds the tie epsilon', () => {
    const result = resolveMascotFromVector(vec({ cat_lore: 0.9, dog_social: 0.2 }))
    expect(result).toBe('cat_lore')
  })

  it('falls back to slime_newbie when top1 - top2 < NEIGHBOR_TIE_EPSILON', () => {
    // top1 cat_lore=0.90, top2 dog_social=0.86 → diff=0.04 < 0.05 → fallback
    const result = resolveMascotFromVector(
      vec({ cat_lore: 0.9, dog_social: 0.86 }),
    )
    expect(result).toBe('slime_newbie')
  })

  it('does NOT fall back when the gap is exactly the tie epsilon', () => {
    // top1=0.9, top2=0.85, diff = 0.05 ≥ epsilon → not a tie → cat_lore
    const result = resolveMascotFromVector(
      vec({ cat_lore: 0.9, dog_social: 0.85 }),
    )
    expect(result).toBe('cat_lore')
  })

  it('falls back when all weights are zero (perfect tie at 0)', () => {
    expect(resolveMascotFromVector(vec({}))).toBe('slime_newbie')
  })

  it('returns slime_newbie when slime_newbie is itself the strict winner', () => {
    expect(
      resolveMascotFromVector(vec({ slime_newbie: 0.8, cat_lore: 0.1 })),
    ).toBe('slime_newbie')
  })

  it('exposes the tie-epsilon constant for downstream consumers', () => {
    expect(NEIGHBOR_TIE_EPSILON).toBe(0.05)
  })
})
