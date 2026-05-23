'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { RenderEngine } from '@/render/RenderEngine'
import type { SpeechEvent, ActionLabelEvent } from '@/render/RenderEngine'

// ─── 角色 ───────────────────────────────────────────────────────────────
interface Char {
  id: string
  name: string
  avatar: string
  x: number
  y: number
  speech: string | null
  action: string | null
  thought: string | null
  isPlayer: boolean
  zone: string
}

const NPCS = [
  { id: 'npc_hoshiyu', name: '星羽', avatar: '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg', x: 0.32, y: 0.42, zone: 'plaza' },
  { id: 'npc_shuangyue', name: '霜月', avatar: '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg', x: 0.65, y: 0.52, zone: 'shop' },
  { id: 'npc_liuli', name: '琉璃', avatar: '/assets/doujin/08e60b159e820a1e652cb968bd6477b4.png', x: 0.75, y: 0.7, zone: 'arena' },
  { id: 'npc_yedou', name: '夜斗', avatar: '/assets/doujin/3323ef486e62e1df4a774064f2233205.png', x: 0.15, y: 0.58, zone: 'cafe' },
]

// ─── 弹幕系统 ────────────────────────────────────────────────────────────
interface Danmaku {
  id: number
  text: string
  color: string
  y: number // 0~100 percentage
  speed: number // seconds to cross
  createdAt: number
}

const DANMAKU_POOL = [
  { text: '星羽赛高！！！', color: '#FF6FB7' },
  { text: '霜月我老婆', color: '#7AE7FF' },
  { text: '琉璃阵营冲冲冲', color: '#A78BFA' },
  { text: '今天的扭蛋运气好好', color: '#B6FF6F' },
  { text: '有没有人组队刷谷子', color: '#FFA864' },
  { text: '同人咖啡厅新图超棒', color: '#FF6FB7' },
  { text: '党争擂台星羽必胜', color: '#FFD700' },
  { text: '新人报道～请多关照', color: '#7AE7FF' },
  { text: '刚抽到SSR！！！', color: '#FFD700' },
  { text: '热搜墙今天好热闹', color: '#FF6FB7' },
  { text: '这个小镇太可爱了吧', color: '#B6FF6F' },
  { text: '广场蹲一个搭子', color: '#7AE7FF' },
  { text: '二创投稿已发送✨', color: '#A78BFA' },
  { text: '限定吧唧终于抢到了', color: '#FFA864' },
  { text: '阵营战什么时候开始', color: '#FF6FB7' },
  { text: '夜斗好帅啊啊啊', color: '#7AE7FF' },
]

// ─── 建筑图片素材映射 ────────────────────────────────────────────────────
const ZONE_IMAGES: Record<string, string> = {
  hotwall: '/assets/art/zone_hotwall.png',
  plaza: '/assets/art-preview/art-01.png',
  shop: '/assets/art/zone_goods.png',
  cafe: '/assets/art/zone_cafe.jpg',
  arena: '/assets/sprites/arena_building.png',
  gacha: '/assets/sprites/gacha_machine.png',
}

// NPC 思考内容池（模拟 AI thought trace）
const THOUGHTS = [
  '分析：热搜墙话题热度↑，应该去凑热闹',
  '决策：前往谷子店补货，预算剩余 2400',
  '观察：广场有新面孔，执行社交协议',
  '计划：今天目标→完成3张同人稿',
  '推理：阵营投票差 200 票，需要动员',
  '记忆：上次在咖啡厅遇到了琉璃',
  '目标：收集全套限定徽章 (4/7)',
  '社交：检测到附近有同好，发起对话',
]

// NPC 行动池
const ACTIONS = [
  'is browsing hot topics',
  'is sketching a doujin',
  'is taking photos',
  'is counting collectibles',
  'is voting for faction',
  'is chatting with friends',
  'heading to goods shop',
  'preparing for cosplay',
]

// ─── 建筑 ───────────────────────────────────────────────────────────────
interface Zone {
  id: string
  name: string
  icon: string
  x: number
  y: number
  w: number
  h: number
  color: string
  desc: string
  activity: string
}

const ZONES: Zone[] = [
  { id: 'hotwall', name: '热搜墙', icon: '🔥', x: 0.02, y: 0.12, w: 0.2, h: 0.2, color: '#FF6FB7', desc: '实时热门话题', activity: '3条新话题上榜' },
  { id: 'plaza', name: '次元广场', icon: '⛲', x: 0.32, y: 0.25, w: 0.32, h: 0.22, color: '#7AE7FF', desc: '小镇中心聚集地', activity: '5人正在社交' },
  { id: 'shop', name: '谷子店', icon: '🛒', x: 0.7, y: 0.18, w: 0.22, h: 0.24, color: '#B6FF6F', desc: '限定周边贩售', activity: '新品上架中' },
  { id: 'cafe', name: '同人咖啡厅', icon: '☕', x: 0.02, y: 0.52, w: 0.22, h: 0.24, color: '#A78BFA', desc: 'AI创作工坊', activity: 'AI正在画稿' },
  { id: 'arena', name: '党争擂台', icon: '⚔️', x: 0.68, y: 0.58, w: 0.24, h: 0.2, color: '#FFA864', desc: '阵营对决', activity: '星羽 vs 霜月' },
  { id: 'gacha', name: '扭蛋机', icon: '🎰', x: 0.42, y: 0.72, w: 0.16, h: 0.16, color: '#FF6FB7', desc: '每日免费1次', activity: '今日已出SSR' },
]

// ─── 扭蛋机奖池 ──────────────────────────────────────────────────────────
interface GachaItem {
  name: string
  rarity: 'SSR' | 'SR' | 'R' | 'N'
  icon: string
  color: string
  desc: string
  image?: string
}

