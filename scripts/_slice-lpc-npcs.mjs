#!/usr/bin/env node
// scripts/_slice-lpc-npcs.mjs
//
// 把 LPC body sheet 切成 30 个 NPC × 17 帧，覆盖 Wave 4 程序化生成的占位。
// 6 类 persona × 5 NPC 各自走 1 个 hue rotate / sat 调色，让 30 个 NPC 视觉
// 上有差异，但都基于真实 LPC humanoid sprite。
//
// LPC body 候选源：female/{light,dark,tanned,tanned2}, male/{light,dark,tanned}.
// 我们把 30 个 slot 平均分到 6 类 × 5 个，按"persona × slot 组合 + body 选择"
// 决定底图与颜色。
//
// 输出结构（与 Wave 4 完全一致，便于 sync-assets.mjs 不变更目录）：
//   assets/npc/{persona}/{01..05}/
//     idle.png
//     walk_{down,up,left,right}_{01..04}.png

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { writeRawPng } from './make-placeholder-png.mjs'

const ROOT = process.cwd()
const LPC_DIR = path.join(
  ROOT,
  'assets',
  '_raw',
  'wave5-procurement',
  'Universal-LPC-spritesheet-master',
  'body',
)
const ASSETS_DIR = path.join(ROOT, 'assets', 'npc')

const FRAME_SIZE = 64
const OUT_SIZE = 32
const WALK_ROWS = { up: 8, left: 9, down: 10, right: 11 }
const WALK_COLS = [1, 3, 5, 7]
const IDLE_COL = 0

// 6 类 persona × 5 slot × { LPC body 文件, hueRotate, satMul }
// 用不同 body 文件让 30 NPC 真正不同（dark/light/tanned 自带肤色差异），
// 再叠 hue rotate 模拟服装/染发。
const NPC_RECIPES = {
  tsundere: [
    { body: 'female/light.png', hue: 320, sat: 1.1 }, // 粉
    { body: 'female/light.png', hue: 0, sat: 1.0 }, // 红
    { body: 'female/light.png', hue: 280, sat: 0.9 }, // 紫
    { body: 'female/tanned.png', hue: 340, sat: 1.0 }, // 偏粉
    { body: 'female/tanned2.png', hue: 10, sat: 0.9 }, // 偏红
  ],
  yandere: [
    { body: 'female/light.png', hue: 240, sat: 0.8 }, // 蓝紫
    { body: 'female/dark.png', hue: 260, sat: 0.7 }, // 暗紫
    { body: 'female/dark.png', hue: 280, sat: 0.85 },
    { body: 'female/light.png', hue: 200, sat: 0.7 }, // 冷蓝
    { body: 'female/dark2.png', hue: 220, sat: 0.65 },
  ],
  tennen: [
    // 天然呆 — 暖橙黄系
    { body: 'female/light.png', hue: 30, sat: 1.05 },
    { body: 'female/tanned.png', hue: 40, sat: 1.0 },
    { body: 'female/tanned2.png', hue: 25, sat: 0.95 },
    { body: 'male/tanned.png', hue: 35, sat: 1.05 },
    { body: 'male/light.png', hue: 50, sat: 0.9 },
  ],
  chuuni: [
    // 中二病 — 黑红 / 紫色
    { body: 'female/dark.png', hue: 350, sat: 1.0 },
    { body: 'male/dark.png', hue: 280, sat: 0.95 },
    { body: 'female/dark2.png', hue: 0, sat: 0.9 },
    { body: 'male/dark.png', hue: 270, sat: 1.0 },
    { body: 'female/dark.png', hue: 230, sat: 0.85 },
  ],
  sanmu: [
    // 三无 — 银白 / 灰色（hue rotate 不大、饱和度低）
    { body: 'female/light.png', hue: 200, sat: 0.4 },
    { body: 'male/light.png', hue: 210, sat: 0.35 },
    { body: 'female/light.png', hue: 220, sat: 0.3 },
    { body: 'male/light.png', hue: 180, sat: 0.4 },
    { body: 'female/light.png', hue: 160, sat: 0.35 },
  ],
  hara_guro: [
    // 腹黑 — 深紫 / 黑（饱和度高 + hue 偏冷）
    { body: 'male/dark.png', hue: 260, sat: 0.95 },
    { body: 'female/dark.png', hue: 250, sat: 0.9 },
    { body: 'male/dark2.png', hue: 290, sat: 0.85 },
    { body: 'female/dark2.png', hue: 270, sat: 0.95 },
    { body: 'male/dark.png', hue: 230, sat: 0.85 },
  ],
}

