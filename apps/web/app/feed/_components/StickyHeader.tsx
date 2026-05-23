/**
 * task 14.1 — StickyHeader（Page_VideoFeed 顶部 56px 状态栏）
 *
 * 契约：
 *   - 高度 56px，绝对定位浮在视频卡之上（透过 backdrop-filter 模糊）
 *   - 左侧标题："抖音 · 次元小镇推荐 · LIVE"（含红点 LIVE 指示）
 *   - 右侧"回到小镇"按钮 → 跳回首页 `/`
 *   - 不携带任何业务状态：纯展示组件，便于 page.tsx 直接挂载
 *
 * 与 14.2 的 DouyinStreamHook 互不依赖：本组件只负责头部 chrome，弹框逻辑
 * 由 hook 自治。
 */

import styles from '../feed.module.css'

export interface StickyHeaderProps {
  /** 自定义首页跳转链接，默认 `/`。 */
  homeHref?: string
}

export function StickyHeader({ homeHref = '/' }: StickyHeaderProps): JSX.Element {
  return (
    <header className={styles['feed-header']} aria-label="视频流顶部状态栏">
      <span className={styles['feed-header-title']}>
        <span className={styles['feed-header-live']} aria-hidden="true" />
        抖音 · 次元小镇推荐 · LIVE
      </span>

      <a
        className={styles['feed-header-home-btn']}
        href={homeHref}
        aria-label="回到小镇主页"
      >
        回到小镇
      </a>
    </header>
  )
}

export default StickyHeader
