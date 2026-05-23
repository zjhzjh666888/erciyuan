'use client'

/**
 * /doujin — 同人剧场（Bilibili 布局重设计）
 *
 * 视觉骨架抄 B 站视频详情页：
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  SiteNav（顶部全局导航）                                          │
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │  分区栏（番剧 / 国创 / 同人 / 鬼畜 / 音乐 / 二创 ...）            │
 *   ├──────────────────────────────────┬───────────────────────────────┤
 *   │                                  │  📋 播放列表（6 集）          │
 *   │   🎬 主播放器                    │   ┌──────────┬─────────────┐ │
 *   │   <video controls autoplay>      │   │  缩略图  │ P01 标题    │ │
 *   │   弹幕条 / 进度 / 三连           │   │  [当前]  │ UP / 时长   │ │
 *   │                                  │   └──────────┴─────────────┘ │
 *   │   标题 + 元信息 + 简介 + 三连     │   ...                         │
 *   ├──────────────────────────────────┴───────────────────────────────┤
 *   │  📚 4 格漫画作品 (2x2 grid)                                       │
 *   │  📖 短篇小说大卡                                                  │
 *   │  🏆 月度热门 TOP 5 榜                                             │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * 视频源：仓库 `视频/` 目录下 6 个 mp4，已 copy 到 `apps/web/public/videos/`，
 * 浏览器直接 fetch `/videos/<hash>.mp4`。
 */

import { useEffect, useMemo, useRef, useState } from 'react'

import { mockTown } from '@erciyuan/mock-town'
import type { Doujin } from '@erciyuan/mock-town'

import { SiteNav } from '../_components/SiteNav'

// ─── 视频清单（与 public/videos/ 文件名一一对应） ─────────────────────────
interface VideoItem {
  id: string
  src: string
  title: string
  upName: string
  upAvatar: string
  duration: string
  views: string
  danmaku: number
  publishedAt: string
  cover: string
  tag: string
  tagColor: string
  description: string
  /** 1280x544 / 720x1280 这类原始尺寸，决定播放器是否切到 9:16 模式 */
  ratio: '16:9' | '9:16' | '4:3'
}

/**
 * 6 个视频的真实信息：
 *   - duration / 分辨率均来自 ffprobe（来源 B 站下载，metadata 中
 *     description=Packed by Bilibili XCoder v2.0.2，没有原始 title）
 *   - 标题、UP 主、IP 等需要 **看过视频内容** 才能填，目前先用中性占位
 *     "AniTown 居民投稿 #N"，避免再次乱编。等真实内容补齐后回填这张表即可。
 */
