#!/usr/bin/env node
/**
 * scripts/_generate-real-assets.mjs
 *
 * Wave 4 — procedural pixel-art asset generator.
 *
 * Replaces the Wave 3 flat-color placeholders with structured procedural
 * art for the entire visible asset set:
 *   • 256×256 tileset (8×8 grid of distinct 32×32 tiles)
 *   • Real Tiled 1.10 64×64 tilemap (.tmj) with zone bounds metadata
 *   • 7 landmark sprites
 *   • 7 mascots × ~26 frames
 *   • 6 personas × 5 NPCs × 17 frames
 *   • UI SVGs (speech bubble, degraded banner, mascot/companion icons)
 *   • Glass card noise PNG + 3 isekai particle PNGs
 *
 * Pure ESM, only Node built-ins + make-placeholder-png.mjs PNG codec.
 * Idempotent / deterministic — same input produces byte-identical output.
 *
 * Usage (from repo root):
 *   node scripts/_generate-real-assets.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeRawPng } from './make-placeholder-png.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const ASSETS = path.join(REPO_ROOT, 'assets')

// ───────────────────────────────────────────────────────────────────
// 24-color palette (design.md §2.3)
// ───────────────────────────────────────────────────────────────────
const PALETTE = {
  bg0: [14, 16, 24],
  bg1: [26, 29, 41],
  bg2: [36, 24, 39],
  bg3: [23, 36, 39],
  text: [245, 245, 247],
  textDim: [160, 160, 168],
  textMute: [98, 98, 106],
  pink: [255, 111, 183],
  cyan: [122, 231, 255],
  lime: [182, 255, 111],
  warn: [255, 184, 111],
  danger: [255, 111, 111],
  hairYellow: [255, 217, 168],
  hairBlue: [168, 216, 255],
  hairPink: [255, 168, 216],
  hairPurple: [216, 168, 255],
  hairGreen: [168, 255, 216],
  hairBrown: [149, 110, 80],
  hairBlack: [40, 40, 56],
  grass: [61, 90, 65],
  dirt: [123, 90, 61],
  stone: [157, 168, 184],
  wood: [216, 197, 168],
  brickRed: [180, 80, 70],
  brickRoof: [120, 50, 50],
  water: [80, 140, 200],
  white: [255, 255, 255],
  black: [26, 26, 26],
  shadow: [10, 10, 14],
}

// Persona main colors per mascot
const MASCOT_COLORS = {
  cat_lore:      { body: [167, 139, 250], accent: [255, 255, 255], dark: [110, 90, 180] },
  dog_social:    { body: [255, 168, 100], accent: [255, 220, 180], dark: [200, 120, 60]  },
  hamster_hoard: { body: [216, 197, 168], accent: [240, 220, 200], dark: [160, 140, 110] },
  fox_create:    { body: [240, 220, 200], accent: [255, 255, 255], dark: [200, 120, 60]  },
  slime_newbie:  { body: [168, 216, 255], accent: [240, 250, 255], dark: [110, 160, 220] },
  wolf_limited:  { body: [50, 80, 130],   accent: [122, 231, 255], dark: [30, 50, 90]    },
  pigeon_buzz:   { body: [255, 200, 220], accent: [255, 240, 245], dark: [200, 130, 170] },
}

const MASCOT_TYPES = Object.keys(MASCOT_COLORS)

const PERSONAS = ['tsundere', 'yandere', 'tennen', 'chuuni', 'sanmu', 'hara_guro']

const NPC_HAIR = ['hairYellow', 'hairPink', 'hairBlue', 'hairBrown', 'hairBlack']

// ───────────────────────────────────────────────────────────────────
// Pixel buffer primitive (RGBA, top-to-bottom row order)
// ───────────────────────────────────────────────────────────────────
function makeBuf(w, h, fill = [0, 0, 0, 0]) {
  const buf = Buffer.alloc(w * h * 4)
  if (fill[3] !== 0 || fill[0] !== 0 || fill[1] !== 0 || fill[2] !== 0) {
    for (let i = 0; i < w * h; i++) {
      buf[i * 4] = fill[0]
      buf[i * 4 + 1] = fill[1]
      buf[i * 4 + 2] = fill[2]
      buf[i * 4 + 3] = fill[3]
    }
  }
  return buf
}

function setPx(buf, w, h, x, y, rgba) {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  const i = (y * w + x) * 4
  buf[i] = rgba[0]
  buf[i + 1] = rgba[1]
  buf[i + 2] = rgba[2]
  buf[i + 3] = rgba.length >= 4 ? rgba[3] : 255
}

function fillRect(buf, w, h, x0, y0, ww, hh, rgba) {
  for (let y = y0; y < y0 + hh; y++) {
    for (let x = x0; x < x0 + ww; x++) {
      setPx(buf, w, h, x, y, rgba)
    }
  }
}

function strokeRect(buf, w, h, x0, y0, ww, hh, rgba) {
  for (let x = x0; x < x0 + ww; x++) {
    setPx(buf, w, h, x, y0, rgba)
    setPx(buf, w, h, x, y0 + hh - 1, rgba)
  }
  for (let y = y0; y < y0 + hh; y++) {
    setPx(buf, w, h, x0, y, rgba)
    setPx(buf, w, h, x0 + ww - 1, y, rgba)
  }
}

function fillCircle(buf, w, h, cx, cy, r, rgba) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r * r) setPx(buf, w, h, x, y, rgba)
    }
  }
}

function strokeCircle(buf, w, h, cx, cy, r, rgba) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= r * r && d2 >= (r - 1) * (r - 1)) setPx(buf, w, h, x, y, rgba)
    }
  }
}

function line(buf, w, h, x0, y0, x1, y1, rgba) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  while (true) {
    setPx(buf, w, h, x, y, rgba)
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx)  { err += dx; y += sy }
  }
}

/** Composite a sub-buffer onto a target buffer at offset (ox, oy). */
function blit(dst, dw, dh, src, sw, sh, ox, oy) {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4
      const a = src[i + 3]
      if (a === 0) continue
      const dx = ox + x
      const dy = oy + y
      if (dx < 0 || dy < 0 || dx >= dw || dy >= dh) continue
      const j = (dy * dw + dx) * 4
      if (a === 255) {
        dst[j] = src[i]
        dst[j + 1] = src[i + 1]
        dst[j + 2] = src[i + 2]
        dst[j + 3] = 255
      } else {
        // simple alpha blend
        const af = a / 255
        const inv = 1 - af
        dst[j] = Math.round(src[i] * af + dst[j] * inv)
        dst[j + 1] = Math.round(src[i + 1] * af + dst[j + 1] * inv)
        dst[j + 2] = Math.round(src[i + 2] * af + dst[j + 2] * inv)
        dst[j + 3] = Math.max(dst[j + 3], a)
      }
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// Seeded PRNG (linear-congruential) — deterministic
// ───────────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// ───────────────────────────────────────────────────────────────────
// Tile drawers — each draws into a 32×32 subregion at (tx, ty) of buf
// tileType encodes row*8 + col within the 8×8 tileset grid.
// ───────────────────────────────────────────────────────────────────
const TILE_SIZE = 32
const TILESET_COLS = 8
const TILESET_ROWS = 8

/** Returns true when a tile id should set properties.collide=true. */
function tileCollides(tileId) {
  // Row 1 walls, row 2 roofs, row 3 doors/windows, row 4 lamps/signs/stalls,
  // row 5 plants — all collidable. Row 0 grass/dirt, row 6 water/sand, row 7
  // markers — non-collidable.
  const row = Math.floor(tileId / TILESET_COLS)
  return row >= 1 && row <= 5
}

function drawGrassTile(buf, w, h, ox, oy, variant) {
  const baseShades = [
    [55, 90, 60],
    [65, 100, 65],
    [75, 110, 70],
    [60, 95, 55],
  ]
  const base = baseShades[variant % baseShades.length]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [...base, 255])
  // dotted grass blades
  const rng = seededRng(1000 + variant * 17)
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rng() * 30) + ox + 1
    const y = Math.floor(rng() * 30) + oy + 1
    const shade = [base[0] + 20, base[1] + 25, base[2] + 15, 255]
    setPx(buf, w, h, x, y, shade)
    setPx(buf, w, h, x, y - 1, shade)
  }
  // subtle border for tile
  const border = [base[0] - 12, base[1] - 18, base[2] - 12, 80]
  for (let i = 0; i < TILE_SIZE; i += 4) {
    setPx(buf, w, h, ox + i, oy, border)
    setPx(buf, w, h, ox, oy + i, border)
  }
}

function drawDirtTile(buf, w, h, ox, oy, variant) {
  const shades = [
    [130, 100, 70],
    [140, 110, 75],
    [120, 90, 60],
    [150, 120, 85],
  ]
  const base = shades[variant % shades.length]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [...base, 255])
  const rng = seededRng(2000 + variant * 13)
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * 30) + ox + 1
    const y = Math.floor(rng() * 30) + oy + 1
    const dark = [base[0] - 25, base[1] - 25, base[2] - 20, 255]
    setPx(buf, w, h, x, y, dark)
  }
  // path divots
  if (variant === 1 || variant === 3) {
    fillRect(buf, w, h, ox + 14, oy + 6, 4, 2, [base[0] + 18, base[1] + 14, base[2] + 10, 255])
    fillRect(buf, w, h, ox + 6, oy + 22, 5, 2, [base[0] + 18, base[1] + 14, base[2] + 10, 255])
  }
}

function drawBrickWallTile(buf, w, h, ox, oy, variant) {
  const base = [180, 80, 70]
  const mortar = [60, 30, 25]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [...mortar, 255])
  // rows of bricks, brick = 8w × 4h with offset on alternate rows
  for (let row = 0; row < 8; row++) {
    const rowY = row * 4
    const offset = (row % 2 === 0 ? 0 : 4) + variant * 2
    for (let bx = -1; bx < 5; bx++) {
      const x = ox + bx * 8 + offset
      const y = oy + rowY
      // brick face
      fillRect(buf, w, h, x + 1, y + 1, 6, 2, [base[0] + (row & 1) * 8, base[1] + (row & 1) * 4, base[2], 255])
    }
  }
}

function drawStoneWallTile(buf, w, h, ox, oy, variant) {
  const base = [157, 168, 184]
  const mortar = [60, 60, 70]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [...mortar, 255])
  const rng = seededRng(3000 + variant * 11)
  // 4 rows of irregular stones
  let y = oy + 1
  for (let row = 0; row < 4; row++) {
    let x = ox + 1
    while (x < ox + TILE_SIZE - 1) {
      const sw = 4 + Math.floor(rng() * 6)
      const sh = 6
      const shade = [base[0] - 10 + Math.floor(rng() * 30), base[1] - 10 + Math.floor(rng() * 30), base[2] - 10 + Math.floor(rng() * 30), 255]
      fillRect(buf, w, h, x, y, Math.min(sw, ox + TILE_SIZE - 1 - x), sh, shade)
      x += sw + 1
    }
    y += 7
  }
}

