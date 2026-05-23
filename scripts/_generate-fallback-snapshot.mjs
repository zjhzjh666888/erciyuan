#!/usr/bin/env node
/**
 * scripts/_generate-fallback-snapshot.mjs
 *
 * Task 11.8 — replace the procedurally-generated placeholder
 * `assets/fallback/town_static_snapshot.png` with a higher-quality
 * pixel-art top-down town view that visually matches what the Phaser
 * `TownScene` would render.
 *
 * Why a separate script (vs `_generate-real-assets.mjs`)?
 * - The real-assets generator already runs as part of Wave 4 procedural
 *   build and exposes 7 different tilesets / sprite sheets. This script
 *   is single-purpose and can be re-run independently after every
 *   visual tweak without rebuilding the entire asset library.
 * - Per the task brief, we must NOT spawn a headless browser; pure
 *   Node + zlib + Buffer is the only allowed channel.
 *
 * Output: 1280×720 RGBA PNG with
 *   • light cream (#FFF4D4) ground tiles
 *   • 7 zone tinted patches (5 zone tints from tokens.json + Newbie /
 *     Limited fillers using the mascot palette)
 *   • each zone carries a small 32×32 landmark motif
 *   • 3 mascot dots aligned with DomFallbackStage DEFAULT_SPRITES
 *   • subtle 32 px grid lines (rgba(0,0,0,0.05))
 *
 * Constraints honored:
 *   - DOES NOT use any external dependency. Only `node:fs`, `node:path`
 *     and the in-repo `make-placeholder-png.mjs` codec.
 *   - DOES NOT spawn a headless browser.
 *   - Image size stays well below the 64 KB target thanks to
 *     deflate-friendly large flat colour regions.
 *   - Idempotent / deterministic — same input ⇒ byte-identical output.
 *
 * Usage (from repo root):
 *   node scripts/_generate-fallback-snapshot.mjs
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeRawPng } from './make-placeholder-png.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const OUT = path.join(REPO_ROOT, 'assets', 'fallback', 'town_static_snapshot.png')

// ───────────────────────────────────────────────────────────────────
// Canvas and palette
// ───────────────────────────────────────────────────────────────────
const W = 1280
const H = 720
const TILE = 32

// Palette derived from apps/web/src/theme/tokens.json (24 main colours).
const hex = (s) => {
  const v = s.replace('#', '')
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ]
}

const COLOR = {
  // Ground — light cream
  ground:           hex('#FFF4D4'),
  groundShade:      hex('#F0E4BA'),
  // Zones (5 tokens from tokens.json)
  zonePlaza:        hex('#FFE4F0'),
  zoneCosStudio:    hex('#FFD9A8'),
  zoneGoodsBazaar:  hex('#FFEABF'), // slightly warmer than ground for contrast
  zoneDoujinAtelier:hex('#D8A8FF'),
  zoneBuzzSquare:   hex('#D4F4FF'),
  // Filler zones (no dedicated token in palette)
  zoneNewbieLobby:  hex('#A8D8FF'), // mascotSlimeNewbie tint
  zoneLimitedHouse: hex('#325082'), // mascotWolfLimited — "dark patch"
  // Roads — soft taupe between cream and warm grey
  road:             hex('#E8D9B0'),
  roadEdge:         hex('#C9B98C'),
  // Mascot dots
  mascotCatLore:    hex('#A78BFA'),
  mascotDogSocial:  hex('#FFA864'),
  mascotPigeonBuzz: hex('#FFC8DC'),
  // Outline + accents
  outlineDark:      hex('#1A1D29'),
  white:            hex('#FFFFFF'),
  black:            hex('#0E1018'),
  accentPink:       hex('#FF6FB7'),
  accentCyan:       hex('#7AE7FF'),
  accentLime:       hex('#B6FF6F'),
  accentWarn:       hex('#FFB86F'),
}

// ───────────────────────────────────────────────────────────────────
// Pixel buffer primitives (RGBA, top-to-bottom rows)
// ───────────────────────────────────────────────────────────────────
function makeBuf(w, h, fill) {
  const buf = Buffer.alloc(w * h * 4)
  if (fill) {
    for (let i = 0; i < w * h; i++) {
      buf[i * 4]     = fill[0]
      buf[i * 4 + 1] = fill[1]
      buf[i * 4 + 2] = fill[2]
      buf[i * 4 + 3] = fill.length >= 4 ? fill[3] : 255
    }
  }
  return buf
}

function setPx(buf, x, y, rgba) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = (y * W + x) * 4
  if (rgba.length === 4 && rgba[3] !== 255) {
    // alpha blend over existing
    const af = rgba[3] / 255
    const inv = 1 - af
    buf[i]     = Math.round(rgba[0] * af + buf[i]     * inv)
    buf[i + 1] = Math.round(rgba[1] * af + buf[i + 1] * inv)
    buf[i + 2] = Math.round(rgba[2] * af + buf[i + 2] * inv)
    buf[i + 3] = 255
  } else {
    buf[i]     = rgba[0]
    buf[i + 1] = rgba[1]
    buf[i + 2] = rgba[2]
    buf[i + 3] = 255
  }
}

function fillRect(buf, x0, y0, w, h, rgba) {
  const x1 = Math.min(W, x0 + w)
  const y1 = Math.min(H, y0 + h)
  const xs = Math.max(0, x0)
  const ys = Math.max(0, y0)
  for (let y = ys; y < y1; y++) {
    for (let x = xs; x < x1; x++) {
      setPx(buf, x, y, rgba)
    }
  }
}

function strokeRect(buf, x0, y0, w, h, rgba, thickness = 1) {
  for (let t = 0; t < thickness; t++) {
    for (let x = x0 + t; x < x0 + w - t; x++) {
      setPx(buf, x, y0 + t, rgba)
      setPx(buf, x, y0 + h - 1 - t, rgba)
    }
    for (let y = y0 + t; y < y0 + h - t; y++) {
      setPx(buf, x0 + t, y, rgba)
      setPx(buf, x0 + w - 1 - t, y, rgba)
    }
  }
}

function fillCircle(buf, cx, cy, r, rgba) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r * r) setPx(buf, x, y, rgba)
    }
  }
}

function strokeCircle(buf, cx, cy, r, rgba) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 <= r * r && d2 >= (r - 1) * (r - 1)) setPx(buf, x, y, rgba)
    }
  }
}

function line(buf, x0, y0, x1, y1, rgba) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  while (true) {
    setPx(buf, x, y, rgba)
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx)  { err += dx; y += sy }
  }
}

// Deterministic LCG so dappling looks the same every run.
function seededRng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