const VIDEOS: VideoItem[] = [
  {
    id: 'v01',
    src: '/videos/0fbf9104a8020ef048b29060a950dee9.mp4',
    title: 'AniTown 居民投稿 · 第 01 集',
    upName: '小镇居民 #01',
    upAvatar: '/assets/mascots/cat_lore/portrait_64.png',
    duration: '00:40',
    views: '125.6w',
    danmaku: 8420,
    publishedAt: '今日 12:05',
    cover:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=540&h=304&fit=crop',
    tag: '投稿',
    tagColor: '#FF6FB7',
    description: '内容由小镇居民投稿。1280×544 横屏 · 25 fps · 时长 40 秒。详细信息待补充。',
    ratio: '16:9',
  },
  {
    id: 'v02',
    src: '/videos/1e7f804cc0315c1e09bd1564edd08288.mp4',
    title: 'AniTown 居民投稿 · 第 02 集',
    upName: '小镇居民 #02',
    upAvatar: '/assets/mascots/pigeon_buzz/portrait_64.png',
    duration: '01:34',
    views: '98.2w',
    danmaku: 12035,
    publishedAt: '今日 11:30',
    cover:
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=540&h=304&fit=crop',
    tag: '投稿',
    tagColor: '#7AE7FF',
    description: '内容由小镇居民投稿。1280×960 · 24 fps · 时长 1 分 34 秒。详细信息待补充。',
    ratio: '4:3',
  },
  {
    id: 'v03',
    src: '/videos/4a943e18035c5ab413bd0eb4ef28d72f.mp4',
    title: 'AniTown 居民投稿 · 第 03 集',
    upName: '小镇居民 #03',
    upAvatar: '/assets/mascots/dog_social/portrait_64.png',
    duration: '00:43',
    views: '72.1w',
    danmaku: 4280,
    publishedAt: '昨日 18:42',
    cover:
      'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=540&h=304&fit=crop',
    tag: '投稿',
    tagColor: '#FFB86F',
    description: '内容由小镇居民投稿。1280×544 横屏 · 24 fps · 时长 43 秒。详细信息待补充。',
    ratio: '16:9',
  },
  {
    id: 'v04',
    src: '/videos/97f3df8df105170434ca00ecae2e014a.mp4',
    title: 'AniTown 居民投稿 · 第 04 集',
    upName: '小镇居民 #04',
    upAvatar: '/assets/mascots/wolf_limited/portrait_64.png',
    duration: '01:24',
    views: '59.8w',
    danmaku: 2987,
    publishedAt: '昨日 22:15',
    cover:
      'https://images.unsplash.com/photo-1606503153255-59d8b8b82176?w=540&h=304&fit=crop',
    tag: '投稿',
    tagColor: '#A78BFA',
    description: '内容由小镇居民投稿。1280×720 横屏 · 24 fps · 时长 1 分 24 秒。详细信息待补充。',
    ratio: '16:9',
  },
  {
    id: 'v05',
    src: '/videos/e872871af0edaf7dfad3f677aa617a9f.mp4',
    title: 'AniTown 居民投稿 · 第 05 集（竖屏）',
    upName: '小镇居民 #05',
    upAvatar: '/assets/mascots/fox_create/portrait_64.png',
    duration: '01:00',
    views: '42.3w',
    danmaku: 1840,
    publishedAt: '前日 20:10',
    cover:
      'https://images.unsplash.com/photo-1542596594-649edbc13630?w=540&h=304&fit=crop',
    tag: '投稿 · 竖屏',
    tagColor: '#F0DCC8',
    description: '内容由小镇居民投稿。720×1280 竖屏 · 24 fps · 时长 1 分。详细信息待补充。',
    ratio: '9:16',
  },
  {
    id: 'v06',
    src: '/videos/f85b5d881d80ef270776384b4b6f3bd6.mp4',
    title: 'AniTown 居民投稿 · 第 06 集',
    upName: '小镇居民 #06',
    upAvatar: '/assets/mascots/cat_lore/portrait_64.png',
    duration: '00:46',
    views: '38.7w',
    danmaku: 5612,
    publishedAt: '前日 14:48',
    cover:
      'https://images.unsplash.com/photo-1531956531700-dc0ee0f1f9a5?w=540&h=304&fit=crop',
    tag: '投稿',
    tagColor: '#B388FF',
    description: '内容由小镇居民投稿。1280×544 横屏 · 24 fps · 时长 46 秒。详细信息待补充。',
    ratio: '16:9',
  },
]

// ─── 顶部分区栏 ──────────────────────────────────────────────────────────
const CHANNELS: Array<{ label: string; emoji: string; active?: boolean }> = [
  { label: '番剧', emoji: '📺' },
  { label: '国创', emoji: '🇨🇳' },
  { label: '同人', emoji: '🎨', active: true },
  { label: '鬼畜', emoji: '🎭' },
  { label: '音乐', emoji: '🎵' },
  { label: 'Cos', emoji: '🪩' },
  { label: '漫展', emoji: '🎪' },
  { label: '谷子', emoji: '🛍️' },
  { label: '解说', emoji: '🔍' },
]

// ─── 月度 TOP 5（保留旧数据） ────────────────────────────────────────────
interface RankItem {
  rank: number
  title: string
  collects: string
  color: string
}
const MONTHLY_TOP5: RankItem[] = [
  { rank: 1, title: '钟离 × 黄泉', collects: '12.5w 收藏', color: '#FF6FB7' },
  { rank: 2, title: '五条悟 × 伊地知', collects: '9.8w 收藏', color: '#7AE7FF' },
  { rank: 3, title: '葛饰北斋 × 阿尔托利亚', collects: '7.2w 收藏', color: '#FFB86F' },
  { rank: 4, title: '玛奇玛 × 阿丽塔', collects: '5.9w 收藏', color: '#B388FF' },
  { rank: 5, title: '芙莉莲短篇', collects: '4.2w 收藏', color: '#B6FF6F' },
]