function drawRoofTile(buf, w, h, ox, oy, color) {
  // rows of triangle-ish shingles
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [color[0] - 30, color[1] - 30, color[2] - 30, 255])
  for (let row = 0; row < 4; row++) {
    const rowY = oy + row * 8
    for (let s = 0; s < 4; s++) {
      const sx = ox + s * 8 + (row % 2 === 0 ? 0 : 4)
      // shingle: a 7×6 rounded shape
      fillRect(buf, w, h, sx, rowY + 1, 7, 6, [...color, 255])
      // highlight top
      fillRect(buf, w, h, sx + 1, rowY + 1, 5, 1, [color[0] + 30, color[1] + 30, color[2] + 30, 255])
      // shadow bottom
      fillRect(buf, w, h, sx, rowY + 7, 7, 1, [color[0] - 50, color[1] - 50, color[2] - 50, 255])
    }
  }
}

function drawDoorTile(buf, w, h, ox, oy, variant) {
  const woodLight = [180, 130, 80]
  const woodDark = [110, 70, 40]
  const handle = [240, 200, 80]
  // frame
  fillRect(buf, w, h, ox + 4, oy + 2, 24, 30, [...woodDark, 255])
  // panel
  fillRect(buf, w, h, ox + 6, oy + 4, 20, 26, [...woodLight, 255])
  // vertical planks
  for (let i = 0; i < 4; i++) {
    fillRect(buf, w, h, ox + 6 + i * 5, oy + 4, 1, 26, [...woodDark, 255])
  }
  // handle pixel
  fillRect(buf, w, h, ox + 22, oy + 18, 2, 2, [...handle, 255])
  if (variant === 1) {
    // arched top
    fillRect(buf, w, h, ox + 6, oy + 4, 20, 2, [...woodDark, 255])
  }
}

function drawWindowTile(buf, w, h, ox, oy, variant) {
  const frame = [110, 70, 40]
  const glass = [180, 220, 240]
  const glassHi = [230, 250, 255]
  // wall background
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [180, 80, 70, 255])
  // window frame
  fillRect(buf, w, h, ox + 4, oy + 6, 24, 22, [...frame, 255])
  // 4-pane glass
  fillRect(buf, w, h, ox + 6, oy + 8, 9, 9, [...glass, 255])
  fillRect(buf, w, h, ox + 17, oy + 8, 9, 9, [...glass, 255])
  fillRect(buf, w, h, ox + 6, oy + 19, 9, 9, [...glass, 255])
  fillRect(buf, w, h, ox + 17, oy + 19, 9, 9, [...glass, 255])
  // highlight pixel
  if (variant === 1) {
    setPx(buf, w, h, ox + 8, oy + 10, [...glassHi, 255])
    setPx(buf, w, h, ox + 19, oy + 10, [...glassHi, 255])
  }
}

function drawLampTile(buf, w, h, ox, oy) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  // post
  const post = [80, 60, 40]
  fillRect(buf, w, h, ox + 15, oy + 10, 2, 18, [...post, 255])
  // base
  fillRect(buf, w, h, ox + 13, oy + 27, 6, 2, [...post, 255])
  // lamp head
  fillRect(buf, w, h, ox + 12, oy + 6, 8, 6, [60, 50, 40, 255])
  fillRect(buf, w, h, ox + 14, oy + 4, 4, 2, [...post, 255])
  // glow
  fillRect(buf, w, h, ox + 13, oy + 7, 6, 4, [255, 230, 130, 255])
  fillRect(buf, w, h, ox + 14, oy + 8, 4, 2, [255, 250, 200, 255])
}

function drawSignTile(buf, w, h, ox, oy) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  const post = [120, 80, 50]
  // post
  fillRect(buf, w, h, ox + 15, oy + 14, 2, 16, [...post, 255])
  // sign board
  fillRect(buf, w, h, ox + 6, oy + 4, 20, 12, [200, 160, 110, 255])
  // border
  strokeRect(buf, w, h, ox + 6, oy + 4, 20, 12, [80, 50, 30, 255])
  // text-like dashes
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 4; i++) {
      fillRect(buf, w, h, ox + 9 + i * 4, oy + 7 + r * 4, 2, 1, [60, 30, 15, 255])
    }
  }
}

function drawMarketStallTile(buf, w, h, ox, oy) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  // posts
  fillRect(buf, w, h, ox + 4, oy + 8, 2, 22, [120, 80, 50, 255])
  fillRect(buf, w, h, ox + 26, oy + 8, 2, 22, [120, 80, 50, 255])
  // counter
  fillRect(buf, w, h, ox + 4, oy + 20, 24, 4, [180, 130, 80, 255])
  // awning stripes
  for (let i = 0; i < 6; i++) {
    const cx = ox + 4 + i * 4
    fillRect(buf, w, h, cx, oy + 6, 2, 4, [255, 100, 110, 255])
    fillRect(buf, w, h, cx + 2, oy + 6, 2, 4, [255, 240, 240, 255])
  }
  // products
  fillRect(buf, w, h, ox + 7, oy + 16, 3, 4, [255, 200, 80, 255])
  fillRect(buf, w, h, ox + 13, oy + 14, 4, 6, [122, 231, 255, 255])
  fillRect(buf, w, h, ox + 21, oy + 16, 3, 4, [255, 168, 216, 255])
}

function drawBushTile(buf, w, h, ox, oy, variant) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  const colors = [
    [60, 130, 70],
    [70, 150, 80],
    [50, 110, 60],
  ]
  const c = colors[variant % colors.length]
  fillCircle(buf, w, h, ox + 16, oy + 18, 9, [...c, 255])
  fillCircle(buf, w, h, ox + 11, oy + 14, 5, [c[0] + 15, c[1] + 20, c[2] + 10, 255])
  fillCircle(buf, w, h, ox + 21, oy + 14, 5, [c[0] + 15, c[1] + 20, c[2] + 10, 255])
  // berries
  if (variant === 1) {
    setPx(buf, w, h, ox + 14, oy + 18, [255, 100, 100, 255])
    setPx(buf, w, h, ox + 19, oy + 17, [255, 100, 100, 255])
  }
}

function drawTreeTile(buf, w, h, ox, oy) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  // trunk
  fillRect(buf, w, h, ox + 14, oy + 20, 4, 10, [110, 70, 40, 255])
  // canopy
  fillCircle(buf, w, h, ox + 16, oy + 14, 11, [50, 110, 60, 255])
  fillCircle(buf, w, h, ox + 13, oy + 11, 5, [70, 140, 80, 255])
  fillCircle(buf, w, h, ox + 19, oy + 12, 5, [70, 140, 80, 255])
  // highlight
  setPx(buf, w, h, ox + 12, oy + 9, [120, 200, 130, 255])
  setPx(buf, w, h, ox + 20, oy + 10, [120, 200, 130, 255])
}

function drawFlowerTile(buf, w, h, ox, oy, variant) {
  const grass = [55, 90, 60, 255]
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, grass)
  const petalCols = [[255, 168, 216], [255, 230, 130], [216, 168, 255]]
  const c = petalCols[variant % petalCols.length]
  // 4 petals + center
  fillRect(buf, w, h, ox + 15, oy + 14, 2, 4, [...c, 255])
  fillRect(buf, w, h, ox + 13, oy + 16, 6, 2, [...c, 255])
  setPx(buf, w, h, ox + 16, oy + 16, [255, 230, 80, 255])
  // stem
  fillRect(buf, w, h, ox + 16, oy + 18, 1, 8, [60, 130, 70, 255])
  // leaves
  setPx(buf, w, h, ox + 14, oy + 22, [60, 130, 70, 255])
  setPx(buf, w, h, ox + 18, oy + 22, [60, 130, 70, 255])
  // second flower for variant 1
  if (variant === 1) {
    fillRect(buf, w, h, ox + 7, oy + 22, 2, 3, [...c, 255])
    fillRect(buf, w, h, ox + 6, oy + 23, 4, 1, [...c, 255])
  }
}

function drawWaterTile(buf, w, h, ox, oy, variant) {
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [70, 130, 200, 255])
  // wave pattern
  const offset = variant * 4
  for (let r = 0; r < 4; r++) {
    const y = oy + 4 + r * 8 + ((offset + r) & 3)
    for (let x = 0; x < TILE_SIZE; x += 8) {
      fillRect(buf, w, h, ox + x, y, 4, 1, [180, 220, 240, 255])
      fillRect(buf, w, h, ox + x + 4, y + 2, 4, 1, [120, 180, 220, 255])
    }
  }
  // sparkle pixel
  setPx(buf, w, h, ox + 8 + variant * 3, oy + 10, [255, 255, 255, 255])
}

function drawSandTile(buf, w, h, ox, oy) {
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [240, 220, 170, 255])
  const rng = seededRng(4000)
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rng() * 30) + ox + 1
    const y = Math.floor(rng() * 30) + oy + 1
    setPx(buf, w, h, x, y, [220, 195, 140, 255])
  }
}

const ZONE_MARKER_COLORS = {
  Convention_Plaza:   [255, 111, 183],
  Cos_Studio:         [122, 231, 255],
  Goods_Bazaar:       [255, 184, 111],
  Doujin_Atelier:     [216, 168, 255],
  Newbie_Lobby:       [168, 216, 255],
  Limited_Info_House: [50, 90, 160],
  Buzz_Square:        [255, 168, 216],
  Spawn:              [182, 255, 111],
}

function drawZoneMarkerTile(buf, w, h, ox, oy, zoneName) {
  const color = ZONE_MARKER_COLORS[zoneName] || [200, 200, 200]
  // grass background
  fillRect(buf, w, h, ox, oy, TILE_SIZE, TILE_SIZE, [55, 90, 60, 255])
  // diamond marker
  for (let dy = -8; dy <= 8; dy++) {
    const span = 8 - Math.abs(dy)
    for (let dx = -span; dx <= span; dx++) {
      setPx(buf, w, h, ox + 16 + dx, oy + 16 + dy, [...color, 200])
    }
  }
  // letter dot grid (just decorative pattern)
  setPx(buf, w, h, ox + 16, oy + 16, [255, 255, 255, 255])
  setPx(buf, w, h, ox + 14, oy + 16, [255, 255, 255, 255])
  setPx(buf, w, h, ox + 18, oy + 16, [255, 255, 255, 255])
}

