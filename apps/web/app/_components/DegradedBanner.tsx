'use client'

/**
 * DegradedBanner — task 12.6 + 13.6 / R29.26 / design.md §2.8
 *
 * 顶部固定红条，仅当 RenderEngine 报告 `degraded` 状态时渲染。
 *
 * **契约（design.md §2.8）：**
 *   - 位置：顶部固定，z-index 9999，不被 Phaser canvas 遮挡
 *   - 高度：36px
 *   - 背景：`linear-gradient(90deg, #FF6F6F 0%, #FF8B6F 100%)`（R29.26）
 *   - 文本：`⚠ DEGRADED MODE — {reason}`，14px / 600 weight，居中
 *   - 不可手动关闭，仅由系统恢复事件（subscribeDegraded 派发 reason=null）触发淡出
 *   - **多 reason** (task 13.6)：取最严重一条（= 最近一条）显示在条上；
 *     hover banner 时下拉 popover 展示最近 10 条 reason + 相对时间戳
 *
 * 设计取舍：
 *   - 接 `engine.subscribeDegraded()` 实现实时切换 + 在 reason 变化时同步
 *     从 `engine.getDegradedHistory()` 拉历史；不重复维护本地栈，避免与
 *     RenderEngine 在 StrictMode 双挂载下出现两份不一致的历史。
 *   - 不引入额外 state 库；本组件只持有 `reason` / `history` / `popoverOpen` 三个 state。
 *   - SSR 安全：subscribe 在 useEffect 内挂载，第一次渲染按 null 处理。
 *   - hover popover：banner 自身放开 `pointer-events: auto`（之前是 none）以接收
 *     onMouseEnter；mouseleave 立即收起（演示现场反应要快，不加 delay）。
 *   - popover 位置：absolute top: 36px (= banner 高度)，与 banner 容器同 fixed 层，
 *     z-index 9999 同层不会被 BentoGrid 遮挡，半透明黑底确保后面 banner 渐变不
 *     反穿过来。
 */

import { useEffect, useState } from 'react'

import type { RenderEngine } from '@/render/RenderEngine'

interface DegradedBannerProps {
  engine: RenderEngine
}

interface DegradedHistoryEntry {
  reason: string
  ts: number
}

/**
 * 把绝对时间戳渲染成 "Xs ago" / "Xm ago" 形式，与 popover 风格一致。
 * 现场实测：黑客松全场不会跑超过 2 小时，因此到分钟粒度即可。
 */
function formatRelativeTime(ts: number, now: number): string {
  const deltaMs = Math.max(0, now - ts)
  const deltaSec = Math.floor(deltaMs / 1000)
  if (deltaSec < 1) return 'just now'
  if (deltaSec < 60) return `${deltaSec}s ago`
  const deltaMin = Math.floor(deltaSec / 60)
  if (deltaMin < 60) return `${deltaMin}m ago`
  const deltaHr = Math.floor(deltaMin / 60)
  return `${deltaHr}h ago`
}