// ─── 4 格漫画区颜色 ──────────────────────────────────────────────────────
const COMIC_ACCENTS = ['#FF6FB7', '#B388FF', '#7AE7FF', '#FFB86F']

function splitParagraphs(text: string): string[] {
  return text
    .split(/(?<=。|！|？)/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── 主页面 ──────────────────────────────────────────────────────────────
export default function DoujinPage(): JSX.Element {
  const [activeIdx, setActiveIdx] = useState(0)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [coined, setCoined] = useState(false)
  const [collected, setCollected] = useState(false)
  const [danmaku, setDanmaku] = useState('')
  const [danmakuList, setDanmakuList] = useState<string[]>([
    '前方高能！！',
    '考据猫又来了',
    '这个 AMV 节奏好顶',
    '老婆我来了',
    '这一段截下来当头像',
    '哈哈哈哈哈',
  ])
  const videoRef = useRef<HTMLVideoElement>(null)

  const all = mockTown.doujins
  const comics = all.filter(
    (d): d is Doujin & { payload: { kind: 'comic_4koma' } } => d.kind === 'comic_4koma',
  )
  const novel = all.find(
    (d): d is Doujin & { payload: { kind: 'novel_short' } } => d.kind === 'novel_short',
  )

  const active = useMemo(() => VIDEOS[activeIdx]!, [activeIdx])

  // 切视频时强制 reload
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    v.muted = muted
    v.play().catch(() => {
      /* autoplay blocked, user must click */
    })
  }, [activeIdx, muted])

  // 弹幕轮播：每 4 秒在画面顶部飘过一条
  const [marqueeKey, setMarqueeKey] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMarqueeKey((k) => k + 1), 4200)
    return () => clearInterval(id)
  }, [])

  const submitDanmaku = (): void => {
    const trimmed = danmaku.trim()
    if (!trimmed) return
    setDanmakuList((list) => [trimmed, ...list].slice(0, 12))
    setDanmaku('')
    setMarqueeKey((k) => k + 1)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, rgba(14, 16, 24, 1) 0%, rgba(20, 12, 32, 1) 100%)',
        color: '#F5F5F7',
        fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SiteNav />

      {/* 分区栏 */}
      <div
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 50,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 24px',
          background:
            'linear-gradient(90deg, rgba(20, 12, 32, 0.96) 0%, rgba(35, 18, 60, 0.96) 100%)',
          borderBottom: '1px solid rgba(255, 111, 183, 0.18)',
          overflowX: 'auto',
          backdropFilter: 'blur(8px)',
        }}
      >
        {CHANNELS.map((c) => (
          <button
            key={c.label}
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              fontSize: 13,
              fontWeight: c.active ? 700 : 500,
              color: c.active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.65)',
              background: c.active
                ? 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)'
                : 'transparent',
              boxShadow: c.active ? '0 2px 8px rgba(255, 111, 183, 0.45)' : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <main
        style={{
          flex: 1,
          padding: '20px 24px 32px',
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ┌─ 主区：播放器 + 播放列表 ─┐ */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 320px',
            gap: 16,
          }}
        >
          {/* 左：播放器 */}
          <div
            style={{
              background: 'rgba(20, 12, 32, 0.85)',
              borderRadius: 12,
              border: '1px solid rgba(255, 111, 183, 0.20)',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
            }}
          >
            {/* 视频本体 */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio:
                  active.ratio === '9:16'
                    ? '16 / 9' /* 容器仍 16:9，竖屏视频在容器内居中、留黑边，更接近 B 站观感 */
                    : active.ratio === '4:3'
                    ? '4 / 3'
                    : '16 / 9',
                background: '#000',
              }}
            >
              <video
                key={active.id}
                ref={videoRef}
                src={active.src}
                poster={active.cover}
                controls
                autoPlay
                muted={muted}
                playsInline
                loop
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: active.ratio === '9:16' ? 'contain' : 'cover',
                  display: 'block',
                  background: '#000',
                }}
              />

              {/* 弹幕条（飘过最新一条） */}
              {danmakuList.length > 0 && (
                <div
                  key={marqueeKey}
                  style={{
                    position: 'absolute',
                    top: '15%',
                    right: 0,
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.85)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    animation: 'doujinDanmakuFly 8s linear forwards',
                    fontFamily: 'inherit',
                  }}
                >
                  {danmakuList[marqueeKey % danmakuList.length]}
                </div>
              )}

              {/* 顶部 tag */}
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: `${active.tagColor}cc`,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  pointerEvents: 'none',
                }}
              >
                {active.tag}
              </span>

              {/* 静音切换 */}
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  background: 'rgba(0, 0, 0, 0.55)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  fontFamily: 'inherit',
                }}
              >
                {muted ? '🔇 已静音' : '🔊 有声'}
              </button>
            </div>

            {/* 标题 + meta */}
            <div style={{ padding: '16px 20px 12px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.4,
                }}
              >
                {active.title}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 8,
                  fontSize: 12,
                  color: 'rgba(245, 245, 247, 0.65)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                <span>👁 {active.views}</span>
                <span>💬 {active.danmaku.toLocaleString()} 弹幕</span>
                <span>{active.publishedAt}</span>
                <span>P{String(activeIdx + 1).padStart(2, '0')} / {VIDEOS.length}</span>
              </div>
            </div>

            {/* UP 主条 + 三连 */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.upAvatar}
                alt={active.upName}
                width={40}
                height={40}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `2px solid ${active.tagColor}`,
                  background: 'rgba(255, 255, 255, 0.05)',
                  imageRendering: 'pixelated',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                  {active.upName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)' }}>
                  AniTown · UP 主
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiked((v) => !v)}
                style={triActionStyle(liked, '#FF6FB7')}
                aria-pressed={liked}
              >
                👍 {liked ? '已点赞' : '点赞'}
              </button>
              <button
                type="button"
                onClick={() => setCoined((v) => !v)}
                style={triActionStyle(coined, '#FFB86F')}
                aria-pressed={coined}
              >
                🪙 {coined ? '已投币' : '投币'}
              </button>
              <button
                type="button"
                onClick={() => setCollected((v) => !v)}
                style={triActionStyle(collected, '#7AE7FF')}
                aria-pressed={collected}
              >
                ⭐ {collected ? '已收藏' : '收藏'}
              </button>
              <button type="button" style={triActionStyle(false, '#B388FF')}>
                📤 分享
              </button>
            </div>

            {/* 简介 */}
            <div
              style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: 13,
                color: 'rgba(245, 245, 247, 0.85)',
                lineHeight: 1.6,
              }}
            >
              {active.description}
            </div>

            {/* 弹幕输入 */}
            <div
              style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: 8,
              }}
            >
              <input
                type="text"
                placeholder="发个友善的弹幕呗~"
                value={danmaku}
                onChange={(e) => setDanmaku(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitDanmaku()
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={submitDanmaku}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(255, 111, 183, 0.40)',
                }}
              >
                发送
              </button>
            </div>
          </div>

          {/* 右：播放列表 */}
          <aside
            style={{
              background: 'rgba(20, 12, 32, 0.85)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 'calc(720px - 24px)',
              overflowY: 'auto',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '4px 4px 8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                📋 播放列表
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(245, 245, 247, 0.55)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                共 {VIDEOS.length} 集
              </span>
            </header>

            {VIDEOS.map((v, idx) => {
              const active = idx === activeIdx
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: 8,
                    padding: 6,
                    borderRadius: 8,
                    border: active
                      ? `1px solid ${v.tagColor}88`
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    background: active
                      ? `linear-gradient(135deg, ${v.tagColor}22 0%, transparent 100%)`
                      : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    color: '#FFFFFF',
                    boxShadow: active ? `0 0 12px ${v.tagColor}33` : 'none',
                    transition: 'all 160ms ease',
                  }}
                >
                  <div style={{ position: 'relative', width: 120, aspectRatio: '16 / 9' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.cover}
                      alt={v.title}
                      width={120}
                      height={68}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'block',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        padding: '1px 5px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        borderRadius: 2,
                        fontFamily: '"JetBrains Mono", monospace',
                      }}
                    >
                      {v.duration}
                    </span>
                    {active && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          padding: '1px 6px',
                          background: v.tagColor,
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 2,
                        }}
                      >
                        ▶ 播放中
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: active ? v.tagColor : 'rgba(245, 245, 247, 0.65)',
                        fontFamily: '"JetBrains Mono", monospace',
                        marginBottom: 2,
                      }}
                    >
                      P{String(idx + 1).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.85)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {v.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(245, 245, 247, 0.55)',
                        marginTop: 4,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span>{v.upName}</span>
                      <span>·</span>
                      <span>👁 {v.views}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </aside>
        </section>

        {/* 相关推荐网格 */}
        <section>
          <SectionTitle emoji="🎬" title="相关推荐" subtitle={`RELATED · ${VIDEOS.length} 个视频`} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {VIDEOS.map((v, idx) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx)
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                style={{
                  padding: 0,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  background: 'rgba(20, 12, 32, 0.85)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  fontFamily: 'inherit',
                  color: '#FFFFFF',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = `0 12px 24px rgba(0, 0, 0, 0.45), 0 0 16px ${v.tagColor}55`
                  e.currentTarget.style.borderColor = `${v.tagColor}88`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.cover}
                    alt={v.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      background: 'rgba(255, 255, 255, 0.05)',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      padding: '2px 6px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#FFFFFF',
                      fontSize: 11,
                      borderRadius: 3,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    {v.duration}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      padding: '2px 8px',
                      background: `${v.tagColor}cc`,
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 3,
                      letterSpacing: '0.08em',
                    }}
                  >
                    {v.tag}
                  </span>
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 36,
                    }}
                  >
                    {v.title}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: 'rgba(245, 245, 247, 0.65)',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    <span>{v.upName}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      gap: 10,
                      fontSize: 11,
                      color: 'rgba(245, 245, 247, 0.55)',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    <span>👁 {v.views}</span>
                    <span>💬 {v.danmaku.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 4 格漫画区（保留） */}
        <section>
          <SectionTitle
            emoji="📚"
            title="本月四格漫画"
            subtitle={`COMIC 4-KOMA · ${comics.length} 篇`}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {comics.map((d, idx) => (
              <ComicCard
                key={d.doujin_id}
                doujin={d}
                index={idx}
                accent={COMIC_ACCENTS[idx % COMIC_ACCENTS.length]!}
              />
            ))}
          </div>
        </section>

        {/* 短篇小说大卡（保留） */}
        {novel && (
          <section>
            <SectionTitle emoji="📖" title="本月精选短篇" subtitle="NOVEL SHORT · 1 篇" />
            <NovelCard doujin={novel} />
          </section>
        )}

        {/* 月度 TOP 5（保留） */}
        <section>
          <SectionTitle emoji="🏆" title="月度热门 TOP 5" subtitle="MONTHLY TOP" />
          <div
            style={{
              background:
                'linear-gradient(180deg, rgba(20, 12, 32, 0.88) 0%, rgba(35, 18, 60, 0.88) 100%)',
              border: '1px solid rgba(255, 111, 183, 0.25)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {MONTHLY_TOP5.map((row) => (
              <RankRow key={row.rank} item={row} />
            ))}
          </div>
        </section>
      </main>

      <style>{`
        @keyframes doujinDanmakuFly {
          0%   { transform: translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(-110vw); opacity: 0; }
        }
        @keyframes doujinCardFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}

// ─── 子组件 ──────────────────────────────────────────────────────────────

interface SectionTitleProps {
  emoji: string
  title: string
  subtitle: string
}
function SectionTitle({ emoji, title, subtitle }: SectionTitleProps): JSX.Element {
  return (
    <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
        {title}
      </h2>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.25em',
          color: 'rgba(245, 245, 247, 0.45)',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {subtitle}
      </span>
    </header>
  )
}

function triActionStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${active ? color : 'rgba(255, 255, 255, 0.18)'}`,
    background: active ? `${color}22` : 'rgba(255, 255, 255, 0.04)',
    color: active ? color : 'rgba(245, 245, 247, 0.85)',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 160ms ease',
    minWidth: 86,
  }
}

