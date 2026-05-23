'use client'

/**
 * CharacterDetail — task 13.5
 *
 * Smallville 风「角色细节卡」React 组件，复刻 Stanford Generative Agents
 * demo 中右侧角色详情面板的排版（design.md §2.6）。
 *
 * 卡片内容（自上而下）：
 *  - 顶部头：64×64 头像（mascot portrait_64.png） + 中文 display_name +
 *    Persona Tag pill（背景用 mascot persona_color，文字白色）
 *  - Activity 段：标题 + 当前 action_label（与 12.5 ActionLabelLayer 同源；
 *    `is brewing coffee` / `is heading to plaza` 一类）；标签底色按
 *    next_action.kind 走 ThoughtStream 同款配色（move=cyan / tool=pink /
 *    speak=lime / idle=灰）
 *  - Plan 段：标题 + 一行最新 thought_trace.plan
 *  - Recent Memory Top 5：5 条 observation 短文本（每条一行 ≤ 50 字符
 *    截断）；mascot mock 暂无完整 memory 系统（task 17.5 接管），现阶段
 *    用最近 10 条 thought_trace 缓冲取 observation 字段替代
 *
 * 数据源与时序：
 *  - `engine.subscribeThought()`（13.3 已实装）：每条 thought 进 buffer，
 *    保留最近 10 条；从中取最新 plan + 最近 5 条 observation 作为 memory
 *  - `engine.subscribeActionLabel()`（12.5 已实装）：维护当前 action_label
 *    + next_action.kind（kind 取自最新 thought trace，因为 ServerMsg
 *    `action_label` 自身不携带 kind，需要从同 char_id 最新 trace 推断）
 *
 * 角色选择：
 *  - 默认 `mock_char_dog_social_alpha`（与 TownScene.spawnDefaultSprites
 *    第一个角色一致；TownScene.followCamera 也优先选它）
 *  - 后续 task 11.6 / 17.5 会接管选角逻辑（如根据 followCamera 跟随目标
 *    动态切换），目前固定显示这只
 *
 * 视觉约束（严格按 design.md §2.6）：
 *  - 头像 64×64，2px accentPink 边框
 *  - 段落标题：14px / 600 weight（design 写 16px 标题 + 14px 内容；
 *    本卡片在 Bento 4 列 × 3 行的紧凑空间内取 §2.6 表格里的 14/13 数值
 *    避免溢出）
 *  - 段落内容：13px / 400 weight
 *  - 段落间距：12px，分隔线 1px rgba(255,255,255,0.08)
 *  - 卡片本身用 GlassCard hoverable=false
 *
 * Reference: design.md §2.6 (角色细节卡 Smallville 排版复刻).
 */

import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  Action,
  MascotProfile,
  ThoughtTrace,
} from '@erciyuan/mock-town'
import { mockTown } from '@erciyuan/mock-town'

import type { ActionLabelEvent, RenderEngine, ThoughtEvent } from '@/render/RenderEngine'
import { resolveMascotTypeFromCharId } from '@/render/MockTimelineDriver'

import { GlassCard, GlassCardHeader } from './GlassCard'

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** 默认显示的角色：与 TownScene.spawnDefaultSprites 首位一致。 */
const DEFAULT_CHARACTER_ID = 'mock_char_dog_social_alpha'

/** thought_trace buffer 上限：保留最近 10 条；其中最近 5 条作为 memory 显示。 */
const TRACE_BUFFER_LIMIT = 10
const RECENT_MEMORY_TOP_N = 5

/** Recent Memory 单行最大字符（design.md §2.6 排版约束）。 */
const MEMORY_LINE_MAX_LEN = 50

/** Activity 标签（next_action.kind）颜色 token，与 ThoughtStream 同款。 */
const KIND_COLORS: Record<Action['kind'], string> = {
  move: '#7AE7FF',
  tool: '#FF6FB7',
  speak: '#B6FF6F',
  idle: 'rgba(245, 245, 247, 0.55)',
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 截断长 observation 到 50 字符内（design.md §2.6）。中文按 `length` 即可，
 * 因为常见 BMP 内字符一字一码元；emoji 在 50 边界处被切到 surrogate 时
 * 视觉上变成乱码，但 mock-town observation 全是中英混排，不触发该 case。
 */
function truncateMemoryLine(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length <= MEMORY_LINE_MAX_LEN) return trimmed
  return `${trimmed.slice(0, MEMORY_LINE_MAX_LEN - 1)}…`
}

