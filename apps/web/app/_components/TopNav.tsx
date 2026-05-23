'use client'

/**
 * TopNav — AniTown 全宽顶部导航栏（v2 — 计时器/票数 ticker 真正跳动）
 *
 * 复刻图1 顶部条：左 logo + 4 个 tab + 右侧 LIVE 时间 / 在线人数 / 票数 / 头像。
 * 与 v1 的差别：
 *   - LIVE 时间真实 setInterval 每秒跳动
 *   - 在线人数每 3 秒 ±2~10 抖动
 *   - 票数每 1.2 秒 +0~3 增长
 *   - 让"画面在动"的最低保证从一开始就成立
 */

import { useEffect, useState } from 'react'

const TABS = [
  { id: 'town', label: '小镇地图', active: true },
  { id: 'trends', label: '热搜榜', active: false },
  { id: 'doujin', label: '同人剧场', active: false },
  { id: 'agent', label: '我的Agent', active: false },
]

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function TopNav(): JSX.Element {
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(1246)
  const [votes, setVotes] = useState(8620)

  useEffect(() => {
    setNow(new Date())
    const t1 = setInterval(() => setNow(new Date()), 1000)
    const t2 = setInterval(() => {
      setOnline((v) => v + (Math.floor(Math.random() * 13) - 4))
    }, 3000)
    const t3 = setInterval(() => {
      setVotes((v) => v + Math.floor(Math.random() * 4))
    }, 1200)
    return () => {
      clearInterval(t1)
      clearInterval(t2)
      clearInterval(t3)
    }
  }, [])

  const timeStr = now
    ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
    : '--:--:--'

  return (
    <nav
      role="banner"
      aria-label="AniTown 顶部导航"
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 16px',
        background:
          'linear-gradient(90deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.92) 100%)',
        borderBottom: '1px solid rgba(255, 111, 183, 0.25)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}
    >
      {/* 左 logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background:
              'radial-gradient(circle, #FF6FB7 0%, #7AE7FF 60%, #B6FF6F 100%)',
            boxShadow: '0 0 12px rgba(255, 111, 183, 0.65)',
            animation: 'erciyuanLogoSpin 6s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: '#FFFFFF',
          }}
        >
          AniTown
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(245, 245, 247, 0.55)',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
            marginLeft: 4,
          }}
        >
          二次元智能体小镇
        </span>
      </div>

      {/* 中间 tabs */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.active}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              background: t.active
                ? 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)'
                : 'transparent',
              color: t.active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.7)',
              boxShadow: t.active ? '0 2px 8px rgba(255, 111, 183, 0.45)' : 'none',
              transition: 'all 160ms ease',
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 右侧 stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Pill
          dot="#FF6F6F"
          dotPulse
          label="LIVE 小镇时间"
          value={timeStr}
          color="#FF8B6F"
        />
        <Pill label="在线人数" value={online.toLocaleString()} color="#7AE7FF" />
        <Pill label="票数" value={votes.toLocaleString()} color="#B6FF6F" />
        <div
          aria-label="个人头像"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 100%)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
          }}
        />
      </div>

      <style>{`
        @keyframes erciyuanLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.85); }
        }
        @keyframes erciyuanLogoSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </nav>
  )
}

interface PillProps {
  label: string
  value: string
  color: string
  dot?: string
  dotPulse?: boolean
}
function Pill({ label, value, color, dot, dotPulse }: PillProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        fontSize: 11,
        fontFamily: '"JetBrains Mono", monospace',
        color: 'rgba(245, 245, 247, 0.85)',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: dot,
            boxShadow: `0 0 6px ${dot}cc`,
            animation: dotPulse ? 'erciyuanLivePulse 1500ms ease-in-out infinite' : undefined,
          }}
        />
      )}
      <span style={{ color: 'rgba(245, 245, 247, 0.55)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  )
}

export default TopNav