// ───────────────────────────────────────────────────────────────────
// Tile id assignment
// ───────────────────────────────────────────────────────────────────
const TILE_IDS = {
  // Row 0 — grass / dirt (0-7)
  GRASS_A: 0, GRASS_B: 1, GRASS_C: 2, GRASS_D: 3,
  DIRT_A: 4, DIRT_B: 5, DIRT_C: 6, DIRT_D: 7,
  // Row 1 — walls (8-15)
  BRICK_A: 8, BRICK_B: 9, BRICK_C: 10, BRICK_D: 11,
  STONE_A: 12, STONE_B: 13, STONE_C: 14, STONE_D: 15,
  // Row 2 — roofs (16-23)
  ROOF_RED_A: 16, ROOF_RED_B: 17,
  ROOF_BLUE_A: 18, ROOF_BLUE_B: 19,
  ROOF_GREEN_A: 20, ROOF_GREEN_B: 21,
  ROOF_YELLOW_A: 22, ROOF_YELLOW_B: 23,
  // Row 3 — doors / windows (24-31)
  DOOR_A: 24, DOOR_B: 25, DOOR_C: 26, DOOR_D: 27,
  WINDOW_A: 28, WINDOW_B: 29, WINDOW_C: 30, WINDOW_D: 31,
  // Row 4 — props (32-39)
  LAMP_A: 32, LAMP_B: 33, SIGN_A: 34, SIGN_B: 35,
  STALL_A: 36, STALL_B: 37, STALL_C: 38, STALL_D: 39,
  // Row 5 — plants (40-47)
  BUSH_A: 40, BUSH_B: 41, BUSH_C: 42,
  TREE_A: 43, TREE_B: 44,
  FLOWER_A: 45, FLOWER_B: 46, FLOWER_C: 47,
  // Row 6 — water / sand (48-55)
  WATER_A: 48, WATER_B: 49, WATER_C: 50, WATER_D: 51,
  SAND_A: 52, SAND_B: 53, SAND_C: 54, SAND_D: 55,
  // Row 7 — zone markers (56-63)
  Z_CONVENTION: 56, Z_COS: 57, Z_GOODS: 58, Z_DOUJIN: 59,
  Z_NEWBIE: 60, Z_LIMITED: 61, Z_BUZZ: 62, Z_SPAWN: 63,
}

function buildTileset() {
  const W = TILE_SIZE * TILESET_COLS
  const H = TILE_SIZE * TILESET_ROWS
  const buf = makeBuf(W, H, [0, 0, 0, 0])

  for (let row = 0; row < TILESET_ROWS; row++) {
    for (let col = 0; col < TILESET_COLS; col++) {
      const tileId = row * TILESET_COLS + col
      const ox = col * TILE_SIZE
      const oy = row * TILE_SIZE
      switch (row) {
        case 0:
          if (col < 4) drawGrassTile(buf, W, H, ox, oy, col)
          else drawDirtTile(buf, W, H, ox, oy, col - 4)
          break
        case 1:
          if (col < 4) drawBrickWallTile(buf, W, H, ox, oy, col)
          else drawStoneWallTile(buf, W, H, ox, oy, col - 4)
          break
        case 2: {
          const roofs = [
            [180, 80, 70], [180, 80, 70],
            [80, 120, 200], [80, 120, 200],
            [80, 160, 100], [80, 160, 100],
            [220, 180, 80], [220, 180, 80],
          ]
          drawRoofTile(buf, W, H, ox, oy, roofs[col])
          break
        }
        case 3:
          if (col < 4) drawDoorTile(buf, W, H, ox, oy, col % 2)
          else drawWindowTile(buf, W, H, ox, oy, col - 4)
          break
        case 4:
          if (col < 2) drawLampTile(buf, W, H, ox, oy)
          else if (col < 4) drawSignTile(buf, W, H, ox, oy)
          else drawMarketStallTile(buf, W, H, ox, oy)
          break
        case 5:
          if (col < 3) drawBushTile(buf, W, H, ox, oy, col)
          else if (col < 5) drawTreeTile(buf, W, H, ox, oy)
          else drawFlowerTile(buf, W, H, ox, oy, col - 5)
          break
        case 6:
          if (col < 4) drawWaterTile(buf, W, H, ox, oy, col)
          else drawSandTile(buf, W, H, ox, oy)
          break
        case 7: {
          const zones = ['Convention_Plaza', 'Cos_Studio', 'Goods_Bazaar', 'Doujin_Atelier',
            'Newbie_Lobby', 'Limited_Info_House', 'Buzz_Square', 'Spawn']
          drawZoneMarkerTile(buf, W, H, ox, oy, zones[col])
          break
        }
      }
    }
  }
  return { buf, w: W, h: H }
}

// ───────────────────────────────────────────────────────────────────
// Tilemap generation (.tmj — Tiled 1.10 schema)
// ───────────────────────────────────────────────────────────────────
const MAP_W = 64
const MAP_H = 64

// Zone bounds {x_min, y_min, x_max, y_max} in TILE coordinates (inclusive).
const ZONES = {
  Plaza:               { x_min: 24, y_min: 24, x_max: 40, y_max: 40 },
  Cafe:                { x_min: 8,  y_min: 8,  x_max: 24, y_max: 24 },
  Houses:              { x_min: 40, y_min: 8,  x_max: 56, y_max: 24 },
  Notice_Board:        { x_min: 28, y_min: 42, x_max: 36, y_max: 46 },
  Convention_Plaza:    { x_min: 24, y_min: 0,  x_max: 40, y_max: 8 },
  Cos_Studio:          { x_min: 40, y_min: 24, x_max: 56, y_max: 32 },
  Goods_Bazaar:        { x_min: 8,  y_min: 40, x_max: 24, y_max: 56 },
  Doujin_Atelier:      { x_min: 40, y_min: 40, x_max: 56, y_max: 56 },
  Newbie_Lobby:        { x_min: 16, y_min: 8,  x_max: 24, y_max: 16 },
  Limited_Info_House:  { x_min: 48, y_min: 8,  x_max: 56, y_max: 16 },
  Buzz_Square:         { x_min: 24, y_min: 56, x_max: 40, y_max: 63 },
}

// Returns 1-based gid (firstgid=1, so tile id N → gid = N+1).
function gid(tileId) {
  return tileId + 1
}

function buildGroundLayer() {
  const data = new Array(MAP_W * MAP_H).fill(gid(TILE_IDS.GRASS_A))
  // Random grass variants for visual texture
  const rng = seededRng(7777)
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const r = rng()
      let id = TILE_IDS.GRASS_A
      if (r < 0.2) id = TILE_IDS.GRASS_B
      else if (r < 0.35) id = TILE_IDS.GRASS_C
      else if (r < 0.45) id = TILE_IDS.GRASS_D
      data[y * MAP_W + x] = gid(id)
    }
  }
  // Cross-shaped dirt road at row 32 / col 32 (3 wide)
  for (let i = 0; i < MAP_W; i++) {
    for (let dx = -1; dx <= 1; dx++) {
      data[(32 + dx) * MAP_W + i] = gid(TILE_IDS.DIRT_A + ((i + dx) & 3))
      data[i * MAP_W + (32 + dx)] = gid(TILE_IDS.DIRT_A + ((i + dx) & 3))
    }
  }
  // Plaza floor — sand-ish dirt within the plaza rect (interior only)
  const p = ZONES.Plaza
  for (let y = p.y_min + 2; y < p.y_max - 2; y++) {
    for (let x = p.x_min + 2; x < p.x_max - 2; x++) {
      data[y * MAP_W + x] = gid(TILE_IDS.DIRT_C)
    }
  }
  // Buzz square — sand
  const bz = ZONES.Buzz_Square
  for (let y = bz.y_min + 1; y < bz.y_max; y++) {
    for (let x = bz.x_min + 1; x < bz.x_max; x++) {
      data[y * MAP_W + x] = gid(TILE_IDS.SAND_A)
    }
  }
  return data
}

