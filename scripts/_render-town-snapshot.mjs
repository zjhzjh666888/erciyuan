#!/usr/bin/env node
/**
 * scripts/_render-town-snapshot.mjs
 *
 * ┌─ Task 11.8 deliverable ─────────────────────────────────────────┐
 * │ Replaces the procedural placeholder produced by task 8.4        │
 * │ (assets/fallback/town_static_snapshot.png) with a high-fidelity │
 * │ composite that reproduces what TownScene draws on screen, so    │
 * │ the DOM fallback path (apps/web/src/render/DomFallbackStage.tsx │
 * │ — task 11.7) shows the actual town artwork instead of a tinted  │
 * │ placeholder.                                                    │
 * │                                                                 │
 * │ A real headless Phaser screenshot is not available in this      │
 * │ environment (no DOM, no GPU, no `phaser` Node side runtime), so │
 * │ this script does the deterministic equivalent in pure Node:     │
 * │                                                                 │
 * │   1. parse assets/tilemaps/town_64x64.tmj                       │
 * │   2. decode assets/tilemaps/tileset_main.png and the 7          │
 * │      assets/tilemaps/landmarks/landmark_*.png images            │
 * │   3. for each visible tilelayer (Ground, Decoration), composite │
 * │      every tile's source rect at its (x, y) destination on a    │
 * │      2048×2048 RGBA canvas (= 64 tiles × 32 px). The Collision  │
 * │      layer is skipped because it is invisible in TownScene.     │
 * │   4. nearest-neighbour downsample 2048→1024 (R29.53 single-file │
 * │      ≤ 1 MB; the native 2048² PNG can exceed that for noisy     │
 * │      pixel art, while 1024² fits comfortably under 200 KB)      │
 * │   5. encode and write the result to                             │
 * │        assets/fallback/town_static_snapshot.png                 │
 * │      The apps/web mirror is refreshed by the existing           │
 * │      apps/web/scripts/sync-assets.mjs (run separately).         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Determinism: this script reads only checked-in inputs and emits raw
 * pixel buffers — no timestamps, no random seeds, no system fonts.
 * Running it twice on the same inputs produces byte-identical output.
 *
 * No external dependencies. Uses only `node:fs`, `node:path`, `node:zlib`,
 * `node:crypto` and the in-repo `make-placeholder-png.mjs` PNG encoder.
 *
 * Usage (from repo root):
 *   node scripts/_render-town-snapshot.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { writeRawPng } from './make-placeholder-png.mjs'

// ───────────────────────────────────────────────────────────────────
// Paths
// ───────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const TILEMAP_DIR = path.join(REPO_ROOT, 'assets', 'tilemaps')
const TMJ_PATH = path.join(TILEMAP_DIR, 'town_64x64.tmj')
const TILESET_MAIN_PATH = path.join(TILEMAP_DIR, 'tileset_main.png')
const OUT_PATH = path.join(REPO_ROOT, 'assets', 'fallback', 'town_static_snapshot.png')

// ───────────────────────────────────────────────────────────────────
// Render constants
// ───────────────────────────────────────────────────────────────────
const SKIP_LAYERS = new Set(['Collision'])
/**
 * Final output size. Native render is 64*32 = 2048. We downsample 2× to
 * keep the file ≤ 1 MB (R29.53). 1024×1024 still gives every tile 16²
 * pixels which is enough to clearly identify ground / road / landmark
 * shapes in DomFallbackStage's `<img>`.
 */
const OUT_W = 1024
const OUT_H = 1024
const TRANSPARENT_BG = [0, 0, 0, 0]

