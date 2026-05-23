'use client'

/**
 * ActionLabelLayer — task 12.5
 *
 * Smallville 风「角色脚下动作描述」叠加层（design.md §1.5）。
 *
 *  - 触发：`RenderEngine` 在 ServerMsg `action_label` 到达 / 外部直接调
 *    `showActionLabel` 时广播 {@link ActionLabelEvent}；本组件订阅事件流并
 *    维护一个 `Map<charId, label>`，label 为 string 时显示，为 `null` 立即
 *    移除该 char_id 条目（与 design.md §1.5「持续与 next_action 一致，结束
 *    立即清除」一致）。
 *  - 视觉：12px 像素英文字体 / 半透明深色 `#1A1A2E` 背景 / 圆角 4px /
 *    `padding: 2px 8px` / `white-space: nowrap`，居中对齐到精灵脚下。
 *  - 与 12.4 气泡（头顶）位置不重叠：脚下 `top + displayHeight/2 + 4px`。
 *  - **不**用 Framer Motion 弹出动画（持续显示的 ambient 信息，不应抢戏）；
 *    只走一句简单 CSS `transition: opacity 120ms` 让出现 / 消失更柔和。
 *
 * 时序设计：
 *  - subscribe 在首个 effect 内立即注册 → 不会错过 RenderEngine 已经发出
 *    的事件（前提：调用方在 mount 后才 dispatch；mock-town 的 90s timeline
 *    起点也是 5s 后才出现 action_label，足够 React 完成挂载）。
 *  - 用 rAF 轮询 `engine.getSpriteScreenPosition(charId)` 让 label 跟随相机
 *    平移 / 缩放 / 走路。Map 为空时跳过 rAF 循环以省功耗。
 */

import { useEffect, useRef, useState } from 'react'

import type { RenderEngine } from '@/render/RenderEngine'

interface ActionLabelLayerProps {
  engine: RenderEngine
}

/** 像素之间的间隙：脚下文字与精灵底之间留 4px 视觉气孔（design.md §1.5）。 */
const FOOT_GAP_PX = 4

/**
 * 单条 label 的可视位置；按 `charId` 索引，每帧 rAF 重算。
 * `null` 时表示当前 sprite 不在视野内（TownScene 还没就绪 / 已 destroy），
 * 渲染层跳过该条。
 */
interface LabelPosition {
  x: number
  y: number
}

export function ActionLabelLayer({ engine }: ActionLabelLayerProps): JSX.Element {
  // 维护当前所有显示中的 label —— useState 用 Map 包对象引用，每次替换整个
  // Map 触发 re-render（不可变更新，符合 React 习惯）。
  const [labels, setLabels] = useState<Map<string, string>>(() => new Map())

  // 屏幕坐标：每帧 rAF 重算，存到 ref 避免无意义 re-render。最后落到一个
  // numeric tick state 触发渲染。
  const positionsRef = useRef<Map<string, LabelPosition>>(new Map())
  const [, setTick] = useState(0)

  // ── 订阅 RenderEngine 事件流 ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = engine.subscribeActionLabel(({ charId, label }) => {
      setLabels((prev) => {
        const next = new Map(prev)
        if (label === null) {
          if (!next.has(charId)) return prev // 无变化：避免无谓 re-render
          next.delete(charId)
        } else {
          if (next.get(charId) === label) return prev // 重复 label，去抖
          next.set(charId, label)
        }
        return next
      })
    })
    return unsubscribe
  }, [engine])

  // ── rAF 同步坐标 ───────────────────────────────────────────────────
  // 仅当存在至少一条 label 时才启动循环；空 Map → 关掉 rAF 省 CPU。
  useEffect(() => {
    if (labels.size === 0) {
      positionsRef.current = new Map()
      return
    }
    let raf = 0
    let cancelled = false
    const loop = (): void => {
      if (cancelled) return
      const next = new Map<string, LabelPosition>()
      for (const charId of labels.keys()) {
        const screen = engine.getSpriteScreenPosition(charId)
        if (!screen) continue
        // 脚下：sprite center y + 半高 + 4px 视觉气孔。
        next.set(charId, {
          x: screen.x,
          y: screen.y + screen.displayHeight / 2 + FOOT_GAP_PX,
        })
      }
      positionsRef.current = next
      setTick((t) => (t + 1) % 1_000_000)
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
    }
  }, [engine, labels])

  return (
    <div
      data-testid="action-label-layer"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        // 12.4 气泡层会与本层共享同一定位空间；z-index 给一个明确的低值，
        // 让头顶气泡（z-index 11）压在脚下 label 之上不会有视觉冲突。
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {Array.from(labels.entries()).map(([charId, label]) => {
        const pos = positionsRef.current.get(charId)
        // 还没拿到屏幕坐标（TownScene 未就绪 / sprite 不存在）时让节点保持
        // opacity 0 但仍挂载，避免 CSS transition 进入"瞬现"路径。
        const visible = pos !== undefined
        const x = pos?.x ?? 0
        const y = pos?.y ?? 0
        return (
          <div
            key={charId}
            data-character-id={charId}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, 0)',
              background: 'rgba(26, 26, 46, 0.85)',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: 1.2,
              fontFamily: 'var(--font-pixel-en)',
              whiteSpace: 'nowrap',
              opacity: visible ? 1 : 0,
              transition: 'opacity 120ms ease-out',
              // 像素风：禁用子像素抗锯齿，保持清晰。
              textRendering: 'geometricPrecision',
              userSelect: 'none',
            }}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}

export default ActionLabelLayer
