'use client'

/**
 * /agent — 我的 Agent 详情独立页
 *
 * 内容（图1 同款 + 加深）：
 *   - 顶部 Hero：大头像（120px）+ 名字 + Persona Tag pill + 厨力 / 能量 / 心情三条
 *   - 装备 4 槽
 *   - 4 tab：记忆 / 计划 / 社交 / 二创
 *   - 每个 tab 真的有内容（mock，每条带时间戳 + 描述）
 *   - 底部 CTA：扫码切换 / 编辑资料
 */

import { useState } from 'react'
import Link from 'next/link'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'

import { SiteNav } from '../_components/SiteNav'

const DEFAULT_MASCOT: MascotType = 'cat_lore'

const EQUIPMENT = [
  { icon: '🖊️', name: '创作之笔', stat: '+15 灵感', color: '#A78BFA' },
  { icon: '📱', name: '限定手机', stat: '+12 信息', color: '#7AE7FF' },
  { icon: '💖', name: '应援徽章', stat: '+9 厨力', color: '#FF6FB7' },
  { icon: '🎒', name: '谷子包', stat: '+6 收藏', color: '#B6FF6F' },
]

type TabId = 'memory' | 'plan' | 'social' | 'doujin'

const TAB_DATA: Record<
  TabId,
  Array<{ ts: string; title: string; body: string; tag: string; tagColor: string }>
> = {
  memory: [
    {
      ts: '12:43:22',
      title: '在 谷子店 抢到限定徽章！',
      body: '排队 6 小时拿到「雷电将军 · 神之眼」吧唧，今晚开箱！',
      tag: '收藏',
      tagColor: '#FF6FB7',
    },
    {
      ts: '12:30:18',
      title: '在 同人咖啡厅 与扩列犬·阿汪初遇',
      body: '相互交换了 3 张 Cos 名片，约好 IDO 漫展第二天碰面',
      tag: '社交',
      tagColor: '#FFA864',
    },
    {
      ts: '11:57:45',
      title: '完成考据《葬送的芙莉莲》第 6 卷设定误差 12 处',
      body: '已发布到知乎专栏，目前阅读量 8.2k，评论 150+',
      tag: '二创',
      tagColor: '#B388FF',
    },
    {
      ts: '11:30:02',
      title: '在 资料馆 触发隐藏成就「时间线纠错员·MAX」',
      body: '累计纠正官方 BUG 50 处，获得粉色考据徽章',
      tag: '成就',
      tagColor: '#B6FF6F',
    },
  ],
  plan: [
    {
      ts: '今日剩余',
      title: '⭐ 应援榜冲到全镇 TOP 3',
      body: '当前差距 ~12,500 票，预计还需 4 小时（3 次完整应援轮）',
      tag: '主线',
      tagColor: '#FF6FB7',
    },
    {
      ts: '14:00 之前',
      title: '完成「太太狐·星澄」二创合作邀约',
      body: '两人已敲定剧本"五条悟 vs 黄泉"，分镜由我画 4 格',
      tag: '协作',
      tagColor: '#B388FF',
    },
    {
      ts: '今日傍晚',
      title: '在 谷子店 收齐"祢豆子"系列吧唧',
      body: '还差 SSR、UR 两款，等 18:00 限定补货',
      tag: '收藏',
      tagColor: '#FFA864',
    },
  ],
  social: [
    {
      ts: '12 分钟前',
      title: '扩列犬·阿汪 给你点赞',
      body: '给你 12:30 发布的「考据笔记 v3」点了👍',
      tag: '互动',
      tagColor: '#FFA864',
    },
    {
      ts: '38 分钟前',
      title: '太太狐·星澄 邀请合作二创',
      body: '主题：五条悟 × 黄泉 4 格漫；预估时长 30 分钟',
      tag: '邀约',
      tagColor: '#B388FF',
    },
    {
      ts: '1 小时前',
      title: '咕咕鸽·麦 转发了你的考据',
      body: '"原来芙莉莲的时间线还能这么解！"',
      tag: '传播',
      tagColor: '#FFC8DC',
    },
    {
      ts: '昨天 23:47',
      title: '加入「星羽阵营」核心审核组',
      body: '负责审核每日新发布的星羽相关同人，权重 ×2',
      tag: '阵营',
      tagColor: '#7AE7FF',
    },
  ],
  doujin: [
    {
      ts: '昨天',
      title: '《钟离 × 黄泉》4 格漫画',
      body: '以"摩拉换灵子"梗起手，第 3 格用了岩王帝君的板砖出处考据',
      tag: '4 格',
      tagColor: '#FF6FB7',
    },
    {
      ts: '3 天前',
      title: '《葛饰北斋 × 阿尔托利亚》短篇',
      body: '从「财宝」推论到神奈川冲浪里的笑点收尾',
      tag: '4 格',
      tagColor: '#B388FF',
    },
    {
      ts: '5 天前',
      title: '《五条悟 × 伊地知》师徒梗',
      body: '辞职信 + 加班费 + 六眼三连击经典',
      tag: '4 格',
      tagColor: '#7AE7FF',
    },
  ],
}

const TAB_LABEL: Record<TabId, string> = {
  memory: '记忆 · Memory',
  plan: '计划 · Plan',
  social: '社交 · Social',
  doujin: '二创 · Doujin',
}