function buildDecorationLayer(landmarkFirstGid) {
  const data = new Array(MAP_W * MAP_H).fill(0) // 0 = no tile

  // Helper to put walls around a building region (exterior walls only).
  function building(rect, wallId, roofId) {
    for (let x = rect.x_min; x <= rect.x_max; x++) {
      data[rect.y_min * MAP_W + x] = gid(roofId)
      data[(rect.y_min + 1) * MAP_W + x] = gid(roofId + 1)
      data[rect.y_max * MAP_W + x] = gid(wallId)
    }
    for (let y = rect.y_min + 2; y < rect.y_max; y++) {
      data[y * MAP_W + rect.x_min] = gid(wallId)
      data[y * MAP_W + rect.x_max] = gid(wallId)
    }
  }

  // Cafe — brick walls + red roof, NW
  building(ZONES.Cafe, TILE_IDS.BRICK_A, TILE_IDS.ROOF_RED_A)
  // Door at south middle
  const cafeDoorX = Math.floor((ZONES.Cafe.x_min + ZONES.Cafe.x_max) / 2)
  data[ZONES.Cafe.y_max * MAP_W + cafeDoorX] = gid(TILE_IDS.DOOR_A)
  // Windows
  data[(ZONES.Cafe.y_min + 3) * MAP_W + ZONES.Cafe.x_min] = gid(TILE_IDS.WINDOW_A)
  data[(ZONES.Cafe.y_min + 3) * MAP_W + ZONES.Cafe.x_max] = gid(TILE_IDS.WINDOW_B)

  // Houses — 4 small 6×6 buildings in NE quadrant
  const houseSpec = [
    { x_min: 41, y_min: 9,  x_max: 47, y_max: 15 },
    { x_min: 49, y_min: 9,  x_max: 55, y_max: 15 },
    { x_min: 41, y_min: 17, x_max: 47, y_max: 23 },
    { x_min: 49, y_min: 17, x_max: 55, y_max: 23 },
  ]
  const houseRoofs = [TILE_IDS.ROOF_BLUE_A, TILE_IDS.ROOF_GREEN_A, TILE_IDS.ROOF_YELLOW_A, TILE_IDS.ROOF_RED_A]
  for (let i = 0; i < houseSpec.length; i++) {
    building(houseSpec[i], TILE_IDS.BRICK_A + i, houseRoofs[i])
    const door = Math.floor((houseSpec[i].x_min + houseSpec[i].x_max) / 2)
    data[houseSpec[i].y_max * MAP_W + door] = gid(TILE_IDS.DOOR_A + (i & 1))
  }

  // Notice board (small 8×4)
  const nb = ZONES.Notice_Board
  building(nb, TILE_IDS.STONE_A, TILE_IDS.ROOF_GREEN_A)
  data[(nb.y_max - 0) * MAP_W + nb.x_min + 4] = gid(TILE_IDS.SIGN_A)

  // Cos_Studio — stone walls
  building(ZONES.Cos_Studio, TILE_IDS.STONE_A, TILE_IDS.ROOF_BLUE_A)
  // Goods_Bazaar — large brick warehouse
  building(ZONES.Goods_Bazaar, TILE_IDS.BRICK_C, TILE_IDS.ROOF_YELLOW_A)
  // Doujin_Atelier — purple-ish walls (use stone D variants)
  building(ZONES.Doujin_Atelier, TILE_IDS.STONE_D, TILE_IDS.ROOF_RED_B)
  // Newbie_Lobby — small
  building(ZONES.Newbie_Lobby, TILE_IDS.STONE_B, TILE_IDS.ROOF_GREEN_B)
  // Limited_Info_House — small
  building(ZONES.Limited_Info_House, TILE_IDS.STONE_C, TILE_IDS.ROOF_BLUE_B)

  // Plaza fountain (water at center 32,32 surrounded by stone ring)
  const cx = 32, cy = 32
  for (let y = cy - 2; y <= cy + 2; y++) {
    for (let x = cx - 2; x <= cx + 2; x++) {
      data[y * MAP_W + x] = gid(TILE_IDS.STONE_A)
    }
  }
  data[cy * MAP_W + cx] = gid(TILE_IDS.WATER_A)
  data[(cy - 1) * MAP_W + cx] = gid(TILE_IDS.WATER_B)
  data[cy * MAP_W + (cx + 1)] = gid(TILE_IDS.WATER_C)

  // Lamps along plaza corners
  const lamps = [[26, 26], [38, 26], [26, 38], [38, 38]]
  for (const [x, y] of lamps) data[y * MAP_W + x] = gid(TILE_IDS.LAMP_A)

  // Plants along the outside
  const rng = seededRng(31415)
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rng() * MAP_W)
    const y = Math.floor(rng() * MAP_H)
    if (data[y * MAP_W + x] !== 0) continue
    // skip near roads
    if (Math.abs(x - 32) <= 2 || Math.abs(y - 32) <= 2) continue
    // skip inside any zone interior
    let inside = false
    for (const z of Object.values(ZONES)) {
      if (x >= z.x_min - 1 && x <= z.x_max + 1 && y >= z.y_min - 1 && y <= z.y_max + 1) {
        inside = true; break
      }
    }
    if (inside) continue
    const r = rng()
    if (r < 0.3) data[y * MAP_W + x] = gid(TILE_IDS.TREE_A)
    else if (r < 0.6) data[y * MAP_W + x] = gid(TILE_IDS.BUSH_A + Math.floor(rng() * 3))
    else data[y * MAP_W + x] = gid(TILE_IDS.FLOWER_A + Math.floor(rng() * 3))
  }

  // Zone landmark sprites — first-class collection tiles from the "landmarks"
  // tileset, placed at each zone's center. These supersede the abstract Z_*
  // markers from row 7 of tileset_main and provide unique per-zone visual cues
  // (landmark_for_zone metadata is preserved on each tile).
  const zoneToLandmarkIndex = {
    Convention_Plaza:   0,
    Cos_Studio:         1,
    Goods_Bazaar:       2,
    Doujin_Atelier:     3,
    Newbie_Lobby:       4,
    Limited_Info_House: 5,
    Buzz_Square:        6,
  }
  for (const [zone, idx] of Object.entries(zoneToLandmarkIndex)) {
    const z = ZONES[zone]
    if (!z) continue
    const mx = Math.floor((z.x_min + z.x_max) / 2)
    const my = Math.floor((z.y_min + z.y_max) / 2)
    // Landmark gids start at landmarkFirstGid; tile index 0..6 within the
    // collection.
    data[my * MAP_W + mx] = landmarkFirstGid + idx
  }

  // Spawn marker (no dedicated landmark sprite) — keep the abstract Z_SPAWN
  // tile at the central plaza so the spawn point remains visible to runtime.
  {
    const z = ZONES.Plaza
    const mx = Math.floor((z.x_min + z.x_max) / 2)
    const my = Math.floor((z.y_min + z.y_max) / 2)
    if (data[my * MAP_W + mx] === 0) data[my * MAP_W + mx] = gid(TILE_IDS.Z_SPAWN)
  }

  return data
}

function buildCollisionLayer(decoration, landmarkFirstGid) {
  const data = new Array(MAP_W * MAP_H).fill(0)
  for (let i = 0; i < decoration.length; i++) {
    const g = decoration[i]
    if (g === 0) continue
    // Landmark gids are always collidable (each landmark tile carries
    // properties.collide=true in its tileset entry).
    if (g >= landmarkFirstGid) {
      data[i] = g
      continue
    }
    const tileId = g - 1
    if (tileCollides(tileId)) data[i] = g
  }
  return data
}

function buildTileset_TmjBlock(tileCount, imagePath, imageW, imageH) {
  // Generate per-tile properties for Tiled (only collidable tiles get collide=true)
  const tiles = []
  for (let i = 0; i < tileCount; i++) {
    if (tileCollides(i)) {
      tiles.push({
        id: i,
        properties: [{ name: 'collide', type: 'bool', value: true }],
      })
    }
  }
  return {
    columns: TILESET_COLS,
    firstgid: 1,
    image: imagePath,
    imageheight: imageH,
    imagewidth: imageW,
    margin: 0,
    name: 'tileset_main',
    spacing: 0,
    tilecount: tileCount,
    tileheight: TILE_SIZE,
    tilewidth: TILE_SIZE,
    tiles,
  }
}

// 7 大功能区地标精灵 → image-collection tileset（design.md §Asset Pipeline）。
// 每张 landmark PNG 作为独立 collection-tile，保留 properties.collide=true 和
// landmark_for_zone=<ZoneId>，便于运行期渲染与数据校验。
const LANDMARK_TILE_ORDER = [
  { name: 'landmark_convention_arch',       zone: 'Convention_Plaza' },
  { name: 'landmark_cos_studio_reflector',  zone: 'Cos_Studio' },
  { name: 'landmark_goods_shelf',           zone: 'Goods_Bazaar' },
  { name: 'landmark_doujin_easel',          zone: 'Doujin_Atelier' },
  { name: 'landmark_newbie_signpost',       zone: 'Newbie_Lobby' },
  { name: 'landmark_limited_sniper_tower',  zone: 'Limited_Info_House' },
  { name: 'landmark_buzz_tv_wall',          zone: 'Buzz_Square' },
]

function buildLandmarksTileset_TmjBlock(firstGid) {
  const tiles = LANDMARK_TILE_ORDER.map((entry, i) => ({
    id: i,
    image: `landmarks/${entry.name}.png`,
    imagewidth: TILE_SIZE,
    imageheight: TILE_SIZE,
    properties: [
      { name: 'collide', type: 'bool', value: true },
      { name: 'landmark_for_zone', type: 'string', value: entry.zone },
    ],
  }))
  return {
    columns: 0, // image-collection tilesets MUST set columns=0 (Tiled spec)
    firstgid: firstGid,
    grid: { height: 1, orientation: 'orthogonal', width: 1 },
    margin: 0,
    name: 'landmarks',
    spacing: 0,
    tilecount: LANDMARK_TILE_ORDER.length,
    tileheight: TILE_SIZE,
    tilewidth: TILE_SIZE,
    tiles,
  }
}

function buildTilemap() {
  const tileCount = TILESET_COLS * TILESET_ROWS
  // Landmark image-collection tileset begins right after the main tileset.
  const landmarkFirstGid = 1 + tileCount

  const ground = buildGroundLayer()
  const deco = buildDecorationLayer(landmarkFirstGid)
  const collision = buildCollisionLayer(deco, landmarkFirstGid)

  // Custom map-level properties: zone bounds for runtime parsing
  const properties = []
  for (const [zone, b] of Object.entries(ZONES)) {
    properties.push({ name: `zone_${zone}_x_min`, type: 'int', value: b.x_min })
    properties.push({ name: `zone_${zone}_y_min`, type: 'int', value: b.y_min })
    properties.push({ name: `zone_${zone}_x_max`, type: 'int', value: b.x_max })
    properties.push({ name: `zone_${zone}_y_max`, type: 'int', value: b.y_max })
  }

  const tmj = {
    compressionlevel: -1,
    width: MAP_W,
    height: MAP_H,
    tilewidth: TILE_SIZE,
    tileheight: TILE_SIZE,
    infinite: false,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.0',
    type: 'map',
    version: '1.10',
    nextlayerid: 4,
    nextobjectid: 1,
    layers: [
      {
        id: 1, name: 'Ground', type: 'tilelayer',
        width: MAP_W, height: MAP_H, opacity: 1, visible: true, x: 0, y: 0,
        data: ground,
      },
      {
        id: 2, name: 'Decoration', type: 'tilelayer',
        width: MAP_W, height: MAP_H, opacity: 1, visible: true, x: 0, y: 0,
        data: deco,
      },
      {
        id: 3, name: 'Collision', type: 'tilelayer',
        width: MAP_W, height: MAP_H, opacity: 0.5, visible: false, x: 0, y: 0,
        data: collision,
      },
    ],
    tilesets: [
      buildTileset_TmjBlock(tileCount, 'tileset_main.png', TILE_SIZE * TILESET_COLS, TILE_SIZE * TILESET_ROWS),
      buildLandmarksTileset_TmjBlock(landmarkFirstGid),
    ],
    properties,
  }
  return tmj
}

// ───────────────────────────────────────────────────────────────────
// Landmark sprites (32×32 each)
// ───────────────────────────────────────────────────────────────────
function drawLandmarkConventionArch() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // pillars
  fillRect(buf, W, H, 4, 14, 3, 16, [180, 100, 100, 255])
  fillRect(buf, W, H, 25, 14, 3, 16, [180, 100, 100, 255])
  // rainbow arch — 6 colored arcs
  const arcColors = [
    [255, 80, 80], [255, 160, 80], [255, 230, 80],
    [80, 200, 80], [80, 160, 220], [180, 100, 220],
  ]
  for (let i = 0; i < arcColors.length; i++) {
    const r = 13 - i
    for (let a = 0; a <= 180; a++) {
      const rad = (a * Math.PI) / 180
      const x = Math.round(16 + Math.cos(rad) * r)
      const y = Math.round(14 - Math.sin(rad) * r)
      setPx(buf, W, H, x, y, [...arcColors[i], 255])
    }
  }
  // banner triangle
  fillRect(buf, W, H, 14, 12, 4, 2, [255, 255, 255, 255])
  return { buf, w: W, h: H }
}

function drawLandmarkCosReflector() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // tripod legs
  line(buf, W, H, 16, 16, 6, 30, [80, 80, 80, 255])
  line(buf, W, H, 16, 16, 26, 30, [80, 80, 80, 255])
  line(buf, W, H, 16, 16, 16, 30, [80, 80, 80, 255])
  // reflector disc
  fillCircle(buf, W, H, 16, 12, 9, [240, 240, 240, 255])
  strokeCircle(buf, W, H, 16, 12, 9, [180, 180, 180, 255])
  // rays
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180
    const x = Math.round(16 + Math.cos(rad) * 11)
    const y = Math.round(12 + Math.sin(rad) * 11)
    setPx(buf, W, H, x, y, [255, 255, 200, 255])
  }
  return { buf, w: W, h: H }
}

