'use client'

/**
 * /conventions — 漫展卡片墙独立页（task 7 多页面跳转骨架）
 *
 * 数据源：`@erciyuan/mock-town` 的 `mockTown.conventions`
 *   - 6 张漫展卡片，覆盖 5 个城市：上海×2 / 北京 / 广州 / 成都 / 杭州
 *   - 每张卡片渲染 R22.2 全部 10 字段：
 *       name / time_range / city / venue / suitable_personas / hot_characters
 *       recommended_outfit / recommended_companion_types / enter_town_cta
 *       related_cosvids_count（外加 related_video_ids 用于"关联视频"区）
 *
 * 视觉模式：
 *   - 顶部 `<SiteNav />`；其余全 inline style，不依赖 globals.css
 *   - 青蓝色调径向背景，区别于 /agent（紫）与 /trends（粉红）
 *   - 城市 chip 单选过滤；卡片 hover 微缩放 + 阴影增强
 *   - CTA onClick → alert(`即将进入: ${cta}`)
 */

import { useMemo, useState } from 'react'

import { mockTown } from '@erciyuan/mock-town'
import type { CompanionType, ConventionCard, MascotType } from '@erciyuan/mock-town'

import { SiteNav } from '../_components/SiteNav'

// 11 类搭子类型 → 中文短标签（R24.2 全集）
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

// 6 张卡片色板，按 conventions 顺序循环
const CARD_PALETTE = ['#FF6FB7', '#B388FF', '#7AE7FF', '#FFB86F', '#B6FF6F', '#FFA864']
const ALL_CITY = '全部'

// 子区块小标题（uppercase mono），抽成常量避免重复 inline 对象
const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.18em',
  color: 'rgba(245, 245, 247, 0.45)',
  fontFamily: '"JetBrains Mono", monospace',
  marginBottom: 6,
  textTransform: 'uppercase',
}

export default function ConventionsPage(): JSX.Element {
  const conventions = mockTown.conventions
  const [selectedCity, setSelectedCity] = useState<string>(ALL_CITY)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const cities = useMemo(
    () => [ALL_CITY, ...Array.from(new Set(conventions.map((c) => c.city)))],
    [conventions],
  )
  const filtered = useMemo(
    () =>
      selectedCity === ALL_CITY
        ? conventions
        : conventions.filter((c) => c.city === selectedCity),
    [conventions, selectedCity],
  )
  const totalVideoCount = useMemo(
    () => conventions.reduce((acc, c) => acc + c.related_cosvids_count, 0),
    [conventions],
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(122, 231, 255, 0.10) 0%, rgba(14, 16, 24, 1) 65%)',
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
            padding: '24px 28px',
            background:
              'linear-gradient(135deg, rgba(14, 30, 50, 0.88) 0%, rgba(20, 40, 70, 0.88) 100%)',
            border: '1px solid rgba(122, 231, 255, 0.35)',
            borderRadius: 16,
            boxShadow:
              '0 12px 40px rgba(0, 0, 0, 0.55), inset 0 0 60px rgba(122, 231, 255, 0.10)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'rgba(122, 231, 255, 0.65)',
              fontFamily: '"JetBrains Mono", monospace',
              marginBottom: 6,
            }}
          >
            CONVENTIONS · R22.2
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #7AE7FF 0%, #B388FF 60%, #FF6FB7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            漫展日历 · Conventions
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(245, 245, 247, 0.75)', marginTop: 8 }}>
            全国 {cities.length - 1} 城 {conventions.length} 场 · 萌宠适配 / 限定情报 /
            一键带搭子进小镇
          </div>
        </section>

        {/* 城市筛选 chip */}
        <section
          role="tablist"
          aria-label="城市筛选"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          {cities.map((city) => {
            const active = city === selectedCity
            return (
              <button
                key={city}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCity(city)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  border: active
                    ? '1px solid rgba(255, 111, 183, 0.65)'
                    : '1px solid rgba(255, 255, 255, 0.10)',
                  background: active
                    ? 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: active ? '#FFFFFF' : 'rgba(245, 245, 247, 0.75)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  boxShadow: active ? '0 4px 14px rgba(255, 111, 183, 0.45)' : 'none',
                  transition: 'all 160ms ease',
                }}
              >
                {city}
              </button>
            )
          })}
        </section>

        {/* 卡片网格 */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((c, idx) => {
            const palette =
              CARD_PALETTE[
                conventions.findIndex((x) => x.convention_id === c.convention_id) %
                  CARD_PALETTE.length
              ]!
            return (
              <ConventionCardView
                key={c.convention_id}
                card={c}
                palette={palette}
                hovered={hoverId === c.convention_id}
                onHoverChange={(on) => setHoverId(on ? c.convention_id : null)}
                idx={idx}
              />
            )
          })}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                color: 'rgba(245, 245, 247, 0.55)',
                fontSize: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
              }}
            >
              该城市暂无漫展数据
            </div>
          )}
        </section>

        {/* 底部说明 */}
        <footer
          style={{
            marginTop: 8,
            padding: '12px 16px',
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(245, 245, 247, 0.45)',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.08em',
          }}
        >
          数据来源：mock-town · {cities.length - 1} 城联运 · 共 {totalVideoCount} 条 cos 视频
        </footer>
      </main>
    </div>
  )
}

