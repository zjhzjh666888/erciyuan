#!/usr/bin/env node
// scripts/_slice-lpc-mascots.mjs
//
// 把 makrohn/Universal-LPC-spritesheet 的 832×1344 LPC 标准 sheet 切片重组为
// 7 类萌宠的 32×32 帧资产，覆盖 Wave 4 程序化生成的占位。
//
// LPC 标准布局（832×1344，每帧 64×64，13 行 × 13 列）：
//   row 0: spellcast      (cols 0-6) — UP
//   row 1: spellcast      (cols 0-6) — LEFT
//   row 2: spellcast      (cols 0-6) — DOWN
//   row 3: spellcast      (cols 0-6) — RIGHT
//   row 4: thrust         (cols 0-7) — UP / LEFT / DOWN / RIGHT
//   row 5-7: thrust …
//   row 8:  walk          (cols 1-8) — UP
//   row 9:  walk          (cols 1-8) — LEFT
//   row 10: walk          (cols 1-8) — DOWN
//   row 11: walk          (cols 1-8) — RIGHT
//   row 12: slash …
//
// LPC walk 帧索引：每方向 9 帧（col 0 是 idle，col 1-8 是 walk 1-8）。
// 我们取 col 1, 3, 5, 7 4 帧覆盖 4 步。
//
// 萌宠 ↔ LPC body 配色映射（保留 program-gen 时期的视觉识别度）：
//   cat_lore       → female/light.png    + 紫色调
//   dog_social     → female/tanned.png   + 橙色调
//   hamster_hoard  → male/tanned2.png    + 米色调
//   fox_create     → female/dark.png     + 奶白色调
//   slime_newbie   → female/dark2.png    + 蓝色调（其实就用 light）
//   wolf_limited   → male/dark.png       + 深蓝色调
//   pigeon_buzz    → female/light.png    + 粉色调
//
// **简化**：本 wave 先全部使用 female/light 作为 base，**用 hue 旋转 / 饱和度
// 调整模拟差异化**（Slice 5 后再正经做发型/服装）；保留 LPC 真实的轮廓与
// 阴影质感。

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import { writeRawPng } from './make-placeholder-png.mjs'

const ROOT = process.cwd()
const LPC_BODY = path.join(
  ROOT,
  'assets',
  '_raw',
  'wave5-procurement',
  'Universal-LPC-spritesheet-master',
  'body',
  'female',
  'light.png',
)
const ASSETS_DIR = path.join(ROOT, 'assets', 'mascots')

// LPC sheet 尺寸（832×1344），每帧 64×64
const FRAME_SIZE = 64
// 我们的 mascot 输出尺寸 — 32×32（design.md §1.3，与现有 mascot 帧一致）
const OUT_SIZE = 32
// LPC walk 帧位置：4 行 × 9 列（col 0 idle, col 1-8 walk steps）
// 我们用 col 1/3/5/7 取 4 帧
const WALK_ROWS = { up: 8, left: 9, down: 10, right: 11 }
const WALK_COLS = [1, 3, 5, 7]
// LPC idle 帧（col 0 of walk row）
const IDLE_COL = 0
// portrait_64 用 down 方向 idle 放大到 64×64

// 7 类萌宠 hue/saturation 调色板（mock-town/src/mascots.ts persona_color 同源）。
// hueRotate 单位是度（0-360）；saturation 是乘子（1.0 = 原色）。
const MASCOT_PALETTE = {
  cat_lore: { hueRotate: 270, satMul: 1.0 }, // 紫色
  dog_social: { hueRotate: 30, satMul: 1.1 }, // 橙色
  hamster_hoard: { hueRotate: 40, satMul: 0.7 }, // 米色（饱和度低）
  fox_create: { hueRotate: 25, satMul: 0.8 }, // 奶白
  slime_newbie: { hueRotate: 200, satMul: 1.0 }, // 淡蓝
  wolf_limited: { hueRotate: 220, satMul: 0.9 }, // 深蓝
  pigeon_buzz: { hueRotate: 330, satMul: 1.05 }, // 粉
}

function readPng(filePath) {
  const buf = fs.readFileSync(filePath)
  return PNG.sync.read(buf)
}

/** 从 LPC sheet 切出一个 64×64 帧，再缩到 32×32 (nearest neighbor)。 */
function sliceFrame(sheet, col, row) {
  const out = Buffer.alloc(OUT_SIZE * OUT_SIZE * 4)
  const srcX = col * FRAME_SIZE
  const srcY = row * FRAME_SIZE
  // 简单 box average 缩放（2:1）— LPC sheet 帧是 64×64，输出 32×32。
  for (let dy = 0; dy < OUT_SIZE; dy++) {
    for (let dx = 0; dx < OUT_SIZE; dx++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        n = 0
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
        // 全透明
        out[di] = 0
        out[di + 1] = 0
        out[di + 2] = 0
        out[di + 3] = 0
      } else {
        out[di] = Math.round(r / n)
        out[di + 1] = Math.round(g / n)
        out[di + 2] = Math.round(b / n)
        out[di + 3] = Math.round(a / 4) // alpha 总是 4 个采样
      }
    }
  }
  return out
}