function drawLandmarkGoodsShelf() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // shelf body
  fillRect(buf, W, H, 3, 6, 26, 22, [140, 100, 60, 255])
  strokeRect(buf, W, H, 3, 6, 26, 22, [80, 50, 30, 255])
  // shelves dividers
  fillRect(buf, W, H, 3, 13, 26, 1, [80, 50, 30, 255])
  fillRect(buf, W, H, 3, 20, 26, 1, [80, 50, 30, 255])
  // badges (colored squares)
  const badges = [
    [[5, 8], [255, 100, 150]], [[10, 8], [255, 200, 80]], [[15, 8], [120, 200, 220]],
    [[20, 8], [180, 120, 220]], [[5, 15], [255, 150, 100]], [[10, 15], [180, 220, 120]],
    [[15, 15], [220, 100, 200]], [[20, 15], [120, 180, 240]], [[25, 8], [240, 240, 100]],
    [[5, 22], [255, 100, 100]], [[10, 22], [100, 240, 200]],
  ]
  for (const [pos, c] of badges) fillRect(buf, W, H, pos[0], pos[1], 3, 3, [...c, 255])
  return { buf, w: W, h: H }
}

function drawLandmarkDoujinEasel() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // easel triangle legs
  line(buf, W, H, 16, 4, 8, 28, [110, 80, 50, 255])
  line(buf, W, H, 16, 4, 24, 28, [110, 80, 50, 255])
  line(buf, W, H, 12, 16, 20, 16, [110, 80, 50, 255])
  // canvas
  fillRect(buf, W, H, 9, 8, 14, 14, [250, 250, 245, 255])
  strokeRect(buf, W, H, 9, 8, 14, 14, [80, 80, 70, 255])
  // sketch lines
  line(buf, W, H, 12, 12, 18, 14, [60, 60, 90, 255])
  line(buf, W, H, 12, 17, 17, 19, [60, 60, 90, 255])
  // pencil pixel pointing up-right
  setPx(buf, W, H, 24, 18, [255, 200, 80, 255])
  setPx(buf, W, H, 25, 17, [200, 60, 60, 255])
  return { buf, w: W, h: H }
}

function drawLandmarkNewbieSignpost() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // post
  fillRect(buf, W, H, 15, 8, 2, 22, [110, 75, 40, 255])
  // arrow board pointing up
  fillRect(buf, W, H, 8, 4, 16, 6, [200, 160, 110, 255])
  strokeRect(buf, W, H, 8, 4, 16, 6, [80, 50, 30, 255])
  // arrowhead
  for (let i = 0; i < 4; i++) {
    setPx(buf, W, H, 24 + i, 4 + i, [80, 50, 30, 255])
    setPx(buf, W, H, 24 + i, 9 - i, [80, 50, 30, 255])
  }
  // sparkle
  setPx(buf, W, H, 20, 2, [255, 230, 150, 255])
  setPx(buf, W, H, 21, 1, [255, 250, 200, 255])
  setPx(buf, W, H, 22, 2, [255, 230, 150, 255])
  // small slime dot near top
  fillCircle(buf, W, H, 16, 6, 1, [120, 200, 255, 255])
  return { buf, w: W, h: H }
}

function drawLandmarkLimitedSniperTower() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // tower body
  fillRect(buf, W, H, 12, 6, 8, 24, [40, 60, 100, 255])
  strokeRect(buf, W, H, 12, 6, 8, 24, [25, 40, 70, 255])
  // floor lines
  for (let y = 10; y < 30; y += 4) fillRect(buf, W, H, 12, y, 8, 1, [25, 40, 70, 255])
  // antenna
  fillRect(buf, W, H, 15, 1, 2, 6, [200, 200, 220, 255])
  fillRect(buf, W, H, 14, 0, 4, 1, [220, 60, 60, 255])
  // cyan dot (radar)
  fillRect(buf, W, H, 14, 8, 4, 2, [122, 231, 255, 255])
  return { buf, w: W, h: H }
}

function drawLandmarkBuzzTvWall() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // outer frame
  fillRect(buf, W, H, 2, 4, 28, 22, [40, 40, 50, 255])
  strokeRect(buf, W, H, 2, 4, 28, 22, [220, 220, 230, 255])
  // diagonal stripe pattern
  for (let i = 0; i < 28; i++) {
    for (let j = 0; j < 22; j++) {
      if ((i + j) % 4 === 0) {
        setPx(buf, W, H, 2 + i, 4 + j, [255, 100, 200, 255])
      } else if ((i + j) % 4 === 2) {
        setPx(buf, W, H, 2 + i, 4 + j, [80, 200, 255, 255])
      }
    }
  }
  // LED dots row
  for (let i = 0; i < 6; i++) setPx(buf, W, H, 5 + i * 4, 27, [255, 230, 80, 255])
  // legs
  fillRect(buf, W, H, 6, 26, 2, 4, [80, 80, 90, 255])
  fillRect(buf, W, H, 24, 26, 2, 4, [80, 80, 90, 255])
  return { buf, w: W, h: H }
}

const LANDMARKS = {
  landmark_convention_arch: drawLandmarkConventionArch,
  landmark_cos_studio_reflector: drawLandmarkCosReflector,
  landmark_goods_shelf: drawLandmarkGoodsShelf,
  landmark_doujin_easel: drawLandmarkDoujinEasel,
  landmark_newbie_signpost: drawLandmarkNewbieSignpost,
  landmark_limited_sniper_tower: drawLandmarkLimitedSniperTower,
  landmark_buzz_tv_wall: drawLandmarkBuzzTvWall,
}

// ───────────────────────────────────────────────────────────────────
// Mascot frame drawing
// frames: idle, portrait_64 (different size!), walk_{dir}_{01-04},
//         action_brewing_{01-02}, action_talking_{01-02}
// ───────────────────────────────────────────────────────────────────
function drawMascotBaseShape(buf, W, H, mascotType, opts) {
  const { facing = 'down', legPhase = 0, mouthOpen = false, scale = 1 } = opts
  const colors = MASCOT_COLORS[mascotType]
  const cx = Math.floor(W / 2)
  const headY = Math.floor(H * 0.35)
  const headR = Math.max(5, Math.floor(7 * scale))

  // Slime is special — no legs, blob shape
  if (mascotType === 'slime_newbie') {
    // round-ish blob
    fillCircle(buf, W, H, cx, Math.floor(H * 0.62), Math.floor(11 * scale), [...colors.body, 255])
    // shading
    fillCircle(buf, W, H, cx + 3, Math.floor(H * 0.55), Math.floor(4 * scale), [...colors.dark, 200])
    // sparkle on top
    setPx(buf, W, H, cx, Math.floor(H * 0.42), [255, 255, 255, 255])
    setPx(buf, W, H, cx - 1, Math.floor(H * 0.43), [255, 255, 255, 200])
    // eyes
    const eyeY = Math.floor(H * 0.6)
    setPx(buf, W, H, cx - 3, eyeY, [...PALETTE.black, 255])
    setPx(buf, W, H, cx + 3, eyeY, [...PALETTE.black, 255])
    // mouth
    if (mouthOpen) fillRect(buf, W, H, cx - 1, eyeY + 3, 3, 1, [...PALETTE.black, 255])
    else fillRect(buf, W, H, cx - 1, eyeY + 3, 3, 1, [...PALETTE.black, 255])
    return
  }

  // Body
  const bodyTop = headY + headR
  const bodyW = Math.floor(10 * scale)
  const bodyH = Math.floor(8 * scale)
  fillRect(buf, W, H, cx - Math.floor(bodyW / 2), bodyTop, bodyW, bodyH, [...colors.body, 255])
  // body shading
  fillRect(buf, W, H, cx - Math.floor(bodyW / 2), bodyTop, 2, bodyH, [...colors.dark, 255])

  // Legs (2 — left/right) with walk phase offset
  const legY = bodyTop + bodyH
  const legH = Math.floor(3 * scale)
  const phaseOffset = legPhase % 4
  const leftLegX = cx - 3
  const rightLegX = cx + 1
  let lOffset = 0, rOffset = 0
  if (phaseOffset === 1) lOffset = -1
  if (phaseOffset === 3) rOffset = -1
  fillRect(buf, W, H, leftLegX, legY + lOffset, 2, legH, [...colors.dark, 255])
  fillRect(buf, W, H, rightLegX, legY + rOffset, 2, legH, [...colors.dark, 255])

  // Head
  fillCircle(buf, W, H, cx, headY, headR, [...colors.body, 255])
  // head highlight
  fillCircle(buf, W, H, cx - 2, headY - 2, Math.max(1, Math.floor(headR / 2.5)), [...colors.accent, 200])

  // Persona-specific facial features depend on facing
  // Eyes
  const eyeY = headY + Math.floor(headR / 4)
  let eyeOffsetX = 0
  if (facing === 'left') eyeOffsetX = -1
  if (facing === 'right') eyeOffsetX = 1
  if (facing !== 'up') {
    setPx(buf, W, H, cx - 2 + eyeOffsetX, eyeY, [...PALETTE.black, 255])
    setPx(buf, W, H, cx + 2 + eyeOffsetX, eyeY, [...PALETTE.black, 255])
  } else {
    // up: tiny eye dots even smaller (back of head)
    setPx(buf, W, H, cx - 2, headY - 1, [...colors.dark, 255])
    setPx(buf, W, H, cx + 2, headY - 1, [...colors.dark, 255])
  }

  // mouth
  if (facing !== 'up') {
    if (mouthOpen) fillRect(buf, W, H, cx, eyeY + 2, 2, 1, [...PALETTE.black, 255])
    else setPx(buf, W, H, cx, eyeY + 2, [...PALETTE.black, 255])
  }

  // persona accents
  switch (mascotType) {
    case 'cat_lore': {
      // pointy ears
      fillRect(buf, W, H, cx - headR + 1, headY - headR - 2, 2, 2, [...colors.body, 255])
      fillRect(buf, W, H, cx + headR - 2, headY - headR - 2, 2, 2, [...colors.body, 255])
      setPx(buf, W, H, cx - headR + 2, headY - headR - 3, [...colors.body, 255])
      setPx(buf, W, H, cx + headR - 2, headY - headR - 3, [...colors.body, 255])
      // glasses (2 white rects around eyes) — only when facing down/left/right
      if (facing !== 'up') {
        setPx(buf, W, H, cx - 3 + eyeOffsetX, eyeY - 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx - 3 + eyeOffsetX, eyeY + 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx - 1 + eyeOffsetX, eyeY - 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx - 1 + eyeOffsetX, eyeY + 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx + 1 + eyeOffsetX, eyeY - 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx + 1 + eyeOffsetX, eyeY + 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx + 3 + eyeOffsetX, eyeY - 1, [255, 255, 255, 255])
        setPx(buf, W, H, cx + 3 + eyeOffsetX, eyeY + 1, [255, 255, 255, 255])
      }
      break
    }
    case 'dog_social': {
      // floppy ears
      fillRect(buf, W, H, cx - headR - 1, headY, 2, 4, [...colors.dark, 255])
      fillRect(buf, W, H, cx + headR, headY, 2, 4, [...colors.dark, 255])
      // tongue (pink pixel below mouth)
      if (facing !== 'up') setPx(buf, W, H, cx, eyeY + 3, [255, 120, 160, 255])
      break
    }
    case 'hamster_hoard': {
      // tiny round ears
      setPx(buf, W, H, cx - 4, headY - headR + 1, [...colors.body, 255])
      setPx(buf, W, H, cx + 3, headY - headR + 1, [...colors.body, 255])
      // cheek puffs
      if (facing !== 'up') {
        setPx(buf, W, H, cx - 4, eyeY + 1, [...colors.accent, 255])
        setPx(buf, W, H, cx + 3, eyeY + 1, [...colors.accent, 255])
      }
      break
    }
    case 'fox_create': {
      // triangle ears
      fillRect(buf, W, H, cx - headR + 1, headY - headR - 1, 2, 2, [...colors.dark, 255])
      fillRect(buf, W, H, cx + headR - 2, headY - headR - 1, 2, 2, [...colors.dark, 255])
      // bushy white-tipped tail
      fillRect(buf, W, H, cx + Math.floor(bodyW / 2), bodyTop + 2, 3, 3, [...colors.body, 255])
      setPx(buf, W, H, cx + Math.floor(bodyW / 2) + 2, bodyTop + 2, [255, 255, 255, 255])
      break
    }
    case 'wolf_limited': {
      // sharp ears
      fillRect(buf, W, H, cx - headR + 1, headY - headR - 1, 1, 2, [...colors.dark, 255])
      fillRect(buf, W, H, cx + headR - 1, headY - headR - 1, 1, 2, [...colors.dark, 255])
      // neon cyan eye dots (override pupils)
      if (facing !== 'up') {
        setPx(buf, W, H, cx - 2 + eyeOffsetX, eyeY, [...colors.accent, 255])
        setPx(buf, W, H, cx + 2 + eyeOffsetX, eyeY, [...colors.accent, 255])
      }
      break
    }
    case 'pigeon_buzz': {
      // round body, no major changes
      // small yellow beak triangle
      if (facing !== 'up') {
        setPx(buf, W, H, cx, eyeY + 2, [255, 200, 80, 255])
        setPx(buf, W, H, cx + 1, eyeY + 2, [255, 200, 80, 255])
      }
      // wing detail
      fillRect(buf, W, H, cx - Math.floor(bodyW / 2) - 1, bodyTop + 2, 1, 3, [...colors.dark, 255])
      break
    }
  }
}

