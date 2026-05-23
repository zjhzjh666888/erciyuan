'use client'

/**
 * ProgressBar — Page_Quiz 顶部进度条 + N/total + 单题倒计时（task 14.3）。
 *
 * R18.1 要求"单题平均 ≤ 8s"。本组件实现 8 秒倒计时提示（仅视觉提醒，
 * 不强制截断答题），让用户在心理上感知"快速作答"的预期。
 *
 * 仅承担渲染；倒计时秒由父组件传入（每题切换时重置）。这样组件保持
 * 纯函数 + 易测试，单题切换的 timer 在 page.tsx 中唯一地管理。
 */
import styles from '../quiz.module.css'

export interface ProgressBarProps {
  /** 当前题序（0-based） */
  index: number
  /** 总题数 */
  total: number
  /** 本题剩余秒数（≥ 0；0 时即停留在 0 不再自减） */
  secondsRemaining: number
  /** R18.2 动态题命中的 contextual_intent 摘要；可空 */
  intentLabel?: string | null
}

export function ProgressBar({
  index,
  total,
  secondsRemaining,
  intentLabel,
}: ProgressBarProps): JSX.Element {
  const safeTotal = Math.max(1, total)
  const progress = Math.min(100, Math.max(0, ((index + 1) / safeTotal) * 100))
  const displayed = Math.min(index + 1, safeTotal)

  return (
    <header
      className={styles.progressHeader}
      aria-label="测一测进度"
    >
      <div className={styles.progressTopRow}>
        <span className={styles.progressTitle}>🎴 测一测领萌宠</span>
        <span className={styles.progressMeta}>
          {displayed} / {safeTotal}
        </span>
      </div>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.progressFooter}>
        <span className={styles.countdown} aria-live="polite">
          建议 8 秒内作答 · 剩 {Math.max(0, secondsRemaining)} 秒
        </span>
        {intentLabel ? (
          <span className={styles.intentBadge}>动态题来自 「{intentLabel}」</span>
        ) : (
          <span className={styles.intentBadge}>放轻松凭直觉选</span>
        )}
      </div>
    </header>
  )
}
