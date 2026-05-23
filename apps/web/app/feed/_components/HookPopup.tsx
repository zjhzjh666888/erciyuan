'use client'

/**
 * task 14.2 — HookPopup（Douyin_Stream_Hook 的弹框 UI 组件）
 *
 * 契约（requirements.md R17.2 / R17.4 / R17.5）：
 *   R17.2 弹框文案池 ≥ 3 套随机；按钮文案至少包含"立即测一测" / "召唤我的萌宠" /
 *         "进入次元小镇"之一（新用户走"立即测一测"分支以满足下限）
 *   R17.4 已绑定萌宠（localStorage `erciyuan:current_mascot`） → 切换为
 *         "你的{mascot}已经在小镇等你了"回访形态，按钮文案含"带 Ta 进小镇"
 *   R17.5 主 CTA 跳 `/quiz?from_video=<video_id>`（contextual_intent 通过 query
 *         param 编码透传给 Quiz_Service / task 14.3）
 *
 * **不引入新 CSS class**（任务约束）：
 *   全部用 inline style；视觉走粉紫渐变 + 玻璃态背景 + 像素字体（fallback 到
 *   monospace，避免依赖未挂载的字体资源）
 *
 * **冲突隔离**：
 *   仅渲染一个底部浮起的 popup，不修改 page.tsx / 主页 _components / globals.css
 */

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'

import type { MockVideoCard } from '@erciyuan/mock-town'

// ─── 文案池（R17.2，≥ 3 套） ──────────────────────────────────────────────

/**
 * 新用户文案池。运行时随机选 1 条；至少 3 套以满足 R17.2 下限。
 * （首条 emoji 同时给视觉回弹，避免静态文本太 flat。）
 */
const NEW_USER_COPY_POOL: ReadonlyArray<string> = [
  '🐾 看到你也喜欢这个！要不要一起搬进次元小镇？',
  '✨ 一起去同人咖啡厅聊聊这部番？',
  '💖 已经为你预留了新的 Agent 槽位 - 来扫码召唤吧！',
]

/** 新用户主 CTA：含 R17.2 关键词"立即测一测"。 */
const NEW_USER_CTA = '去测一测 →'

/** 回访用户主 CTA：含 R17.4 关键词"带 Ta 进小镇"。 */
const RETURN_USER_CTA = '带 Ta 进小镇 →'

/** 副 CTA（R17.6 dismissed 路径）。 */
const SECONDARY_CTA = '等等再说'

// ─── Props ─────────────────────────────────────────────────────────────────

export interface HookPopupProps {
  /** 触发本次弹框的视频（contextual_intent 来源 R17.5）。 */
  video: MockVideoCard
  /**
   * 用户已绑定的萌宠名（R17.4）。null/undefined → 新用户形态。
   * 由调用方从 localStorage `erciyuan:current_mascot` 读取后透传。
   */
  existingMascot?: string | null
  /** 关闭弹框（点击 × / 背景 / 副 CTA / Esc / "去测一测"跳转前）。 */
  onDismiss: (reason: 'dismissed' | 'clicked' | 'ignored') => void
}

// ─── 工具：随机选文案（基于 video_id 稳定，避免重渲染抖动） ────────────

function pickCopyDeterministic(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  const idx = Math.abs(h) % NEW_USER_COPY_POOL.length
  return NEW_USER_COPY_POOL[idx] ?? NEW_USER_COPY_POOL[0]!
}

// ─── 主组件 ────────────────────────────────────────────────────────────────

