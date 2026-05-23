'use client'

/**
 * SpeechBubbleLayer — task 12.4
 *
 * Smallville 风白底气泡 React 渲染层（design.md §1.4 / R7.6 / R8.2）。
 *
 * **覆盖关系**：本组件以 `position: absolute; inset: 0` 叠加在 Phaser
 * canvas 同 parent 的容器内（见 TownStage.tsx）。坐标系与
 * RenderEngine.getSpriteScreenPosition 返回值同 origin —— 即父容器左上角。
 *
 * **生命周期**：
 *  - 订阅 RenderEngine 的 speech 事件流；每条 speech 立即 push 一条 bubble。
 *  - **4 秒后立即移除（不淡出）**（R7.6）：用 `setTimeout` 删除，
 *    Framer Motion `exit` 动画**不设置**，DOM 直接卸载。
 *  - 同一 char_id 4 秒内再次发声：旧 bubble 立即被移除（先于 timeout）
 *    再 mount 新的；同一时刻每个角色头顶最多一条气泡。
 *  - 文本 R8.2 截断由上游 RenderEngine.dispatchServerMsg 完成，本组件
 *    不再二次截断（保留一次"防御性"裁剪以应对外部直接调
 *    `engine.showSpeechBubble` 时未截断的输入）。
 *
 * **位置更新**：rAF 循环每帧调用 `engine.getSpriteScreenPosition`，以保
 * 持气泡跟随精灵走动 / 相机移动 / 缩放变化。坐标解析失败时（精灵被
 * destroy 或画布未 layout）当帧仍渲染最后一次成功的位置——下一帧若仍
 * 失败则 timeout 自然把它清理掉。
 *
 * **视觉规范**（design.md §1.4，CSS 复刻 SVG）：
 *  - 背景 `#FFFFFF`，2px 黑边 `#1A1A1A`，圆角 8px
 *  - box-shadow `0 2px 0 rgba(0,0,0,0.25)`
 *  - 朝下小尾巴：`::after` 伪元素三角形（CSS 变种 SVG）
 *  - 字号 14px（中文规范），`var(--font-pixel-zh)` 字族
 *  - 内边距 6px 10px
 *  - 角色头顶偏移 -36px（精灵中心 → 气泡底边）
 */

import { motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type { RenderEngine, SpeechEvent } from '@/render/RenderEngine'

/** Bubble 在 DOM 中的存活时间，R7.6 字面 4 秒。 */
const BUBBLE_LIFETIME_MS = 4000

/** 单条气泡防御性截断上限（理论上 RenderEngine 已经截过，但兜底一次）。 */
const FALLBACK_TEXT_MAX_LEN = 80
const FALLBACK_TEXT_SUFFIX = '…'

/** 精灵中心 → 气泡底部的垂直偏移。design.md §1.4 给出 -36px。 */
const BUBBLE_VERTICAL_OFFSET = 36

interface ActiveBubble {
  /** 唯一 key（含 ts），让 React 在同一 char_id 连发时强制重 mount。 */
  id: string
  charId: string
  text: string
  expireAt: number
  /** 上次成功解析的屏幕坐标，rAF 循环更新。 */
  screenX: number
  screenY: number
}

export interface SpeechBubbleLayerProps {
  /** 来自 TownStage 的 RenderEngine 单例。 */
  engine: RenderEngine
}

function safeTruncate(text: string): string {
  if (text.length <= FALLBACK_TEXT_MAX_LEN) return text
  return (
    text.slice(0, FALLBACK_TEXT_MAX_LEN - FALLBACK_TEXT_SUFFIX.length) +
    FALLBACK_TEXT_SUFFIX
  )
}

export function SpeechBubbleLayer({
  engine,
}: SpeechBubbleLayerProps): JSX.Element {
  // bubbles 存在 ref 里 + state 触发渲染：rAF 高频更新坐标只走 ref，
  // 让 React 层只在 push / expire 时 setState，避免每秒 60 次渲染。
  const bubblesRef = useRef<ActiveBubble[]>([])
  const [, forceTick] = useState(0)
  const tick = useCallback(() => forceTick((n) => (n + 1) | 0), [])
  const reactKeyPrefix = useId()

  // ── 订阅 speech 事件 ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (event: SpeechEvent): void => {
      const safeText = safeTruncate(event.text)
      const id = `${reactKeyPrefix}:${event.charId}:${event.ts}`

      // 同 char_id 已有 bubble：先移除（R7.6 同时只展一条 / 不互相覆盖）
      const filtered = bubblesRef.current.filter((b) => b.charId !== event.charId)

      // 即时尝试解析屏幕坐标；失败时给 (-9999, -9999) 让首帧不可见，
      // 由 rAF 循环后续帧补上。
      const screen = engine.getSpriteScreenPosition(event.charId)
      const next: ActiveBubble = {
        id,
        charId: event.charId,
        text: safeText,
        expireAt: event.ts + BUBBLE_LIFETIME_MS,
        screenX: screen?.x ?? -9999,
        screenY: screen?.y ?? -9999,
      }
      bubblesRef.current = [...filtered, next]
      tick()

      // R7.6：4 秒后**立即移除（不淡出）**——纯 setTimeout，无 exit 动画。
      // 同 char_id 再次发声时上面的 filtered 已经清掉，避免幽灵 timeout
      // 误删新气泡，这里用闭包内的 id 做幂等过滤。
      window.setTimeout(() => {
        bubblesRef.current = bubblesRef.current.filter((b) => b.id !== id)
        tick()
      }, BUBBLE_LIFETIME_MS)
    }
    const unsubscribe = engine.subscribeSpeech(handler)
    return unsubscribe
  }, [engine, reactKeyPrefix, tick])

  // ── rAF 循环：每帧重新解析屏幕坐标，让气泡跟随精灵走动 / 相机滚动 ──
  useLayoutEffect(() => {
    let rafId = 0
    const loop = (): void => {
      let dirty = false
      for (const bubble of bubblesRef.current) {
        const screen = engine.getSpriteScreenPosition(bubble.charId)
        if (!screen) continue
        if (
          Math.abs(screen.x - bubble.screenX) > 0.5 ||
          Math.abs(screen.y - bubble.screenY) > 0.5
        ) {
          bubble.screenX = screen.x
          bubble.screenY = screen.y
          dirty = true
        }
      }
      if (dirty) tick()
      rafId = window.requestAnimationFrame(loop)
    }
    rafId = window.requestAnimationFrame(loop)
    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [engine, tick])

  return (
    <div
      data-testid="speech-bubble-layer"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        // 高于 Phaser canvas（默认 z=auto），但低于 DEGRADED MODE 红条（z=9999）。
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {bubblesRef.current.map((bubble) => (
        <SpeechBubble
          key={bubble.id}
          text={bubble.text}
          screenX={bubble.screenX}
          screenY={bubble.screenY}
        />
      ))}
    </div>
  )
}

interface SpeechBubbleProps {
  text: string
  screenX: number
  screenY: number
}

/**
 * 单条气泡。CSS 复刻 design.md §1.4：白底 / 黑边 2px / 圆角 8px / 阴影 /
 * 朝下小尾巴。Framer Motion enter 动画 180ms easeOut；**没有 exit 动画**
 * （R7.6 立即移除）。
 */
function SpeechBubble({ text, screenX, screenY }: SpeechBubbleProps): JSX.Element {
  return (
    <motion.div
      data-testid="speech-bubble"
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY - BUBBLE_VERTICAL_OFFSET,
        // origin = 气泡底边中点（朝下尾巴的尖端），让 enter 动画从精灵头顶弹出。
        transform: 'translate(-50%, -100%)',
        transformOrigin: 'center bottom',
        backgroundColor: '#FFFFFF',
        color: '#1A1A1A',
        border: '2px solid #1A1A1A',
        borderRadius: 8,
        boxShadow: '0 2px 0 rgba(0, 0, 0, 0.25)',
        padding: '6px 10px',
        fontSize: 14,
        lineHeight: 1.3,
        fontFamily: 'var(--font-pixel-zh)',
        // 单条 ≤ 80 字符：2 行内可放下；超过自动换行
        maxWidth: 220,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        // 朝下尾巴：底部中央用一个绝对定位的旋转方块作出"V"形外边
        // ::after 伪元素需走全局 CSS；这里改用嵌套 div 替代以保证 SSR-safe
        // 内联渲染。
      }}
    >
      {text}
      {/* 朝下尾巴：黑色三角（外）+ 白色三角（内），visual 上模拟 SVG 的
          `bubble_white_tail_down` 效果。绝对定位到气泡底边中央。 */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -8,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '8px solid #1A1A1A',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -5,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '6px solid #FFFFFF',
        }}
      />
    </motion.div>
  )
}

export default SpeechBubbleLayer