const GACHA_POOL: GachaItem[] = [
  { name: '限定·星羽の翼', rarity: 'SSR', icon: '✨', color: '#FFD700', desc: '传说级装饰，佩戴后全属性+20', image: '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg' },
  { name: '限定·霜月之证', rarity: 'SSR', icon: '🌙', color: '#FFD700', desc: '限定称号框，闪耀紫光', image: '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg' },
  { name: '稀有·樱吹雪背景', rarity: 'SR', icon: '🌸', color: '#A78BFA', desc: '主页背景特效：飘落樱花', image: '/assets/doujin/08e60b159e820a1e652cb968bd6477b4.png' },
  { name: '稀有·痛包贴纸套', rarity: 'SR', icon: '💖', color: '#A78BFA', desc: '包含6张角色贴纸', image: '/assets/doujin/3323ef486e62e1df4a774064f2233205.png' },
  { name: '稀有·次元广播权', rarity: 'SR', icon: '📢', color: '#A78BFA', desc: '可发送全服广播1次', image: '/assets/doujin/c1c2bf4888c06e7ed7e1d62b542027e9.png' },
  { name: '普通·灵感结晶×50', rarity: 'R', icon: '💎', color: '#7AE7FF', desc: '灵感点+50' },
  { name: '普通·厨力补给×30', rarity: 'R', icon: '🔥', color: '#7AE7FF', desc: '厨力值+30' },
  { name: '普通·社交令×3', rarity: 'R', icon: '💬', color: '#7AE7FF', desc: '额外社交次数+3' },
  { name: '基础·经验药水', rarity: 'N', icon: '🧪', color: '#999', desc: '经验+10' },
  { name: '基础·小铃铛', rarity: 'N', icon: '🔔', color: '#999', desc: '装饰品' },
]

function rollGacha(): GachaItem {
  const r = Math.random()
  if (r < 0.03) return GACHA_POOL[Math.floor(Math.random() * 2)]! // SSR 3%
  if (r < 0.15) return GACHA_POOL[2 + Math.floor(Math.random() * 3)]! // SR 12%
  if (r < 0.55) return GACHA_POOL[5 + Math.floor(Math.random() * 3)]! // R 40%
  return GACHA_POOL[8 + Math.floor(Math.random() * 2)]! // N 45%
}

// ─── 热搜墙话题 ─────────────────────────────────────────────────────────
const HOT_TOPICS = [
  { rank: 1, tag: '星羽新皮肤', heat: 9823, trend: '+128%', hot: true },
  { rank: 2, tag: '#漫展搭子互选', heat: 7651, trend: '+56%', hot: true },
  { rank: 3, tag: '霜月×琉璃同人', heat: 5420, trend: '+34%', hot: false },
  { rank: 4, tag: '阵营战第3赛季', heat: 4102, trend: '+22%', hot: false },
  { rank: 5, tag: '吃谷晒单大赛', heat: 3890, trend: '+18%', hot: false },
  { rank: 6, tag: 'AI画稿新功能', heat: 2741, trend: '+9%', hot: false },
]

// ─── 谷子店商品 ─────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { name: '星羽限定吧唧', price: 45, stock: 3, icon: '🎫', tag: '限定', image: '/assets/doujin/14a892a4a4ecdf92a4cc85e6b6ca3ac6.jpg' },
  { name: '霜月亚克力立牌', price: 88, stock: 12, icon: '🖼️', tag: '新品', image: '/assets/doujin/0293911a32a6135ef7171cd395f5f30b.jpg' },
  { name: '阵营应援色纸', price: 25, stock: 50, icon: '📜', tag: '热卖', image: '/assets/doujin/ae512c7ae2128a28f49647063e1dd4ff.png' },
  { name: '全员Q版挂件套', price: 128, stock: 5, icon: '🔑', tag: '限量', image: '/assets/doujin/88b9f22cbcdbb002878199abb1699467.png' },
]

// ─── 咖啡厅创作 ─────────────────────────────────────────────────────────
const CAFE_CREATIONS = [
  { title: '星羽×霜月·黄昏线稿', author: '琉璃', progress: 78, type: 'AI绘画' },
  { title: '第3话·阵营决战脚本', author: '夜斗', progress: 45, type: 'AI剧本' },
  { title: '主题曲·星辰のメロディ', author: '铃音', progress: 92, type: 'AI作曲' },
]

export interface TownStageArtProps { engine: RenderEngine }