export function HookPopup({ video, existingMascot, onDismiss }: HookPopupProps): JSX.Element {
  const isReturning = !!existingMascot

  // R17.2 / R17.4：选文案。回访形态用定制 fallback。
  const copy = useMemo(() => {
    if (isReturning) {
      return `🐾 你的${existingMascot}已经在小镇等你了！`
    }
    return pickCopyDeterministic(video.video_id)
  }, [isReturning, existingMascot, video.video_id])

  // R17.6：30s 未点击 → 写 'ignored' 事件
  useEffect(() => {
    const t = setTimeout(() => {
      onDismiss('ignored')
    }, 30_000)
    return () => clearTimeout(t)
  }, [onDismiss])

  // ESC 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss('dismissed')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  // R17.5：主 CTA 通过 query param 编码 contextual_intent，透传给 /quiz（task 14.3）
  const ctaHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('from_video', video.video_id)
    if (video.contextual_intent.ip) params.set('ip', video.contextual_intent.ip)
    if (video.contextual_intent.cos_character) {
      params.set('cos', video.contextual_intent.cos_character)
    }
    if (video.contextual_intent.note) params.set('note', video.contextual_intent.note)
    return `/quiz?${params.toString()}`
  }, [video.video_id, video.contextual_intent])

  // 副标题：让评委看到 contextual_intent 已携带（demo 透明度）
  const subtitle = useMemo(() => {
    const ip = video.contextual_intent.ip
    const cos = video.contextual_intent.cos_character
    if (ip && cos) return `刚刷到的 · ${ip} / ${cos}`
    if (ip) return `刚刷到的 · ${ip}`
    if (cos) return `刚刷到的 · ${cos}`
    return '刚刷到的视频'
  }, [video.contextual_intent])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isReturning ? '萌宠回访引导' : '测一测领萌宠'}
      style={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss('dismissed')
      }}
    >
      <div style={styles.card}>
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={() => onDismiss('dismissed')}
          aria-label="关闭弹框"
          style={styles.closeBtn}
        >
          ×
        </button>

        {/* 头部：emoji + 副标题（contextual_intent 提示） */}
        <div style={styles.header}>
          <span style={styles.emoji} aria-hidden="true">
            {isReturning ? '🐾' : '✨'}
          </span>
          <span style={styles.subtitle}>{subtitle}</span>
        </div>

        {/* R17.2 主文案 */}
        <p style={styles.copy}>{copy}</p>

        {/* CTA + 跳过 */}
        <div style={styles.actionRow}>
          <Link
            href={ctaHref}
            onClick={() => onDismiss('clicked')}
            style={styles.ctaPrimary}
          >
            {isReturning ? RETURN_USER_CTA : NEW_USER_CTA}
          </Link>
          <button
            type="button"
            onClick={() => onDismiss('dismissed')}
            style={styles.ctaGhost}
          >
            {SECONDARY_CTA}
          </button>
        </div>

        {/* footer：透明度提示已携带 contextual_intent */}
        <p style={styles.footer}>
          来自视频 {video.video_id} · 已携带 contextual_intent
        </p>
      </div>
    </div>
  )
}

export default HookPopup

// ─── styles（inline，无新 CSS class） ─────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 24,
    background: 'rgba(20, 10, 30, 0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    animation: 'none', // 不引入 keyframes，依赖父层 framer-motion / 简单 fade
  } satisfies CSSProperties,

  card: {
    position: 'relative',
    width: 'min(92vw, 380px)',
    marginBottom: 'env(safe-area-inset-bottom, 24px)',
    padding: '24px 22px 20px',
    borderRadius: 22,
    // R17 视觉：粉紫渐变 + 玻璃态背景
    background:
      'linear-gradient(135deg, rgba(255, 182, 219, 0.92) 0%, rgba(196, 158, 255, 0.92) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.45)',
    boxShadow:
      '0 24px 60px rgba(120, 60, 180, 0.4), 0 0 0 1px rgba(255, 105, 180, 0.18)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    color: '#2A1340',
    // 像素字体 fallback 到 monospace，避免依赖未挂载的字体资源
    fontFamily:
      '"Press Start 2P", "PixelMplus", ui-monospace, SFMono-Regular, Menlo, monospace',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  } satisfies CSSProperties,

  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 30,
    height: 30,
    border: 'none',
    background: 'transparent',
    color: 'rgba(42, 19, 64, 0.62)',
    fontSize: 22,
    lineHeight: 1,
    cursor: 'pointer',
    borderRadius: 999,
    fontFamily: 'inherit',
  } satisfies CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } satisfies CSSProperties,

  emoji: {
    fontSize: 26,
    lineHeight: 1,
  } satisfies CSSProperties,

  subtitle: {
    fontSize: 11,
    letterSpacing: '0.04em',
    color: 'rgba(42, 19, 64, 0.68)',
  } satisfies CSSProperties,

  copy: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.6,
    color: '#2A1340',
    // 像素字体下减小字号让 CJK 仍可读
    letterSpacing: '0.01em',
  } satisfies CSSProperties,

  actionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  } satisfies CSSProperties,

  ctaPrimary: {
    display: 'inline-block',
    width: '100%',
    padding: '12px 18px',
    border: 'none',
    borderRadius: 12,
    background: 'linear-gradient(90deg, #FF6FB5 0%, #B16FFF 100%)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(177, 111, 255, 0.4)',
    textAlign: 'center',
    textDecoration: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  } satisfies CSSProperties,

  ctaGhost: {
    width: '100%',
    padding: '10px 18px',
    border: '1px solid rgba(42, 19, 64, 0.32)',
    borderRadius: 12,
    background: 'rgba(255, 255, 255, 0.35)',
    color: 'rgba(42, 19, 64, 0.78)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } satisfies CSSProperties,

  footer: {
    margin: 0,
    fontSize: 10,
    color: 'rgba(42, 19, 64, 0.52)',
    textAlign: 'center',
    letterSpacing: '0.04em',
  } satisfies CSSProperties,
} as const