const sheetCache = new Map()
function readSheet(rel) {
  if (sheetCache.has(rel)) return sheetCache.get(rel)
  const buf = fs.readFileSync(path.join(LPC_DIR, rel))
  const sheet = PNG.sync.read(buf)
  sheetCache.set(rel, sheet)
  return sheet
}

function sliceFrame(sheet, col, row) {
  const out = Buffer.alloc(OUT_SIZE * OUT_SIZE * 4)
  const srcX = col * FRAME_SIZE
  const srcY = row * FRAME_SIZE
  for (let dy = 0; dy < OUT_SIZE; dy++) {
    for (let dx = 0; dx < OUT_SIZE; dx++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let oy = 0; oy < 2; oy++) {
        for (let ox = 0; ox < 2; ox++) {
          const sx = srcX + dx * 2 + ox
          const sy = srcY + dy * 2 + oy
          const idx = (sy * sheet.width + sx) * 4
          if (sheet.data[idx + 3] > 0) {
            r += sheet.data[idx]
            g += sheet.data[idx + 1]
            b += sheet.data[idx + 2]
            a += sheet.data[idx + 3]
            n++
          }
        }
      }
      const di = (dy * OUT_SIZE + dx) * 4
      if (n === 0) {
        out[di + 3] = 0
      } else {
        out[di] = Math.round(r / n)
        out[di + 1] = Math.round(g / n)
        out[di + 2] = Math.round(b / n)
        out[di + 3] = Math.round(a / 4)
      }
    }
  }
  return out
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  h /= 360
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function recolorFrame(rgba, palette) {
  const out = Buffer.from(rgba)
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue
    const [h, s, l] = rgbToHsl(out[i], out[i + 1], out[i + 2])
    const newH = (h + palette.hue) % 360
    const newS = Math.max(0, Math.min(1, s * palette.sat))
    const [r, g, b] = hslToRgb(newH, newS, l)
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
  }
  return out
}

function main() {
  let writes = 0
  for (const [persona, recipes] of Object.entries(NPC_RECIPES)) {
    recipes.forEach((recipe, idx) => {
      const slotStr = String(idx + 1).padStart(2, '0')
      const dir = path.join(ASSETS_DIR, persona, slotStr)
      fs.mkdirSync(dir, { recursive: true })

      const sheet = readSheet(recipe.body)

      // idle = walk down col 0
      const idleRaw = sliceFrame(sheet, IDLE_COL, WALK_ROWS.down)
      const idleColored = recolorFrame(idleRaw, recipe)
      writeRawPng({ out: path.join(dir, 'idle.png'), w: OUT_SIZE, h: OUT_SIZE, pixels: idleColored })
      writes++

      for (const [d4, row] of Object.entries(WALK_ROWS)) {
        WALK_COLS.forEach((col, fIdx) => {
          const frame = sliceFrame(sheet, col, row)
          const colored = recolorFrame(frame, recipe)
          const num = String(fIdx + 1).padStart(2, '0')
          writeRawPng({
            out: path.join(dir, `walk_${d4}_${num}.png`),
            w: OUT_SIZE,
            h: OUT_SIZE,
            pixels: colored,
          })
          writes++
        })
      }
      console.log(`[lpc-npc] ✓ ${persona}/${slotStr} (body=${recipe.body}, hue=${recipe.hue}°)`)
    })
  }
  console.log(`\n[lpc-npc] DONE — ${writes} frames written across 30 NPCs`)
}

main()
