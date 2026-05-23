'use client'

/**
 * task 14.1 — VideoCard（Page_VideoFeed 单张抖音风视频卡）
 *
 * 契约：
 *   - 竖屏 540×960 区域，背景 `<img src={thumbnail}>` cover + 半透明渐变叠层
 *   - 左下文字层：作者头像 / author_name / title / video_tags chips / 时长·播放数
 *   - 右下浮动按钮组：❤ 点赞 / 💬 评论 / 🔄 分享 / ⭐ 收藏 — 装饰性，
 *     点击触发轻量 toast，不实装真实业务行为（task 14.5+ 才接入互动表）
 *   - 点击卡片本体 → 触发 `onWatch5sThreshold(video)` 回调（任务 14.2 接管真实
 *     业务逻辑：5s 阈值 + 弹框）；本任务仅在父组件默认 console.info 打日志
 *   - 设置 `data-video-id={video.video_id}` 给 14.2 DouyinStreamHook 的
 *     IntersectionObserver 订阅识别"当前视频"
 *
 * 视觉规范：
 *   - 卡片高度 = 100vh（scroll-snap-align: start，每张占满视口）
 *   - 字体 var(--font-pixel-zh) 全站一致
 *   - 颜色直接写值（黑色沉浸主题，与 anitown 玻璃风格脱钩）
 *
 * 不依赖 RenderEngine / Phaser / mock-town runtime — **纯静态展示**。
 */

import { useCallback, useState } from 'react'
import type { MockVideoCard, VideoTag } from '@erciyuan/mock-town'

import styles from '../feed.module.css'

/** 9 类 video_tags → 中文展示映射（与 R29.12 一一对应）。 */
const TAG_LABELS: Record<VideoTag, string> = {
  cosplay: 'Cos',
  convention_vlog: '漫展 vlog',
  anime_review: '动漫解说',
  character_analysis: '角色分析',
  goods_unboxing: '谷子开箱',
  figure: '手办',
  anime_outfit: '二次元穿搭',
  local_convention: '同城漫展',
  doujin_edit: '二创剪辑',
}

/** play_count → 抖音风压缩展示（"1.2w" / "236w"）。 */
function formatPlayCount(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000
    return `${w >= 100 ? Math.round(w) : w.toFixed(1)}w`
  }
  return `${n}`
}

/** duration 秒 → "1:05" / "0:35" 风格 mm:ss。 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export interface VideoCardProps {
  /** 视频 mock 数据（来自 @erciyuan/mock-town.videos）。 */
  video: MockVideoCard
  /**
   * 用户点击卡片时触发，参数携带完整 MockVideoCard。
   * 14.1 默认不实装行为（仅 console.info），14.2+ 由 DouyinStreamHook 接管
   * 5s 阈值的真实业务逻辑。
   */
  onWatch5sThreshold?: (video: MockVideoCard) => void
}

interface ActionButton {
  key: 'like' | 'comment' | 'share' | 'favorite'
  icon: string
  label: string
  toastText: string
}

const ACTION_BUTTONS: ReadonlyArray<ActionButton> = [
  { key: 'like', icon: '❤', label: '点赞', toastText: '已点赞 · 萌力 +1' },
  { key: 'comment', icon: '💬', label: '评论', toastText: '评论功能稍后开放' },
  { key: 'share', icon: '🔄', label: '分享', toastText: '已复制分享链接' },
  { key: 'favorite', icon: '⭐', label: '收藏', toastText: '已收藏到我的次元小镇' },
]

export function VideoCard({ video, onWatch5sThreshold }: VideoCardProps): JSX.Element {
  const [toast, setToast] = useState<string | null>(null)

  /** 点击装饰按钮 — 弹一个 1.4s 自动消失的 toast。 */
  const handleAction = useCallback((btn: ActionButton, e: React.MouseEvent) => {
    e.stopPropagation() // 阻止冒泡到卡片本体的 onWatch5sThreshold
    setToast(btn.toastText)
    // toast 自动消失（不引入 setTimeout 闭包陷阱：每次点击重置 1.4s）
    window.setTimeout(() => setToast((t) => (t === btn.toastText ? null : t)), 1400)
  }, [])

  /** 点击卡片本体 — 触发 onWatch5sThreshold（14.2 接管真实业务）。 */
  const handleCardClick = useCallback(() => {
    if (onWatch5sThreshold) {
      onWatch5sThreshold(video)
    } else {
      // eslint-disable-next-line no-console
      console.info('[Page_VideoFeed] watched video (14.1 default)', {
        video_id: video.video_id,
        title: video.title,
        contextual_intent: video.contextual_intent,
      })
    }
  }, [video, onWatch5sThreshold])

  return (
    <section
      className={styles['feed-card']}
      data-video-id={video.video_id}
      aria-label={`视频 ${video.title}（作者 ${video.author_name}）`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
    >
      {/* 540×960 缩略图作为底层背景；远端 unsplash URL 不走 next/image
          避免域名白名单负担，design.md §Mock-First 已批准 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles['feed-card-thumb']}
        src={video.thumbnail}
        alt={video.title}
        loading="lazy"
        draggable={false}
      />

      {/* 半透明渐变叠层 */}
      <div className={styles['feed-card-overlay']} aria-hidden="true" />

      {/* 左下文字层 */}
      <div className={styles['feed-card-info']}>
        <div className={styles['feed-card-author-row']}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles['feed-card-avatar']}
            src={video.avatar}
            alt={`${video.author_name} 头像`}
            loading="lazy"
            draggable={false}
          />
          <span className={styles['feed-card-author-name']}>@{video.author_name}</span>
        </div>

        <p className={styles['feed-card-title']}>{video.title}</p>

        <ul className={styles['feed-card-tags']} aria-label="视频标签">
          {video.video_tags.map((tag) => (
            <li key={tag} className={styles['feed-card-tag']}>
              # {TAG_LABELS[tag] ?? tag}
            </li>
          ))}
        </ul>

        <div className={styles['feed-card-meta']} aria-label="视频元数据">
          <span className={styles['feed-card-meta-item']}>
            ▶ {formatPlayCount(video.play_count)}
          </span>
          <span className={styles['feed-card-meta-item']}>
            ⏱ {formatDuration(video.duration)}
          </span>
        </div>
      </div>

      {/* 右下浮动按钮组 — 装饰性，点击 toast */}
      <div className={styles['feed-card-actions']} aria-label="视频互动按钮">
        {ACTION_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            type="button"
            className={styles['feed-card-action-btn']}
            onClick={(e) => handleAction(btn, e)}
            aria-label={btn.label}
          >
            <span className={styles['feed-card-action-icon']} aria-hidden="true">
              {btn.icon}
            </span>
            <span className={styles['feed-card-action-label']}>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Toast（点击装饰按钮时短暂显示） */}
      {toast ? (
        <div className={styles['feed-toast']} role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </section>
  )
}

export default VideoCard
