'use client'

/**
 * /trends — 热搜榜独立页
 *
 * 内容：
 *   - 顶部：今日热搜 TOP 5 LED 大屏（粉紫渐变 + 火焰 emoji + 涨跌幅）
 *   - 下半：3 tab 切换：阵营榜 / 角色榜 / 话题榜
 *   - 每行卡片可点击跳转到 /trends/<topic>（暂未实装，弹 toast 提示）
 */

import { useEffect, useState } from 'react'

import { SiteNav } from '../_components/SiteNav'

const HOT_TOP5 = [
  { rank: 1, label: '#春日同人祭#', score: '125.6w', change: '+15.2%', emoji: '🔥' },
  { rank: 2, label: '#夏羽生日会#', score: '98.2w', change: '+9.7%', emoji: '🎂' },
  { rank: 3, label: '#夜斗新装曝光#', score: '72.1w', change: '+5.3%', emoji: '⚡' },
  { rank: 4, label: '#应援打榜进行中#', score: '59.8w', change: '+2.1%', emoji: '💖' },
  { rank: 5, label: '#同人活动招募#', score: '42.3w', change: '-1.4%', emoji: '✨' },
]

const FACTION_RANKS = [
  { rank: 1, name: '星羽', members: '12,468', score: '1,256,170', growth: '+15.2%', color: '#FF6FB7' },
  { rank: 2, name: '霜月', members: '9,872', score: '982,410', growth: '+9.7%', color: '#7AE7FF' },
  { rank: 3, name: '琉璃', members: '7,654', score: '732,560', growth: '+5.3%', color: '#A78BFA' },
  { rank: 4, name: '夜斗', members: '6,210', score: '598,240', growth: '-1.4%', color: '#B388FF' },
]

const CHARACTER_RANKS = [
  { rank: 1, name: '考据猫·凛', faction: '琉璃', score: '124,680', growth: '+8.5%', color: '#A78BFA', mascot: 'cat_lore' },
  { rank: 2, name: '扩列犬·阿汪', faction: '星羽', score: '108,920', growth: '+12.3%', color: '#FFA864', mascot: 'dog_social' },
  { rank: 3, name: '太太狐·星澄', faction: '琉璃', score: '96,540', growth: '-2.0%', color: '#F0DCC8', mascot: 'fox_create' },
  { rank: 4, name: '咕咕鸽·麦', faction: '星羽', score: '85,210', growth: '+3.7%', color: '#FFC8DC', mascot: 'pigeon_buzz' },
  { rank: 5, name: '限定狼·夜', faction: '夜斗', score: '74,180', growth: '+11.0%', color: '#325082', mascot: 'wolf_limited' },
  { rank: 6, name: '囤囤鼠·豆豆', faction: '霜月', score: '62,500', growth: '+0.8%', color: '#D8C5A8', mascot: 'hamster_hoard' },
]

const TOPIC_RANKS = [
  { rank: 1, name: '#春日同人祭#', count: '12.3w 篇', growth: '+15.2%', color: '#FF8B6F' },
  { rank: 2, name: '#夏羽生日会#', count: '9.8w 篇', growth: '+4.5%', color: '#7AE7FF' },
  { rank: 3, name: '#次元小镇#', count: '8.6w 篇', growth: '+22.1%', color: '#FF6FB7' },
  { rank: 4, name: '#夜斗新装曝光#', count: '7.2w 篇', growth: '+1.2%', color: '#B388FF' },
  { rank: 5, name: '#应援打榜进行中#', count: '5.9w 篇', growth: '-0.8%', color: '#FFB86F' },
  { rank: 6, name: '#原神 × 崩铁联动梗#', count: '4.5w 篇', growth: '+18.0%', color: '#B6FF6F' },
]

type TabId = 'faction' | 'character' | 'topic'
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'faction', label: '阵营榜' },
  { id: 'character', label: '角色榜' },
  { id: 'topic', label: '话题榜' },
]