interface ComicCardProps {
  doujin: Doujin & { payload: { kind: 'comic_4koma' } }
  index: number
  accent: string
}
function ComicCard({ doujin, index, accent }: ComicCardProps): JSX.Element {
  const [hover, setHover] = useState(false)
  const panels =
    doujin.payload.kind === 'comic_4koma' ? doujin.payload.panels : []

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.88) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: `1px solid ${accent}55`,
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transform: hover ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hover
          ? `0 14px 32px rgba(0, 0, 0, 0.55), 0 0 24px ${accent}55`
          : '0 6px 18px rgba(0, 0, 0, 0.35)',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        cursor: 'pointer',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: accent,
            fontWeight: 700,
          }}
        >
          #{String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
          {doujin.characters.join(' × ')}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {panels.map((p, i) => (
          <figure
            key={i}
            style={{
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 6,
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${accent}33`,
              borderRadius: 10,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image_url}
              alt={p.caption}
              loading="lazy"
              width={240}
              height={240}
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                objectFit: 'cover',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'block',
              }}
            />
            <figcaption
              style={{
                fontSize: 12,
                color: 'rgba(245, 245, 247, 0.85)',
                lineHeight: 1.4,
                minHeight: 32,
              }}
            >
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: accent,
                  marginRight: 4,
                  fontWeight: 700,
                }}
              >
                ❲{i + 1}❳
              </span>
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'rgba(245, 245, 247, 0.55)',
          fontFamily: '"JetBrains Mono", monospace',
          paddingTop: 4,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span>{formatTime(doujin.created_at)}</span>
        <span style={{ color: `${accent}cc` }}>{doujin.watermark}</span>
      </footer>
    </article>
  )
}

interface NovelCardProps {
  doujin: Doujin & { payload: { kind: 'novel_short' } }
}
function NovelCard({ doujin }: NovelCardProps): JSX.Element {
  const text = doujin.payload.kind === 'novel_short' ? doujin.payload.text : ''
  const paragraphs = splitParagraphs(text)

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: '40% 60%',
        gap: 0,
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.88) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: '1px solid rgba(179, 136, 255, 0.35)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255, 184, 111, 0.35) 0%, rgba(40, 18, 70, 0.92) 70%)',
          borderRight: '1px solid rgba(179, 136, 255, 0.20)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: 280,
        }}
      >
        <div
          aria-hidden
          style={{
            fontSize: 96,
            lineHeight: 1,
            filter: 'drop-shadow(0 6px 16px rgba(255, 184, 111, 0.45))',
            animation: 'doujinCardFloat 3.6s ease-in-out infinite',
          }}
        >
          🍶
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFC8DC' }}>
          {doujin.characters.join(' × ')}
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            color: 'rgba(245, 245, 247, 0.55)',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          TAVERN · MIDNIGHT
        </div>
      </div>

      <div
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <header style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
            《酒馆夜谈》
          </h3>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(179, 136, 255, 0.18)',
              border: '1px solid rgba(179, 136, 255, 0.45)',
              color: '#B388FF',
              fontWeight: 700,
            }}
          >
            短篇
          </span>
        </header>
        <div
          style={{
            fontSize: 14,
            color: 'rgba(245, 245, 247, 0.92)',
            lineHeight: 1.8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0, textIndent: '2em' }}>
              {p}
            </p>
          ))}
        </div>
        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.55)',
            fontFamily: '"JetBrains Mono", monospace',
            paddingTop: 8,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span>{formatTime(doujin.created_at)}</span>
          <span style={{ color: '#FF6FB7' }}>💖 1,247</span>
          <span style={{ color: 'rgba(179, 136, 255, 0.85)' }}>{doujin.watermark}</span>
        </footer>
      </div>
    </article>
  )
}

function RankRow({ item }: { item: RankItem }): JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
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
            item.rank === 1
              ? 'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 100%)'
              : item.rank === 2
              ? 'linear-gradient(135deg, #B6FF6F 0%, #7AE7FF 100%)'
              : item.rank === 3
              ? 'linear-gradient(135deg, #FFB86F 0%, #FF6FB7 100%)'
              : 'rgba(255, 255, 255, 0.10)',
          color: '#FFFFFF',
        }}
      >
        {item.rank}
      </span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{item.title}</div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.55)',
            marginTop: 2,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          MONTHLY
        </div>
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          color: item.color,
          minWidth: 100,
          textAlign: 'right',
        }}
      >
        {item.collects}
      </span>
    </div>
  )
}