export function DegradedBanner({ engine }: DegradedBannerProps): JSX.Element | null {
  const [reason, setReason] = useState<string | null>(null)
  const [history, setHistory] = useState<DegradedHistoryEntry[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)
  // 用 nowTick 强刷"X seconds ago"显示，仅在 popover 打开时启用，避免每秒
  // setState 影响性能 / Phaser 主循环。
  const [, setNowTick] = useState(0)

  useEffect(() => {
    // subscribeDegraded 在订阅瞬间就用当前 reason 派发一次，无需手动 prime。
    const unsubscribe = engine.subscribeDegraded((next) => {
      setReason(next)
      // reason 变更（包括 null 恢复）时同步拉一次最新历史栈。
      // 注：getDegradedHistory 返回浅拷贝，setHistory 直接持有即可。
      setHistory(engine.getDegradedHistory())
    })
    return unsubscribe
  }, [engine])

  // popover 打开期间每秒刷新一次 "Xs ago" 文本。关闭时停止 tick，避免空转。
  useEffect(() => {
    if (!popoverOpen) return
    const id = window.setInterval(() => {
      setNowTick((t) => (t + 1) & 0xffff)
    }, 1000)
    return () => window.clearInterval(id)
  }, [popoverOpen])

  if (reason === null) return null

  const now = Date.now()

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPopoverOpen(true)}
      onMouseLeave={() => setPopoverOpen(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        // 不可手动关闭：不渲染 close 按钮 / 不绑定 onClick
        userSelect: 'none',
        // task 13.6：放开 pointer-events 以接收 hover；banner 自身不阻塞 canvas
        // 点击的兜底见 R29.26 —— banner 高度仅 36px，不挡住地图主区。
        pointerEvents: 'auto',
        // 容器自身 inline-block 层级即可；条体与 popover 都用 absolute 落位。
        // 用 div 包一层是为了让 popover 跟随 banner 一起 fixed 顶部。
      }}
    >
      {/* 红条本体 —— 36px 高，单行 reason 文本居中 */}
      <div
        // hover 兜底：长 reason 通过 ellipsis 截断，title 兜底完整文本
        title={`DEGRADED MODE · ${reason}`}
        style={{
          height: 36,
          // R29.26 / design.md §2.8 的标准红条渐变
          background: 'linear-gradient(90deg, #FF6F6F 0%, #FF8B6F 100%)',
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          // 滑入 200ms（design.md §2.8）—— 用 CSS keyframe 太重，inline 用
          // entrance transform/opacity 配合 mount-time 触发即可。
          animation: 'erciyuanDegradedSlideIn 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 2px 12px rgba(255, 111, 111, 0.45)',
          padding: '0 16px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          // 给视觉提示：可 hover
          cursor: history.length > 1 ? 'help' : 'default',
        }}
      >
        <span aria-hidden="true" style={{ marginRight: 8 }}>
          ⚠
        </span>
        DEGRADED MODE · {reason}
        {history.length > 1 ? (
          <span
            aria-hidden="true"
            style={{
              marginLeft: 10,
              fontSize: 12,
              opacity: 0.85,
              fontWeight: 500,
            }}
          >
            ({history.length} events · hover)
          </span>
        ) : null}
      </div>

      {/* hover popover —— 紧贴 banner 下方，列出最近 10 条 reason */}
      {popoverOpen && history.length > 0 ? (
        <div
          role="list"
          aria-label="Recent degraded reasons"
          style={{
            position: 'absolute',
            top: 36, // 紧贴 banner 下方
            right: 16,
            maxWidth: 480,
            minWidth: 280,
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#FFFFFF',
            borderRadius: 6,
            padding: 12,
            fontSize: 13,
            lineHeight: 1.5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            // 与 banner 同 z-index 不会被 BentoGrid 遮挡；BentoGrid 自身
            // 上限是 100，差两个数量级。
            // SSR 友好：纯 CSS 入场动画，不依赖 ref。
            animation: 'erciyuanDegradedPopoverFadeIn 120ms ease-out',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: 8,
            }}
          >
            Recent reasons (last {history.length})
          </div>
          {history.map((entry, idx) => (
            <div
              key={`${entry.ts}-${idx}`}
              role="listitem"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '4px 0',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span
                style={{
                  flex: '1 1 auto',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  // 最近一条用稍亮的颜色高亮
                  color: idx === 0 ? '#FFB86F' : '#FFFFFF',
                  fontWeight: idx === 0 ? 600 : 400,
                }}
              >
                {entry.reason}
              </span>
              <span
                style={{
                  flex: '0 0 auto',
                  opacity: 0.6,
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatRelativeTime(entry.ts, now)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* 滑入动画 keyframe 注入；inline `<style>` 避免污染 globals.css */}
      <style>{`
        @keyframes erciyuanDegradedSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes erciyuanDegradedPopoverFadeIn {
          from { transform: translateY(-4px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default DegradedBanner