// ───────────────────────────────────────────────────────────────────
// Minimal PNG decoder (RGBA8 only — sufficient for our inputs)
//
// All inputs in this repo are written by make-placeholder-png.mjs which
// only emits PNG color type 6 (RGBA), depth 8, no interlace, filter 0.
// We assert those properties and decode exactly that subset.
// ───────────────────────────────────────────────────────────────────
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function decodePng(buf) {
  if (!buf.slice(0, 8).equals(PNG_SIG)) {
    throw new Error('not a PNG (signature mismatch)')
  }
  let off = 8
  let ihdr = null
  const idatChunks = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4
    const type = buf.slice(off, off + 4).toString('ascii'); off += 4
    const data = buf.slice(off, off + len); off += len
    off += 4 // skip CRC
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
  }
  if (!ihdr) throw new Error('missing IHDR')
  if (ihdr.depth !== 8) throw new Error(`unsupported bit depth ${ihdr.depth}`)
  if (ihdr.colorType !== 6) throw new Error(`unsupported color type ${ihdr.colorType} (need 6 = RGBA)`)
  if (ihdr.interlace !== 0) throw new Error('interlaced PNGs not supported')

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks))
  const bpp = 4 // RGBA8
  const stride = ihdr.width * bpp
  if (inflated.length !== ihdr.height * (stride + 1)) {
    throw new Error(`unexpected IDAT length: ${inflated.length} vs ${ihdr.height * (stride + 1)}`)
  }
  const pixels = Buffer.alloc(ihdr.width * ihdr.height * bpp)
  // Inverse PNG filtering, line by line.
  for (let y = 0; y < ihdr.height; y++) {
    const filterByte = inflated[y * (stride + 1)]
    const rowSrc = inflated.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const rowDst = pixels.subarray(y * stride, (y + 1) * stride)
    const prevRow = y > 0
      ? pixels.subarray((y - 1) * stride, y * stride)
      : null
    for (let x = 0; x < stride; x++) {
      const cur = rowSrc[x]
      const left = x >= bpp ? rowDst[x - bpp] : 0
      const up = prevRow ? prevRow[x] : 0
      const upLeft = (prevRow && x >= bpp) ? prevRow[x - bpp] : 0
      let recon
      switch (filterByte) {
        case 0: recon = cur; break                              // None
        case 1: recon = (cur + left) & 0xff; break               // Sub
        case 2: recon = (cur + up) & 0xff; break                 // Up
        case 3: recon = (cur + ((left + up) >> 1)) & 0xff; break // Average
        case 4: recon = (cur + paeth(left, up, upLeft)) & 0xff; break // Paeth
        default: throw new Error(`unknown filter type ${filterByte} at row ${y}`)
      }
      rowDst[x] = recon
    }
  }
  return { width: ihdr.width, height: ihdr.height, pixels }
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

// ───────────────────────────────────────────────────────────────────
// Compositing primitives (RGBA8, top-to-bottom rows)
// ───────────────────────────────────────────────────────────────────
function makeCanvas(w, h, fill) {
  const buf = Buffer.alloc(w * h * 4)
  if (fill) {
    for (let i = 0; i < w * h; i++) {
      buf[i * 4]     = fill[0]
      buf[i * 4 + 1] = fill[1]
      buf[i * 4 + 2] = fill[2]
      buf[i * 4 + 3] = fill[3] ?? 255
    }
  }
  return buf
}

/** Source-over alpha blit of an `srcW × srcH` source onto `dst` (`dstW × dstH`). */
function blitOver(dst, dstW, dstH, src, srcW, srcH, srcX, srcY, srcCropW, srcCropH, dstX, dstY) {
  for (let y = 0; y < srcCropH; y++) {
    const dy = dstY + y
    if (dy < 0 || dy >= dstH) continue
    for (let x = 0; x < srcCropW; x++) {
      const dx = dstX + x
      if (dx < 0 || dx >= dstW) continue
      const sIdx = ((srcY + y) * srcW + (srcX + x)) * 4
      const sa = src[sIdx + 3]
      if (sa === 0) continue
      const dIdx = (dy * dstW + dx) * 4
      if (sa === 255) {
        dst[dIdx]     = src[sIdx]
        dst[dIdx + 1] = src[sIdx + 1]
        dst[dIdx + 2] = src[sIdx + 2]
        dst[dIdx + 3] = 255
      } else {
        const af = sa / 255
        const inv = 1 - af
        dst[dIdx]     = Math.round(src[sIdx]     * af + dst[dIdx]     * inv)
        dst[dIdx + 1] = Math.round(src[sIdx + 1] * af + dst[dIdx + 1] * inv)
        dst[dIdx + 2] = Math.round(src[sIdx + 2] * af + dst[dIdx + 2] * inv)
        dst[dIdx + 3] = Math.max(dst[dIdx + 3], sa)
      }
    }
  }
}