function drawMascotIdle32(mascotType) {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  drawMascotBaseShape(buf, W, H, mascotType, { facing: 'down', legPhase: 0 })
  // ground shadow
  fillRect(buf, W, H, 12, 28, 8, 1, [0, 0, 0, 80])
  return { buf, w: W, h: H }
}

function drawMascotPortrait64(mascotType) {
  const W = 64, H = 64
  const buf = makeBuf(W, H, [...PALETTE.bg1, 255])
  drawMascotBaseShape(buf, W, H, mascotType, { facing: 'down', legPhase: 0, scale: 2 })
  // border
  strokeRect(buf, W, H, 0, 0, W, H, [...PALETTE.pink, 255])
  return { buf, w: W, h: H }
}

function drawMascotWalk32(mascotType, dir, frame) {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  drawMascotBaseShape(buf, W, H, mascotType, { facing: dir, legPhase: frame })
  fillRect(buf, W, H, 12, 28, 8, 1, [0, 0, 0, 80])
  return { buf, w: W, h: H }
}

function drawMascotActionBrewing32(mascotType, frame) {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  drawMascotBaseShape(buf, W, H, mascotType, { facing: 'down', legPhase: 0 })
  // steam dots above head
  const steamDots = frame === 0
    ? [[14, 4], [16, 2], [18, 4]]
    : [[13, 5], [16, 3], [19, 5]]
  for (const [x, y] of steamDots) {
    fillRect(buf, W, H, x, y, 2, 2, [220, 220, 220, 220])
  }
  return { buf, w: W, h: H }
}

function drawMascotActionTalking32(mascotType, frame) {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  drawMascotBaseShape(buf, W, H, mascotType, { facing: 'down', legPhase: 0, mouthOpen: frame === 1 })
  // tiny speech indicator dots top-right
  fillRect(buf, W, H, 24, 4, 2, 2, [255, 255, 255, 255])
  if (frame === 1) fillRect(buf, W, H, 27, 6, 2, 2, [255, 255, 255, 255])
  return { buf, w: W, h: H }
}

// ───────────────────────────────────────────────────────────────────
// NPC frames — humanoid 32×32 with persona-specific facial accents
// ───────────────────────────────────────────────────────────────────
function drawNpcFrame(persona, slotIdx /* 1..5 */, dir, frame /* 0..3 or null for idle */) {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  const hairColor = PALETTE[NPC_HAIR[(slotIdx - 1) % NPC_HAIR.length]]
  const skin = [255, 220, 188]
  const shirt = [
    [120, 160, 220], [220, 160, 200], [180, 220, 160],
    [220, 200, 140], [200, 200, 220],
  ][(slotIdx - 1) % 5]
  const pants = [60, 60, 90]

  const legPhase = frame == null ? 0 : frame

  // Draw legs (with walk offset)
  const legY = 23
  let lOff = 0, rOff = 0
  if (legPhase === 1) lOff = -1
  if (legPhase === 3) rOff = -1
  fillRect(buf, W, H, 13, legY + lOff, 2, 5, [...pants, 255])
  fillRect(buf, W, H, 17, legY + rOff, 2, 5, [...pants, 255])
  // shoes
  fillRect(buf, W, H, 13, 28, 2, 1, [40, 40, 40, 255])
  fillRect(buf, W, H, 17, 28, 2, 1, [40, 40, 40, 255])

  // Torso
  fillRect(buf, W, H, 12, 16, 8, 8, [...shirt, 255])
  fillRect(buf, W, H, 12, 16, 1, 8, [shirt[0] - 30, shirt[1] - 30, shirt[2] - 30, 255])
  // Arms (with subtle swing)
  let aLOff = 0, aROff = 0
  if (legPhase === 1) aROff = 1
  if (legPhase === 3) aLOff = 1
  fillRect(buf, W, H, 10, 17 + aLOff, 2, 6, [...shirt, 255])
  fillRect(buf, W, H, 20, 17 + aROff, 2, 6, [...shirt, 255])
  // hands
  fillRect(buf, W, H, 10, 23 + aLOff, 2, 1, [...skin, 255])
  fillRect(buf, W, H, 20, 23 + aROff, 2, 1, [...skin, 255])

  // Head
  fillCircle(buf, W, H, 16, 11, 5, [...skin, 255])
  // hair (top half + side based on direction)
  if (dir === 'up') {
    fillRect(buf, W, H, 11, 5, 10, 5, [...hairColor, 255])
    fillRect(buf, W, H, 12, 10, 8, 2, [...hairColor, 255])
  } else {
    fillRect(buf, W, H, 11, 5, 10, 4, [...hairColor, 255])
    fillRect(buf, W, H, 11, 8, 1, 4, [...hairColor, 255])
    fillRect(buf, W, H, 20, 8, 1, 4, [...hairColor, 255])
  }
  // hair shine
  setPx(buf, W, H, 13, 6, [hairColor[0] + 30, hairColor[1] + 30, hairColor[2] + 30, 255])
  setPx(buf, W, H, 18, 6, [hairColor[0] + 30, hairColor[1] + 30, hairColor[2] + 30, 255])

  // Eyes & mouth based on persona
  if (dir !== 'up') {
    let eyeOffsetX = 0
    if (dir === 'left') eyeOffsetX = -1
    if (dir === 'right') eyeOffsetX = 1
    drawNpcFace(buf, W, H, 16 + eyeOffsetX, 11, persona)
  }

  // ahoge for tennen
  if (persona === 'tennen' && dir !== 'up') {
    setPx(buf, W, H, 16, 4, [...hairColor, 255])
    setPx(buf, W, H, 16, 3, [...hairColor, 255])
  }

  // ground shadow
  fillRect(buf, W, H, 12, 29, 8, 1, [0, 0, 0, 80])
  return { buf, w: W, h: H }
}

