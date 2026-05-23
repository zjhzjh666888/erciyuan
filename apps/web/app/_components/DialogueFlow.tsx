'use client'

/**
 * DialogueFlow — task 13.4
 *
 * 全镇对话流侧边栏（design.md §2.5 / R13.3 / R13.4）：
 *
 *  - **数据源**：订阅 RenderEngine 的 `subscribeSpeech` —— 与 12.4 SpeechBubbleLayer
 *    共用同一份事件流入口，**不**改 RenderEngine。每条 speech ServerMsg 进入本组件
 *    的时间倒序 buffer。
 *  - **容量**：最近 100 条。新 speech `unshift` 到数组首部；超过 100 条尾部 pop。
 *  - **单条排版**（design.md §2.5）：
 *      `[charId 头像 32px] → [对方头像 32px / 占位] [文本一行 ≤ 60 字符]  [ts]`
 *      文本超过 60 字符截断 + `…`，hover 浮窗（HTML `title` 属性）显示完整文本。
 *  - **R13.3 自动滚动 + 用户暂停**：
 *      - 默认每条新消息进入时容器 `scrollTop = 0`（最新在顶）。
 *      - 用户主动 scroll 容器 → 暂停自动滚动；3s 无 scroll 操作恢复，并跳回顶。
 *      - 暂停期间累积"未读 N 条"小条，置于容器顶端浮起；点击恢复并跳到顶。
 *
 * 设计取舍：
 *
 *  - **target_char_id 不在 ServerMsg 协议里**（packages/types#ServerMsg.speech 无该字段），
 *    mock-town timeline 的 speech 也都是单角色"自言自语"。本组件接受这一现状：
 *    "对方"位置渲染为同等尺寸的空占位（保持视觉对齐），而不是吃掉头像位让单条
 *    布局偏移。等到 Slice 5+ ServerMsg 扩展 target_char_id 时，只需要把
 *    `event.targetCharId` 接进来即可，不必改 layout。
 *  - **暂停时维持视觉位置**：用户向下滚动后，新事件 unshift 会让"原本看的那条"
 *    在 DOM 中下移一格。本组件用 `useLayoutEffect` 测量 scrollHeight 变化，
 *    把 `scrollTop += delta` 抹平视觉抖动 —— 用户一直盯着同一条，不会被新事件
 *    "顶下去"。
 *  - **scroll 事件区分用户 vs 程序触发**：本组件唯一的程序触发是 `scrollTop = 0`，
 *    它本身就是"已在顶部"语义；scroll handler 内只要看到 `scrollTop > 1` 才认定
 *    为用户主动滚动 → 触发暂停 + 3s 恢复 timer。
 *  - **mascot_type → portrait 解析**复用 RenderEngine 同款的
 *    {@link resolveMascotTypeFromCharId}，再拼 `/assets/mascots/{mascot_type}/portrait_64.png`
 *    （sync-assets.mjs 已把 32 类素材同步进 public 路径）。解析失败 → 走 fallback
 *    avatar（彩色字母圆角块），不抛错。
 *
 * Reference: design.md §2.5 (全镇对话流侧边栏), R13.3 (自动滚动暂停规则).
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { GlassCard, GlassCardHeader } from './GlassCard'

import { resolveMascotTypeFromCharId } from '@/render/MockTimelineDriver'
import type { RenderEngine, SpeechEvent } from '@/render/RenderEngine'

/** R13.3：buffer 容量上限。 */
const BUFFER_LIMIT = 100

/** design.md §2.5：单条文本超过 60 字符截断。 */
const TEXT_TRUNCATE_LIMIT = 60
const TRUNCATE_SUFFIX = '…'

/** R13.3：用户停止滚动后多少 ms 恢复自动滚动。 */
const AUTO_SCROLL_RESUME_MS = 3000

/** scrollTop ≤ 此阈值视为"已在顶部"（程序触发或用户回到顶部）。 */
const TOP_THRESHOLD_PX = 1

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DialogueEntry {
  /** React key —— charId+ts 已唯一；mock-town 循环回放时同 trace_id 也会因 ts 不同而区分。 */
  key: string
  charId: string
  /** 当前 ServerMsg.speech 暂无 target_char_id；为未来 Slice 5+ 扩展预留。 */
  targetCharId: string | null
  text: string
  ts: number
}

