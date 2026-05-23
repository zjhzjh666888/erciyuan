'use client'

import { useEffect, useState } from 'react'
import { mascotProfiles } from '@erciyuan/mock-town'
import type { RenderEngine, SpeechEvent } from '@/render/RenderEngine'

const TABS = ['阵营榜', '角色榜', '话题榜'] as const

interface RankEntry {
  rank: number
  name: string
  avatar: string
  score: number
  growth: number
  color: string
}

// 从真实 mascot profiles 构建初始排名
const INITIAL_RANKINGS: RankEntry[] = [
  { rank: 1, name: '星羽阵营', avatar: '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg', score: 1256780, growth: 15.2, color: '#FF6FB7' },
  { rank: 2, name: '霜月阵营', avatar: '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg', score: 982410, growth: 9.7, color: '#7AE7FF' },
  { rank: 3, name: '琉璃阵营', avatar: '/assets/doujin/08e60b159e820a1e652cb968bd6477b4.png', score: 732560, growth: 5.3, color: '#A78BFA' },
  { rank: 4, name: '夜斗阵营', avatar: '/assets/doujin/3323ef486e62e1df4a774064f2233205.png', score: 598240, growth: 2.1, color: '#B6FF6F' },
]

interface RankingPanelProps {
  engine?: RenderEngine
}

export function RankingPanel({ engine }: RankingPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('阵营榜')
  const [rankings, setRankings] = useState<RankEntry[]>(INITIAL_RANKINGS)

  // 每隔5秒分数微涨（模拟实时人气变化）
  useEffect(() => {
    const id = setInterval(() => {
      setRankings((prev) =>
        prev.map((entry) => ({
          ...entry,
          score: entry.score + Math.floor(Math.random() * 200 + 50),
          growth: +(entry.growth + (Math.random() * 0.3 - 0.1)).toFixed(1),
        }))
      )
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // 订阅 engine speech 事件 — 有事件时第一名额外加分（模拟"最活跃阵营"）
  useEffect(() => {
    if (!engine) return
    const handler = (_ev: SpeechEvent) => {
      setRankings((prev) => {
        const copy = [...prev]
        const idx = Math.floor(Math.random() * copy.length)
        copy[idx] = { ...copy[idx]!, score: copy[idx]!.score + Math.floor(Math.random() * 500 + 100) }
        return copy
      })
    }
    return engine.subscribeSpeech(handler)
  }, [engine])

  const maxScore = Math.max(...rankings.map((r) => r.score))

  return (
    <div className="ranking-panel">
      {/* Header */}
      <div className="ranking-header">
        <span className="ranking-title">角色人气榜 / 小镇热搜</span>
        <span className="ranking-badge">🏆</span>
      </div>

      {/* Tabs */}
      <div className="ranking-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`ranking-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="ranking-list">
        {rankings.map((entry) => (
          <div key={entry.rank} className="ranking-entry">
            <span className={`rank-number rank-${entry.rank}`}>{entry.rank}</span>
            <img
              src={entry.avatar}
              alt={entry.name}
              className="rank-avatar"
            />
            <div className="rank-info">
              <div className="rank-name-row">
                <span className="rank-name">{entry.name}</span>
                <span className="rank-score">{entry.score.toLocaleString()}</span>
              </div>
              <div className="rank-bar-row">
                <div className="rank-bar">
                  <div
                    className="rank-bar-fill"
                    style={{
                      width: `${(entry.score / maxScore) * 100}%`,
                      background: entry.color,
                    }}
                  />
                </div>
                <span className="rank-growth" style={{ color: entry.color }}>
                  +{entry.growth}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="ranking-footer">数据每10分钟更新一次</p>
    </div>
  )
}
