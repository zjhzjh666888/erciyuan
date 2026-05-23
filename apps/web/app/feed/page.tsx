'use client'

/**
 * task 14.1 — Page_VideoFeed（A 链路第 1 页，抖音风视频流模拟）
 *
 * 契约（requirements.md R28.1 / R29.11–12 + design.md §Slice 3）：
 *   - 消费 `@erciyuan/mock-town` 的静态 `videos` 数组（task 9.2 落地的 12 条
 *     mock，缩略图固定 540×960，覆盖 9 类 video_tags）
 *   - 视觉：竖屏 540×960 全屏沉浸，每条视频独占视口一屏；上下滑动平滑切换
 *   - 实现方式：CSS `scroll-snap-type: y mandatory` + 每张卡 `scroll-snap-align: start`，
 *     无需自定义 wheel/touch handler，浏览器原生即可（Safari / Chrome / Edge）
 *
 * **路由隔离**（task 14.1 边界）：
 *   - 与首页 `/` 完全隔离：本路由独立目录 `/feed`，独立 CSS Module
 *     `feed.module.css`，不污染 globals.css，不复用 `.anitown-*` 类名。
 *   - 全部新增类名一律 `feed-` 前缀。
 *
 * **本任务范围**：
 *   - 14.1 ✅ 抖音风视频流静态展示（VideoCard / StickyHeader / scroll-snap）
 *
 * **任务 14.2 协同点**（已实装：DouyinStreamHook）：
 *   - VideoCard 渲染时挂 `data-video-id` 属性，14.2 用 IntersectionObserver
 *     订阅识别"当前在视口里的视频"，本页面无需把 currentVideo 提升为 React
 *     state（保持 14.1 接口最小化）。
 *
 * **不在本任务范围**：
 *   - 5s 阈值 + 弹框（→ task 14.2 Douyin_Stream_Hook 接管，已并入本页面）
 *   - 测一测 Quiz（→ task 14.3）
 *   - 萌宠结果页（→ task 14.4 Mascot_System）
 *   - 真正播放视频（demo 阶段只用 thumbnail 静态展示，避免引入 hls / 远端视频源）
 */

import { videos } from '@erciyuan/mock-town'
import type { MockVideoCard } from '@erciyuan/mock-town'

import { DouyinStreamHook } from './_components/DouyinStreamHook'
import { StickyHeader } from './_components/StickyHeader'
import { VideoCard } from './_components/VideoCard'
import styles from './feed.module.css'

export default function VideoFeedPage(): JSX.Element {
  /**
   * 14.1 默认行为：点击视频卡仅在 console 打日志（任务 14.2 接管真实
   * 5s 阈值 + 弹框业务）。这里把 callback 显式声明出来，便于 14.5+
   * 在需要时把 currentVideo 提升到本组件 state。
   */
  const handleWatch5sThreshold = (video: MockVideoCard): void => {
    // eslint-disable-next-line no-console
    console.info('[Page_VideoFeed] onWatch5sThreshold', {
      video_id: video.video_id,
      title: video.title,
      contextual_intent: video.contextual_intent,
    })
  }

  return (
    <main
      className={styles['feed-viewport']}
      aria-label="抖音风视频流（Page_VideoFeed）"
    >
      {/* 顶部 56px sticky 状态栏 — 浮在视频卡之上 */}
      <StickyHeader homeHref="/" />

      {/* 主滚动容器：scroll-snap-type: y mandatory；data-video-feed-scroll
          属性让 globals.css 的 Webkit scrollbar hide 规则命中（仅此 1 条
          属性选择器，无新增 CSS） */}
      <div className={styles['feed-scroll']} data-video-feed-scroll>
        {videos.map((video) => (
          <VideoCard
            key={video.video_id}
            video={video}
            onWatch5sThreshold={handleWatch5sThreshold}
          />
        ))}
      </div>

      {/* task 14.2 — DouyinStreamHook：5s 阈值 + 10min 频控 + 测一测掉落弹框。
          组件自身用 IntersectionObserver 订阅 [data-video-id] 元素识别当前
          视频，不强制把 currentVideo state 提升到 page.tsx 这一层（14.1 用
          CSS scroll-snap 做切换，没有 React state，本任务保持接口最小化）。 */}
      <DouyinStreamHook />
    </main>
  )
}
