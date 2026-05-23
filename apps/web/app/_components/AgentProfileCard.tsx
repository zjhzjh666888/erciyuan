'use client'

import { useEffect, useState, useRef } from 'react'
import { getMascotProfile } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'
import type { RenderEngine, SpeechEvent } from '@/render/RenderEngine'

const AGENT_TABS = ['记忆', '计划', '社交', '二创'] as const

const EQUIPMENT = [
  { icon: '🖊️', name: '创作之笔', stat: '+15', color: '#A78BFA' },
  { icon: '📱', name: '限定手机', stat: '+12', color: '#7AE7FF' },
  { icon: '💖', name: '应援徽章', stat: '+9', color: '#FF6FB7' },
  { icon: '🎒', name: '谷子包', stat: '+6', color: '#B6FF6F' },
]

const EFFECT_PHRASES = ['厨力+1', '人气+2', '热度+1', '灵感+3', '社交+1']
const OBSESSIONS = ['为星羽打榜！', '今天一定要抢到限定！', '找搭子去漫展！', '给本命画同人！', '安利成功10个人！']

interface AgentProfileCardProps {
  mascotType?: MascotType
  engine?: RenderEngine
}

export function AgentProfileCard({ mascotType = 'dog_social', engine }: AgentProfileCardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('记忆')

  // 真数据来自 mock-town
  const profile = getMascotProfile(mascotType)

  // 动态状态 — 随事件变化
  const [powerLevel, setPowerLevel] = useState(72)
  const [energy, setEnergy] = useState(85)
  const [mood, setMood] = useState(90)
  const [obsession, setObsession] = useState(OBSESSIONS[0]!)
  const [recentActions, setRecentActions] = useState<string[]>([])
  const actionCountRef = useRef(0)

  // 订阅 engine 的 speech 事件，每次事件让数值微变（模拟活跃度）
  useEffect(() => {
    if (!engine) return
    const handler = (ev: SpeechEvent) => {
      actionCountRef.current++
      const count = actionCountRef.current

      // 厨力值缓慢上升（封顶100）
      setPowerLevel((p) => Math.min(100, p + (count % 3 === 0 ? 1 : 0)))
      // 能量缓慢下降（最低20）
      setEnergy((e) => Math.max(20, e - (count % 5 === 0 ? 1 : 0)))
      // 心情小幅波动
      setMood((m) => Math.min(100, Math.max(50, m + (Math.random() > 0.5 ? 1 : -1))))

      // 每10次事件换一次执念
      if (count % 10 === 0) {
        setObsession(OBSESSIONS[Math.floor(Math.random() * OBSESSIONS.length)]!)
      }

      // 记录最近动作
      setRecentActions((prev) => {
        const action = ev.text.length > 30 ? ev.text.slice(0, 30) + '…' : ev.text
        return [action, ...prev].slice(0, 5)
      })
    }
    return engine.subscribeSpeech(handler)
  }, [engine])

  // 动态时间轴 — 每3s自动微调数值（即使没有事件也要"呼吸"）
  useEffect(() => {
    const id = setInterval(() => {
      setEnergy((e) => Math.max(20, e - 1))
      setMood((m) => {
        const delta = Math.random() > 0.7 ? -1 : 1
        return Math.min(100, Math.max(50, m + delta))
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const moodEmoji = mood > 80 ? '😊' : mood > 60 ? '😐' : '😰'

  return (
    <div className="agent-profile-card">
      {/* Header */}
      <div className="agent-card-header">
        <span className="agent-title">我的Agent</span>
        <span className="agent-heart">💜</span>
      </div>

      {/* Portrait */}
      <div className="agent-portrait-wrap">
        <img
          src="/assets/doujin/c1c2bf4888c06e7ed7e1d62b542027e9.png"
          alt={profile.display_name_zh}
          className="agent-portrait"
        />
      </div>

      {/* Name — 来自真实 mascot profile */}
      <div className="agent-name-row">
        <span className="agent-name">{profile.display_name_zh.split(' ')[0]}</span>
        <span className="agent-name-en">{profile.display_name_romaji}</span>
        <span className="agent-edit-icon">✏️</span>
      </div>
      <div className="agent-meta">
        <span className="agent-meta-label">类型：</span>
        <span className="agent-meta-value">{profile.core_traits[0]}</span>
      </div>
      <div className="agent-meta">
        <span className="agent-meta-label">性格：</span>
        <span className="agent-meta-tag">{profile.core_traits[1]}</span>
      </div>

      {/* Power Level — 动态 */}
      <div className="agent-stat-row">
        <span className="agent-stat-label">厨力值：💖</span>
        <div className="agent-progress-bar">
          <div
            className="agent-progress-fill pink"
            style={{ width: `${powerLevel}%` }}
          />
        </div>
        <span className="agent-stat-num">{powerLevel}/100</span>
      </div>

      {/* Faction & Obsession — 动态切换 */}
      <div className="agent-meta">
        <span className="agent-meta-label">本命阵营：</span>
        <span className="agent-meta-value">{profile.recommended_zone.replace('_', ' ')}</span>
      </div>
      <div className="agent-meta">
        <span className="agent-meta-label">今日执念：</span>
        <span className="agent-meta-highlight">{obsession}</span>
      </div>

      {/* Tabs */}
      <div className="agent-tabs">
        {AGENT_TABS.map((tab) => (
          <button
            key={tab}
            className={`agent-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content — 记忆 tab 显示最近动作 */}
      {activeTab === '记忆' && recentActions.length > 0 && (
        <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.65)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentActions.map((a, i) => (
            <span key={i} style={{ opacity: 1 - i * 0.15 }}>• {a}</span>
          ))}
        </div>
      )}
      {activeTab === '计划' && (
        <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.65)' }}>
          <span>📌 {obsession}</span><br />
          <span style={{ color: '#7AE7FF' }}>→ 前往 {profile.recommended_zone.replace('_', ' ')}</span>
        </div>
      )}
      {activeTab === '社交' && (
        <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.65)' }}>
          <span>💬 口头禅：「{profile.catchphrase.zh}」</span>
        </div>
      )}

      {/* CTA Button */}
      <button className="agent-cta">
        <span className="cta-icon">📱</span>
        扫码转生 / 召唤我的Agent
      </button>
      <p className="agent-cta-hint">扫描二维码，让你的角色降临小镇 ℹ️</p>

      {/* Equipment */}
      <div className="agent-section-title">我的装备</div>
      <div className="agent-equipment">
        {EQUIPMENT.map((eq) => (
          <div key={eq.name} className="equipment-slot" style={{ borderColor: eq.color }}>
            <span className="equipment-icon">{eq.icon}</span>
            <span className="equipment-stat">{eq.stat}</span>
          </div>
        ))}
      </div>

      {/* Status Bars — 动态 */}
      <div className="agent-status-bars">
        <div className="status-bar-row">
          <span className="status-icon">⚡</span>
          <span className="status-label">能量</span>
          <div className="agent-progress-bar">
            <div
              className="agent-progress-fill blue"
              style={{ width: `${energy}%` }}
            />
          </div>
          <span className="agent-stat-num">{energy}/100</span>
        </div>
        <div className="status-bar-row">
          <span className="status-icon">{moodEmoji}</span>
          <span className="status-label">心情</span>
          <div className="agent-progress-bar">
            <div
              className="agent-progress-fill green"
              style={{ width: `${mood}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
