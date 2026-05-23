'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_TABS: Array<{ label: string; href: string }> = [
  { label: '小镇地图', href: '/' },
  { label: '热搜榜', href: '/trends' },
  { label: '同人剧场', href: '/doujin' },
  { label: '我的Agent', href: '/agent' },
]

export function Header(): JSX.Element {
  const [time, setTime] = useState('--:--:--')
  const [online, setOnline] = useState(1246)
  const [inspiration, setInspiration] = useState(8620)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() ?? '/'

  useEffect(() => {
    setMounted(true)
    const tick = () => {
      const now = new Date()
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Simulate dynamic stats
  useEffect(() => {
    const id = setInterval(() => {
      setOnline((prev) => prev + Math.floor(Math.random() * 5 - 2))
      setInspiration((prev) => prev + Math.floor(Math.random() * 10 + 1))
    }, 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="anitown-header">
      {/* Logo */}
      <Link
        href="/"
        className="header-left"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <span className="header-logo-icon">🐾</span>
        <span className="header-logo-text">AniTown</span>
        <span className="header-logo-subtitle">二次元智能体小镇</span>
      </Link>

      {/* Nav Tabs */}
      <nav className="header-nav">
        {NAV_TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`header-tab ${active ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Right Stats */}
      <div className="header-right">
        <div className="header-stat live-stat">
          <span className="live-dot" />
          <span className="live-label">LIVE</span>
          <span className="stat-value" suppressHydrationWarning>小镇时间 {mounted ? time : '--:--:--'}</span>
        </div>
        <div className="header-stat">
          <span className="stat-icon">👥</span>
          <span className="stat-label">在线居民</span>
          <span className="stat-value" suppressHydrationWarning>{online.toLocaleString()}</span>
        </div>
        <div className="header-stat">
          <span className="stat-icon">✨</span>
          <span className="stat-label">灵感点</span>
          <span className="stat-value" suppressHydrationWarning>{inspiration.toLocaleString()}</span>
        </div>
        <Link
          href="/demo/scan"
          className="header-avatar"
          aria-label="扫码召唤 Agent"
          title="扫码召唤 Agent"
          style={{ textDecoration: 'none' }}
        >
          📷
        </Link>
      </div>
    </header>
  )
}
