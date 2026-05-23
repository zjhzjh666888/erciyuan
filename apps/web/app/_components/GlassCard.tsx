/**
 * GlassCard — task 13.2
 *
 * 通用 Glassmorphism 卡片 wrapper，把 `apps/web/src/theme/tokens.{ts,json}` 里
 * 的 `surfaces` / `borders` / `shadows` / `radii` / `blur` token 落成一个可复用
 * 的 React 组件，供 13.3–13.8 的具体卡片（Thought Stream / 对话流 / 角色细节
 * / 视频流 / Trends / 谷子货架 / 痛房 / Doujin / War / Settings）直接使用。
 *
 * 设计取舍：
 *  - 纯样式 wrapper，不需要 `'use client'`：组件没有 hooks / event handlers，
 *    完全可以在 Server Component 里直接 render（Bento Grid 13.1 的格子也
 *    多半是 Server Component）
 *  - inline style 引用 CSS variables（globals.css 暴露），而非 Tailwind class。
 *    这样：
 *      a) 三个 variant 的差异（primary / secondary / translucent）只需切换
 *         一个 CSS var 就成立，不用为每个 variant 维护一坨 Tailwind class
 *      b) Phaser 等非 React 路径也能用同样的 var() 读到一致的视觉值
 *  - hover 切换 `--shadow-card-hover` 用纯 CSS（:hover 选择器 + style block
 *    挂在组件根节点），不引入 React state，不破坏父组件 layout（box-shadow
 *    不会改变盒子尺寸）
 *  - density 控制 padding：compact / normal / spacious 三档对齐 design.md
 *    §2.4–2.6 各卡片内边距规范
 *  - `as` prop 让 GlassCard 可以渲染成 `<section>` / `<article>` 等语义化
 *    标签，符合 Bento Grid 13.1 + 仪表盘可访问性需求
 *  - sub-components（Header / Body / Footer）只是预设了 padding / typography
 *    的简单 wrapper，目的：让 13.3+ 各卡片的 markup 看起来一致，又不强制使用
 *
 * Reference: design.md §2.2 (Glassmorphism Design Tokens) + §2.4 / §2.6
 * (Thought Stream / 角色细节卡 排版).
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type GlassCardVariant = 'primary' | 'secondary' | 'translucent'
export type GlassCardDensity = 'compact' | 'normal' | 'spacious'
export type GlassCardElement = 'div' | 'section' | 'article'

/**
 * Variant 决定卡片的 surface fill：
 *  - primary：12% rgba(white) — Bento Grid 主格子（最不透明、视觉最稳）
 *  - secondary：6% — 次级 / 内嵌面板（设置面板里的子区块）
 *  - translucent：4% — 浮层 / popover（异世界转生过场用的最透明）
 */
const VARIANT_SURFACE: Record<GlassCardVariant, string> = {
  primary:     'var(--surface-glass-primary)',
  secondary:   'var(--surface-glass-secondary)',
  translucent: 'var(--surface-glass-translucent)',
}

/**
 * Density 决定卡片自身的 padding。GlassCardHeader / Body / Footer 内部的
 * 间距独立管理，所以 density 只影响"卡片整体边距"那一层。
 */
const DENSITY_PADDING: Record<GlassCardDensity, string> = {
  compact:  '12px',
  normal:   '16px',
  spacious: '24px',
}

export interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  variant?: GlassCardVariant
  density?: GlassCardDensity
  /** 渲染成哪个 HTML 标签，默认 `div`。语义化场景下传 `section` / `article`。 */
  as?: GlassCardElement
  /** 是否启用 hover 阴影抬升（默认 true）。Bento Grid 13.1 的 cell 全开启； */
  /** 静态展示卡（如 DEGRADED MODE banner）传 false 关闭，避免误导用户可点击。 */
  hoverable?: boolean
  /** 内圆角 size：默认 `card`（16px）；紧凑卡片传 `cardSmall`（8px）。 */
  radius?: 'card' | 'cardSmall'
  children?: ReactNode
}

/**
 * 主组件。CSS variables 在 globals.css `:root` 里声明：
 *   --surface-glass-primary / -secondary / -translucent
 *   --border-subtle / --border-glow
 *   --radius-card / --radius-card-small
 *   --shadow-card / --shadow-card-hover
 *   --glass-blur (= blur(12px))
 *   --motion-normal / --easing-anime
 *
 * hover 时切换 box-shadow 用纯 CSS（:hover 选择器），不需要 React state。
 * 我们用 `data-glass-card` 属性 + 一个全局 stylesheet 块，实现"局部 hover
 * 规则"而不污染全局 .glass。
 */
export function GlassCard({
  variant = 'primary',
  density = 'normal',
  as = 'div',
  hoverable = true,
  radius = 'card',
  style,
  className,
  children,
  ...rest
}: GlassCardProps): JSX.Element {
  const Tag = as as 'div'

  const composedStyle: CSSProperties = {
    background: VARIANT_SURFACE[variant],
    border: 'var(--border-subtle)',
    borderRadius:
      radius === 'cardSmall'
        ? 'var(--radius-card-small)'
        : 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    backdropFilter: 'var(--glass-blur)',
    // Safari / 旧 iOS Chromium 需要 webkit prefix
    WebkitBackdropFilter: 'var(--glass-blur)',
    padding: DENSITY_PADDING[density],
    transition:
      'box-shadow var(--motion-normal) var(--easing-anime), border-color var(--motion-normal) var(--easing-anime)',
    ...style,
  }

  // hover 规则在 globals.css 里以全局选择器 `[data-glass-card][data-glass-hoverable='true']:hover`
  // 实现，不依赖 styled-jsx —— 这样组件可以保持纯 Server Component（不需要
  // `'use client'`），同时调用方什么都不用做就能拿到 hover 抬升效果。
  return (
    <Tag
      data-glass-card={variant}
      data-glass-hoverable={hoverable ? 'true' : 'false'}
      className={className}
      style={composedStyle}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* -------------------------------------------------------------------------- */
/* Sub-components — 简化卡片内部排版的轻量 wrapper                            */
/* -------------------------------------------------------------------------- */

export interface GlassCardSlotProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

/**
 * 卡片头：标题 + 可选副标题 / action 按钮。
 *  - 字号对齐 design.md §2.6（角色细节卡头部 16px 标题）
 *  - 底部 8px 间距 + 1px hairline，让头/正文之间有清晰的视觉分隔
 */
export function GlassCardHeader({
  style,
  className,
  children,
  ...rest
}: GlassCardSlotProps): JSX.Element {
  return (
    <div
      data-glass-card-slot="header"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingBottom: 8,
        marginBottom: 8,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--neutral-glass-white)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

/**
 * 卡片正文：默认行高放松，避免长段落（如 Thought Trace 的 plan 字段）挤在
 * 一起。不强制内边距 —— 由外层 GlassCard `density` 控制。
 */
export function GlassCardBody({
  style,
  className,
  children,
  ...rest
}: GlassCardSlotProps): JSX.Element {
  return (
    <div
      data-glass-card-slot="body"
      className={className}
      style={{
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: 'rgba(245, 245, 247, 0.85)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

/**
 * 卡片底：metadata / 时间戳 / 操作按钮。字号比 body 小一档，颜色更暗。
 */
export function GlassCardFooter({
  style,
  className,
  children,
  ...rest
}: GlassCardSlotProps): JSX.Element {
  return (
    <div
      data-glass-card-slot="footer"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 8,
        marginTop: 8,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.75rem',
        color: 'rgba(245, 245, 247, 0.55)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default GlassCard