// ─── 单张漫展卡片 ─────────────────────────────────────────────────────────────

interface ConventionCardViewProps {
  card: ConventionCard
  palette: string
  hovered: boolean
  onHoverChange: (hovered: boolean) => void
  idx: number
}

function ConventionCardView({
  card,
  palette,
  hovered,
  onHoverChange,
  idx,
}: ConventionCardViewProps): JSX.Element {
  return (
    <article
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(180deg, rgba(20, 24, 40, 0.92) 0%, rgba(14, 18, 32, 0.92) 100%)',
        border: `1px solid ${palette}55`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 18px 48px rgba(0, 0, 0, 0.60), 0 0 32px ${palette}55`
          : '0 8px 24px rgba(0, 0, 0, 0.45)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
    >
      {/* 顶部色带：城市 + 时间范围 */}
      <header
        style={{
          padding: '10px 14px',
          background: `linear-gradient(90deg, ${palette}33 0%, ${palette}11 100%)`,
          borderBottom: `1px solid ${palette}55`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
        }}
      >
        <span style={{ color: palette, fontWeight: 700 }}>🏙️ {card.city}</span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            color: 'rgba(245, 245, 247, 0.85)',
          }}
        >
          {card.time_range}
        </span>
      </header>

      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          flex: 1,
        }}
      >
        {/* 名称 + 场馆 */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.35 }}>
            {card.name}
          </h2>
          <div style={{ fontSize: 12, color: 'rgba(245, 245, 247, 0.55)', marginTop: 4 }}>
            📍 {card.venue}
          </div>
        </div>

        {/* 适配萌宠 */}
        <div>
          <div style={SECTION_LABEL_STYLE}>适配萌宠</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {card.suitable_personas.map((m) => (
              <PersonaChip key={m} mascotType={m} />
            ))}
          </div>
        </div>

        {/* 热门 Cos 角色 */}
        <div>
          <div style={SECTION_LABEL_STYLE}>热门 Cos 角色</div>
          <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.92)', lineHeight: 1.5 }}>
            {card.hot_characters.join(' / ')}
          </div>
        </div>

        {/* 穿搭推荐 */}
        <div>
          <div style={SECTION_LABEL_STYLE}>穿搭推荐</div>
          <div
            style={{
              fontSize: 13,
              fontStyle: 'italic',
              color: 'rgba(245, 245, 247, 0.85)',
              lineHeight: 1.55,
            }}
          >
            👗 {card.recommended_outfit}
          </div>
        </div>

        {/* 搭子标签 */}
        <div>
          <div style={SECTION_LABEL_STYLE}>搭子标签</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {card.recommended_companion_types.map((t) => (
              <span
                key={t}
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(245, 245, 247, 0.85)',
                }}
              >
                #{COMPANION_TYPE_ZH[t]}
              </span>
            ))}
          </div>
        </div>

        {/* 关联 COS 视频 */}
        <div>
          <div style={SECTION_LABEL_STYLE}>关联 COS 视频</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.75)',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <span>🎥 共 {card.related_cosvids_count} 条</span>
            <span style={{ color: 'rgba(245, 245, 247, 0.45)', fontSize: 10 }}>
              {card.related_video_ids.join(' · ')}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => {
            // 多页面跳转骨架阶段：弹占位提示
            // eslint-disable-next-line no-alert
            alert(`即将进入: ${card.enter_town_cta}`)
          }}
          aria-label={`卡片 #${idx + 1}: ${card.enter_town_cta}`}
          style={{
            marginTop: 'auto',
            padding: '12px 16px',
            borderRadius: 10,
            border: `1px solid ${palette}88`,
            background: `linear-gradient(135deg, ${palette} 0%, #B388FF 120%)`,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: `0 6px 16px ${palette}66`,
            letterSpacing: '0.04em',
            transition: 'transform 160ms ease',
          }}
        >
          {card.enter_town_cta} →
        </button>
      </div>
    </article>
  )
}

// ─── persona chip：用 mascot persona_color ──────────────────────────────────

interface PersonaChipProps {
  mascotType: MascotType
}
function PersonaChip({ mascotType }: PersonaChipProps): JSX.Element {
  const profile = mockTown.getMascotProfile(mascotType)
  const color = profile.persona_color
  return (
    <span
      title={profile.display_name_romaji}
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        background: `${color}33`,
        border: `1px solid ${color}88`,
        fontSize: 11,
        fontWeight: 700,
        color,
      }}
    >
      {profile.display_name_zh}
    </span>
  )
}
