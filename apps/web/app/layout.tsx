import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: '次元萌宠小镇',
  description:
    '次元萌宠小镇 / Anime Agent Town — 抖音黑客松赛道 1「AI 体验：刷到懂你的瞬间」参赛作品',
}

/**
 * task 11.4 — 首屏 ≤ 2s critical path（design.md §1.7 / R7.1 / R15.6 / R16.4）。
 *
 * 这三条 `<link rel="preload">` 把首屏视觉所需的最小资源集合提前推到浏览器：
 *   1. tileset_main.png  —— 主 tileset，地图所有 ground / decoration 共用
 *   2. town_64x64.tmj    —— 地图结构 JSON（fetch as application/json）
 *   3. portrait_64.png   —— Slice 0 默认 sprite，居中 sanity-check 用
 *
 * 这些路径必须与 `RenderEngine.DEFAULT_ASSET_MANIFEST` 字段保持一致；
 * `apps/web/scripts/sync-assets.mjs` 在 predev/prebuild 阶段把它们从仓库
 * 根 `assets/` 拷到 `apps/web/public/assets/`，因此构建后稳定可由 Next.js 静态分发。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="preload"
          as="image"
          href="/assets/tilemaps/tileset_main.png"
        />
        <link
          rel="preload"
          as="fetch"
          href="/assets/tilemaps/town_64x64.tmj"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="image"
          href="/assets/mascots/cat_lore/portrait_64.png"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