/** 2× nearest-neighbour downsample, averaging RGBA across each 2×2 block. */
function downsample2x(src, srcW, srcH) {
  const dstW = srcW >> 1
  const dstH = srcH >> 1
  const dst = Buffer.alloc(dstW * dstH * 4)
  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const sx = x * 2
      const sy = y * 2
      let r = 0, g = 0, b = 0, a = 0
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const i = ((sy + dy) * srcW + (sx + dx)) * 4
          r += src[i]
          g += src[i + 1]
          b += src[i + 2]
          a += src[i + 3]
        }
      }
      const di = (y * dstW + x) * 4
      dst[di]     = (r >> 2) & 0xff
      dst[di + 1] = (g >> 2) & 0xff
      dst[di + 2] = (b >> 2) & 0xff
      dst[di + 3] = (a >> 2) & 0xff
    }
  }
  return { pixels: dst, width: dstW, height: dstH }
}

// ───────────────────────────────────────────────────────────────────
// Tileset / landmark loading
// ───────────────────────────────────────────────────────────────────
function loadTilesetMain() {
  const buf = fs.readFileSync(TILESET_MAIN_PATH)
  const img = decodePng(buf)
  return img // {width, height, pixels}
}

function loadLandmark(imagePath) {
  const abs = path.join(TILEMAP_DIR, imagePath)
  const buf = fs.readFileSync(abs)
  return decodePng(buf)
}

// ───────────────────────────────────────────────────────────────────
// GID resolver (Tiled `firstgid` semantics)
// ───────────────────────────────────────────────────────────────────
/**
 * Returns a function that maps a global tile id (gid) to either:
 *   - { kind: 'image-tileset', source, sx, sy, sw, sh }   (e.g. tileset_main)
 *   - { kind: 'image-collection', image }                 (e.g. landmarks)
 *   - null                                                 (gid 0 / unresolved)
 *
 * Mirrors how Phaser walks `map.tilesets` and falls through firstgid bands.
 */
function buildGidResolver(tilesets, tilesetMainImg, landmarkImagesById) {
  // Sort by firstgid descending, so a single linear scan picks the highest
  // firstgid ≤ gid (the standard Tiled rule).
  const sorted = [...tilesets].sort((a, b) => b.firstgid - a.firstgid)
  return (gid) => {
    if (!gid || gid <= 0) return null
    for (const ts of sorted) {
      if (gid < ts.firstgid) continue
      const localId = gid - ts.firstgid
      if (ts.image) {
        // Image tileset: localId → (col, row) inside ts.image grid.
        const cols = ts.columns
        if (localId < 0 || localId >= ts.tilecount) return null
        const col = localId % cols
        const row = Math.floor(localId / cols)
        const sx = col * ts.tilewidth
        const sy = row * ts.tileheight
        return {
          kind: 'image-tileset',
          source: tilesetMainImg,
          sx,
          sy,
          sw: ts.tilewidth,
          sh: ts.tileheight,
        }
      } else {
        // Image-collection tileset: localId is an entry in ts.tiles[*].id.
        const img = landmarkImagesById.get(localId)
        if (!img) return null
        return {
          kind: 'image-collection',
          source: img.decoded,
          sx: 0,
          sy: 0,
          sw: img.decoded.width,
          sh: img.decoded.height,
        }
      }
    }
    return null
  }
}

