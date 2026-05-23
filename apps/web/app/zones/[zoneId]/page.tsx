'use client'

/**
 * /zones/[zoneId] — 7 大主题分区动态独立页（task 7 多页面跳转骨架）
 *
 * 7 个合法 zoneId（R25.1 主场对应关系）：
 *   - Convention_Plaza   → dog_social      漫展广场     🎪
 *   - Cos_Studio         → fox_create      Cos 摄影区   📸
 *   - Goods_Bazaar       → hamster_hoard   谷子交换区   🎒
 *   - Doujin_Atelier     → fox_create      同人创作阁   🖌️
 *   - Newbie_Lobby       → slime_newbie    新人接引区   🌱
 *   - Limited_Info_House → wolf_limited    限定情报屋   ⚡
 *   - Buzz_Square        → pigeon_buzz     情报广场     📡
 *
 * 数据源：
 *   - `mockTown.mascotProfiles` 反查"该 zone 推荐什么 mascot"
 *   - `mockTown.companions` 过滤 wanted_companion_types 与 typical_companions 有交集
 *   - `mockTown.conventions` 过滤 suitable_personas 含 primary_mascot
 *
 * 视觉模式：
 *   - 顶部 `<SiteNav />`；其余全 inline style，不依赖 globals.css
 *   - 整页背景使用 ZONE_META[zoneId].bg_gradient
 *   - 主色按 zone 切换；Hero 三栏 + 底部 7 zone 切换 chip
 *   - 不在 7 类中渲染 404 卡片 + "返回小镇" 按钮
 */

import Link from 'next/link'

import { mockTown } from '@erciyuan/mock-town'
import type {
  CompanionCard,
  CompanionType,
  ConventionCard,
  MascotType,
  ZoneId,
} from '@erciyuan/mock-town'

import { SiteNav } from '../../_components/SiteNav'

// ─── 11 类搭子类型 → 中文短标签（R24.2 与 conventions / companions 页一致） ───
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

// ─── ZoneMeta 内置常量表 ───────────────────────────────────────────────────

interface ZoneMeta {
  name_zh: string
  name_jp: string
  emoji: string
  /** 主色 hex */
  color: string
  /** 整页背景径向渐变 */
  bg_gradient: string
  /** 50–80 字介绍 */
  description: string
  /** 一句话氛围 */
  vibe: string
  /** R25.1 主场对应 mascot */
  primary_mascot: MascotType
  /** 次推荐 mascot */
  secondary_mascots: MascotType[]
  /** 该 zone 典型搭子类型 */
  typical_companions: CompanionType[]
  /** 4–6 条 mock 近期动态 */
  recent_events: Array<{ ts: string; actor: string; text: string }>
}

const ZONE_IDS: ZoneId[] = [
  'Convention_Plaza',
  'Cos_Studio',
  'Goods_Bazaar',
  'Doujin_Atelier',
  'Newbie_Lobby',
  'Limited_Info_House',
  'Buzz_Square',
]

