'use client'

/**
 * EventFeed — 右栏下半「今日事件流」
 *
 * 复刻图1 右下：4-5 行事件条，每条含时间戳 + 内容 + 标签 / 头像。
 * 数据接 RenderEngine.subscribeSpeech + subscribeThought：每条 speech /
 * thought 进入 buffer（按时间倒序，最近 12 条）；mock-town timeline 启动
 * 后即可看到事件持续流入，Slice 1 观感比 13.4 单纯对话流更"产品化"。
 */

import { useEffect, useRef, useState } from 'react'

import { resolveMascotTypeFromCharId } from '@/render/MockTimelineDriver'
import type { RenderEngine, SpeechEvent, ThoughtEvent } from '@/render/RenderEngine'

const BUFFER_LIMIT = 12

interface EventEntry {
  key: string
  ts: number
  charId: string
  /** "speech" / "thought" / "system" */
  kind: 'speech' | 'thought' | 'system'
  /** 主文本：speech text 或 thought.observation */
  text: string
  /** 副标签 / 标签色：根据 kind / next_action.kind 决定 */
  tag: string
  tagColor: string
}

const KIND_TAG_COLOR: Record<string, string> = {
  speech: '#B6FF6F',
  move: '#7AE7FF',
  tool: '#FF6FB7',
  speak: '#B6FF6F',
  idle: 'rgba(245, 245, 247, 0.55)',
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function shortChar(charId: string): string {
  const m = resolveMascotTypeFromCharId(charId)
  if (!m) return charId
  // 把 mascot_type 映射到中文短名
  const mapping: Record<string, string> = {
    cat_lore: '考据猫',
    dog_social: '扩列犬',
    hamster_hoard: '囤囤鼠',
    fox_create: '太太狐',
    slime_newbie: '云仔',
    wolf_limited: '限定狼',
    pigeon_buzz: '咕咕鸽',
  }
  return mapping[m] ?? m
}

export interface EventFeedProps {
  engine: RenderEngine
}

export function EventFeed({ engine }: EventFeedProps): JSX.Element {
  const bufferRef = useRef<EventEntry[]>([])
  const [, forceTick] = useState(0)
  const tick = () => forceTick((n) => (n + 1) | 0)

  useEffect(() => {
    const onSpeech = (event: SpeechEvent): void => {
      const entry: EventEntry = {
        key: `s:${event.charId}:${event.ts}`,
        ts: event.ts,
        charId: event.charId,
        kind: 'speech',
        text: event.text,
        tag: '说话',
        tagColor: KIND_TAG_COLOR.speech!,
      }
      const next = [entry, ...bufferRef.current]
      if (next.length > BUFFER_LIMIT) next.length = BUFFER_LIMIT
      bufferRef.current = next
      tick()
    }
    const onThought = (event: ThoughtEvent): void => {
      const kind = event.trace.next_action.kind
      const entry: EventEntry = {
        key: `t:${event.trace.trace_id}`,
        ts: event.ts,
        charId: event.charId,
        kind: 'thought',
        text: event.trace.observation,
        tag: kind === 'move' ? '移动' : kind === 'tool' ? '工具' : kind === 'speak' ? '社交' : '思考',
        tagColor: KIND_TAG_COLOR[kind] ?? KIND_TAG_COLOR.idle!,
      }
      const next = [entry, ...bufferRef.current]
      if (next.length > BUFFER_LIMIT) next.length = BUFFER_LIMIT
      bufferRef.current = next
      tick()
    }
    const u1 = engine.subscribeSpeech(onSpeech)
    const u2 = engine.subscribeThought(onThought)
    return () => {
      u1()
      u2()
    }
  }, [engine])

  const items = bufferRef.current

  return (
    <section
      aria-label="今日事件流"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 111, 183, 0.25)',
        background:
          'linear-gradient(180deg, rgba(15, 12, 35, 0.92) 0%, rgba(28, 14, 50, 0.92) 100%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FF8B6F',
              boxShadow: '0 0 6px rgba(255, 139, 111, 0.8)',
              animation: 'erciyuanLivePulse 1500ms ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            今日事件流
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'rgba(255, 255, 255, 0.55)',
          }}
        >
          LIVE
        </span>
      </header>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {items.length === 0 && (
          <li
            style={{
              fontSize: 11,
              color: 'rgba(245, 245, 247, 0.45)',
              padding: '12px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            等待 mock-town 90s 时间轴启动…
          </li>
        )}
        {items.map((e) => (
          <li
            key={e.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontFamily: 'monospace',
                color: 'rgba(245, 245, 247, 0.45)',
                minWidth: 46,
                paddingTop: 1,
              }}
            >
              {formatTime(e.ts)}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 11,
                lineHeight: 1.45,
                color: 'rgba(245, 245, 247, 0.85)',
                fontFamily: 'var(--font-pixel-zh, sans-serif)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={e.text}
            >
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{shortChar(e.charId)}</span>
              <span style={{ color: 'rgba(245, 245, 247, 0.55)', margin: '0 4px' }}>·</span>
              {e.text}
            </span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 3,
                fontSize: 9,
                fontFamily: 'var(--font-pixel-zh, sans-serif)',
                fontWeight: 600,
                color: e.tagColor,
                border: `1px solid ${e.tagColor}`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {e.tag}
            </span>
          </li>
        ))}
      </ul>
      <footer
        style={{
          fontSize: 10,
          color: 'rgba(245, 245, 247, 0.45)',
          textAlign: 'center',
          fontFamily: 'monospace',
          paddingTop: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        — 还有更多事件正在发生 —
      </footer>
    </section>
  )
}

export default EventFeed
