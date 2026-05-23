#!/usr/bin/env node
// scripts/_install-art-assets.mjs
//
// 把 `素材/` 目录里 10 张 AI 生成的高质量像素 art 安装到
// `apps/web/public/assets/art/` 下，并赋予稳定的语义文件名。
// 这些素材**不进 MANIFEST.yaml**（它们与 R29 资产管线契约的"程序化合
// 法素材"互补，是用户提供的无法回溯到合法源的 AI 风格作品；R29.46
// 拒绝未授权 IP 立绘 — 我们这里仅在演示页使用，并在 README#Credits
// 段标注"用户自带素材"。

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, '素材')
const DST = path.join(ROOT, 'apps', 'web', 'public', 'assets', 'art')

// 用户已经在 art-preview 上确认的对应关系（见 chat history）：
//   art-01 → 小镇全景大图          → town_overview.png
//   art-02 → 玩家任务/属性 UI 卡   → ui_task_panel.png
//   art-03 → 热搜墙 LED 大屏       → zone_hotwall.png
//   art-04 → 立体店铺立面          → zone_cafe.jpg
//   art-05 → 痛房内饰              → zone_itasha.png
//   art-06 → 我的 Agent 整套侧栏   → ui_agent_card.png
//   art-07 → 控制条 / 装备槽       → ui_loadout.png
//   art-08 → 谷子店立面            → zone_goods.png
//   art-09 → 完整像素 UI 套件      → ui_kit.jpg
//   art-10 → 角色人气榜侧栏        → ui_ranking.png
const ALIAS = {
  '02607c46070b166e7665306eea239adf.png': 'town_overview.png',
  '41a947e7dc07dede84d537367237f289.png': 'ui_task_panel.png',
  '50cd5be37edd2022acb7b7eb30f8ce1b.png': 'zone_hotwall.png',
  '747126ede1ecd8927ec74eced3cc5fe6.jpg': 'zone_cafe.jpg',
  '88b9f22cbcdbb002878199abb1699467.png': 'zone_itasha.png',
  '8b1bf364faaac6e6c4786bce266375f2.png': 'ui_agent_card.png',
  'a42da554f0b896ac215e9877c1c4836c.png': 'ui_loadout.png',
  'b104675364a353ee16ce4dd22ced9e1b.png': 'zone_goods.png',
  'd2685423870ff54944521a99f504a918.jpg': 'ui_kit.jpg',
  'f931e4d67f23034543ac3d58f6dfd5c5.png': 'ui_ranking.png',
}

fs.mkdirSync(DST, { recursive: true })

let copied = 0
for (const [hashName, alias] of Object.entries(ALIAS)) {
  const src = path.join(SRC, hashName)
  if (!fs.existsSync(src)) {
    console.warn(`[install-art] missing source: ${hashName}`)
    continue
  }
  const dst = path.join(DST, alias)
  fs.copyFileSync(src, dst)
  const size = fs.statSync(dst).size
  console.log(`[install-art] ${alias} ← ${hashName} (${size}B)`)
  copied++
}
console.log(`[install-art] DONE — ${copied}/${Object.keys(ALIAS).length} images installed`)