const ZONE_META: Record<ZoneId, ZoneMeta> = {
  Convention_Plaza: {
    name_zh: '漫展广场',
    name_jp: '漫展ひろば',
    emoji: '🎪',
    color: '#FFA864',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(255, 168, 100, 0.18) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '六场漫展的入口集散地，扩列犬·阿汪在这里组织漫展同行、同城聚会和应援打 call。',
    vibe: '人声鼎沸 · 名片满天飞',
    primary_mascot: 'dog_social',
    secondary_mascots: ['pigeon_buzz', 'slime_newbie'],
    typical_companions: ['convention', 'cos', 'photo', 'same_city'],
    recent_events: [
      { ts: '12:45', actor: '扩列犬·阿汪', text: '在 IDO 漫展招募 cos 同行 → 已 12 人响应' },
      { ts: '12:32', actor: '咕咕鸽·情报', text: '现场播报：CCG 三号馆雷电将军走秀开始' },
      { ts: '12:18', actor: '社交达人·小桃', text: '约到 5 个搭子明天一起拍炭治郎×祢豆子' },
      { ts: '11:55', actor: '热场担当·麻里', text: 'LL 应援团扩招完成，新增 8 名萌新' },
      { ts: '11:30', actor: '广场之王·豆豆', text: '萤火虫漫展第二天 10 人聚餐报名截止' },
    ],
  },
  Cos_Studio: {
    name_zh: 'Cos 摄影区',
    name_jp: 'コス撮影所',
    emoji: '📸',
    color: '#FFC8DC',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(255, 200, 220, 0.16) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '太太狐和扩列犬共建的拍照区，一键调色、逆光打光模板、双人合拍机位齐全。',
    vibe: '逆光闪烁 · 反光板乱飞',
    primary_mascot: 'fox_create',
    secondary_mascots: ['dog_social'],
    typical_companions: ['cos', 'photo', 'duet', 'doujin'],
    recent_events: [
      { ts: '12:50', actor: '画板狐·苍墨', text: '上传五条悟逆光打光模板 v3，已 1.2k 收藏' },
      { ts: '12:33', actor: '社交达人·小桃', text: '征拍立得搭子拍祢豆子 → 已找到 3 位' },
      { ts: '12:08', actor: '剧本狐·夜墨', text: '玛奇玛×阿丽塔 AMV 配乐征集中' },
      { ts: '11:42', actor: '太太狐·墨狐', text: '钟离×黄泉双人合拍机位空出，约人' },
    ],
  },
  Goods_Bazaar: {
    name_zh: '谷子交换区',
    name_jp: 'グッズ広場',
    emoji: '🎒',
    color: '#D8C5A8',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(216, 197, 168, 0.16) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '囤囤鼠的领域，吧唧拼单、立牌排列癖、痛包搭配建议、稀有度雷达全在这里。',
    vibe: '吧唧叮当 · 痛包炸街',
    primary_mascot: 'hamster_hoard',
    secondary_mascots: ['wolf_limited'],
    typical_companions: ['goods', 'booth', 'limited'],
    recent_events: [
      { ts: '12:48', actor: '囤囤鼠·小米', text: 'CP29 黄泉吧唧拼单余 1 位，限 5 分钟' },
      { ts: '12:30', actor: '谷子守护者', text: 'CCG 限定立牌排队最优路线已发布' },
      { ts: '12:12', actor: '徽章帝·阿橡', text: '收换：2008 鸣人徽章 → 菲伦立牌' },
      { ts: '11:50', actor: '限定狼·孤狙', text: '黄泉立牌价格趋势更新：已涨 38%' },
    ],
  },
  Doujin_Atelier: {
    name_zh: '同人创作阁',
    name_jp: '同人アトリエ',
    emoji: '🖌️',
    color: '#B388FF',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(179, 136, 255, 0.16) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '太太狐主持的二创圣地，4 格漫、AMV、上色搭子、剧本协作一站式齐活。',
    vibe: '画板沙沙 · 灵感爆炸',
    primary_mascot: 'fox_create',
    secondary_mascots: ['cat_lore'],
    typical_companions: ['doujin', 'same_ip', 'duet'],
    recent_events: [
      { ts: '12:44', actor: '太太狐·墨狐', text: '钟离×黄泉本子开本，差上色搭子 1 位' },
      { ts: '12:25', actor: '剧本狐·夜墨', text: '玛奇玛×阿丽塔短篇剧本完稿，6 页' },
      { ts: '12:02', actor: '考据酱·凛', text: '芙莉莲时间线考据 v3 已上架' },
      { ts: '11:38', actor: '画板狐·苍墨', text: '咒术回战 AMV 剪辑模板共享' },
    ],
  },
  Newbie_Lobby: {
    name_zh: '新人接引区',
    name_jp: '初心者ロビー',
    emoji: '🌱',
    color: '#A8D8FF',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(168, 216, 255, 0.18) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '云仔的温柔乡，第一次逛漫展、初次 cos、入坑指南、求带搭子全在这里破冰。',
    vibe: '萌新颤抖 · 神坛降临',
    primary_mascot: 'slime_newbie',
    secondary_mascots: ['dog_social'],
    typical_companions: ['newbie', 'same_city'],
    recent_events: [
      { ts: '12:46', actor: '云仔·咕嘟', text: '"第一次去漫展紧张到睡不着……求带"' },
      { ts: '12:28', actor: '果冻·小蓝', text: '阿尼亚发型贴片 5 步教程 → 已 200 收藏' },
      { ts: '12:10', actor: '萌新云仔·豆乳', text: 'LL 入坑路线咨询 → 已配对 2 位老司机' },
      { ts: '11:45', actor: '热场担当·麻里', text: '今晚 21:00 LL 萌新 Snow halation 教学' },
    ],
  },
  Limited_Info_House: {
    name_zh: '限定情报屋',
    name_jp: '限定情報屋',
    emoji: '⚡',
    color: '#325082',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(50, 80, 130, 0.20) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '限定狼的孤狼基地，抢票队列、二级市场行情、稀有度趋势 Excel 24h 更新。',
    vibe: '冷光闪烁 · 0:00 准点',
    primary_mascot: 'wolf_limited',
    secondary_mascots: ['hamster_hoard'],
    typical_companions: ['limited', 'goods', 'convention'],
    recent_events: [
      { ts: '12:50', actor: '限定狼·孤狙', text: 'CP29 抢票队列已就绪，0 漏配置完成' },
      { ts: '12:33', actor: '夜行狼·影刃', text: 'CCG 三天票首发窗口，余 2 张分票' },
      { ts: '12:15', actor: '独行狼·寒霜', text: '稀有度趋势 Excel v18 上架，免费下载' },
      { ts: '11:40', actor: '限定狼·孤狙', text: '黄牛对线战报：本周成功 3 次降价' },
    ],
  },
  Buzz_Square: {
    name_zh: '情报广场',
    name_jp: 'バズ広場',
    emoji: '📡',
    color: '#FF6FB7',
    bg_gradient:
      'radial-gradient(ellipse at top, rgba(255, 111, 183, 0.18) 0%, rgba(14, 16, 24, 1) 65%)',
    description:
      '咕咕鸽 + 考据猫双驻点，热搜榜、八卦广场、原作纠错员、现场播报麦克风全到位。',
    vibe: '麦克风嘶啦 · 瓜满天飞',
    primary_mascot: 'pigeon_buzz',
    secondary_mascots: ['cat_lore'],
    typical_companions: ['duet', 'same_ip'],
    recent_events: [
      { ts: '12:51', actor: '咕咕鸽·情报', text: 'IDO 现场 CP 联谊摊瓜：A 摊 vs B 摊' },
      { ts: '12:35', actor: '考据酱·凛', text: '芙莉莲第 6 卷设定误差 12 处考据完成' },
      { ts: '12:16', actor: '麦克风鸽·咕咕', text: '萤火虫 cos 走秀解说招募搭档主播' },
      { ts: '11:55', actor: '热搜鸽·咕喵', text: '我推 S2 第 8 话十大爆点合集发布' },
      { ts: '11:30', actor: '原典派·夜白', text: 'EVA 24 话逐帧解析直播预告' },
    ],
  },
}

