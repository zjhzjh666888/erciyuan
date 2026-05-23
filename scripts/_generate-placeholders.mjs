#!/usr/bin/env node
/**
 * scripts/_generate-placeholders.mjs
 *
 * Wave 3 batch placeholder generator.
 * Emits all PNG / SVG / TMJ / TXT placeholders required so that
 * `npm run check:assets` passes while the human team finishes
 * external downloads per assets/PROCUREMENT.md.
 *
 * Idempotent: running twice produces identical files
 * (deterministic pixel buffers, no timestamps in payloads).
 *
 * Run from repo root:
 *   node scripts/_generate-placeholders.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { writePlaceholderPng } from './make-placeholder-png.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS = path.join(REPO_ROOT, 'assets')

// ───────────────────────────────────────────────────────────────────
// Per-mascot persona colors (design.md §2.3 + tokens)
// ───────────────────────────────────────────────────────────────────
const MASCOT_COLORS = {
  cat_lore: [167, 139, 250, 255], // purple — 考据猫
  dog_social: [255, 184, 111, 255], // orange — 扩列犬
  hamster_hoard: [216, 197, 168, 255], // beige — 囤囤鼠
  fox_create: [245, 245, 247, 255], // white-ish — 太太狐
  slime_newbie: [168, 216, 255, 255], // light blue — 云仔
  wolf_limited: [50, 80, 130, 255], // navy — 限定狼
  pigeon_buzz: [255, 168, 216, 255], // pink — 咕咕鸽
}

// 11 companion icon colors
const COMPANION_COLORS = {
  convention: [255, 111, 183, 255],
  cos: [122, 231, 255, 255],
  photo: [182, 255, 111, 255],
  booth: [255, 184, 111, 255],
  goods: [216, 197, 168, 255],
  same_ip: [167, 139, 250, 255],
  same_city: [168, 216, 255, 255],
  duet: [255, 168, 216, 255],
  newbie: [168, 216, 255, 255],
  limited: [50, 80, 130, 255],
  doujin: [216, 168, 255, 255],
}

// ───────────────────────────────────────────────────────────────────
// SVG factory helpers — minimal, valid, with viewBox + label
// ───────────────────────────────────────────────────────────────────
function svgIcon({ size = 48, fill, label }) {
  // a circle with a centered text label
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" fill="#0E1018"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
  <text x="${size / 2}" y="${size / 2 + 4}" font-family="monospace" font-size="10" fill="#0E1018" text-anchor="middle">${label}</text>
</svg>
`
}

function svgSpeechBubble() {
  // White rounded rect with bottom tail — Smallville style
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80" viewBox="0 0 160 80">
  <rect x="2" y="2" width="156" height="56" rx="8" ry="8" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2"/>
  <polygon points="70,58 80,72 90,58" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2"/>
  <text x="80" y="34" font-family="monospace" font-size="12" fill="#1A1A1A" text-anchor="middle">placeholder bubble</text>
</svg>
`
}

function svgDegradedBanner() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="36" viewBox="0 0 800 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="degraded" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF6F6F"/>
      <stop offset="100%" stop-color="#FF8B6F"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="800" height="36" fill="url(#degraded)"/>
  <text x="400" y="23" font-family="sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle">⚠ DEGRADED MODE — placeholder banner</text>
</svg>
`
}

function writeSvg(rel, content) {
  const out = path.join(ASSETS, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, content, 'utf-8')
  return out
}

function writeText(rel, content) {
  const out = path.join(ASSETS, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, content, 'utf-8')
  return out
}

// ───────────────────────────────────────────────────────────────────
// Tilemap TMJ — minimal, valid, 64×64 ground layer of zero tiles
// ───────────────────────────────────────────────────────────────────
function writeTilemapTmj() {
  const W = 64
  const H = 64
  const data = new Array(W * H).fill(0)
  const tmj = {
    compressionlevel: -1,
    width: W,
    height: H,
    tilewidth: 32,
    tileheight: 32,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.0',
    type: 'map',
    version: '1.10',
    nextlayerid: 2,
    nextobjectid: 1,
    layers: [
      {
        id: 1,
        name: 'Ground',
        type: 'tilelayer',
        width: W,
        height: H,
        opacity: 1,
        visible: true,
        x: 0,
        y: 0,
        data,
      },
    ],
    tilesets: [],
    properties: [
      {
        name: 'placeholder',
        type: 'string',
        value:
          'PLACEHOLDER tilemap — replace with real Tiled-edited map per PROCUREMENT.md (4 functional zones not yet placed)',
      },
    ],
  }
  const out = path.join(ASSETS, 'tilemaps', 'town_64x64.tmj')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(tmj, null, 2), 'utf-8')
  return out
}

// ───────────────────────────────────────────────────────────────────
// Manifest entry generation
// ───────────────────────────────────────────────────────────────────
function fileMeta(absPath) {
  const buf = fs.readFileSync(absPath)
  const hash = 'sha256:' + crypto.createHash('sha256').update(buf).digest('hex')
  const size_kb = Math.max(0, Math.round(buf.length / 1024))
  return { hash, size_kb }
}

const entries = []

function record({ rel, category, required_for_demo = true, notes, license = 'SELF', source_url = '', author = 'anime-agent-town team (placeholder)' }) {
  const abs = path.join(ASSETS, rel)
  const { hash, size_kb } = fileMeta(abs)
  entries.push({
    path: rel.replace(/\\/g, '/'),
    category,
    hash,
    size_kb,
    license,
    source_url,
    author,
    required_for_demo,
    notes,
  })
}

// ───────────────────────────────────────────────────────────────────
// MAIN: emit every placeholder
// ───────────────────────────────────────────────────────────────────

// 1. Tilemap & tileset (task 2.x)
writePlaceholderPng({
  out: path.join(ASSETS, 'tilemaps', 'tileset_main.png'),
  w: 256,
  h: 256,
  rgba: [255, 111, 183, 255],
  pattern: 'grid',
})
record({ rel: 'tilemaps/tileset_main.png', category: 'tilemap', notes: 'placeholder — replace per PROCUREMENT.md (Kenney RPG Urban Kit / LPC RPG Pack)' })

writeTilemapTmj()
record({ rel: 'tilemaps/town_64x64.tmj', category: 'tilemap', notes: 'placeholder — minimal 64×64 zero-tile map; 4+7 zones not yet laid out' })

// 2. Mascot fallback sprite (used by all 7 mascot types until task 4.x done)
writePlaceholderPng({
  out: path.join(ASSETS, 'sprites', '_placeholder', 'mascot_default.png'),
  w: 32,
  h: 32,
  rgba: [255, 168, 216, 255],
})
record({
  rel: 'sprites/_placeholder/mascot_default.png',
  category: 'mascot',
  notes: 'placeholder — shared default until 7 mascot sprites drawn (see PROCUREMENT.md task 4.x)',
})

// 3. NPC fallback sprite
writePlaceholderPng({
  out: path.join(ASSETS, 'sprites', '_placeholder', 'npc_default.png'),
  w: 32,
  h: 32,
  rgba: [168, 216, 255, 255],
})
record({
  rel: 'sprites/_placeholder/npc_default.png',
  category: 'npc',
  notes: 'placeholder — shared default until 30+ NPC sprites curated (see PROCUREMENT.md task 5.1)',
})

// 4. UI — speech bubble & degraded banner SVGs
writeSvg('ui/speech_bubble.svg', svgSpeechBubble())
record({ rel: 'ui/speech_bubble.svg', category: 'ui', notes: 'placeholder — Smallville-style bubble; refine per task 6.3' })

writeSvg('ui/degraded_banner.svg', svgDegradedBanner())
record({ rel: 'ui/degraded_banner.svg', category: 'ui', notes: 'placeholder — DEGRADED MODE banner; refine per task 6.4' })

// 5. UI — 7 mascot icons
for (const [type, color] of Object.entries(MASCOT_COLORS)) {
  const fillHex = '#' + color.slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')
  const rel = `ui/icons_mascot/${type}.svg`
  writeSvg(rel, svgIcon({ size: 48, fill: fillHex, label: type.split('_')[0] }))
  record({ rel, category: 'ui', notes: `placeholder mascot icon — ${type}` })
}

// 6. UI — 11 companion icons
for (const [type, color] of Object.entries(COMPANION_COLORS)) {
  const fillHex = '#' + color.slice(0, 3).map((c) => c.toString(16).padStart(2, '0')).join('')
  const rel = `ui/icons_companion/${type}.svg`
  writeSvg(rel, svgIcon({ size: 48, fill: fillHex, label: type.slice(0, 6) }))
  record({ rel, category: 'ui', notes: `placeholder companion icon — ${type}` })
}

// 7. UI — Glassmorphism card background
writePlaceholderPng({
  out: path.join(ASSETS, 'ui', 'glass_card_bg.png'),
  w: 64,
  h: 64,
  rgba: [255, 255, 255, 16],
})
record({ rel: 'ui/glass_card_bg.png', category: 'ui', notes: 'placeholder — glass card noise texture' })

// 8. UI — 3 isekai particle PNGs
for (const idx of ['p01', 'p02', 'p03']) {
  const rel = `ui/isekai_particles/${idx}.png`
  writePlaceholderPng({
    out: path.join(ASSETS, rel),
    w: 32,
    h: 32,
    rgba: [255, 111, 183, 200],
  })
  record({ rel, category: 'ui', notes: `placeholder isekai particle ${idx}` })
}

// 9. Audio — pending list (cannot meaningfully placeholder)
const audioPending = `# Audio assets — pending external download

The 4 audio assets below cannot be usefully placeholdered. They are
external Pixabay / Kenney downloads that the human team must fetch
manually, then drop into this directory and re-run check:assets.

See assets/PROCUREMENT.md tasks 7.1–7.4 for full URLs / licenses.

| Output filename                  | Source / License | PROCUREMENT task |
| -------------------------------- | ---------------- | ---------------- |
| audio/isekai_jingle.mp3          | Pixabay          | 7.1              |
| audio/popup_drop.mp3             | Pixabay          | 7.2              |
| audio/click_{01..03}.mp3 (×3)    | Pixabay / Kenney | 7.3              |
| audio/mascot_born_bgm.mp3        | Pixabay / Kenney | 7.4              |

Until downloads land, these entries are recorded in MANIFEST.yaml with
required_for_demo=false so check:assets does not fail. Once each file
exists, flip required_for_demo=true and update hash + size_kb.
`
writeText('audio/.PROCUREMENT_PENDING', audioPending)
record({
  rel: 'audio/.PROCUREMENT_PENDING',
  category: 'audio',
  required_for_demo: false,
  notes: 'pending download — see PROCUREMENT.md tasks 7.1–7.4',
})

// 10. Fallback assets (task 8.x)
writePlaceholderPng({
  out: path.join(ASSETS, 'fallback', 'network_disconnected.png'),
  w: 320,
  h: 240,
  rgba: [255, 184, 111, 255],
})
record({ rel: 'fallback/network_disconnected.png', category: 'fallback', notes: 'placeholder — network disconnected illustration (task 8.1)' })

writePlaceholderPng({
  out: path.join(ASSETS, 'fallback', 'isekai_failed.png'),
  w: 320,
  h: 240,
  rgba: [255, 111, 111, 255],
})
record({ rel: 'fallback/isekai_failed.png', category: 'fallback', notes: 'placeholder — isekai transmigration failed illustration (task 8.2)' })

writePlaceholderPng({
  out: path.join(ASSETS, 'fallback', 'fallback_character.png'),
  w: 32,
  h: 32,
  rgba: [168, 216, 255, 255],
})
record({ rel: 'fallback/fallback_character.png', category: 'fallback', notes: 'placeholder — R2.6 fallback character used when char-gen times out (task 8.3)' })

writePlaceholderPng({
  out: path.join(ASSETS, 'fallback', 'town_static_snapshot.png'),
  w: 640,
  h: 480,
  rgba: [40, 60, 80, 255],
  pattern: 'grid',
})
record({
  rel: 'fallback/town_static_snapshot.png',
  category: 'fallback',
  notes: 'placeholder — replace with real Phaser export per task 11.8 (task 8.4)',
})

// ───────────────────────────────────────────────────────────────────
// Persist manifest entries to a JSON sidecar so that manifest writer
// can pick them up. Easier to debug than constructing YAML in-script.
// ───────────────────────────────────────────────────────────────────
const sidecar = path.join(__dirname, '_wave3-entries.json')
fs.writeFileSync(sidecar, JSON.stringify(entries, null, 2), 'utf-8')

console.log(`✅ Generated ${entries.length} placeholder assets`)
console.log(`   manifest entries written to ${path.relative(REPO_ROOT, sidecar)}`)