export default function TrendsPage(): JSX.Element {
  const [tab, setTab] = useState<TabId>('faction')
  const [marquee, setMarquee] = useState(0)

  // LED 大屏轮播 — 每 4 秒切换强调一行
  useEffect(() => {
    const id = setInterval(() => setMarquee((n) => (n + 1) % HOT_TOP5.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(255, 111, 111, 0.10) 0%, rgba(14, 16, 24, 1) 65%)',
        color: '#F5F5F7',
        fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SiteNav />

      <main
        style={{
          flex: 1,
          padding: 24,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* LED 大屏 */}
        <section
          style={{
            position: 'relative',
            padding: 24,
            background:
              'linear-gradient(135deg, rgba(40, 14, 70, 0.92) 0%, rgba(60, 20, 100, 0.92) 100%)',
            border: '1px solid rgba(179, 136, 255, 0.55)',
            borderRadius: 16,
            boxShadow:
              '0 12px 40px rgba(0, 0, 0, 0.55), inset 0 0 60px rgba(179, 136, 255, 0.18)',
            overflow: 'hidden',
          }}
        >
          {/* 扫描线效果 */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 3px)',
              pointerEvents: 'none',
            }}
          />
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#FF6F6F',
                boxShadow: '0 0 8px #FF6F6F',
                animation: 'trendsLivePulse 1.5s ease-in-out infinite',
              }}
            />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                background:
                  'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 50%, #B388FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              今日热搜 · TOP 5
            </h1>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'rgba(255, 200, 220, 0.65)',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.2em',
              }}
            >
              UPDATED · 10s ago
            </span>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HOT_TOP5.map((row, idx) => (
              <div
                key={row.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 36px 1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  background:
                    idx === marquee
                      ? 'linear-gradient(90deg, rgba(255, 111, 183, 0.22) 0%, transparent 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    idx === marquee
                      ? '1px solid rgba(255, 111, 183, 0.55)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  transition: 'all 320ms ease',
                }}
              >
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    fontSize: 18,
                    color:
                      row.rank === 1
                        ? '#FFC8DC'
                        : row.rank === 2
                        ? '#7AE7FF'
                        : row.rank === 3
                        ? '#FFB86F'
                        : 'rgba(255, 255, 255, 0.65)',
                    textShadow: row.rank <= 3 ? `0 0 8px currentColor` : 'none',
                  }}
                >
                  {row.rank}
                </span>
                <span style={{ fontSize: 22 }}>{row.emoji}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{row.label}</span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                >
                  {row.score}
                </span>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700,
                    color: row.change.startsWith('-') ? '#FF6F6F' : '#B6FF6F',
                    fontSize: 13,
                    minWidth: 60,
                    textAlign: 'right',
                  }}
                >
                  {row.change}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 tab 切换 */}
        <section>
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background:
                    tab === t.id
                      ? 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                  color: tab === t.id ? '#FFFFFF' : 'rgba(245, 245, 247, 0.75)',
                  fontFamily: 'inherit',
                  boxShadow: tab === t.id ? '0 4px 12px rgba(255, 111, 183, 0.45)' : 'none',
                  transition: 'all 160ms',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 12, 32, 0.88) 0%, rgba(35, 18, 60, 0.88) 100%)',
              border: '1px solid rgba(255, 111, 183, 0.20)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {tab === 'faction' &&
              FACTION_RANKS.map((row) => (
                <RankRow
                  key={row.name}
                  rank={row.rank}
                  title={row.name}
                  subtitle={`${row.members} 名居民`}
                  score={row.score}
                  growth={row.growth}
                  color={row.color}
                />
              ))}
            {tab === 'character' &&
              CHARACTER_RANKS.map((row) => (
                <RankRow
                  key={row.name}
                  rank={row.rank}
                  avatar={`/assets/mascots/${row.mascot}/portrait_64.png`}
                  title={row.name}
                  subtitle={row.faction}
                  score={row.score}
                  growth={row.growth}
                  color={row.color}
                />
              ))}
            {tab === 'topic' &&
              TOPIC_RANKS.map((row) => (
                <RankRow
                  key={row.name}
                  rank={row.rank}
                  title={row.name}
                  subtitle={row.count}
                  score=""
                  growth={row.growth}
                  color={row.color}
                />
              ))}
          </div>
        </section>

        <style>{`
          @keyframes trendsLivePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%      { opacity: 0.5; transform: scale(0.85); }
          }
        `}</style>
      </main>
    </div>
  )
}

interface RankRowProps {
  rank: number
  avatar?: string
  title: string
  subtitle: string
  score: string
  growth: string
  color: string
}
function RankRow({ rank, avatar, title, subtitle, score, growth, color }: RankRowProps): JSX.Element {
  const isUp = !growth.startsWith('-')
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: avatar ? '32px 48px 1fr auto auto' : '32px 1fr auto auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          background:
            rank === 1
              ? 'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 100%)'
              : rank === 2
              ? 'linear-gradient(135deg, #B6FF6F 0%, #7AE7FF 100%)'
              : rank === 3
              ? 'linear-gradient(135deg, #FFB86F 0%, #FF6FB7 100%)'
              : 'rgba(255, 255, 255, 0.10)',
          color: '#FFFFFF',
        }}
      >
        {rank}
      </span>
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={48}
          height={48}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            background: 'rgba(255, 255, 255, 0.05)',
            imageRendering: 'pixelated',
          }}
        />
      )}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)', marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <span
        style={{
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          color: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        {score}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          color: isUp ? '#B6FF6F' : '#FF6F6F',
          minWidth: 60,
          textAlign: 'right',
        }}
      >
        {growth}
      </span>
    </div>
  )
}