export interface DialogueFlowProps {
  engine: RenderEngine
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** 文本 ≤ 60 字符截断 + `…`；≤ 60 时原样返回。 */
function truncateText(text: string): string {
  if (text.length <= TEXT_TRUNCATE_LIMIT) return text
  return text.slice(0, TEXT_TRUNCATE_LIMIT - TRUNCATE_SUFFIX.length) + TRUNCATE_SUFFIX
}

/** UNIX ms → `HH:mm:ss`（本地时区）。 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * char_id → portrait_64.png URL。失败时返回 null，调用方走 fallback avatar。
 */
function resolvePortraitUrl(charId: string): string | null {
  const mascotType = resolveMascotTypeFromCharId(charId)
  if (!mascotType) return null
  return `/assets/mascots/${mascotType}/portrait_64.png`
}

/** 简化 char_id 显示（去掉 `mock_char_` 前缀），用于 hover title 与 fallback 字母。 */
function shortCharId(charId: string): string {
  return charId.startsWith('mock_char_') ? charId.slice('mock_char_'.length) : charId
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

interface AvatarProps {
  charId: string | null
  size?: number
}

/**
 * 32px 头像；`charId === null` 表示"对方占位"——渲染为同尺寸空盒以保持单行布局
 * 对齐（design.md §2.5："角色 A 头像 32px + → + 角色 B 头像 32px"）。
 */
function Avatar({ charId, size = 32 }: AvatarProps): JSX.Element {
  if (charId === null) {
    return (
      <div
        aria-hidden
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          // 对方占位：1px 虚线，提示"无明确接收者"
          border: '1px dashed rgba(255, 255, 255, 0.18)',
          boxSizing: 'border-box',
        }}
      />
    )
  }

  const portraitUrl = resolvePortraitUrl(charId)
  const label = shortCharId(charId)

  if (!portraitUrl) {
    // fallback：圆形 + 首字母（与 design.md §2.5 视觉留白一致）
    return (
      <div
        title={charId}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          color: 'rgba(245, 245, 247, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'var(--font-pixel-en)',
          textTransform: 'uppercase',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxSizing: 'border-box',
        }}
      >
        {label.charAt(0) || '?'}
      </div>
    )
  }

  return (
    <img
      src={portraitUrl}
      alt={charId}
      title={charId}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        objectFit: 'cover',
        // 像素艺术放大不要被插值糊掉
        imageRendering: 'pixelated',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        boxSizing: 'border-box',
      }}
    />
  )
}

interface DialogueRowProps {
  entry: DialogueEntry
}

function DialogueRow({ entry }: DialogueRowProps): JSX.Element {
  const truncated = truncateText(entry.text)
  const isTruncated = truncated !== entry.text

  return (
    <li
      data-testid="dialogue-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        // 单条之间用 hairline 分隔，比 8px gap 更省垂直空间（4 列 × 3 行槽位较窄）
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        listStyle: 'none',
      }}
    >
      <Avatar charId={entry.charId} size={32} />
      <span
        aria-hidden
        style={{
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: 14,
          flexShrink: 0,
          fontFamily: 'var(--font-pixel-en)',
          lineHeight: 1,
        }}
      >
        →
      </span>
      <Avatar charId={entry.targetCharId} size={32} />
      <span
        // hover 浮窗：text 全文。R13.3 字面"hover 展开浮窗"，HTML title 是
        // 最朴素也最稳的实现，不增加 popper / portal 依赖。
        title={isTruncated ? entry.text : undefined}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          lineHeight: 1.35,
          color: 'rgba(245, 245, 247, 0.88)',
          // 单行截断：如果浏览器自身排版超出（例如等宽 CJK 单字 > 60 也只占 1 行
          // 但容器太窄）再叠一层 ellipsis 保险
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-pixel-zh)',
        }}
      >
        {truncated}
      </span>
      <span
        style={{
          flexShrink: 0,
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.40)',
          fontFamily: 'var(--font-pixel-en, "JetBrains Mono", monospace)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatTime(entry.ts)}
      </span>
    </li>
  )
}

