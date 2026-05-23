/**
 * BentoGrid + BentoSlot — task 13.1 / design.md §2.1
 *
 * 12 列 × 8 行 Bento Grid 主仪表盘布局容器 + 槽位系统。本组件**只做布局**，
 * 不实现具体卡片内容（13.3–13.8 才填）。
 *
 * 设计取舍：
 *  - **纯布局，零状态**：组件不需要 `'use client'`，可在 Server Component
 *    路径下渲染，对 SSR 友好（首屏 ≤ 2s 目标受益）。
 *  - **位置全部托管在子组件 `BentoSlot` 上**：每个槽位通过 `name` prop 决定
 *    自己的 `gridColumn / gridRow / order`，调用方什么都不用算。
 *  - **类型契约硬约束**：`name` 是字面量联合，写错就 TS 报错；新增槽位需要
 *    同步改 design.md §2.1 与本表，不允许"打字符串就能加"。
 *  - **响应式由 globals.css `.bento-grid` 三档 media query 接管**：
 *      ≥ 1440px ...... 完整 12×8（grid 模式生效）
 *      1024–1440px ... 同 12×8，仅收紧 CSS variable padding / 字号
 *      <  1024px ..... 切到 flex 列堆叠，`order` 接管视觉顺序
 *    BentoSlot 的 inline style 同时携带 `gridColumn/Row` + `order`，两种布局
 *    模式下都正确（grid 忽略 order，flex 忽略 grid 定位）。
 *  - **gap 全断点统一 16px**（设计文档硬性要求）。
 *  - **DegradedBanner 不在 grid 流里**：它已在 TownStage 内以
 *    `position:fixed` 顶部叠加，本组件不为它分配槽位，避免重复占位。
 *
 * 槽位分配（与 design.md §2.1 + 任务 13.1 内说明对齐；总和 12×8 = 96 cells）：
 *
 *   | name              | col-span | row-span | 起点 (col, row) | 占用格 |
 *   | ----------------- | -------- | -------- | --------------- | ------ |
 *   | town              | 8        | 5        | (1, 1)          | 40     |
 *   | thought-stream    | 4        | 5        | (9, 1)          | 20     |
 *   | character-detail  | 4        | 3        | (1, 6)          | 12     |
 *   | control-panel     | 4        | 3        | (5, 6)          | 12     |
 *   | dialogue-flow     | 4        | 3        | (9, 6)          | 12     |
 *
 * Reference: design.md §2.1 (Bento Grid 精确网格).
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 槽位字面量联合。新增槽位必须先更新 design.md §2.1，再扩展此类型。
 * 未列出的名称在 BentoSlot props 上会编译报错（task 要求第 4 条）。
 */
export type BentoSlotName =
  | 'town'
  | 'thought-stream'
  | 'dialogue-flow'
  | 'character-detail'
  | 'control-panel'

interface SlotPlacement {
  /** CSS Grid `grid-column` 简写：`<start> / span <span>` */
  gridColumn: string
  /** CSS Grid `grid-row` 简写：`<start> / span <span>` */
  gridRow: string
  /**
   * Flex 模式（< 1024px）下的堆叠顺序。
   * TownStage 必须在最顶 → order 0；其他卡片纵向排列。
   */
  order: number
}

/**
 * 槽位 → 网格定位。所有 placement 在编译期确定，运行时不计算。
 *
 * 起止严格对齐 design.md §2.1，并与本任务 prompt 的"约 8 列 × 5 行 / 4 列 ×
 * 5 行 / 4 列 × 3 行"小标题完全一致。`character-detail` 与 `control-panel`
 * 共占左下与中下两块（4+4 列），`dialogue-flow` 占右下（4 列）。
 */
const SLOT_PLACEMENT: Record<BentoSlotName, SlotPlacement> = {
  // 左上主视图：8 列 × 5 行（design.md §2.1 主舞台）
  town: {
    gridColumn: '1 / span 8',
    gridRow: '1 / span 5',
    order: 0,
  },
  // 右上：4 列 × 5 行（实时滚动）
  'thought-stream': {
    gridColumn: '9 / span 4',
    gridRow: '1 / span 5',
    order: 1,
  },
  // 左下：4 列 × 3 行（角色细节卡）
  'character-detail': {
    gridColumn: '1 / span 4',
    gridRow: '6 / span 3',
    order: 2,
  },
  // 中下：4 列 × 3 行（控制面板 / Mock Mode badge / JSONL 导出导入按钮）
  'control-panel': {
    gridColumn: '5 / span 4',
    gridRow: '6 / span 3',
    order: 3,
  },
  // 右下：4 列 × 3 行（对话流）
  'dialogue-flow': {
    gridColumn: '9 / span 4',
    gridRow: '6 / span 3',
    order: 4,
  },
}

/* -------------------------------------------------------------------------- */
/* BentoGrid container                                                        */
/* -------------------------------------------------------------------------- */

export interface BentoGridProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

/**
 * 12×8 Bento Grid 容器。自适应父容器 100% × 100vh（min-height 768px）。
 *
 * 真正的 grid 定义在 globals.css 的 `.bento-grid` 类里（含三档 media query），
 * 这里只是个语义化的 `<main>` wrapper，让外层 page.tsx 不需要再嵌一层 `<main>`。
 */
export function BentoGrid({
  className,
  children,
  ...rest
}: BentoGridProps): JSX.Element {
  const composed = ['bento-grid', className].filter(Boolean).join(' ')

  return (
    <main className={composed} {...rest}>
      {children}
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/* BentoSlot                                                                  */
/* -------------------------------------------------------------------------- */

export interface BentoSlotProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 槽位名。字面量联合，未列出的名称会触发 TS2322 编译错误。
   * 新增槽位必须先更新 design.md §2.1。
   */
  name: BentoSlotName
  children?: ReactNode
}

/**
 * Bento 槽位占位容器。**不**渲染卡片样式（边框 / 背景 / padding），所有视觉
 * 由 children（通常是 13.2 的 GlassCard）承担；这样 BentoSlot 就是个纯定位
 * 容器，调用方可以自由决定每个槽位填什么。
 *
 * 自身只做三件事：
 *   1. 应用 SLOT_PLACEMENT 表里的 gridColumn / gridRow / order
 *   2. 给 children 一个 100% × 100% 的可填空间（默认 `display: flex`，子元素
 *      可直接 `flex: 1` 填满；调用方也可以覆盖）
 *   3. 通过 `data-bento-slot` 属性让 globals.css 的移动端 fallback 能精准
 *      区分 town vs 其他槽（town 需要保持 16:9 ratio，其他默认 220px 高）
 */
export function BentoSlot({
  name,
  className,
  style,
  children,
  ...rest
}: BentoSlotProps): JSX.Element {
  const placement = SLOT_PLACEMENT[name]

  const composedStyle: CSSProperties = {
    gridColumn: placement.gridColumn,
    gridRow: placement.gridRow,
    order: placement.order,
    minWidth: 0, // 防止 grid item 撑开父容器（12 列细分时的常见坑）
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }

  return (
    <div
      data-bento-slot={name}
      className={className}
      style={composedStyle}
      {...rest}
    >
      {children}
    </div>
  )
}

export default BentoGrid