/**
 * 把 hex `#RRGGBB` 转成 `rgba(r, g, b, alpha)`；非 hex 输入原样返回。
 * 用于从 mascot persona_color 派生 pill 背景半透明色（直接用满色太刺眼）。
 */
function withAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-fA-F]{6})$/)
  if (!m || !m[1]) return hex
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 把 mascot_type 解析为 portrait_64.png 资源路径。约定与
 * `apps/web/public/assets/mascots/{mascot_type}/portrait_64.png` 严格一致
 * （由 sync-assets.mjs 同步）。char_id 不可解析时返回 fallback 头像。
 */
function resolvePortraitUrl(charId: string): { url: string; mascotType: string | null } {
  const mascotType = resolveMascotTypeFromCharId(charId) ?? null
  if (mascotType) {
    return { url: `/assets/mascots/${mascotType}/portrait_64.png`, mascotType }
  }
  // fallback：与 RenderEngine.DEFAULT_ASSET_MANIFEST.spriteDefaultUrl 同图。
  return { url: '/assets/fallback/fallback_character.png', mascotType: null }
}

/**
 * 解析 mascot 元数据（display_name / persona_color / catchphrase / core_traits）。
 * 解析失败（slime_newbie / wolf_limited 等也都覆盖）→ 返回兜底文案，避免
 * 卡片直接显示 `undefined`。
 */