function EmptyState(): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 6,
        padding: '24px 12px',
        color: 'rgba(245, 245, 247, 0.45)',
      }}
    >
      <div style={{ fontSize: 24 }} aria-hidden>
        💬
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        等待小镇里的萌宠开口…
        <br />
        speech 事件流接入即可。
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export function DialogueFlow({ engine }: DialogueFlowProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const reactKeyPrefix = useId()

  // buffer 在 ref 里持久；setState 仅在事件触达时让 React 重渲染。
  const bufferRef = useRef<DialogueEntry[]>([])
  const [, forceTick] = useState(0)
  const tick = useCallback(() => forceTick((n) => (n + 1) | 0), [])

  // 暂停 / 未读条数（R13.3）
  const pausedRef = useRef<boolean>(false)
  const [paused, setPaused] = useState<boolean>(false)
  const [unread, setUnread] = useState<number>(0)
  const resumeTimerRef = useRef<number | null>(null)

  // 维持暂停态滚动锚点：上一帧 scrollHeight，新事件入队后用差值修正
  // scrollTop，让用户视觉位置不被新条目"顶下去"。
  const prevScrollHeightRef = useRef<number>(0)
  // 标记"是否需要在下一次 layout effect 里做自动滚动到顶"
  const shouldStickToTopRef = useRef<boolean>(false)
  // 标记"是否需要保持视觉位置"（暂停态下新事件入队后用）
  const shouldPreserveAnchorRef = useRef<boolean>(false)

  /* -------- 订阅 RenderEngine.speech ------------------------------------ */
  useEffect(() => {
    const handler = (event: SpeechEvent): void => {
      const el = containerRef.current
      // 入队前测量当前 scrollHeight，下一次 layout 用作 anchor 修正基线
      prevScrollHeightRef.current = el?.scrollHeight ?? 0

      const entry: DialogueEntry = {
        key: `${reactKeyPrefix}:${event.charId}:${event.ts}`,
        charId: event.charId,
        // ServerMsg.speech 当前协议无 target_char_id；预留接口给 Slice 5+
        // 时直接 `(event as any).targetCharId ?? null`，本任务范围不强转。
        targetCharId: null,
        text: event.text,
        ts: event.ts,
      }

      const next = [entry, ...bufferRef.current]
      if (next.length > BUFFER_LIMIT) next.length = BUFFER_LIMIT
      bufferRef.current = next

      if (pausedRef.current) {
        setUnread((n) => n + 1)
        shouldPreserveAnchorRef.current = true
      } else {
        shouldStickToTopRef.current = true
      }

      tick()
    }
    return engine.subscribeSpeech(handler)
  }, [engine, reactKeyPrefix, tick])

  /* -------- 渲染后：按需 scrollTop=0 / 维持锚点 ------------------------- */
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (shouldStickToTopRef.current) {
      shouldStickToTopRef.current = false
      // 程序触发：scrollTop = 0 不会被 onScroll 视作"用户主动滚动"
      // （阈值 TOP_THRESHOLD_PX）
      el.scrollTop = 0
      return
    }

    if (shouldPreserveAnchorRef.current) {
      shouldPreserveAnchorRef.current = false
      const delta = el.scrollHeight - prevScrollHeightRef.current
      if (delta > 0) {
        // 把 scrollTop 加上 delta，让用户原本看到的条目仍在原位
        el.scrollTop += delta
      }
    }
  })

  /* -------- 卸载时清理 timer ------------------------------------------- */
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
      }
    }
  }, [])

  /* -------- 暂停 / 恢复 helper ----------------------------------------- */
  const enterPaused = useCallback((): void => {
    if (!pausedRef.current) {
      pausedRef.current = true
      setPaused(true)
    }
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current)
    }
    resumeTimerRef.current = window.setTimeout(() => {
      // 3s 无 scroll 操作 → 恢复自动滚动 + 跳回顶
      pausedRef.current = false
      resumeTimerRef.current = null
      setPaused(false)
      setUnread(0)
      const el = containerRef.current
      if (el) el.scrollTop = 0
    }, AUTO_SCROLL_RESUME_MS)
  }, [])

  const resumeNow = useCallback((): void => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
    pausedRef.current = false
    setPaused(false)
    setUnread(0)
    const el = containerRef.current
    if (el) el.scrollTop = 0
  }, [])

  /* -------- scroll handler --------------------------------------------- */
  const handleScroll = useCallback((): void => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollTop <= TOP_THRESHOLD_PX) {
      // 已回到顶部（程序触发或用户回到顶部）→ 取消暂停
      if (pausedRef.current) {
        if (resumeTimerRef.current !== null) {
          window.clearTimeout(resumeTimerRef.current)
          resumeTimerRef.current = null
        }
        pausedRef.current = false
        setPaused(false)
        setUnread(0)
      }
      return
    }
    // 用户主动滚动 → 暂停 + 重置 3s 恢复 timer（每次 scroll 都续命）
    enterPaused()
  }, [enterPaused])

  const items = bufferRef.current

  return (
    <GlassCard
      as="section"
      variant="primary"
      density="normal"
      hoverable={false}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
      }}
      aria-label="全镇对话流（最近 100 条）"
    >
      <GlassCardHeader>
        <span>💬 全镇对话流</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(245, 245, 247, 0.45)',
            fontFamily: 'var(--font-pixel-en, "JetBrains Mono", monospace)',
          }}
        >
          {items.length} / {BUFFER_LIMIT}
        </span>
      </GlassCardHeader>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
        }}
      >
        {/* 浮起的"未读 N 条"小条：暂停期间累计 unread > 0 才渲染。
            点击后立即 resume + 跳到顶。 */}
        {paused && unread > 0 && (
          <button
            type="button"
            onClick={resumeNow}
            data-testid="dialogue-flow-unread-banner"
            style={{
              position: 'absolute',
              top: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              border: 'none',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: '#0E1018',
              backgroundColor: 'var(--brand-secondary)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
              cursor: 'pointer',
              fontFamily: 'var(--font-pixel-zh)',
              letterSpacing: 0,
            }}
          >
            ↑ {unread} 条新消息
          </button>
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          data-testid="dialogue-flow-list"
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
            paddingRight: 4,
            // 让内部 ul 能撑满
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {items.map((entry) => (
                <DialogueRow key={entry.key} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export default DialogueFlow
