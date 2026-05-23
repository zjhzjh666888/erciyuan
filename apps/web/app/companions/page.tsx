'use client'

/**
 * /companions — 搭子匹配独立页（TASK 7 多页面跳转骨架）
 *
 * 内容：
 *   - 顶部：SiteNav 通用导航
 *   - Hero 标题区："找搭子 · Companions"
 *   - 7 + 1 类型筛选 Tab（按 mascot_type 分类，使用 persona_color 染色）
 *   - 排序按钮（按 match_score 降序 / 按 wanted_companion_types 数量降序）
 *   - 卡片网格：22 张搭子 NPC 卡（cat_lore×3 / dog_social×4 / hamster_hoard×3 /
 *     fox_create×3 / slime_newbie×3 / wolf_limited×3 / pigeon_buzz×3）
 *   - 每张卡片渲染 R24.3 全部 7 + 必填字段：mascot_avatar / mascot_type /
 *     display_name / common_interests / match_score / wanted_companion_types /
 *     ice_breaker（target_convention_id 可选）
 *   - 主按钮 [加好友 →] alert 模拟发送好友请求
 *   - 底部说明：全部为 NPC 搭子（is_npc=true），真实用户接入后自动替换
 *
 * 数据来源：`@erciyuan/mock-town`
 *   - mockTown.companions
 *   - mockTown.getMascotProfile(mascot_type) → display_name_zh / persona_color / catchphrase.zh
 *   - mockTown.conventions → 根据 target_convention_id 显示漫展简称
 */

import { useMemo, useState } from 'react'

import { mockTown } from '@erciyuan/mock-town'
import type { CompanionCard, CompanionType, MascotType } from '@erciyuan/mock-town'

import { SiteNav } from '../_components/SiteNav'

// ── 11 类 CompanionType 中文映射 ───────────────────────────────────────────
const COMPANION_TYPE_ZH: Record<CompanionType, string> = {
  convention: '漫展',
  cos: 'Cos',
  photo: '拍照',
  booth: '逛摊',
  goods: '买谷',
  same_ip: '同作',
  same_city: '同城',
  duet: '合拍',
  newbie: '萌新',
  limited: '限定',
  doujin: '二创',
}

// ── 7 类 mascot_type 顺序（与 R29.6 保持一致） ─────────────────────────────
const MASCOT_TYPE_ORDER: MascotType[] = [
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
]

type FilterType = 'all' | MascotType
type SortBy = 'score' | 'types'

// ── match_score → 颜色映射 ────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 90) return '#B6FF6F'
  if (score >= 80) return '#7AE7FF'
  if (score >= 70) return '#FFD66F'
  return 'rgba(245, 245, 247, 0.55)'
}

// ── 漫展简称（city + name 前 8 字符） ─────────────────────────────────────
function conventionLabel(convention_id: string | undefined): string | null {
  if (!convention_id) return null
  const conv = mockTown.conventions.find((c) => c.convention_id === convention_id)
  if (!conv) return null
  const shortName = conv.name.length > 8 ? `${conv.name.slice(0, 8)}…` : conv.name
  return `${conv.city} · ${shortName}`
}