export default function AgentPage(): JSX.Element {
  const [tab, setTab] = useState<TabId>('memory')
  const profile = mockTown.getMascotProfile(DEFAULT_MASCOT)
  const items = TAB_DATA[tab]

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(123, 58, 200, 0.18) 0%, rgba(14, 16, 24, 1) 65%)',
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
        {/* Hero */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 24,
            padding: 24,
            background:
              'linear-gradient(135deg, rgba(20, 12, 32, 0.88) 0%, rgba(40, 18, 70, 0.88) 100%)',
            border: `1px solid ${profile.persona_color}55`,
            borderRadius: 20,
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.55), 0 0 36px ${profile.persona_color}22`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/mascots/${DEFAULT_MASCOT}/portrait_64.png`}
            alt={profile.display_name_zh}
            width={144}
            height={144}
            style={{
              width: 144,
              height: 144,
              imageRendering: 'pixelated',
              border: `3px solid ${profile.persona_color}`,
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: 12,
              boxShadow: `0 0 24px ${profile.persona_color}66`,
              animation: 'agentPortraitBreath 2.4s ease-in-out infinite',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '0.3em',
                  color: 'rgba(245, 245, 247, 0.55)',
                  fontFamily: '"JetBrains Mono", monospace',
                  marginBottom: 6,
                }}
              >
                MY AGENT
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
                  铃音 <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(245, 245, 247, 0.65)', fontFamily: 'monospace' }}>Rinne</span>
                </h1>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: `${profile.persona_color}33`,
                    border: `1px solid ${profile.persona_color}88`,
                    fontSize: 12,
                    color: profile.persona_color,
                    fontWeight: 700,
                  }}
                >
                  {profile.display_name_zh}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(245, 245, 247, 0.85)',
                  marginTop: 8,
                  fontStyle: 'italic',
                }}
              >
                ⭐ 今日执念：「{profile.catchphrase.zh}」
              </div>
            </div>

            {/* 三条进度 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              <Stat label="厨力" value={87} color="#FF6FB7" icon="💖" />
              <Stat label="能量" value={72} color="#7AE7FF" icon="⚡" />
              <Stat label="心情" value={85} color="#B6FF6F" icon="😊" />
            </div>

            {/* 装备槽 */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(245, 245, 247, 0.55)',
                  letterSpacing: '0.2em',
                  fontFamily: '"JetBrains Mono", monospace',
                  marginBottom: 6,
                }}
              >
                EQUIPMENT
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {EQUIPMENT.map((eq) => (
                  <div
                    key={eq.name}
                    title={`${eq.name} ${eq.stat}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${eq.color}66`,
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{eq.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 12 }}>
                        {eq.name}
                      </div>
                      <div style={{ color: eq.color, fontFamily: 'monospace', fontSize: 10 }}>
                        {eq.stat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4 Tab */}
        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(20, 12, 32, 0.88) 0%, rgba(35, 18, 60, 0.88) 100%)',
            border: '1px solid rgba(255, 111, 183, 0.25)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            role="tablist"
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {(Object.keys(TAB_LABEL) as TabId[]).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  color: tab === id ? '#FFFFFF' : 'rgba(245, 245, 247, 0.55)',
                  borderBottom: tab === id ? '2px solid #FF6FB7' : '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 160ms ease',
                }}
              >
                {TAB_LABEL[id]}
              </button>
            ))}
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((it, idx) => (
              <article
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr auto',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'rgba(245, 245, 247, 0.55)',
                    fontFamily: '"JetBrains Mono", monospace',
                    paddingTop: 2,
                  }}
                >
                  {it.ts}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>
                    {it.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(245, 245, 247, 0.75)', lineHeight: 1.5 }}>
                    {it.body}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: `${it.tagColor}22`,
                    color: it.tagColor,
                    border: `1px solid ${it.tagColor}55`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.tag}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <Link
            href="/demo/scan"
            style={{
              flex: 1,
              maxWidth: 280,
              padding: '14px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255, 111, 183, 0.65)',
              background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 6px 18px rgba(255, 111, 183, 0.45)',
              letterSpacing: '0.04em',
            }}
          >
            📷 重新扫码切换 Agent
          </Link>
          <Link
            href="/demo/quiz"
            style={{
              flex: 1,
              maxWidth: 280,
              padding: '14px 20px',
              borderRadius: 10,
              border: '1px solid rgba(122, 231, 255, 0.55)',
              background: 'rgba(122, 231, 255, 0.10)',
              color: '#7AE7FF',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            🧪 重新测一测
          </Link>
        </section>

        <style>{`
          @keyframes agentPortraitBreath {
            0%, 100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(-3px) scale(1.04); }
          }
        `}</style>
      </main>
    </div>
  )
}

interface StatProps {
  label: string
  value: number
  color: string
  icon: string
}
function Stat({ label, value, color, icon }: StatProps): JSX.Element {
  return (
    <div
      style={{
        padding: '8px 10px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          marginBottom: 4,
        }}
      >
        <span style={{ color: 'rgba(245, 245, 247, 0.85)' }}>
          {icon} {label}
        </span>
        <span style={{ color, fontFamily: 'monospace', fontWeight: 700 }}>{value} / 100</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color} 0%, #FF6FB7 100%)`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  )
}
