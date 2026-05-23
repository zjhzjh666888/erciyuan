'use client'

/**
 * DoujinTheater — 主页底部"同人小剧场"
 *
 * 数据契约：mock-town `doujins`（task 9.7），每条 `Doujin`：
 *   - kind: 'comic_4koma' → payload.panels: DoujinPanel[]（≤ 4）
 *   - kind: 'novel_short' → payload.text: string（≤ 400）
 *
 * 没有 `title` / 顶层 `panels` 字段。这里把每条 Doujin 标题用「角色 1 × 角色 2」
 * 占位拼接（characters 取前两个 character_id 截取后段做显示）。
 */

import { useEffect, useState } from 'react'
import { doujins } from '@erciyuan/mock-town'
import type { Doujin, DoujinPanel } from '@erciyuan/types'

const STORY_THEMES = ['相遇', '同行', '党争', '二创'] as const
const THEME_COLORS = ['#FF6FB7', '#7AE7FF', '#B6FF6F', '#A78BFA']

// 素材图片用于故事卡片背景
const STORY_IMAGES = [
  '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg',
  '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg',
  '/assets/doujin/08e60b159e820a1e652cb968bd6477b4.png',
  '/assets/doujin/3323ef486e62e1df4a774064f2233205.png',
]

function getPanels(d: Doujin): DoujinPanel[] {
  return d.payload.kind === 'comic_4koma' ? d.payload.panels : []
}

function getDisplayTitle(d: Doujin): string {
  // characters 形如 'char_genshin_zhongli'，取最后一段做显示
  const labels = d.characters.slice(0, 2).map((id) => {
    const tail = id.split('_').slice(2).join('_') || id
    return tail
  })
  return labels.length >= 2 ? `${labels[0]} × ${labels[1]}` : labels[0] ?? d.doujin_id
}

function getFirstCaption(d: Doujin): string {
  const panels = getPanels(d)
  if (panels[0]) return panels[0].caption
  if (d.payload.kind === 'novel_short') return d.payload.text.slice(0, 24) + '…'
  return d.doujin_id
}

const STORIES = doujins.slice(0, 4).map((d, i) => ({
  num: i + 1,
  themeLabel: STORY_THEMES[i] ?? '番外',
  title: getDisplayTitle(d),
  caption: getFirstCaption(d),
  panels: getPanels(d),
}))

const HOT_DOUJINS = doujins.slice(0, 3).map((d, i) => ({
  rank: i + 1,
  title: getDisplayTitle(d),
  views: `${(((i * 37) % 10) + 2.4).toFixed(1)}w`,
}))

export function DoujinTheater(): JSX.Element {
  // 自动切换展示的 panel（每3秒切下一格，模拟"AI在生成"）
  const [activePanelIdx, setActivePanelIdx] = useState(0)
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setActivePanelIdx((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  // 模拟"AI正在生成"动画
  useEffect(() => {
    const id = setInterval(() => {
      setGeneratingIdx(Math.floor(Math.random() * 4))
      setTimeout(() => setGeneratingIdx(null), 1500)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="doujin-theater">
      {/* Left: Story Cards */}
      <div className="doujin-left">
        <div className="doujin-header">
          <span className="doujin-title">同人小剧场（AI自动生成）✨</span>
          <span className="doujin-more">本月热门二创 &gt;</span>
        </div>
        <div className="doujin-stories">
          {STORIES.map((s, idx) => {
            const showPanel = s.panels.length > 0
              ? s.panels[activePanelIdx % s.panels.length]?.caption
              : s.caption
            const panelImage = s.panels.length > 0
              ? s.panels[activePanelIdx % s.panels.length]?.image_url
              : undefined
            return (
              <div
                key={s.num}
                className="story-card"
                style={{
                  borderColor: generatingIdx === idx ? THEME_COLORS[idx] : undefined,
                  boxShadow:
                    generatingIdx === idx
                      ? `0 0 12px ${THEME_COLORS[idx]}44`
                      : undefined,
                }}
              >
                <div className="story-badge">{s.num}</div>
                <div className="story-title" style={{ color: THEME_COLORS[idx] }}>
                  {s.themeLabel}
                </div>
                <div className="story-image">
                  {/* 优先使用 panel 图，fallback 到素材 */}
                  <img
                    src={panelImage || STORY_IMAGES[idx] || ''}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 6,
                    }}
                  />
                  {generatingIdx === idx && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: 6,
                        fontSize: 10,
                        color: '#7AE7FF',
                        animation: 'erciyuanLivePulse 1200ms infinite',
                      }}
                    >
                      AI 生成中...
                    </div>
                  )}
                  <div className="story-dialog">&ldquo;{showPanel}&rdquo;</div>
                </div>
                <p className="story-caption">{s.title}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Hot Rankings + CTA */}
      <div className="doujin-right">
        <div className="doujin-hot-list">
          {HOT_DOUJINS.map((d) => (
            <div key={d.rank} className="hot-doujin-row">
              <span className="hot-rank">{d.rank}</span>
              <span className="hot-title">{d.title}</span>
              <span className="hot-views">🔥 {d.views}</span>
            </div>
          ))}
        </div>
        <button className="doujin-submit-btn">我要投稿二创</button>
      </div>
    </div>
  )
}