/** 从 LPC sheet 切出一个 64×64 帧，**保留原尺寸**（用于 portrait_64）。 */
function sliceFrame64(sheet, col, row) {
  const out = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 4)
  const srcX = col * FRAME_SIZE
  const srcY = row * FRAME_SIZE
  for (let dy = 0; dy < FRAME_SIZE; dy++) {
    for (let dx = 0; dx < FRAME_SIZE; dx++) {
      const sx = srcX + dx
      const sy = srcY + dy
      const sIdx = (sy * sheet.width + sx) * 4
      const dIdx = (dy * FRAME_SIZE + dx) * 4
      out[dIdx] = sheet.data[sIdx]
      out[dIdx + 1] = sheet.data[sIdx + 1]
      out[dIdx + 2] = sheet.data[sIdx + 2]
      out[dIdx + 3] = sheet.data[sIdx + 3]
    }
  }
  return out
}

/** RGB 转 HSL（输入 0-255，输出 h:0-360 / s:0-1 / l:0-1）。 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h,
    s,
    l = (max + min) / 2
  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = h * 60
  }
  return [h, s, l]
}

/** HSL 转 RGB（输入 h:0-360 / s:0-1 / l:0-1，输出 0-255）。 */
function hslToRgb(h, s, l) {
  h /= 360
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
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

/** 对一帧 RGBA buffer 做 hue rotation + saturation 调整。透明像素跳过。 */
function recolorFrame(rgba, palette) {
  const out = Buffer.from(rgba)
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue
    const [h, s, l] = rgbToHsl(out[i], out[i + 1], out[i + 2])
    const newH = (h + palette.hueRotate) % 360
    const newS = Math.max(0, Math.min(1, s * palette.satMul))
    const [r, g, b] = hslToRgb(newH, newS, l)
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
  }
  return out
}

function main() {
  if (!fs.existsSync(LPC_BODY)) {
    console.error(`[lpc-slice] LPC source not found: ${LPC_BODY}`)
    console.error('请先 cmd /c "tar -xzf assets\\_raw\\wave5-procurement\\makrohn-tarball.tar.gz -C assets\\_raw\\wave5-procurement\\"')
    process.exit(1)
  }

  console.log(`[lpc-slice] reading ${LPC_BODY}`)
  const sheet = readPng(LPC_BODY)
  console.log(`[lpc-slice] sheet ${sheet.width}×${sheet.height}`)

  let writes = 0
  for (const [mascotType, palette] of Object.entries(MASCOT_PALETTE)) {
    const dir = path.join(ASSETS_DIR, mascotType)
    fs.mkdirSync(dir, { recursive: true })

    // idle (32×32) — 取 walk DOWN 行 col 0
    const idleRaw = sliceFrame(sheet, IDLE_COL, WALK_ROWS.down)
    const idleColored = recolorFrame(idleRaw, palette)
    writeRawPng({ out: path.join(dir, 'idle.png'), w: OUT_SIZE, h: OUT_SIZE, pixels: idleColored })
    writes++

    // portrait_64 (64×64) — 取 walk DOWN 行 col 0 原始尺寸
    const portraitRaw = sliceFrame64(sheet, IDLE_COL, WALK_ROWS.down)
    const portraitColored = recolorFrame(portraitRaw, palette)
    writeRawPng({ out: path.join(dir, 'portrait_64.png'), w: FRAME_SIZE, h: FRAME_SIZE, pixels: portraitColored })
    writes++

    // walk × 4 方向 × 4 帧 = 16
    for (const [dir4, row] of Object.entries(WALK_ROWS)) {
      WALK_COLS.forEach((col, idx) => {
        const frame = sliceFrame(sheet, col, row)
        const colored = recolorFrame(frame, palette)
        const num = String(idx + 1).padStart(2, '0')
        const outPath = path.join(dir, `walk_${dir4}_${num}.png`)
        writeRawPng({ out: outPath, w: OUT_SIZE, h: OUT_SIZE, pixels: colored })
        writes++
      })
    }

    // brewing × 2 + talking × 2 (用 spellcast 行做 brewing，walk down 做 talking)
    // spellcast UP row 0 col 1, 3 → brewing 1 / 2
    for (let f = 0; f < 2; f++) {
      const brewingRaw = sliceFrame(sheet, 1 + f * 2, 0)
      const brewingColored = recolorFrame(brewingRaw, palette)
      const num = String(f + 1).padStart(2, '0')
      writeRawPng({
        out: path.join(dir, `action_brewing_${num}.png`),
        w: OUT_SIZE,
        h: OUT_SIZE,
        pixels: brewingColored,
      })
      writes++
    }
    for (let f = 0; f < 2; f++) {
      const talkingRaw = sliceFrame(sheet, IDLE_COL + f * 2, WALK_ROWS.down)
      const talkingColored = recolorFrame(talkingRaw, palette)
      const num = String(f + 1).padStart(2, '0')
      writeRawPng({
        out: path.join(dir, `action_talking_${num}.png`),
        w: OUT_SIZE,
        h: OUT_SIZE,
        pixels: talkingColored,
      })
      writes++
    }

    console.log(`[lpc-slice] ✓ ${mascotType} (${22} frames)`)
  }

  console.log(`\n[lpc-slice] DONE — ${writes} frames written across 7 mascot types`)
}

main()