// ───────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────
function main() {
  const tmj = JSON.parse(fs.readFileSync(TMJ_PATH, 'utf-8'))
  const TILE_W = tmj.tilewidth
  const TILE_H = tmj.tileheight
  const MAP_W = tmj.width
  const MAP_H = tmj.height
  const NATIVE_W = MAP_W * TILE_W
  const NATIVE_H = MAP_H * TILE_H

  console.log(`[render-town] map ${MAP_W}×${MAP_H} tiles, tile ${TILE_W}×${TILE_H}px → native ${NATIVE_W}×${NATIVE_H}px`)
  console.log(`[render-town] target ${OUT_W}×${OUT_H} (downsample factor ${NATIVE_W / OUT_W})`)

  // 1. Load image-tileset (tileset_main.png).
  const tilesetMainImg = loadTilesetMain()
  console.log(
    `[render-town] tileset_main.png ${tilesetMainImg.width}×${tilesetMainImg.height} (${tilesetMainImg.pixels.length} bytes)`,
  )

  // 2. Load image-collection landmarks (one PNG per local tile id).
  const tilesetsRaw = tmj.tilesets
  const landmarkTs = tilesetsRaw.find((ts) => !ts.image)
  const landmarkImagesById = new Map()
  if (landmarkTs && Array.isArray(landmarkTs.tiles)) {
    for (const t of landmarkTs.tiles) {
      const decoded = loadLandmark(t.image)
      landmarkImagesById.set(t.id, { decoded, source: t.image })
    }
  }
  console.log(`[render-town] landmark image-collection: ${landmarkImagesById.size} images`)

  // 3. Build native canvas (transparent so layer ordering matches Phaser).
  const canvas = makeCanvas(NATIVE_W, NATIVE_H, TRANSPARENT_BG)

  // 4. Walk tile layers in declared order (matches Phaser createLayer order).
  const resolveGid = buildGidResolver(tilesetsRaw, tilesetMainImg, landmarkImagesById)
  let drawn = 0
  let skippedLayers = []
  for (const layer of tmj.layers) {
    if (layer.type !== 'tilelayer') continue
    if (SKIP_LAYERS.has(layer.name)) {
      skippedLayers.push(layer.name)
      continue
    }
    const data = layer.data
    for (let i = 0; i < data.length; i++) {
      const gid = data[i]
      const resolved = resolveGid(gid)
      if (!resolved) continue
      const cx = i % MAP_W
      const cy = Math.floor(i / MAP_W)
      const dstX = cx * TILE_W
      const dstY = cy * TILE_H
      blitOver(
        canvas, NATIVE_W, NATIVE_H,
        resolved.source.pixels, resolved.source.width, resolved.source.height,
        resolved.sx, resolved.sy, resolved.sw, resolved.sh,
        dstX, dstY,
      )
      drawn++
    }
  }
  console.log(`[render-town] composited ${drawn} tiles; skipped layers: [${skippedLayers.join(', ')}]`)

  // 5. Native canvas is 2048×2048 RGBA. Downsample twice (2048→1024).
  let { pixels, width, height } = { pixels: canvas, width: NATIVE_W, height: NATIVE_H }
  while (width > OUT_W && (width & 1) === 0) {
    const next = downsample2x(pixels, width, height)
    pixels = next.pixels; width = next.width; height = next.height
  }
  if (width !== OUT_W || height !== OUT_H) {
    throw new Error(`downsample chain did not reach target: got ${width}×${height}, want ${OUT_W}×${OUT_H}`)
  }

  // 6. Write PNG (deterministic — encoder uses zlib.deflateSync default level).
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  const result = writeRawPng({ out: OUT_PATH, w: OUT_W, h: OUT_H, pixels })

  // 7. Report.
  const kb = (result.bytes / 1024).toFixed(1)
  console.log(`[render-town] wrote ${path.relative(REPO_ROOT, OUT_PATH)}  ${result.bytes} bytes (${kb} KB)`)
  if (result.bytes > 1024 * 1024) {
    console.error('[render-town] FATAL: output exceeds 1 MB single-file cap (R29.53)')
    process.exit(1)
  }
}

main()
