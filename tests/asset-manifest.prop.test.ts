/**
 * tests/asset-manifest.prop.test.ts
 *
 * 资产清单 Property-Based Tests（tasks.md 10.3*，fast-check ≥ 100 次迭代）。
 *
 * 来源：requirements.md R29.49–56、design.md §5.2 资产管线契约。
 *
 * Properties:
 *   - **A1**：FOR ALL entry，Math.round(actualBytes/1024) === entry.size_kb
 *             （tolerance ±4 KB，与 check-assets.ts 的 SIZE_TOLERANCE_KB 对齐）
 *   - **A2**：FOR ALL entry with hash, 'sha256:' + sha256(file) === entry.hash
 *   - **A3**：FOR ALL entry, entry.category ∈ legal enum
 *   - **A4**：FOR ALL entry, required_for_demo=true ⇒ license / source_url
 *             (or license=SELF) / author 全部非空
 *
 * Validates: Requirements 29.43, 29.44, 29.49, 29.52, 29.53
 */

import { describe, it } from 'vitest'
import fc from 'fast-check'
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(REPO_ROOT, 'assets')
const MANIFEST_PATH = path.join(ASSETS_DIR, 'MANIFEST.yaml')

interface AssetEntry {
  path: string
  category: string
  hash?: string
  size_kb: number
  license: string
  source_url: string
  author: string
  required_for_demo: boolean
}

interface AssetManifest {
  version: number
  assets: AssetEntry[]
}

const manifest = yaml.load(
  fs.readFileSync(MANIFEST_PATH, 'utf-8'),
) as AssetManifest

// Use only on-disk entries — avoid platform/CI noise from missing files.
const onDiskEntries: AssetEntry[] = manifest.assets.filter((a) => {
  if (typeof a.path !== 'string') return false
  return fs.existsSync(path.join(ASSETS_DIR, a.path))
})

if (onDiskEntries.length === 0) {
  throw new Error(
    'tests/asset-manifest.prop.test.ts: no on-disk entries found in MANIFEST.yaml',
  )
}

const SIZE_TOLERANCE_KB = 4

const LEGAL_CATEGORIES = new Set<string>([
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

// Smart generator: sample uniformly into the index space of on-disk entries.
const indexArb: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: onDiskEntries.length - 1,
})

// ─── Property A1 — manifest size_kb ≈ round(actual bytes / 1024) ───────────

describe('Property A1 — manifest.size_kb matches disk file (±4 KB)', () => {
  it('for every sampled entry, |actualKb - size_kb| ≤ 4 (Validates: Requirements 29.49)', () => {
    fc.assert(
      fc.property(indexArb, (idx) => {
        const e = onDiskEntries[idx]!
        const abs = path.join(ASSETS_DIR, e.path)
        const stat = fs.statSync(abs)
        const actualKb = Math.round(stat.size / 1024)
        return Math.abs(actualKb - e.size_kb) <= SIZE_TOLERANCE_KB
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property A2 — manifest.hash === sha256 of file contents ───────────────

describe('Property A2 — manifest.hash matches sha256 of file contents', () => {
  // Build a hashed sub-pool so sampling never lands on entries without a hash.
  const hashedEntries = onDiskEntries.filter(
    (a) => typeof a.hash === 'string' && a.hash.startsWith('sha256:'),
  )

  it('for every sampled hashed entry, "sha256:"+sha256(file) === entry.hash (Validates: Requirements 29.49)', () => {
    if (hashedEntries.length === 0) {
      // Nothing to check — manifest has no hash fields at all (early Pre-Slice).
      return
    }
    const hashedIdxArb = fc.integer({ min: 0, max: hashedEntries.length - 1 })
    fc.assert(
      fc.property(hashedIdxArb, (idx) => {
        const e = hashedEntries[idx]!
        const abs = path.join(ASSETS_DIR, e.path)
        const buf = fs.readFileSync(abs)
        const actual =
          'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
        return actual === e.hash
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property A3 — entry.category is in the legal enum ─────────────────────

describe('Property A3 — entry.category ∈ legal enum', () => {
  it('for every sampled entry, category is one of the 9 legal values (Validates: Requirements 29.43, 29.44)', () => {
    fc.assert(
      fc.property(indexArb, (idx) => {
        const e = onDiskEntries[idx]!
        return LEGAL_CATEGORIES.has(e.category)
      }),
      { numRuns: 100 },
    )
  })
})

// ─── Property A4 — required_for_demo ⇒ license + source_url (or SELF) + author non-empty ─

describe('Property A4 — required_for_demo=true ⇒ license/source_url/author non-empty', () => {
  it('for every sampled required entry, all attribution fields are populated (Validates: Requirements 29.44, 29.52)', () => {
    const requiredEntries = onDiskEntries.filter((a) => a.required_for_demo)
    if (requiredEntries.length === 0) return
    const requiredIdxArb = fc.integer({
      min: 0,
      max: requiredEntries.length - 1,
    })
    fc.assert(
      fc.property(requiredIdxArb, (idx) => {
        const e = requiredEntries[idx]!
        const licenseOk = typeof e.license === 'string' && e.license.trim() !== ''
        const authorOk = typeof e.author === 'string' && e.author.trim() !== ''
        // SELF assets may have empty source_url; third-party must have a URL.
        const sourceOk =
          e.license === 'SELF' ||
          (typeof e.source_url === 'string' && e.source_url.trim() !== '')
        return licenseOk && authorOk && sourceOk
      }),
      { numRuns: 100 },
    )
  })
})
