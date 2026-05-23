'use client'

/**
 * SiteNav — 跨页通用顶部导航（不依赖 globals.css，全 inline style）
 *
 * 4 tab 全部是真实跳转：/ (小镇地图) /trends (热搜) /doujin (同人剧场)
 * /agent (我的 Agent)。配合 useEffect 时间 / 票数动态显示。
 *
 * 与 /` 主页 Header 组件不冲突：那个是 CC 在写产品壳的 `<Header>`；本组件
 * 仅给 /agent /trends /doujin /conventions /companions /zones/* 这些
 * 独立页面用。
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS: Array<{ href: string; label: string }> = [
  { href: '/', label: '小镇地图' },
  { href: '/trends', label: '热搜榜' },
  { href: '/doujin', label: '同人剧场' },
  { href: '/agent', label: '我的Agent' },
]

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

export function SiteNav(): JSX.Element {
  const pathname = usePathname() ?? '/'
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(1246)
  const [votes, setVotes] = useState(8620)

  useEffect(() => {
    setNow(new Date())
    const t1 = setInterval(() => setNow(new Date()), 1000)
    const t2 = setInterval(() => setOnline((v) => v + (Math.floor(Math.random() * 13) - 4)), 3000)
    const t3 = setInterval(() => setVotes((v) => v + Math.floor(Math.random() * 4)), 1200)
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
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        href="/"
        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
      >
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background:
              'radial-gradient(circle, #FF6FB7 0%, #7AE7FF 60%, #B6FF6F 100%)',
            boxShadow: '0 0 12px rgba(255, 111, 183, 0.65)',
            animation: 'navLogoSpin 6s linear infinite',
          }}
        />
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
          }}
        >
          AniTown
        </span>
        <span
          style={{
            fontSize: 12,
            color: 'rgba(245, 245, 247, 0.55)',
            marginLeft: 4,
          }}
        >
          二次元智能体小镇
        </span>
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {TABS.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: active
                  ? 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)'
                  : 'transparent',
                color: active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.7)',
                boxShadow: active ? '0 2px 8px rgba(255, 111, 183, 0.45)' : 'none',
                transition: 'all 160ms ease',
              }}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Pill dot="#FF6F6F" label="LIVE 时间" value={timeStr} color="#FF8B6F" />
        <Pill label="在线" value={online.toLocaleString()} color="#7AE7FF" />
        <Pill label="票数" value={votes.toLocaleString()} color="#B6FF6F" />
        <Link
          href="/demo/scan"
          aria-label="扫码召唤 Agent"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid rgba(255, 111, 183, 0.65)',
            background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(255, 111, 183, 0.45)',
          }}
        >
          📷 扫码召唤
        </Link>
      </div>

      <style>{`
        @keyframes navLogoSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes navLivePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
      `}</style>
    </nav>
  )
}

interface PillProps {
  label: string
  value: string
  color: string
  dot?: string
}
function Pill({ label, value, color, dot }: PillProps): JSX.Element {
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
            animation: 'navLivePulse 1500ms ease-in-out infinite',
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

export default SiteNav