export default function CompanionsPage(): JSX.Element {
  const [selectedType, setSelectedType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('score')

  const displayList = useMemo<CompanionCard[]>(() => {
    const filtered =
      selectedType === 'all'
        ? mockTown.companions
        : mockTown.companions.filter((c) => c.mascot_type === selectedType)
    const sorted = [...filtered]
    if (sortBy === 'score') {
      sorted.sort((a, b) => b.match_score - a.match_score)
    } else {
      sorted.sort(
        (a, b) =>
          b.wanted_companion_types.length - a.wanted_companion_types.length ||
          b.match_score - a.match_score,
      )
    }
    return sorted
  }, [selectedType, sortBy])

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(255, 168, 100, 0.10) 0%, rgba(14, 16, 24, 1) 65%)',
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
        {/* Hero 标题区 */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background:
                'linear-gradient(135deg, #FFA864 0%, #FF6FB7 50%, #B388FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            找搭子 · Companions
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(245, 245, 247, 0.65)',
            }}
          >
            22 个 NPC 搭子待领取 · 7 类萌宠 / 11 类匹配 / 一键破冰
          </p>
        </header>

        {/* 筛选 + 排序栏 */}
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
          }}
        >
          {/* 7 + 1 类型 chip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <FilterChip
              label="全部"
              active={selectedType === 'all'}
              color="#FFA864"
              onClick={() => setSelectedType('all')}
            />
            {MASCOT_TYPE_ORDER.map((m) => {
              const profile = mockTown.getMascotProfile(m)
              return (
                <FilterChip
                  key={m}
                  label={profile.display_name_zh}
                  active={selectedType === m}
                  color={profile.persona_color}
                  onClick={() => setSelectedType(m)}
                />
              )
            })}
          </div>

          {/* 排序按钮 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <SortButton
              label="按匹配度 ↓"
              active={sortBy === 'score'}
              onClick={() => setSortBy('score')}
            />
            <SortButton
              label="按搭子类型多 ↓"
              active={sortBy === 'types'}
              onClick={() => setSortBy('types')}
            />
          </div>
        </section>

        {/* 卡片网格 */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {displayList.map((c) => (
            <CompanionCardItem key={c.companion_id} card={c} />
          ))}
        </section>

        {/* 底部说明 */}
        <footer
          style={{
            marginTop: 8,
            padding: 12,
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(245, 245, 247, 0.55)',
            borderTop: '1px dashed rgba(255, 168, 100, 0.20)',
          }}
        >
          全部为 NPC 搭子（is_npc=true），真实用户接入后自动替换
        </footer>

        <style>{`
          @keyframes companionCardEnter {
            0%   { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// FilterChip — mascot_type 切换 chip（使用 persona_color 染色）
// ────────────────────────────────────────────────────────────────────────
interface FilterChipProps {
  label: string
  active: boolean
  color: string
  onClick: () => void
}
function FilterChip({ label, active, color, onClick }: FilterChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? color : `${color}22`,
        color: active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.85)',
        border: active ? `1px solid ${color}` : `1px solid ${color}55`,
        boxShadow: active ? `0 4px 12px ${color}66` : 'none',
        fontFamily: 'inherit',
        transition: 'all 160ms ease',
      }}
    >
      {label}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────
// SortButton — 简洁次级按钮
// ────────────────────────────────────────────────────────────────────────
interface SortButtonProps {
  label: string
  active: boolean
  onClick: () => void
}
function SortButton({ label, active, onClick }: SortButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        background: active ? 'rgba(255, 168, 100, 0.30)' : 'rgba(255, 255, 255, 0.05)',
        color: active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.65)',
        border: active
          ? '1px solid rgba(255, 168, 100, 0.65)'
          : '1px solid rgba(255, 255, 255, 0.10)',
        fontFamily: 'inherit',
        transition: 'all 160ms ease',
      }}
    >
      {label}
    </button>
  )
}

// ────────────────────────────────────────────────────────────────────────
// CompanionCardItem — 单张搭子卡片
// ────────────────────────────────────────────────────────────────────────
interface CompanionCardItemProps {
  card: CompanionCard
}
function CompanionCardItem({ card }: CompanionCardItemProps): JSX.Element {
  const profile = mockTown.getMascotProfile(card.mascot_type)
  const convLabel = conventionLabel(card.target_convention_id)
  const sColor = scoreColor(card.match_score)
  const [hovered, setHovered] = useState(false)

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 16,
        background:
          'linear-gradient(180deg, rgba(28, 18, 40, 0.92) 0%, rgba(20, 14, 30, 0.92) 100%)',
        border: `1px solid ${profile.persona_color}55`,
        borderRadius: 14,
        boxShadow: hovered
          ? `0 12px 32px ${profile.persona_color}55, 0 0 0 1px ${profile.persona_color}88`
          : '0 4px 12px rgba(0, 0, 0, 0.35)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        animation: 'companionCardEnter 320ms ease-out both',
      }}
    >
      {/* match_score 角标 */}
      <span
        title="match_score"
        style={{
          position: 'absolute', top: 12, right: 12,
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(0, 0, 0, 0.45)',
          border: `1px solid ${sColor}88`,
          fontSize: 13, fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          color: sColor, textShadow: `0 0 8px ${sColor}66`,
        }}
      >
        ❤️ {card.match_score}%
      </span>

      {/* 头像区 */}
      <div
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6, paddingTop: 4,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/${card.mascot_avatar}`}
          alt={card.display_name}
          width={120}
          height={120}
          style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `3px solid ${profile.persona_color}`,
            background: `${profile.persona_color}15`,
            boxShadow: `0 0 24px ${profile.persona_color}44`,
            imageRendering: 'pixelated', objectFit: 'cover',
          }}
        />
        <span
          style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            background: `${profile.persona_color}33`,
            border: `1px solid ${profile.persona_color}88`,
            fontSize: 11, fontWeight: 700, color: '#FFFFFF',
          }}
        >
          {profile.display_name_zh}
        </span>
      </div>

      {/* 主标题 + catchphrase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
          {card.display_name}
        </h3>
        <p
          style={{
            margin: 0, fontSize: 12, fontStyle: 'italic',
            color: 'rgba(245, 245, 247, 0.55)',
          }}
        >
          {profile.catchphrase.zh}
        </p>
      </div>

      {/* 共同兴趣 */}
      <div>
        <div style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)', marginBottom: 4 }}>
          共同兴趣
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {card.common_interests.map((tag) => (
            <span
              key={tag}
              style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(245, 245, 247, 0.80)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 想找的搭子 */}
      <div>
        <div style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)', marginBottom: 4 }}>
          想找的搭子
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {card.wanted_companion_types.map((t) => (
            <span
              key={t}
              style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: `${profile.persona_color}22`,
                color: profile.persona_color,
                border: `1px solid ${profile.persona_color}55`,
              }}
            >
              {COMPANION_TYPE_ZH[t]}
            </span>
          ))}
        </div>
      </div>

      {/* 漫展（可选） */}
      {convLabel && (
        <div
          style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 12,
            background: 'rgba(255, 168, 100, 0.10)',
            border: '1px solid rgba(255, 168, 100, 0.25)',
            color: 'rgba(255, 200, 160, 0.95)',
          }}
        >
          🎫 {convLabel}
        </div>
      )}

      {/* 破冰文案 */}
      <div
        style={{
          padding: 10, borderRadius: 8, fontSize: 12,
          fontStyle: 'italic', lineHeight: 1.5,
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px dashed rgba(255, 255, 255, 0.10)',
          color: 'rgba(245, 245, 247, 0.85)',
        }}
      >
        💬 {card.ice_breaker}
      </div>

      {/* 主按钮 */}
      <button
        type="button"
        onClick={() => alert(`已向 ${card.display_name} 发送好友请求！`)}
        style={{
          marginTop: 'auto', padding: '10px 14px', borderRadius: 10,
          border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: `linear-gradient(135deg, ${profile.persona_color} 0%, #FF6FB7 100%)`,
          color: '#FFFFFF',
          boxShadow: `0 6px 16px ${profile.persona_color}66`,
          fontFamily: 'inherit',
          transition: 'transform 120ms ease',
        }}
      >
        加好友 →
      </button>
    </article>
  )
}