function drawNpcFace(buf, W, H, cx, cy, persona) {
  const black = [...PALETTE.black, 255]
  switch (persona) {
    case 'tsundere': {
      // angled eyebrows + cheek dots
      setPx(buf, W, H, cx - 3, cy - 2, black)
      setPx(buf, W, H, cx - 2, cy - 2, black)
      setPx(buf, W, H, cx + 2, cy - 2, black)
      setPx(buf, W, H, cx + 3, cy - 2, black)
      // eyes
      setPx(buf, W, H, cx - 2, cy, black)
      setPx(buf, W, H, cx + 2, cy, black)
      // mouth pouty
      setPx(buf, W, H, cx, cy + 2, black)
      // pink cheek dots
      setPx(buf, W, H, cx - 3, cy + 1, [255, 168, 200, 255])
      setPx(buf, W, H, cx + 3, cy + 1, [255, 168, 200, 255])
      break
    }
    case 'yandere': {
      // half-closed eyes (single horizontal line)
      fillRect(buf, W, H, cx - 3, cy, 2, 1, black)
      fillRect(buf, W, H, cx + 2, cy, 2, 1, black)
      // unsettling smile (slight curve)
      setPx(buf, W, H, cx - 1, cy + 2, black)
      setPx(buf, W, H, cx, cy + 2, black)
      setPx(buf, W, H, cx + 1, cy + 2, black)
      setPx(buf, W, H, cx + 2, cy + 2, black)
      break
    }
    case 'tennen': {
      // wide-apart dot eyes, blank
      setPx(buf, W, H, cx - 3, cy, black)
      setPx(buf, W, H, cx + 3, cy, black)
      // small o mouth
      setPx(buf, W, H, cx, cy + 2, black)
      setPx(buf, W, H, cx, cy + 3, black)
      break
    }
    case 'chuuni': {
      // X eye on right, normal on left
      setPx(buf, W, H, cx - 2, cy, black)
      setPx(buf, W, H, cx + 1, cy - 1, black)
      setPx(buf, W, H, cx + 3, cy - 1, black)
      setPx(buf, W, H, cx + 2, cy, black)
      setPx(buf, W, H, cx + 1, cy + 1, black)
      setPx(buf, W, H, cx + 3, cy + 1, black)
      // smirk
      setPx(buf, W, H, cx - 1, cy + 2, black)
      setPx(buf, W, H, cx, cy + 2, black)
      // dramatic dot above
      setPx(buf, W, H, cx + 2, cy - 3, [180, 60, 200, 255])
      break
    }
    case 'sanmu': {
      // flat dash mouth, expressionless eyes
      setPx(buf, W, H, cx - 2, cy, black)
      setPx(buf, W, H, cx + 2, cy, black)
      fillRect(buf, W, H, cx - 1, cy + 2, 3, 1, black)
      // glasses
      setPx(buf, W, H, cx - 3, cy, black)
      setPx(buf, W, H, cx + 3, cy, black)
      break
    }
    case 'hara_guro': {
      // smirk + half-closed right eye
      setPx(buf, W, H, cx - 2, cy, black)
      fillRect(buf, W, H, cx + 2, cy, 2, 1, black)
      // asymmetric mouth (curl up on left)
      setPx(buf, W, H, cx - 1, cy + 2, black)
      setPx(buf, W, H, cx, cy + 2, black)
      setPx(buf, W, H, cx + 1, cy + 1, black)
      break
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// SVG generators
// ───────────────────────────────────────────────────────────────────
function svgSpeechBubble() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60" viewBox="0 0 140 74">
  <defs>
    <filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="0" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#bubbleShadow)">
    <rect x="2" y="2" width="136" height="56" rx="8" ry="8" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2"/>
    <polygon points="62,58 70,72 78,58" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2"/>
    <polygon points="64,58 70,71 76,58" fill="#FFFFFF"/>
  </g>
</svg>
`
}

function svgDegradedBanner() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="36" viewBox="0 0 800 36" preserveAspectRatio="none">
  <defs>
    <linearGradient id="degradedGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF6F6F"/>
      <stop offset="100%" stop-color="#FF8B6F"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="800" height="36" fill="url(#degradedGrad)"/>
  <text x="400" y="23" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">⚠ DEGRADED MODE — placeholder banner</text>
</svg>
`
}

function svgMascotIcon(mascotType) {
  const c = MASCOT_COLORS[mascotType]
  const hex = (rgb) => '#' + rgb.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('')
  const bodyHex = hex(c.body)
  const accentHex = hex(c.accent)
  const darkHex = hex(c.dark)

  // shared frame
  const frame = `<rect x="0" y="0" width="48" height="48" fill="#0E1018"/>
  <circle cx="24" cy="24" r="20" fill="${bodyHex}" stroke="${darkHex}" stroke-width="2"/>`

  // per-type extra detail
  let detail = ''
  switch (mascotType) {
    case 'cat_lore':
      detail = `
  <polygon points="10,12 14,6 16,14" fill="${bodyHex}" stroke="${darkHex}" stroke-width="1"/>
  <polygon points="34,14 32,6 38,12" fill="${bodyHex}" stroke="${darkHex}" stroke-width="1"/>
  <circle cx="18" cy="24" r="3" fill="#fff" stroke="${darkHex}" stroke-width="1"/>
  <circle cx="30" cy="24" r="3" fill="#fff" stroke="${darkHex}" stroke-width="1"/>
  <circle cx="18" cy="24" r="1" fill="#1A1A1A"/>
  <circle cx="30" cy="24" r="1" fill="#1A1A1A"/>
  <line x1="21" y1="24" x2="27" y2="24" stroke="${darkHex}" stroke-width="1"/>`
      break
    case 'dog_social':
      detail = `
  <ellipse cx="10" cy="22" rx="3" ry="6" fill="${darkHex}"/>
  <ellipse cx="38" cy="22" rx="3" ry="6" fill="${darkHex}"/>
  <circle cx="20" cy="22" r="1.5" fill="#1A1A1A"/>
  <circle cx="28" cy="22" r="1.5" fill="#1A1A1A"/>
  <ellipse cx="24" cy="30" rx="3" ry="2" fill="#FF6FA0"/>
  <path d="M 35 36 Q 40 30 38 25" fill="none" stroke="${darkHex}" stroke-width="2"/>`
      break
    case 'hamster_hoard':
      detail = `
  <circle cx="14" cy="16" r="3" fill="${bodyHex}" stroke="${darkHex}" stroke-width="1"/>
  <circle cx="34" cy="16" r="3" fill="${bodyHex}" stroke="${darkHex}" stroke-width="1"/>
  <circle cx="20" cy="22" r="1.5" fill="#1A1A1A"/>
  <circle cx="28" cy="22" r="1.5" fill="#1A1A1A"/>
  <ellipse cx="14" cy="30" rx="3" ry="2" fill="#F5D7B8"/>
  <ellipse cx="34" cy="30" rx="3" ry="2" fill="#F5D7B8"/>
  <circle cx="24" cy="28" r="1.5" fill="#FF6FA0"/>`
      break
    case 'fox_create':
      detail = `
  <polygon points="10,14 14,4 18,16" fill="${darkHex}"/>
  <polygon points="30,16 34,4 38,14" fill="${darkHex}"/>
  <circle cx="20" cy="24" r="1.5" fill="#1A1A1A"/>
  <circle cx="28" cy="24" r="1.5" fill="#1A1A1A"/>
  <path d="M 38 30 Q 44 32 42 38" fill="none" stroke="${darkHex}" stroke-width="3"/>
  <circle cx="42" cy="38" r="2" fill="#fff"/>`
      break
    case 'slime_newbie':
      detail = `
  <circle cx="20" cy="22" r="1.5" fill="#1A1A1A"/>
  <circle cx="28" cy="22" r="1.5" fill="#1A1A1A"/>
  <path d="M 22 28 Q 24 30 26 28" fill="none" stroke="#1A1A1A" stroke-width="1.5"/>
  <polygon points="24,4 25,8 28,9 25,10 24,14 23,10 20,9 23,8" fill="#fff"/>
  <circle cx="18" cy="18" r="2" fill="${accentHex}" opacity="0.7"/>`
      break
    case 'wolf_limited':
      detail = `
  <polygon points="10,12 12,4 16,14" fill="${darkHex}"/>
  <polygon points="32,14 36,4 38,12" fill="${darkHex}"/>
  <circle cx="20" cy="22" r="2" fill="${accentHex}"/>
  <circle cx="28" cy="22" r="2" fill="${accentHex}"/>
  <line x1="22" y1="30" x2="26" y2="30" stroke="#1A1A1A" stroke-width="2"/>`
      break
    case 'pigeon_buzz':
      detail = `
  <polygon points="34,22 42,24 34,26" fill="#FFC850"/>
  <circle cx="22" cy="22" r="1.5" fill="#1A1A1A"/>
  <ellipse cx="14" cy="30" rx="6" ry="3" fill="${darkHex}"/>
  <rect x="36" y="32" width="3" height="6" fill="#666"/>
  <circle cx="37.5" cy="30" r="2" fill="#444"/>`
      break
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  ${frame}
  ${detail}
</svg>
`
}

function svgCompanionIcon(type) {
  const palettes = {
    convention:  { bg: '#FF6FB7', fg: '#FFFFFF' },
    cos:         { bg: '#7AE7FF', fg: '#0E1018' },
    photo:       { bg: '#B6FF6F', fg: '#0E1018' },
    booth:       { bg: '#FFB86F', fg: '#0E1018' },
    goods:       { bg: '#D8C5A8', fg: '#0E1018' },
    same_ip:     { bg: '#A78BFA', fg: '#FFFFFF' },
    same_city:   { bg: '#A8D8FF', fg: '#0E1018' },
    duet:        { bg: '#FFA8D8', fg: '#0E1018' },
    newbie:      { bg: '#A8FFD8', fg: '#0E1018' },
    limited:     { bg: '#3250A2', fg: '#7AE7FF' },
    doujin:      { bg: '#D8A8FF', fg: '#0E1018' },
  }
  const p = palettes[type]

  let detail = ''
  switch (type) {
    case 'convention':
      detail = `
  <rect x="6" y="20" width="36" height="22" fill="#3D2A38"/>
  <path d="M 6 20 L 10 8 L 38 8 L 42 20 Z" fill="${p.fg}"/>
  <path d="M 12 20 Q 16 32 12 42" fill="${p.fg}" opacity="0.6"/>
  <path d="M 36 20 Q 32 32 36 42" fill="${p.fg}" opacity="0.6"/>
  <rect x="22" y="28" width="4" height="14" fill="#FFC850"/>`
      break
    case 'cos':
      detail = `
  <ellipse cx="24" cy="22" rx="14" ry="18" fill="${p.fg}" stroke="#0E1018" stroke-width="2"/>
  <ellipse cx="24" cy="22" rx="10" ry="13" fill="${p.bg}" opacity="0.4"/>
  <rect x="20" y="38" width="8" height="6" fill="#0E1018"/>
  <rect x="14" y="42" width="20" height="2" fill="#0E1018"/>`
      break
    case 'photo':
      detail = `
  <rect x="6" y="14" width="36" height="24" rx="3" fill="#1A1A1A"/>
  <circle cx="24" cy="26" r="9" fill="${p.bg}" stroke="#0E1018" stroke-width="2"/>
  <circle cx="24" cy="26" r="4" fill="#0E1018"/>
  <rect x="14" y="10" width="10" height="6" fill="#1A1A1A"/>
  <circle cx="36" cy="18" r="1.5" fill="#FF6F6F"/>`
      break
    case 'booth':
      detail = `
  <rect x="8" y="22" width="32" height="18" fill="#8B5A3C"/>
  <path d="M 4 20 L 24 8 L 44 20 Z" fill="${p.fg}"/>
  <rect x="6" y="20" width="4" height="3" fill="#FF6F6F"/>
  <rect x="14" y="20" width="4" height="3" fill="#FFFFFF"/>
  <rect x="22" y="20" width="4" height="3" fill="#FF6F6F"/>
  <rect x="30" y="20" width="4" height="3" fill="#FFFFFF"/>
  <rect x="38" y="20" width="4" height="3" fill="#FF6F6F"/>`
      break
    case 'goods':
      detail = `
  <rect x="8" y="20" width="32" height="22" fill="#FFB86F" stroke="#0E1018" stroke-width="2"/>
  <rect x="22" y="20" width="4" height="22" fill="${p.fg}"/>
  <path d="M 16 14 Q 20 8 24 14 Q 28 8 32 14 L 26 20 L 22 20 Z" fill="${p.fg}" stroke="#0E1018" stroke-width="2"/>`
      break
    case 'same_ip':
      detail = `
  <circle cx="18" cy="24" r="9" fill="none" stroke="${p.fg}" stroke-width="3"/>
  <circle cx="30" cy="24" r="9" fill="none" stroke="${p.fg}" stroke-width="3"/>
  <circle cx="24" cy="24" r="3" fill="${p.fg}"/>`
      break
    case 'same_city':
      detail = `
  <path d="M 24 6 C 14 6 10 16 10 22 C 10 30 24 42 24 42 C 24 42 38 30 38 22 C 38 16 34 6 24 6 Z" fill="${p.fg}"/>
  <circle cx="24" cy="22" r="5" fill="${p.bg}"/>`
      break
    case 'duet':
      detail = `
  <circle cx="16" cy="14" r="5" fill="${p.fg}"/>
  <rect x="11" y="20" width="10" height="14" fill="${p.fg}"/>
  <circle cx="32" cy="14" r="5" fill="${p.fg}"/>
  <rect x="27" y="20" width="10" height="14" fill="${p.fg}"/>`
      break
    case 'newbie':
      detail = `
  <path d="M 12 6 Q 14 18 22 22 L 22 32 L 30 32 L 30 22 Q 36 18 36 6" fill="none" stroke="${p.fg}" stroke-width="3"/>
  <rect x="22" y="32" width="8" height="10" fill="${p.fg}"/>`
      break
    case 'limited':
      detail = `
  <circle cx="24" cy="24" r="14" fill="none" stroke="${p.fg}" stroke-width="3"/>
  <line x1="24" y1="24" x2="24" y2="14" stroke="${p.fg}" stroke-width="3"/>
  <line x1="24" y1="24" x2="32" y2="28" stroke="${p.fg}" stroke-width="3"/>
  <polygon points="32,28 36,30 32,32" fill="${p.fg}"/>`
      break
    case 'doujin':
      detail = `
  <rect x="10" y="8" width="22" height="32" fill="#FFFFFF" stroke="#0E1018" stroke-width="2"/>
  <line x1="14" y1="14" x2="28" y2="14" stroke="#0E1018" stroke-width="1"/>
  <line x1="14" y1="20" x2="28" y2="20" stroke="#0E1018" stroke-width="1"/>
  <line x1="14" y1="26" x2="24" y2="26" stroke="#0E1018" stroke-width="1"/>
  <polygon points="32,32 40,24 38,38" fill="#FFC850" stroke="#0E1018" stroke-width="1"/>`
      break
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect x="0" y="0" width="48" height="48" fill="${p.bg}" rx="6" ry="6"/>
  ${detail}
</svg>
`
}

function buildGlassCardBg() {
  const W = 128, H = 128
  const buf = makeBuf(W, H)
  const rng = seededRng(9001)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // base 240..255 noise
      const n = Math.floor(rng() * 16)
      const r = 240 + n
      const g = 240 + n
      const b = 248 + Math.floor(n * 0.5)
      const idx = (y * W + x) * 4
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = 30
    }
  }
  return { buf, w: W, h: H }
}

function buildIsekaiParticleP01() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // 4-pointed star (radial cross) — vertical/horizontal bars with magenta border
  for (let y = 6; y < 26; y++) {
    fillRect(buf, W, H, 14, y, 4, 1, [255, 255, 255, 230])
  }
  for (let x = 6; x < 26; x++) {
    fillRect(buf, W, H, x, 14, 1, 4, [255, 255, 255, 230])
  }
  // magenta border tips
  fillRect(buf, W, H, 15, 4, 2, 2, [255, 80, 200, 255])
  fillRect(buf, W, H, 15, 26, 2, 2, [255, 80, 200, 255])
  fillRect(buf, W, H, 4, 15, 2, 2, [255, 80, 200, 255])
  fillRect(buf, W, H, 26, 15, 2, 2, [255, 80, 200, 255])
  return { buf, w: W, h: H }
}