// ─── 类型守卫 ───────────────────────────────────────────────────────────────
function isZoneId(value: string): value is ZoneId {
  return (ZONE_IDS as string[]).includes(value)
}

// ─── 页面组件 ──────────────────────────────────────────────────────────────
export default function ZonePage({
  params,
}: {
  params: { zoneId: string }
}): JSX.Element {
  const rawId = params.zoneId
  if (!isZoneId(rawId)) {
    return <ZoneNotFound rawId={rawId} />
  }

  const zoneId: ZoneId = rawId
  const meta = ZONE_META[zoneId]
  const primary = mockTown.getMascotProfile(meta.primary_mascot)

  // ── 搭子推荐：wanted_companion_types 与 typical_companions 有交集 ──────
  const matchedCompanions: CompanionCard[] = mockTown.companions
    .filter((c) =>
      c.wanted_companion_types.some((t) => meta.typical_companions.includes(t)),
    )
    .slice(0, 6)

  // ── 适配漫展：suitable_personas 含 primary_mascot ────────────────────
  const matchedConventions: ConventionCard[] = mockTown.conventions.filter((c) =>
    c.suitable_personas.includes(meta.primary_mascot),
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: meta.bg_gradient,
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
        <Hero meta={meta} zoneId={zoneId} primaryProfile={primary} />

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}
        >
          <RecentEventsColumn meta={meta} />
          <CompanionsColumn meta={meta} companions={matchedCompanions} />
          <ConventionsColumn meta={meta} conventions={matchedConventions} />
        </section>

        <ZoneSwitcher currentId={zoneId} />

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
          ZONE :: {zoneId} · 主场 mascot {meta.primary_mascot} · 数据源 mock-town
        </footer>
      </main>
    </div>
  )
}

// ─── Hero（左 60% 介绍 / 右 40% 推荐萌宠） ─────────────────────────────────

