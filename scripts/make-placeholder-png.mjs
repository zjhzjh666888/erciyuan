#!/usr/bin/env node
/**
 * scripts/make-placeholder-png.mjs
 *
 * Reusable Node ES module that emits a valid 32-bit RGBA PNG.
 * No external dependencies — uses only `fs`, `zlib`, `crypto`.
 *
 * Usage (CLI):
 *   node scripts/make-placeholder-png.mjs <out_path> <w> <h> <r> <g> <b> <a> [grid]
 *
 *   - out_path : absolute or repo-relative path (PNG will be written here)
 *   - w / h    : positive integers
 *   - r,g,b,a  : 0-255 channel values for a flat-fill placeholder
 *   - grid     : optional literal 'grid' — emits an alternating checker pattern
 *                using (r,g,b,a) and a complementary darker shade, cell = 32px
 *
 * Programmatic:
 *   import { writePlaceholderPng } from './make-placeholder-png.mjs'
 *   writePlaceholderPng({ out, w, h, rgba: [r,g,b,a], pattern: 'flat'|'grid' })
 *
 * Output is a real, decodable PNG with the correct 8-byte signature
 * (89 50 4E 47 0D 0A 1A 0A), IHDR / IDAT / IEND chunks, deflate IDAT,
 * and per-chunk CRC-32. The check:assets pipeline only checks file
 * existence + size_kb, so any valid PNG with the right header is fine.
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// ───────────────────────────────────────────────────────────────────
// CRC-32 (PNG / zlib polynomial 0xEDB88320)
// ───────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

// ───────────────────────────────────────────────────────────────────
// Build raw RGBA pixel buffer
// ───────────────────────────────────────────────────────────────────
function buildPixels(w, h, rgba, pattern) {
  const pixels = Buffer.alloc(w * h * 4)
  const [r, g, b, a] = rgba
  // complementary darker shade for the grid pattern
  const dr = Math.max(0, r - 64)
  const dg = Math.max(0, g - 64)
  const db = Math.max(0, b - 64)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      let cr = r
      let cg = g
      let cb = b
      let ca = a
      if (pattern === 'grid') {
        const cell = 32
        const cx = Math.floor(x / cell)
        const cy = Math.floor(y / cell)
        if ((cx + cy) % 2 === 1) {
          cr = dr
          cg = dg
          cb = db
        }
        // 1-pixel cell border for visual debug
        if (x % cell === 0 || y % cell === 0) {
          cr = 255
          cg = 255
          cb = 255
          ca = 255
        }
      }
      pixels[idx] = cr
      pixels[idx + 1] = cg
      pixels[idx + 2] = cb
      pixels[idx + 3] = ca
    }
  }
  return pixels
}

// ───────────────────────────────────────────────────────────────────
// Encode pixels into PNG IDAT (filter byte 0 per scanline)
// ───────────────────────────────────────────────────────────────────
function encodeIdat(pixels, w, h) {
  const stride = 1 + w * 4
  const filtered = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    filtered[y * stride] = 0 // filter type: None
    pixels.copy(filtered, y * stride + 1, y * w * 4, (y + 1) * w * 4)
  }
  return zlib.deflateSync(filtered)
}

// ───────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────
function encodePngFromPixels(pixels, w, h) {
  const idat = encodeIdat(pixels, w, h)

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression: deflate
  ihdr[11] = 0 // filter: standard
  ihdr[12] = 0 // interlace: none

  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

export function writePlaceholderPng({ out, w, h, rgba = [255, 111, 183, 255], pattern = 'flat' }) {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
    throw new Error(`invalid dimensions: ${w}x${h}`)
  }
  const pixels = buildPixels(w, h, rgba, pattern)
  const png = encodePngFromPixels(pixels, w, h)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, png)
  return { path: out, bytes: png.length }
}

/**
 * Write a PNG from a caller-supplied raw RGBA pixel buffer.
 * `pixels` must be a Buffer or Uint8Array of length w*h*4 (8-bit RGBA, top-to-bottom rows).
 */
export function writeRawPng({ out, w, h, pixels }) {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
    throw new Error(`invalid dimensions: ${w}x${h}`)
  }
  if (pixels.length !== w * h * 4) {
    throw new Error(`pixel buffer length ${pixels.length} != ${w * h * 4}`)
  }
  const buf = Buffer.isBuffer(pixels) ? pixels : Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
  const png = encodePngFromPixels(buf, w, h)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, png)
  return { path: out, bytes: png.length }
}

/** Encode a raw RGBA pixel buffer to a PNG Buffer (no file write). */
export function encodeRawPngBuffer({ w, h, pixels }) {
  if (pixels.length !== w * h * 4) {
    throw new Error(`pixel buffer length ${pixels.length} != ${w * h * 4}`)
  }
  const buf = Buffer.isBuffer(pixels) ? pixels : Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)
  return encodePngFromPixels(buf, w, h)
}

// ───────────────────────────────────────────────────────────────────
// CLI entry
// ───────────────────────────────────────────────────────────────────
const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
  process.argv[1] === new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')

if (isMain) {
  const [, , outArg, wArg, hArg, rArg, gArg, bArg, aArg, patternArg] = process.argv
  if (!outArg) {
    console.error('usage: node make-placeholder-png.mjs <out> <w> <h> <r> <g> <b> <a> [grid]')
    process.exit(1)
  }
  const result = writePlaceholderPng({
    out: path.resolve(outArg),
    w: parseInt(wArg, 10),
    h: parseInt(hArg, 10),
    rgba: [
      parseInt(rArg, 10),
      parseInt(gArg, 10),
      parseInt(bArg, 10),
      parseInt(aArg, 10),
    ],
    pattern: patternArg === 'grid' ? 'grid' : 'flat',
  })
  console.log(`wrote ${result.path} (${result.bytes} bytes)`)
}
