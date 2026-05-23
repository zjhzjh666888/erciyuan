'use client'

import { useState, useCallback } from 'react'

const ACTIONS = [
  { icon: '🤖', label: '创建Agent', toast: '正在生成你的专属Agent...' },
  { icon: '📱', label: '扫码转生', toast: '请扫描二维码召唤Agent！' },
  { icon: '📢', label: '发布动态', toast: '动态已投递到次元广场！' },
  { icon: '💖', label: '应援打榜', toast: '为星羽阵营投票成功！厨力+5' },
  { icon: '🛒', label: '吃谷清单', toast: '今日限定已加入清单！' },
  { icon: '⚔️', label: '阵营频道', toast: '已进入阵营频道...' },
]

export function QuickActions(): JSX.Element {
  const [toast, setToast] = useState<string | null>(null)
  const [clickedIdx, setClickedIdx] = useState<number | null>(null)

  const handleClick = useCallback((idx: number) => {
    setClickedIdx(idx)
    setToast(ACTIONS[idx]!.toast)
    setTimeout(() => {
      setToast(null)
      setClickedIdx(null)
    }, 2000)
  }, [])

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <span className="quick-title">快捷操作</span>
        <span className="quick-arrow">›</span>
      </div>
      <div className="quick-grid">
        {ACTIONS.map((a, idx) => (
          <button
            key={a.label}
            className={`quick-btn ${clickedIdx === idx ? 'clicked' : ''}`}
            onClick={() => handleClick(idx)}
          >
            <span className="quick-icon">{a.icon}</span>
            <span className="quick-label">{a.label}</span>
          </button>
        ))}
      </div>
      {toast && (
        <div className="quick-toast">{toast}</div>
      )}
      <button className="quick-submit-btn" onClick={() => handleClick(2)}>我要投稿二创</button>
    </div>
  )
}