interface HeroProps {
  meta: ZoneMeta
  zoneId: ZoneId
  primaryProfile: ReturnType<typeof mockTown.getMascotProfile>
}
function Hero({ meta, zoneId, primaryProfile }: HeroProps): JSX.Element {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '6fr 4fr',
        gap: 20,
        padding: '24px 28px',
        background:
          'linear-gradient(135deg, rgba(20, 24, 40, 0.88) 0%, rgba(14, 18, 32, 0.88) 100%)',
        border: `1px solid ${meta.color}55`,
        borderRadius: 16,
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.55), inset 0 0 60px ${meta.color}1F`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.3em',
            color: `${meta.color}AA`,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          ZONE · {zoneId}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            aria-hidden
            style={{
              fontSize: 80,
              lineHeight: 1,
              filter: `drop-shadow(0 0 16px ${meta.color}88)`,
            }}
          >
            {meta.emoji}
          </span>
          <div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                margin: 0,
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              {meta.name_zh}
            </h1>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(245, 245, 247, 0.55)',
                marginTop: 4,
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {meta.name_jp}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(245, 245, 247, 0.85)',
          }}
        >
          {meta.description}
        </div>

        <span
          style={{
            alignSelf: 'flex-start',
            padding: '6px 14px',
            borderRadius: 999,
            background: `${meta.color}26`,
            border: `1px solid ${meta.color}88`,
            color: meta.color,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          ✦ {meta.vibe}
        </span>
      </div>

      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${primaryProfile.persona_color}66`,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 80,
              height: 80,
              borderRadius: 14,
              border: `2px solid ${primaryProfile.persona_color}`,
              background: `radial-gradient(circle at 35% 30%, ${primaryProfile.persona_color} 0%, ${primaryProfile.persona_color}55 60%, transparent 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              boxShadow: `0 0 20px ${primaryProfile.persona_color}66`,
              flexShrink: 0,
            }}
          >
            {meta.emoji}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'rgba(245, 245, 247, 0.45)',
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              主场 MASCOT
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: primaryProfile.persona_color,
              }}
            >
              {primaryProfile.display_name_zh}
            </div>
            <div
              style={{
                fontSize: 12,
                fontStyle: 'italic',
                color: 'rgba(245, 245, 247, 0.75)',
                lineHeight: 1.45,
              }}
            >
              「{primaryProfile.catchphrase.zh}」
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'rgba(245, 245, 247, 0.45)',
              fontFamily: '"JetBrains Mono", monospace',
              marginBottom: 6,
            }}
          >
            次推荐
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {meta.secondary_mascots.map((m) => {
              const p = mockTown.getMascotProfile(m)
              return (
                <span
                  key={m}
                  title={p.display_name_romaji}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: `${p.persona_color}26`,
                    border: `1px solid ${p.persona_color}88`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: p.persona_color,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: p.persona_color,
                      boxShadow: `0 0 6px ${p.persona_color}`,
                    }}
                  />
                  {p.display_name_zh}
                </span>
              )
            })}
          </div>
        </div>
      </aside>
    </section>
  )
}

// ─── 三栏：近期动态 ─────────────────────────────────────────────────────────

interface RecentEventsColumnProps {
  meta: ZoneMeta
}
function RecentEventsColumn({ meta }: RecentEventsColumnProps): JSX.Element {
  return (
    <ColumnFrame title="近期动态" color={meta.color} subtitle="ACTIVITY · LIVE">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 360,
          overflowY: 'auto',
        }}
      >
        {meta.recent_events.map((ev, i) => (
          <div
            key={`${ev.ts}-${i}`}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: meta.color,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {ev.ts}
            </span>
            <span
              style={{
                color: 'rgba(245, 245, 247, 0.55)',
                flexShrink: 0,
              }}
            >
              {ev.actor}
            </span>
            <span
              style={{
                color: 'rgba(245, 245, 247, 0.85)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {ev.text}
            </span>
          </div>
        ))}
      </div>
    </ColumnFrame>
  )
}

// ─── 三栏：搭子推荐 ─────────────────────────────────────────────────────────

interface CompanionsColumnProps {
  meta: ZoneMeta
  companions: CompanionCard[]
}
function CompanionsColumn({ meta, companions }: CompanionsColumnProps): JSX.Element {
  return (
    <ColumnFrame title="搭子推荐" color={meta.color} subtitle="COMPANIONS · MATCH">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {companions.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.45)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
            }}
          >
            暂无匹配搭子
          </div>
        )}
        {companions.map((c) => {
          const p = mockTown.getMascotProfile(c.mascot_type)
          return (
            <Link
              key={c.companion_id}
              href="/companions"
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 160ms ease, border-color 160ms ease',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `2px solid ${p.persona_color}`,
                  background: `radial-gradient(circle at 35% 30%, ${p.persona_color} 0%, ${p.persona_color}55 60%, transparent 100%)`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.display_name}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    marginTop: 2,
                  }}
                >
                  {c.wanted_companion_types.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.10)',
                        color: 'rgba(245, 245, 247, 0.65)',
                      }}
                    >
                      #{COMPANION_TYPE_ZH[t]}
                    </span>
                  ))}
                </div>
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  fontWeight: 700,
                  color: meta.color,
                  flexShrink: 0,
                }}
              >
                {c.match_score}%
              </span>
            </Link>
          )
        })}
      </div>
    </ColumnFrame>
  )
}

// ─── 三栏：适配漫展 ─────────────────────────────────────────────────────────

interface ConventionsColumnProps {
  meta: ZoneMeta
  conventions: ConventionCard[]
}
function ConventionsColumn({ meta, conventions }: ConventionsColumnProps): JSX.Element {
  return (
    <ColumnFrame title="适配漫展" color={meta.color} subtitle="CONVENTIONS · MATCH">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conventions.length === 0 && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.45)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
            }}
          >
            暂无适配漫展
          </div>
        )}
        {conventions.map((c) => (
          <Link
            key={c.convention_id}
            href="/conventions"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.35,
              }}
            >
              {c.name}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 11,
                color: 'rgba(245, 245, 247, 0.55)',
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              <span style={{ color: meta.color }}>🏙️ {c.city}</span>
              <span>{c.time_range}</span>
            </div>
          </Link>
        ))}
      </div>
    </ColumnFrame>
  )
}

// ─── 子组件：栏框（统一标题 / 边框） ───────────────────────────────────────

interface ColumnFrameProps {
  title: string
  subtitle: string
  color: string
  children: React.ReactNode
}
function ColumnFrame({ title, subtitle, color, children }: ColumnFrameProps): JSX.Element {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 14,
        background:
          'linear-gradient(180deg, rgba(20, 24, 40, 0.88) 0%, rgba(14, 18, 32, 0.88) 100%)',
        border: `1px solid ${color}3F`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: `${color}AA`,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {subtitle}
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          {title}
        </h3>
      </header>
      {children}
    </section>
  )
}

// ─── 底部 7 zone 切换 chip ─────────────────────────────────────────────────

interface ZoneSwitcherProps {
  currentId: ZoneId
}
function ZoneSwitcher({ currentId }: ZoneSwitcherProps): JSX.Element {
  return (
    <nav
      aria-label="切换功能区"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {ZONE_IDS.map((id) => {
        const m = ZONE_META[id]
        const active = id === currentId
        return (
          <Link
            key={id}
            href={`/zones/${id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: active ? `${m.color}33` : 'rgba(255, 255, 255, 0.04)',
              border: active ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.10)',
              color: active ? m.color : 'rgba(245, 245, 247, 0.75)',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: active ? `0 4px 12px ${m.color}55` : 'none',
              transition: 'all 160ms ease',
            }}
          >
            <span aria-hidden>{m.emoji}</span>
            {m.name_zh}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── 404 卡片 ──────────────────────────────────────────────────────────────

