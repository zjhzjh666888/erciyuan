'use client'

import { useEffect, useRef, useState } from 'react'
import type { RenderEngine, SpeechEvent } from '@/render/RenderEngine'

interface EventEntry {
  id: string
  time: string
  character: string
  charColor: string
  action: string
  effect: string
  effectColor: string
}

const EFFECT_POOL = [
  { text: '厨力+8', color: '#FF6FB7' },
  { text: '人气+12', color: '#7AE7FF' },
  { text: '热度+5', color: '#B6FF6F' },
  { text: '灵感+3', color: '#A78BFA' },
  { text: '社交+2', color: '#FFA864' },
  { text: '活跃+1', color: '#7AE7FF' },
]

const CHAR_COLORS = ['#FF6FB7', '#7AE7FF', '#A78BFA', '#B6FF6F', '#FFA864']

const INITIAL_EVENTS: EventEntry[] = [
  { id: 'e1', time: '12:43', character: '铃音', charColor: '#FF6FB7', action: '在 谷子店 抢到限定徽章！', effect: '厨力+8', effectColor: '#FF6FB7' },
  { id: 'e2', time: '12:41', character: '霜野', charColor: '#7AE7FF', action: '在 次元广场 向路人安利成功，获得3个新粉丝！', effect: '人气+12', effectColor: '#7AE7FF' },
  { id: 'e3', time: '12:37', character: '琉璃阵营', charColor: '#A78BFA', action: '发布新同人图集，阵营热度 +12！', effect: '热度+12', effectColor: '#B6FF6F' },
]

interface EventStreamProps {
  engine?: RenderEngine
}

export function EventStream({ engine }: EventStreamProps): JSX.Element {
  const [events, setEvents] = useState<EventEntry[]>(INITIAL_EVENTS)
  const scrollRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef(4)

  useEffect(() => {
    if (!engine) return
    const handler = (ev: SpeechEvent) => {
      const id = `live_${counterRef.current++}`
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const effect = EFFECT_POOL[counterRef.current % EFFECT_POOL.length]!
      const charColor = CHAR_COLORS[counterRef.current % CHAR_COLORS.length]!
      const charName = ev.charId.replace('mock_char_', '').replace(/_/g, ' ').split(' ')[0] ?? '未知'
      const newEntry: EventEntry = {
        id,
        time,
        character: charName,
        charColor,
        action: ev.text.length > 25 ? ev.text.slice(0, 25) + '…' : ev.text,
        effect: effect.text,
        effectColor: effect.color,
      }
      setEvents((prev) => [newEntry, ...prev].slice(0, 20))
    }
    return engine.subscribeSpeech(handler)
  }, [engine])

  return (
    <div className="event-stream">
      <div className="event-stream-header">
        <span className="event-title">今日事件流</span>
        <span className="live-badge">
          <span className="live-dot red" />
          LIVE
        </span>
      </div>
      <div className="event-list" ref={scrollRef}>
        {events.map((ev) => (
          <div key={ev.id} className="event-row">
            <span className="event-time">{ev.time}</span>
            <span className="event-char" style={{ color: ev.charColor }}>{ev.character}</span>
            <span className="event-action">{ev.action}</span>
            <span className="event-effect" style={{ background: ev.effectColor + '22', color: ev.effectColor, border: `1px solid ${ev.effectColor}44` }}>
              {ev.effect}
            </span>
          </div>
        ))}
      </div>
      <p className="event-footer">• 更多事件正在发生..</p>
    </div>
  )
}