function resolveMascotMeta(charId: string): {
  displayName: string
  personaTag: string
  personaColor: string
  catchphrase: string
} {
  const mascotType = resolveMascotTypeFromCharId(charId)
  if (mascotType) {
    const profile: MascotProfile = mockTown.getMascotProfile(mascotType)
    return {
      displayName: profile.display_name_zh,
      // persona_tag 在 mock 数据里以 mascot 主标签呈现：取 core_traits 第一条
      // 作为视觉用 pill（避免显示英文枚举名 'cat_lore'）。
      personaTag: profile.core_traits[0] ?? mascotType,
      personaColor: profile.persona_color,
      catchphrase: profile.catchphrase.zh,
    }
  }
  return {
    displayName: charId,
    personaTag: '路人甲',
    personaColor: '#7AE7FF',
    catchphrase: '',
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export interface CharacterDetailProps {
  /**
   * RenderEngine 实例。由 page.tsx hoist 后透传，与 TownStage / ThoughtStream
   * 共享同一份事件流（thought + action_label）。
   */
  engine: RenderEngine
  /**
   * 显示哪个 character_id 的细节。未传时使用默认（mock_char_dog_social_alpha）。
   * 后续 task 11.6 / 17.5 会接管动态选角，目前固定即可。
   */
  characterId?: string
}

interface ActivityState {
  label: string | null
  /** 来自最近一条同 char_id 的 thought_trace.next_action.kind，用于决定标签颜色。 */
  kind: Action['kind']
}

export function CharacterDetail({
  engine,
  characterId = DEFAULT_CHARACTER_ID,
}: CharacterDetailProps): JSX.Element {
  // 当前角色（state，留接口给后续动态切换）。
  const [activeCharId] = useState<string>(characterId)

  // thought_trace buffer：最近 10 条同 char_id 的 trace，时间倒序（新在前）。
  const traceBufferRef = useRef<ThoughtTrace[]>([])
  // tick 触发重渲染（buffer 变更）。
  const [, forceTick] = useState(0)

  // 当前 Activity 状态：label 文本 + kind 颜色（kind 推断自最新 trace）。
  const [activity, setActivity] = useState<ActivityState>({ label: null, kind: 'idle' })

  // ── 订阅 thought 事件流 ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (event: ThoughtEvent): void => {
      // 仅累积当前关注角色的 trace；其他角色的 thought 直接忽略。
      if (event.charId !== activeCharId) return
      const next = [event.trace, ...traceBufferRef.current]
      if (next.length > TRACE_BUFFER_LIMIT) next.length = TRACE_BUFFER_LIMIT
      traceBufferRef.current = next
      // 同步 Activity kind：以最新 trace.next_action.kind 为准（label 仍由
      // action_label 事件单独驱动，因为 mock-town timeline 中 thought 与
      // action_label 不同步）。
      setActivity((prev) => ({ label: prev.label, kind: event.trace.next_action.kind }))
      forceTick((n) => (n + 1) | 0)
    }
    return engine.subscribeThought(handler)
  }, [engine, activeCharId])

  // ── 订阅 action_label 事件流 ──────────────────────────────────────────
  // 与 12.5 ActionLabelLayer 同源；本卡片只展示当前关注角色的 label。
  useEffect(() => {
    const handler = (event: ActionLabelEvent): void => {
      if (event.charId !== activeCharId) return
      setActivity((prev) => ({ label: event.label, kind: prev.kind }))
    }
    return engine.subscribeActionLabel(handler)
  }, [engine, activeCharId])

  // ── 派生数据 ──────────────────────────────────────────────────────────
  const meta = useMemo(() => resolveMascotMeta(activeCharId), [activeCharId])
  const portrait = useMemo(() => resolvePortraitUrl(activeCharId), [activeCharId])

  const traces = traceBufferRef.current
  // 最新 plan：buffer 头部第一条；尚无数据时显示 mascot catchphrase 占位。
  const latestPlan: string =
    traces[0]?.plan ?? (meta.catchphrase || '正在等待第一条 thought_trace…')

  // Recent Memory Top 5：从 buffer 取最近 5 条 observation，去重 + 截断。
  const recentMemories: Array<{ key: string; ts: number; text: string }> = useMemo(() => {
    const seen = new Set<string>()
    const items: Array<{ key: string; ts: number; text: string }> = []
    for (const t of traces) {
      const trimmed = truncateMemoryLine(t.observation)
      if (!trimmed || seen.has(trimmed)) continue
      seen.add(trimmed)
      items.push({ key: t.trace_id, ts: t.ts, text: trimmed })
      if (items.length >= RECENT_MEMORY_TOP_N) break
    }
    return items
  }, [traces])

  // ── Render ────────────────────────────────────────────────────────────
  const activityColor = KIND_COLORS[activity.kind]

  return (
    <GlassCard
      as="section"
      variant="primary"
      density="normal"
      hoverable={false}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        gap: 12,
      }}
      aria-label={`角色细节卡 — ${meta.displayName}`}
    >
      <GlassCardHeader>
        <span>👤 角色细节</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(245, 245, 247, 0.45)',
          }}
        >
          Smallville
        </span>
      </GlassCardHeader>

      {/* ── 顶部头：64×64 头像 + 姓名 + Persona Tag ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* 头像；image-rendering: pixelated 让像素图保持锐利，不被浏览器抗锯齿糊掉。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portrait.url}
          alt={`${meta.displayName} 头像`}
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            border: '2px solid #FF6FB7',
            background: '#0E1018',
            imageRendering: 'pixelated',
            flex: '0 0 auto',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.2,
              color: '#F5F5F7',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={meta.displayName}
          >
            {meta.displayName}
          </div>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              background: meta.personaColor,
              color: '#FFFFFF',
              boxShadow: `0 0 0 1px ${withAlpha(meta.personaColor, 0.5)}`,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={meta.personaTag}
          >
            {meta.personaTag}
          </span>
        </div>
      </div>

      {/* ── Activity 段 ── */}
      <Section title="Activity">
        {activity.label ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 4,
              background: withAlpha(activityColor.startsWith('#') ? activityColor : '#7AE7FF', 0.18),
              color: activityColor,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-pixel-en, var(--font-mono, monospace))',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: activityColor,
                flex: '0 0 auto',
              }}
            />
            {activity.label}
          </span>
        ) : (
          <span style={{ color: 'rgba(245, 245, 247, 0.45)', fontSize: 13 }}>idle</span>
        )}
      </Section>

      {/* ── Plan 段 ── */}
      <Section title="Plan">
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgba(245, 245, 247, 0.85)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={latestPlan}
        >
          {latestPlan}
        </p>
      </Section>

      {/* ── Recent Memory Top 5 ── */}
      <Section title={`Recent Memory · Top ${RECENT_MEMORY_TOP_N}`}>
        {recentMemories.length === 0 ? (
          <span style={{ color: 'rgba(245, 245, 247, 0.45)', fontSize: 13 }}>
            等待 observation 累积…
          </span>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {recentMemories.map((m) => (
              <li
                key={m.key}
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  color: 'rgba(245, 245, 247, 0.75)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={m.text}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'rgba(122, 231, 255, 0.6)',
                    marginRight: 6,
                    verticalAlign: 'middle',
                  }}
                  aria-hidden="true"
                />
                {m.text}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </GlassCard>
  )
}

/* -------------------------------------------------------------------------- */
/* Section sub-component                                                      */
/* -------------------------------------------------------------------------- */

interface SectionProps {
  title: string
  children: React.ReactNode
}

/**
 * 通用段落容器：14px 标题 + body slot。design.md §2.6 表格里的「标题字号
 * 14px / 内容字号 13px / 段落间距 12px」严格落地。
 */
function Section({ title, children }: SectionProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: 'rgba(245, 245, 247, 0.65)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  )
}

export default CharacterDetail