interface ZoneNotFoundProps {
  rawId: string
}
function ZoneNotFound({ rawId }: ZoneNotFoundProps): JSX.Element {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(255, 111, 183, 0.12) 0%, rgba(14, 16, 24, 1) 65%)',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <section
          style={{
            maxWidth: 480,
            width: '100%',
            padding: '32px 28px',
            background:
              'linear-gradient(180deg, rgba(20, 24, 40, 0.92) 0%, rgba(14, 18, 32, 0.92) 100%)',
            border: '1px solid rgba(255, 111, 183, 0.45)',
            borderRadius: 16,
            boxShadow:
              '0 12px 40px rgba(0, 0, 0, 0.55), inset 0 0 60px rgba(255, 111, 183, 0.10)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'rgba(255, 111, 183, 0.75)',
              fontFamily: '"JetBrains Mono", monospace',
              marginBottom: 8,
            }}
          >
            ZONE · 404
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            未知功能区 :: {rawId || '(空)'}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(245, 245, 247, 0.75)',
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            请回到小镇地图选择有效区域。次元小镇仅包含 7 大主题分区（漫展广场 / Cos
            摄影区 / 谷子交换区 / 同人创作阁 / 新人接引区 / 限定情报屋 / 情报广场）。
          </p>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '12px 28px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 16px rgba(255, 111, 183, 0.45)',
              letterSpacing: '0.04em',
            }}
          >
            ← 返回小镇
          </Link>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              justifyContent: 'center',
            }}
          >
            {ZONE_IDS.map((id) => {
              const m = ZONE_META[id]
              return (
                <Link
                  key={id}
                  href={`/zones/${id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${m.color}66`,
                    color: m.color,
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span aria-hidden>{m.emoji}</span>
                  {m.name_zh}
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