export function TownStageArt({ engine }: TownStageArtProps): JSX.Element {
  useEffect(() => { engine.startMockTimeline() }, [engine])

  const [chars, setChars] = useState<Char[]>(() => [
    ...NPCS.map((c) => ({ ...c, speech: null, action: null, thought: null, isPlayer: false })),
    { id: 'player', name: '我的Agent', avatar: '/assets/doujin/c1c2bf4888c06e7ed7e1d62b542027e9.png', x: 0.48, y: 0.48, speech: null, action: null, thought: null, isPlayer: true, zone: 'plaza' },
  ])

  const [popup, setPopup] = useState<Zone | null>(null)
  const [charPanel, setCharPanel] = useState<Char | null>(null)
  const [interactMsg, setInteractMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // 扭蛋机状态
  const [gachaResult, setGachaResult] = useState<GachaItem | null>(null)
  const [gachaRolling, setGachaRolling] = useState(false)
  const [gachaHistory, setGachaHistory] = useState<GachaItem[]>([])
  const [gachaCount, setGachaCount] = useState(0)

  // 热搜墙状态
  const [hotVoted, setHotVoted] = useState<number[]>([])

  // 谷子店状态
  const [shopCart, setShopCart] = useState<string[]>([])

  // 咖啡厅状态
  const [cafeBoost, setCafeBoost] = useState<string | null>(null)

  // 弹幕系统
  const [danmakus, setDanmakus] = useState<Danmaku[]>([])
  const danmakuCounter = useMemo(() => ({ current: 0 }), [])

  // 弹幕定时发射
  useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => {
      const pool = DANMAKU_POOL[Math.floor(Math.random() * DANMAKU_POOL.length)]!
      const newD: Danmaku = {
        id: danmakuCounter.current++,
        text: pool.text,
        color: pool.color,
        y: 8 + Math.random() * 55, // 8% ~ 63% from top
        speed: 8 + Math.random() * 6, // 8~14 seconds to cross
        createdAt: Date.now(),
      }
      setDanmakus((prev) => [...prev.slice(-20), newD])
    }, 2200)
    return () => clearInterval(id)
  }, [mounted, danmakuCounter])

  // 从引擎事件生成弹幕
  useEffect(() => {
    const unsub = engine.subscribeSpeech((ev: SpeechEvent) => {
      const text = ev.text.length > 20 ? ev.text.slice(0, 20) + '…' : ev.text
      const colors = ['#FF6FB7', '#7AE7FF', '#B6FF6F', '#A78BFA', '#FFA864']
      const newD: Danmaku = {
        id: danmakuCounter.current++,
        text,
        color: colors[danmakuCounter.current % colors.length]!,
        y: 8 + Math.random() * 55,
        speed: 8 + Math.random() * 6,
        createdAt: Date.now(),
      }
      setDanmakus((prev) => [...prev.slice(-20), newD])
    })
    return unsub
  }, [engine, danmakuCounter])

  // 清理过期弹幕
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setDanmakus((prev) => prev.filter((d) => now - d.createdAt < d.speed * 1000))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { setMounted(true) }, [])

  // NPC 自动移动 + 自动思考 + 自动行动
  useEffect(() => {
    if (!mounted) return
    const moveId = setInterval(() => {
      setChars((prev) => prev.map((c) => {
        if (c.isPlayer) return c
        const dx = (Math.random() - 0.5) * 0.04
        const dy = (Math.random() - 0.5) * 0.03
        return { ...c, x: Math.max(0.05, Math.min(0.92, c.x + dx)), y: Math.max(0.18, Math.min(0.86, c.y + dy)) }
      }))
    }, 3000)

    // NPC 思考（AI thought trace 可视化）
    const thinkId = setInterval(() => {
      const npcIdx = Math.floor(Math.random() * NPCS.length)
      const tid = NPCS[npcIdx]!.id
      const thought = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)]!
      setChars((p) => p.map((c) => c.id === tid ? { ...c, thought } : c))
      setTimeout(() => {
        setChars((p) => p.map((c) => c.id === tid ? { ...c, thought: null } : c))
      }, 5000)
    }, 4000)

    // NPC 自动action
    const actId = setInterval(() => {
      const npcIdx = Math.floor(Math.random() * NPCS.length)
      const tid = NPCS[npcIdx]!.id
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]!
      setChars((p) => p.map((c) => c.id === tid ? { ...c, action } : c))
    }, 5000)

    return () => { clearInterval(moveId); clearInterval(thinkId); clearInterval(actId) }
  }, [mounted])

  // 订阅引擎事件
  useEffect(() => {
    const ids = NPCS.map((n) => n.id)
    let idx = 0
    const unsub1 = engine.subscribeSpeech((ev: SpeechEvent) => {
      const tid = ids[idx % ids.length]!
      idx++
      const text = ev.text.length > 25 ? ev.text.slice(0, 25) + '…' : ev.text
      setChars((p) => p.map((c) => c.id === tid ? { ...c, speech: text } : c))
      setTimeout(() => { setChars((p) => p.map((c) => c.id === tid ? { ...c, speech: null } : c)) }, 4000)
    })
    const unsub2 = engine.subscribeActionLabel((ev: ActionLabelEvent) => {
      const tid = ids[idx % ids.length]!
      if (ev.label) setChars((p) => p.map((c) => c.id === tid ? { ...c, action: ev.label } : c))
    })
    return () => { unsub1(); unsub2() }
  }, [engine])

  // 扭蛋抽取
  const doGachaPull = useCallback(() => {
    setGachaRolling(true)
    setGachaResult(null)
    setTimeout(() => {
      const item = rollGacha()
      setGachaResult(item)
      setGachaHistory((prev) => [item, ...prev].slice(0, 10))
      setGachaCount((c) => c + 1)
      setGachaRolling(false)
    }, 1500)
  }, [])

  // 点击地图
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const zone = ZONES.find((z) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h)
    if (zone) { setPopup(zone); setGachaResult(null); setGachaRolling(false) }
    setChars((p) => p.map((c) => c.isPlayer ? { ...c, x, y } : c))
  }, [])

  // 点击角色 → 打开互动面板
  const handleCharClick = useCallback((char: Char, e: React.MouseEvent) => {
    e.stopPropagation()
    setCharPanel(char)
  }, [])

  // 互动按钮
  const doInteract = useCallback((action: string) => {
    setInteractMsg(action)
    setCharPanel(null)
    setTimeout(() => setInteractMsg(null), 3000)
  }, [])

  const sakura = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const s = (i * 7919 + 104729) % 100000
    return { key: i, left: (s % 1000) / 10, dur: 12 + (s * 13 % 1000) / 100, delay: (s * 97 % 1000) / 100, size: 5 + (s * 31 % 1000) / 200 }
  }), [])

  return (
    <div onClick={handleMapClick} style={{
      position: 'relative', width: '100%', height: '100%', minHeight: 0,
      borderRadius: 16, overflow: 'hidden', cursor: 'crosshair',
      border: '1px solid rgba(255,111,183,0.3)', background: '#0e0a1f',
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
    }}>
      {/* 背景 */}
      <img src="/assets/art/town_overview.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', animation: 'townKen 32s ease-in-out infinite',
      }} />

      {/* 建筑热区 + 活动状态 — 强交互视觉 */}
      {ZONES.map((z) => (
        <div key={z.id} className="zone-hit" data-color={z.color} style={{
          position: 'absolute', left: `${z.x * 100}%`, top: `${z.y * 100}%`,
          width: `${z.w * 100}%`, height: `${z.h * 100}%`,
          borderRadius: 10, zIndex: 2, cursor: 'pointer',
          border: `2px solid ${z.color}55`,
          background: `linear-gradient(135deg, ${z.color}08, ${z.color}03)`,
          boxShadow: `inset 0 0 20px ${z.color}10, 0 0 8px ${z.color}15`,
          transition: 'all 0.3s ease',
        }}>
          {/* 四角装饰 */}
          <span style={{ position: 'absolute', top: 3, left: 3, width: 8, height: 8, borderTop: `2px solid ${z.color}`, borderLeft: `2px solid ${z.color}`, borderRadius: '3px 0 0 0' }} />
          <span style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderTop: `2px solid ${z.color}`, borderRight: `2px solid ${z.color}`, borderRadius: '0 3px 0 0' }} />
          <span style={{ position: 'absolute', bottom: 3, left: 3, width: 8, height: 8, borderBottom: `2px solid ${z.color}`, borderLeft: `2px solid ${z.color}`, borderRadius: '0 0 0 3px' }} />
          <span style={{ position: 'absolute', bottom: 3, right: 3, width: 8, height: 8, borderBottom: `2px solid ${z.color}`, borderRight: `2px solid ${z.color}`, borderRadius: '0 0 3px 0' }} />

          {/* 呼吸光晕 */}
          <div style={{
            position: 'absolute', inset: -2, borderRadius: 10,
            border: `1px solid ${z.color}`,
            animation: 'zoneBreath 3s ease-in-out infinite',
            opacity: 0.4, pointerEvents: 'none',
          }} />

          {/* 建筑图标居中 */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: 24, opacity: 0.3, pointerEvents: 'none',
          }}>{z.icon}</div>

          {/* 顶部标签：名称 + 活动状态 */}
          <div style={{
            position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none',
          }}>
            <span style={{
              background: 'rgba(0,0,0,0.9)', padding: '3px 8px', borderRadius: 5,
              fontSize: 10, color: z.color, whiteSpace: 'nowrap',
              border: `1.5px solid ${z.color}66`, fontWeight: 600,
              boxShadow: `0 0 8px ${z.color}33`,
            }}>{z.icon} {z.name}</span>
          </div>

          {/* 底部活动指示器 */}
          <div style={{
            position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: z.color,
              animation: 'livePulse 1.5s infinite',
            }} />
            <span style={{
              background: `${z.color}20`, padding: '2px 6px', borderRadius: 3,
              fontSize: 8, color: z.color, whiteSpace: 'nowrap',
              border: `1px solid ${z.color}40`,
            }}>{z.activity}</span>
          </div>

          {/* Hover 时的"点击进入"提示 */}
          <div className="zone-enter-hint" style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: `${z.color}dd`, color: '#fff', padding: '6px 14px',
            borderRadius: 6, fontSize: 11, fontWeight: 700,
            opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none',
            boxShadow: `0 4px 16px ${z.color}55`,
          }}>
            点击进入 →
          </div>
        </div>
      ))}

      {/* 角色 */}
      {chars.map((c) => (
        <div key={c.id} onClick={(e) => handleCharClick(c, e)} className="town-char" style={{
          position: 'absolute', left: `${c.x * 100}%`, top: `${c.y * 100}%`,
          transform: 'translate(-50%,-80%)', transition: 'left 1.5s ease, top 1.5s ease',
          zIndex: c.isPlayer ? 10 : 5, cursor: 'pointer',
        }}>
          {/* AI 思考气泡（紫色，区别于普通对话） */}
          {c.thought && (
            <div style={{
              position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(167,139,250,0.95)', color: '#fff', padding: '4px 8px',
              borderRadius: 8, fontSize: 9, maxWidth: 180, whiteSpace: 'pre-wrap',
              border: '1px solid #A78BFA', animation: 'popIn .3s ease',
              boxShadow: '0 0 12px rgba(167,139,250,0.4)',
            }}>
              <span style={{ fontSize: 8, opacity: 0.8 }}>🧠 AI思考：</span><br/>
              {c.thought}
              <span style={{
                position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(167,139,250,0.95)',
              }} />
            </div>
          )}

          {/* 对话气泡 */}
          {c.speech && !c.thought && (
            <div style={{
              position: 'absolute', bottom: '105%', left: '50%', transform: 'translateX(-50%)',
              background: '#fff', color: '#1a1a1a', padding: '4px 8px', borderRadius: 7,
              fontSize: 10, maxWidth: 160, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)', border: '2px solid #1a1a1a',
              animation: 'popIn .3s ease',
            }}>
              {c.speech}
              <span style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1a1a1a' }} />
            </div>
          )}

          {/* 头像 */}
          <div style={{
            width: c.isPlayer ? 52 : 40, height: c.isPlayer ? 52 : 40,
            borderRadius: '50%', overflow: 'hidden',
            border: c.isPlayer ? '3px solid #FF6FB7' : '2px solid rgba(255,255,255,0.7)',
            boxShadow: c.isPlayer ? '0 0 16px rgba(255,111,183,0.6)' : '0 2px 6px rgba(0,0,0,0.5)',
            animation: c.isPlayer ? 'playerGlow 2s ease-in-out infinite' : 'charBob 3s ease-in-out infinite',
          }}>
            <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* 名字 + action */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <span style={{
              padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600,
              background: c.isPlayer ? 'rgba(255,111,183,0.85)' : 'rgba(0,0,0,0.75)', color: '#fff',
              whiteSpace: 'nowrap',
            }}>{c.name}</span>
            {c.action && <span style={{
              padding: '1px 4px', borderRadius: 2, fontSize: 7, color: '#7AE7FF',
              background: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap', maxWidth: 100,
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{c.action}</span>}
          </div>

          {c.isPlayer && <div style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            background: '#FF6FB7', color: '#fff', padding: '1px 5px', borderRadius: 8,
            fontSize: 7, fontWeight: 700,
          }}>🎮 YOU</div>}
        </div>
      ))}

      {/* ═══ 建筑交互面板（全屏覆盖式） ═══ */}
      {popup && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn .2s ease',
        }}>
          <div style={{
            background: 'rgba(14,10,31,0.98)', border: `2px solid ${popup.color}`,
            borderRadius: 16, padding: '24px 28px', width: '85%', maxWidth: 420,
            maxHeight: '85%', overflow: 'auto',
            boxShadow: `0 0 60px ${popup.color}33, 0 20px 60px rgba(0,0,0,0.6)`,
            animation: 'scaleIn .3s ease',
          }}>
            {/* 头部 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>{popup.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: popup.color }}>{popup.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{popup.desc}</div>
                </div>
              </div>
              <button onClick={() => setPopup(null)} style={{
                width: 28, height: 28, borderRadius: '50%', border: `1px solid ${popup.color}55`,
                background: `${popup.color}15`, color: popup.color, cursor: 'pointer',
                fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* 活动指示 */}
            <div style={{
              padding: '8px 14px', borderRadius: 8, marginBottom: 16,
              background: `${popup.color}12`, border: `1px solid ${popup.color}33`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: popup.color, animation: 'livePulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, color: popup.color, fontWeight: 600 }}>{popup.activity}</span>
            </div>

            {/* 建筑图片展示 */}
            {ZONE_IMAGES[popup.id] && (
              <div style={{
                width: '100%', height: 120, borderRadius: 10, overflow: 'hidden',
                marginBottom: 16, position: 'relative',
                border: `1px solid ${popup.color}33`,
              }}>
                <img src={ZONE_IMAGES[popup.id]} alt={popup.name} style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 50%, rgba(14,10,31,0.8) 100%)`,
                }} />
                <div style={{
                  position: 'absolute', bottom: 8, left: 12, fontSize: 11,
                  color: 'rgba(255,255,255,0.8)', fontWeight: 600,
                }}>📍 {popup.name} · {popup.desc}</div>
              </div>
            )}

            {/* ═══ 扭蛋机专属界面 ═══ */}
            {popup.id === 'gacha' && (
              <div>
                {/* 扭蛋机主体 */}
                <div style={{
                  background: 'linear-gradient(180deg, #1a1035 0%, #0e0a1f 100%)',
                  border: `1px solid ${popup.color}44`, borderRadius: 12,
                  padding: 16, textAlign: 'center', marginBottom: 12,
                }}>
                  {/* 抽卡动画区域 */}
                  <div style={{
                    width: 140, height: 140, margin: '0 auto 12px',
                    borderRadius: gachaResult?.image ? 12 : '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: gachaRolling
                      ? 'conic-gradient(#FF6FB7, #7AE7FF, #A78BFA, #B6FF6F, #FF6FB7)'
                      : gachaResult
                        ? `radial-gradient(circle, ${gachaResult.color}33, transparent)`
                        : 'radial-gradient(circle, rgba(255,111,183,0.1), transparent)',
                    border: gachaResult ? `3px solid ${gachaResult.color}` : '2px solid rgba(255,111,183,0.3)',
                    animation: gachaRolling ? 'gachaSpin 0.6s linear infinite' : undefined,
                    transition: 'all 0.5s ease', overflow: 'hidden',
                  }}>
                    {gachaRolling && <span style={{ fontSize: 40, animation: 'gachaBounce 0.3s ease infinite' }}>🎰</span>}
                    {!gachaRolling && !gachaResult && <span style={{ fontSize: 40 }}>🎰</span>}
                    {!gachaRolling && gachaResult && (
                      gachaResult.image
                        ? <img src={gachaResult.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 40 }}>{gachaResult.icon}</span>
                    )}
                  </div>

                  {/* 结果展示 */}
                  {gachaResult && !gachaRolling && (
                    <div style={{ animation: 'popIn .4s ease' }}>
                      <div style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                        background: gachaResult.color, color: '#000', fontWeight: 800,
                        fontSize: 12, marginBottom: 6,
                      }}>{gachaResult.rarity}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: gachaResult.color }}>{gachaResult.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{gachaResult.desc}</div>
                    </div>
                  )}

                  {!gachaResult && !gachaRolling && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>点击下方按钮开始抽取</div>
                  )}
                </div>

                {/* 概率展示 */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12,
                }}>
                  {[
                    { label: 'SSR', rate: '3%', color: '#FFD700' },
                    { label: 'SR', rate: '12%', color: '#A78BFA' },
                    { label: 'R', rate: '40%', color: '#7AE7FF' },
                    { label: 'N', rate: '45%', color: '#999' },
                  ].map((r) => (
                    <div key={r.label} style={{
                      padding: '6px 4px', borderRadius: 6, textAlign: 'center',
                      background: `${r.color}11`, border: `1px solid ${r.color}33`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{r.rate}</div>
                    </div>
                  ))}
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button onClick={doGachaPull} disabled={gachaRolling} style={{
                    flex: 1, padding: '12px', borderRadius: 8, border: 'none',
                    background: gachaRolling ? '#555' : 'linear-gradient(135deg, #FF6FB7, #A78BFA)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: gachaRolling ? 'not-allowed' : 'pointer',
                    boxShadow: gachaRolling ? 'none' : '0 4px 16px rgba(255,111,183,0.4)',
                  }}>
                    {gachaRolling ? '🎰 抽取中...' : '🎰 单抽×1（免费）'}
                  </button>
                  <button onClick={() => { for (let i = 0; i < 10; i++) setTimeout(doGachaPull, i * 200) }} disabled={gachaRolling} style={{
                    padding: '12px 16px', borderRadius: 8, border: `1px solid ${popup.color}55`,
                    background: `${popup.color}15`, color: popup.color, fontSize: 12, fontWeight: 600,
                    cursor: gachaRolling ? 'not-allowed' : 'pointer',
                  }}>十连</button>
                </div>

                {/* 抽取记录 */}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  已抽 {gachaCount} 次 | 保底 {Math.max(0, 90 - (gachaCount % 90))} 次后必出SSR
                </div>
                {gachaHistory.length > 0 && (
                  <div style={{
                    padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)', maxHeight: 80, overflow: 'auto',
                  }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>最近记录：</div>
                    {gachaHistory.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ color: item.color }}>{item.icon}</span>
                        <span style={{ color: item.color, fontWeight: 600 }}>[{item.rarity}]</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ 热搜墙专属界面 ═══ */}
            {popup.id === 'hotwall' && (
              <div>
                {HOT_TOPICS.map((topic) => (
                  <div key={topic.rank} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, marginBottom: 6,
                    background: topic.hot ? 'rgba(255,111,183,0.08)' : 'rgba(255,255,255,0.03)',
                    border: topic.hot ? '1px solid rgba(255,111,183,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                      background: topic.rank <= 3 ? 'linear-gradient(135deg, #FF6FB7, #FFA864)' : 'rgba(255,255,255,0.1)',
                      color: topic.rank <= 3 ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>{topic.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                        {topic.tag}
                        {topic.hot && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 4px', borderRadius: 3, background: '#FF6FB7', color: '#fff' }}>热</span>}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        🔥 {topic.heat.toLocaleString()} 讨论 · {topic.trend}
                      </div>
                    </div>
                    <button onClick={() => setHotVoted((prev) => prev.includes(topic.rank) ? prev : [...prev, topic.rank])} style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                      border: hotVoted.includes(topic.rank) ? '1px solid #B6FF6F55' : '1px solid #FF6FB755',
                      background: hotVoted.includes(topic.rank) ? 'rgba(182,255,111,0.1)' : 'rgba(255,111,183,0.1)',
                      color: hotVoted.includes(topic.rank) ? '#B6FF6F' : '#FF6FB7',
                    }}>
                      {hotVoted.includes(topic.rank) ? '✓ 已顶' : '👍 顶'}
                    </button>
                  </div>
                ))}
                <button onClick={() => doInteract('📢 发布了新话题到热搜墙！')} style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none', marginTop: 8,
                  background: 'linear-gradient(135deg, #FF6FB7, #FFA864)', color: '#fff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>🔥 发布新话题</button>
              </div>
            )}

            {/* ═══ 谷子店专属界面 ═══ */}
            {popup.id === 'shop' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {SHOP_ITEMS.map((item) => (
                    <div key={item.name} style={{
                      padding: '12px', borderRadius: 10,
                      background: 'rgba(182,255,111,0.05)', border: '1px solid rgba(182,255,111,0.2)',
                      textAlign: 'center', position: 'relative',
                    }}>
                      {/* 标签 */}
                      <span style={{
                        position: 'absolute', top: 6, right: 6, fontSize: 8, padding: '1px 5px',
                        borderRadius: 3, background: item.tag === '限定' ? '#FF6FB7' : item.tag === '限量' ? '#FFD700' : '#7AE7FF',
                        color: '#fff', fontWeight: 700, zIndex: 2,
                      }}>{item.tag}</span>
                      <div style={{
                        width: '100%', height: 70, borderRadius: 6, overflow: 'hidden', marginBottom: 6,
                        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.image
                          ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 28 }}>{item.icon}</span>
                        }
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#B6FF6F', marginBottom: 2 }}>💰 {item.price} 灵感点</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>库存: {item.stock}</div>
                      <button onClick={() => {
                        setShopCart((p) => [...p, item.name])
                        doInteract(`🛒 加入购物车：${item.name}（-${item.price}灵感点）`)
                      }} style={{
                        padding: '5px 12px', borderRadius: 5, border: 'none',
                        background: shopCart.includes(item.name) ? 'rgba(182,255,111,0.3)' : 'linear-gradient(135deg, #B6FF6F, #7AE7FF)',
                        color: shopCart.includes(item.name) ? '#B6FF6F' : '#000', fontSize: 10,
                        fontWeight: 700, cursor: 'pointer',
                      }}>
                        {shopCart.includes(item.name) ? '✓ 已加入' : '加入购物车'}
                      </button>
                    </div>
                  ))}
                </div>
                {shopCart.length > 0 && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 6, background: 'rgba(182,255,111,0.08)',
                    border: '1px solid rgba(182,255,111,0.3)', fontSize: 11, color: '#B6FF6F',
                  }}>🛒 购物车: {shopCart.length} 件 | 合计 {shopCart.reduce((sum, name) => sum + (SHOP_ITEMS.find((i) => i.name === name)?.price ?? 0), 0)} 灵感点</div>
                )}
              </div>
            )}

            {/* ═══ 咖啡厅专属界面 ═══ */}
            {popup.id === 'cafe' && (
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                  🤖 AI 正在自动生成创作内容...
                </div>
                {CAFE_CREATIONS.map((c) => (
                  <div key={c.title} style={{
                    padding: '12px', borderRadius: 8, marginBottom: 8,
                    background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{c.title}</span>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: '#A78BFA33', color: '#A78BFA' }}>{c.type}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>创作者: {c.author}</div>
                    {/* 进度条 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                        <div style={{
                          width: `${c.progress}%`, height: '100%', borderRadius: 3,
                          background: c.progress > 80 ? 'linear-gradient(90deg, #B6FF6F, #7AE7FF)' : 'linear-gradient(90deg, #A78BFA, #FF6FB7)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#A78BFA', fontWeight: 600 }}>{c.progress}%</span>
                    </div>
                    <button onClick={() => {
                      setCafeBoost(c.title)
                      doInteract(`⚡ 为「${c.title}」注入灵感！进度+5%`)
                      setTimeout(() => setCafeBoost(null), 2000)
                    }} style={{
                      marginTop: 8, padding: '5px 12px', borderRadius: 5, border: 'none',
                      background: cafeBoost === c.title ? 'rgba(182,255,111,0.3)' : 'linear-gradient(135deg, #A78BFA, #7AE7FF)',
                      color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    }}>
                      {cafeBoost === c.title ? '✨ 灵感已注入！' : '⚡ 注入灵感'}
                    </button>
                  </div>
                ))}
                <button onClick={() => doInteract('🎨 开始新的AI创作任务...')} style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed #A78BFA55',
                  background: 'transparent', color: '#A78BFA', fontSize: 12, cursor: 'pointer', marginTop: 4,
                }}>+ 发起新创作</button>
              </div>
            )}

            {/* ═══ 次元广场界面 ═══ */}
            {popup.id === 'plaza' && (
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                  广场上 5 位居民正在社交，你可以：
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => doInteract('📢 在次元广场大喊：有没有人一起组队刷副本！→ 收到3条回复')} style={{
                    padding: '12px', borderRadius: 8, border: '1px solid #7AE7FF33',
                    background: 'rgba(122,231,255,0.06)', color: '#7AE7FF', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}>📢 广播喊话（附近5人可见）</button>
                  <button onClick={() => doInteract('🤝 在广场发起「漫展搭子」匹配 → 匹配中...')} style={{
                    padding: '12px', borderRadius: 8, border: '1px solid #B6FF6F33',
                    background: 'rgba(182,255,111,0.06)', color: '#B6FF6F', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}>🤝 发起搭子匹配</button>
                  <button onClick={() => doInteract('📸 在广场合影留念 → 照片已保存')} style={{
                    padding: '12px', borderRadius: 8, border: '1px solid #FF6FB733',
                    background: 'rgba(255,111,183,0.06)', color: '#FF6FB7', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}>📸 合影留念</button>
                  <button onClick={() => doInteract('🎤 在广场开启「安利大赛」 → 等待参赛者...')} style={{
                    padding: '12px', borderRadius: 8, border: '1px solid #FFA86433',
                    background: 'rgba(255,168,100,0.06)', color: '#FFA864', fontSize: 12,
                    cursor: 'pointer', textAlign: 'left',
                  }}>🎤 开启安利大赛</button>
                </div>
              </div>
            )}

            {/* ═══ 党争擂台界面 ═══ */}
            {popup.id === 'arena' && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                  padding: '16px', marginBottom: 12, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(255,111,183,0.1), rgba(255,168,100,0.1))',
                  border: '1px solid rgba(255,168,100,0.3)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>⭐</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6FB7' }}>星羽</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>126万票</div>
                  </div>
                  <div style={{ fontSize: 20, color: '#FFA864', fontWeight: 800 }}>VS</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>🌙</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#7AE7FF' }}>霜月</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>98万票</div>
                  </div>
                </div>
                {/* 进度条 */}
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', marginBottom: 12, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: '56%', background: 'linear-gradient(90deg, #FF6FB7, #FFA864)' }} />
                  <div style={{ width: '44%', background: 'linear-gradient(90deg, #7AE7FF, #A78BFA)' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => doInteract('🗳️ 为星羽阵营投票！厨力-5 → 星羽+1票')} style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #FF6FB7, #FFA864)', color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>投票星羽</button>
                  <button onClick={() => doInteract('🗳️ 为霜月阵营投票！厨力-5 → 霜月+1票')} style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #7AE7FF, #A78BFA)', color: '#fff',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>投票霜月</button>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
                  每次投票消耗 5 厨力 | 本赛季剩余 2天14小时
                </div>
              </div>
            )}

            {/* ═══ 通用界面（没有专属内容的建筑） ═══ */}
            {!['gacha', 'hotwall', 'shop', 'cafe', 'plaza', 'arena'].includes(popup.id) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => { doInteract(`✅ 进入了「${popup.name}」— ${popup.activity}`); setPopup(null) }} style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: `linear-gradient(135deg, ${popup.color}, ${popup.color}cc)`, color: '#fff',
                  fontSize: 13, cursor: 'pointer', fontWeight: 700,
                }}>进入 {popup.name}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 角色互动面板 */}
      {charPanel && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'absolute', top: '8%', right: '3%',
          background: 'rgba(14,10,31,0.96)', border: '2px solid #A78BFA',
          borderRadius: 12, padding: '12px 16px', zIndex: 30, width: 200,
          animation: 'popIn .25s ease', boxShadow: '0 0 20px rgba(167,139,250,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <img src={charPanel.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #A78BFA' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{charPanel.name}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>
                {charPanel.isPlayer ? '🎮 你的Agent' : '🤖 AI 智能体'}
              </div>
            </div>
          </div>
          {charPanel.action && <div style={{ fontSize: 9, color: '#7AE7FF', marginBottom: 4 }}>📌 {charPanel.action}</div>}
          {charPanel.thought && <div style={{ fontSize: 9, color: '#A78BFA', marginBottom: 4 }}>🧠 {charPanel.thought}</div>}
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            {charPanel.isPlayer ? '这是你的化身，点击地图移动' : '由 AI 自主决策行动'}
          </div>
          {!charPanel.isPlayer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={() => doInteract(`向${charPanel.name}打招呼: "你好!"  → ${charPanel.name}回复: "嗨~一起逛逛?"`)  } style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #7AE7FF44', background: 'rgba(122,231,255,0.1)', color: '#7AE7FF', fontSize: 10, cursor: 'pointer', textAlign: 'left' }}>💬 打招呼</button>
              <button onClick={() => doInteract(`邀请${charPanel.name}组队 → ${charPanel.name}: "好呀！走~"`)} style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #B6FF6F44', background: 'rgba(182,255,111,0.1)', color: '#B6FF6F', fontSize: 10, cursor: 'pointer', textAlign: 'left' }}>🤝 组队</button>
              <button onClick={() => doInteract(`查看${charPanel.name}的AI决策记录...`)} style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #A78BFA44', background: 'rgba(167,139,250,0.1)', color: '#A78BFA', fontSize: 10, cursor: 'pointer', textAlign: 'left' }}>🧠 查看思维</button>
            </div>
          )}
          <button onClick={() => setCharPanel(null)} style={{ marginTop: 8, width: '100%', padding: '3px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 9, cursor: 'pointer' }}>关闭</button>
        </div>
      )}

      {/* 互动结果通知 */}
      {interactMsg && (
        <div style={{
          position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(14,10,31,0.95)', border: '1px solid #7AE7FF',
          borderRadius: 8, padding: '8px 16px', zIndex: 28, maxWidth: '60%',
          fontSize: 11, color: '#7AE7FF', textAlign: 'center',
          animation: 'popIn .3s ease', boxShadow: '0 0 16px rgba(122,231,255,0.2)',
        }}>
          {interactMsg}
        </div>
      )}

      {/* 提示栏 */}
      <div style={{
        position: 'absolute', top: 8, left: 10, right: 10, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 12,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', background: 'rgba(0,0,0,0.75)', borderRadius: 4,
          border: '1px solid rgba(255,111,111,0.5)', fontSize: 10, color: '#fff',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6F6F', animation: 'livePulse 1.5s infinite' }} />
          LIVE · AI智能体小镇
        </span>
        <span style={{ padding: '3px 9px', background: 'rgba(0,0,0,0.65)', borderRadius: 4, fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>
          🖱️ 点击移动 | 👆 点击角色互动 | 🏠 点击建筑进入
        </span>
      </div>

      {/* ═══ 弹幕层 ═══ */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 15 }}>
        {danmakus.map((d) => (
          <div key={d.id} style={{
            position: 'absolute', top: `${d.y}%`, right: 0,
            whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 700, color: d.color,
            textShadow: `0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)`,
            animation: `danmakuScroll ${d.speed}s linear forwards`,
            opacity: 0.85,
            letterSpacing: '0.5px',
          }}>
            {d.text}
          </div>
        ))}
      </div>

      {/* 樱花 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {sakura.map((s) => (
          <span key={s.key} style={{
            position: 'absolute', left: `${s.left}%`, top: -10,
            width: s.size, height: s.size, borderRadius: '50%', opacity: 0.5,
            background: 'radial-gradient(circle, rgba(255,200,220,0.9), rgba(255,111,183,0.3), transparent)',
            animation: `sakuraDrop ${s.dur}s linear ${s.delay}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        .zone-hit { position: relative; }
        .zone-hit:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04)) !important;
          border-style: solid !important;
          transform: scale(1.02);
          box-shadow: 0 0 20px var(--zone-glow, rgba(255,255,255,0.2)), inset 0 0 30px rgba(255,255,255,0.05) !important;
        }
        .zone-hit:hover .zone-enter-hint { opacity: 1 !important; }
        .zone-hit:active { transform: scale(0.98); transition: transform 0.1s; }
        .town-char:hover { transform: translate(-50%,-80%) scale(1.15) !important; z-index: 15 !important; }
        @keyframes townKen { 0%{transform:scale(1.03) translate(0,0)} 25%{transform:scale(1.05) translate(-0.6%,0.3%)} 50%{transform:scale(1.04) translate(0.3%,-0.6%)} 75%{transform:scale(1.05) translate(0.6%,0.3%)} 100%{transform:scale(1.03) translate(0,0)} }
        @keyframes playerGlow { 0%,100%{box-shadow:0 0 12px rgba(255,111,183,0.5)} 50%{box-shadow:0 0 22px rgba(255,111,183,0.8)} }
        @keyframes charBob { 0%,100%{margin-top:0} 50%{margin-top:-2px} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes popIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes sakuraDrop { 0%{transform:translateY(0) rotate(0);opacity:0} 8%{opacity:0.5} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }
        @keyframes pulse { 0%,100%{opacity:0.8} 50%{opacity:1} }
        @keyframes zoneBreath { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.01)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes gachaSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes gachaBounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes danmakuScroll { from{transform:translateX(100%)} to{transform:translateX(calc(-100vw - 100%))} }
      `}</style>
    </div>
  )
}

export default TownStageArt