function buildIsekaiParticleP02() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // 6-pointed sparkle (Star of David-like): two triangles
  // upward triangle
  for (let y = 0; y < 16; y++) {
    const dx = y
    fillRect(buf, W, H, 16 - dx, 4 + y, 1, 1, [255, 220, 255, 240])
    fillRect(buf, W, H, 16 + dx, 4 + y, 1, 1, [255, 220, 255, 240])
  }
  // downward triangle
  for (let y = 0; y < 16; y++) {
    const dx = 15 - y
    fillRect(buf, W, H, 16 - dx, 12 + y, 1, 1, [220, 200, 255, 240])
    fillRect(buf, W, H, 16 + dx, 12 + y, 1, 1, [220, 200, 255, 240])
  }
  // center pop
  fillCircle(buf, W, H, 16, 16, 3, [255, 255, 255, 255])
  return { buf, w: W, h: H }
}

function buildIsekaiParticleP03() {
  const W = 32, H = 32
  const buf = makeBuf(W, H)
  // glowing orb — radial gradient
  const cx = 16, cy = 16
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx
      const dy = y - cy
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > 14) continue
      const t = d / 14 // 0 center → 1 edge
      // color: white (255,255,255) → magenta (255,80,200)
      const r = Math.round(255)
      const g = Math.round(255 - t * 175)
      const b = Math.round(255 - t * 55)
      const a = Math.round((1 - t * t) * 255)
      const idx = (y * W + x) * 4
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = a
    }
  }
  return { buf, w: W, h: H }
}

// ───────────────────────────────────────────────────────────────────
// Output helpers
// ───────────────────────────────────────────────────────────────────
function writePng(rel, { buf, w, h }) {
  const out = path.join(ASSETS, rel)
  writeRawPng({ out, w, h, pixels: buf })
}

function writeSvg(rel, content) {
  const out = path.join(ASSETS, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, content, 'utf-8')
}

function writeJson(rel, obj) {
  const out = path.join(ASSETS, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, JSON.stringify(obj, null, 2), 'utf-8')
}

function deleteIfExists(absPath) {
  if (fs.existsSync(absPath)) fs.unlinkSync(absPath)
}

function rmDirIfExists(absPath) {
  if (fs.existsSync(absPath)) {
    for (const f of fs.readdirSync(absPath)) {
      const p = path.join(absPath, f)
      if (fs.statSync(p).isDirectory()) rmDirIfExists(p)
      else fs.unlinkSync(p)
    }
    fs.rmdirSync(absPath)
  }
}

// ───────────────────────────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────────────────────────
function run() {
  const counts = {
    tileset: 0, tilemap: 0, landmarks: 0,
    mascots: 0, npcs: 0, ui_svgs: 0, ui_pngs: 0,
  }

  // 1. Tileset
  console.log('▶ Building tileset_main.png (256×256, 8×8 grid)…')
  const tileset = buildTileset()
  writePng('tilemaps/tileset_main.png', tileset)
  counts.tileset++

  // 2. Tilemap
  console.log('▶ Building town_64x64.tmj (64×64 with 4+7 zones)…')
  const tmj = buildTilemap()
  writeJson('tilemaps/town_64x64.tmj', tmj)
  counts.tilemap++

  // 3. Landmarks
  console.log('▶ Drawing 7 landmark sprites…')
  for (const [name, drawer] of Object.entries(LANDMARKS)) {
    writePng(`tilemaps/landmarks/${name}.png`, drawer())
    counts.landmarks++
  }

  // 4. Mascots
  console.log('▶ Drawing 7 mascots × 26 frames…')
  for (const m of MASCOT_TYPES) {
    const dir = `mascots/${m}`
    writePng(`${dir}/idle.png`, drawMascotIdle32(m))
    writePng(`${dir}/portrait_64.png`, drawMascotPortrait64(m))
    counts.mascots += 2
    for (const d of ['down', 'up', 'left', 'right']) {
      for (let f = 0; f < 4; f++) {
        const num = String(f + 1).padStart(2, '0')
        writePng(`${dir}/walk_${d}_${num}.png`, drawMascotWalk32(m, d, f))
        counts.mascots++
      }
    }
    for (let f = 0; f < 2; f++) {
      const num = String(f + 1).padStart(2, '0')
      writePng(`${dir}/action_brewing_${num}.png`, drawMascotActionBrewing32(m, f))
      writePng(`${dir}/action_talking_${num}.png`, drawMascotActionTalking32(m, f))
      counts.mascots += 2
    }
  }

  // 5. NPCs (6 personas × 5 slots × 17 frames)
  console.log('▶ Drawing 6 personas × 5 NPCs × 17 frames…')
  for (const persona of PERSONAS) {
    for (let slot = 1; slot <= 5; slot++) {
      const slotStr = String(slot).padStart(2, '0')
      const dir = `npc/${persona}/${slotStr}`
      // idle (down-facing, no walk phase)
      writePng(`${dir}/idle.png`, drawNpcFrame(persona, slot, 'down', 0))
      counts.npcs++
      for (const d of ['down', 'up', 'left', 'right']) {
        for (let f = 0; f < 4; f++) {
          const num = String(f + 1).padStart(2, '0')
          writePng(`${dir}/walk_${d}_${num}.png`, drawNpcFrame(persona, slot, d, f))
          counts.npcs++
        }
      }
    }
  }

  // 6. UI SVGs
  console.log('▶ Writing UI SVGs…')
  writeSvg('ui/speech_bubble.svg', svgSpeechBubble())
  writeSvg('ui/degraded_banner.svg', svgDegradedBanner())
  counts.ui_svgs += 2
  for (const m of MASCOT_TYPES) {
    writeSvg(`ui/icons_mascot/${m}.svg`, svgMascotIcon(m))
    counts.ui_svgs++
  }
  const COMPANIONS = ['convention', 'cos', 'photo', 'booth', 'goods', 'same_ip', 'same_city', 'duet', 'newbie', 'limited', 'doujin']
  for (const c of COMPANIONS) {
    writeSvg(`ui/icons_companion/${c}.svg`, svgCompanionIcon(c))
    counts.ui_svgs++
  }

  // 7. Glass card bg + isekai particles
  console.log('▶ Writing Glass card bg + 3 isekai particles…')
  writePng('ui/glass_card_bg.png', buildGlassCardBg())
  writePng('ui/isekai_particles/p01.png', buildIsekaiParticleP01())
  writePng('ui/isekai_particles/p02.png', buildIsekaiParticleP02())
  writePng('ui/isekai_particles/p03.png', buildIsekaiParticleP03())
  counts.ui_pngs += 4

  // 8. Delete superseded sprite placeholders
  console.log('▶ Cleaning up _placeholder/ directory…')
  rmDirIfExists(path.join(ASSETS, 'sprites', '_placeholder'))
  // Leave the empty sprites/ dir intact (.gitkeep present)

  // Summary
  console.log('')
  console.log('────── Generation summary ──────')
  console.log(`  tileset PNGs:    ${counts.tileset}`)
  console.log(`  tilemap TMJ:     ${counts.tilemap}`)
  console.log(`  landmarks:       ${counts.landmarks}`)
  console.log(`  mascot frames:   ${counts.mascots}`)
  console.log(`  npc frames:      ${counts.npcs}`)
  console.log(`  ui SVGs:         ${counts.ui_svgs}`)
  console.log(`  ui PNGs:         ${counts.ui_pngs}`)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(`  TOTAL:           ${total}`)
  console.log('────────────────────────────────')
}

run()
