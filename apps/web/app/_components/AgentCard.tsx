'use client'

/**
 * AgentCard — 左栏「我的 Agent」侧栏
 *
 * 用 user-provided `ui_agent_card.png`（粉色 chibi 立绘 + 进度条 + 装备槽）
 * 当背景大图，再叠一层信息文本（display_name / persona_tag / 厨力 / 执念 /
 * 操作按钮）。这样视觉立刻拥有图1 那种产品壳质感，不需要从零绘制。
 *
 * 数据：从 mock-town `mascotProfiles.cat_lore` 取（默认显示 "考据猫" 作为
 * 玩家分身）。后续 Slice 3 task 14.4 接入 quiz 结果后会动态切换。
 *
 * 视觉栈（从下到上）：
 *   1. 整张 art-06 大图，object-fit: cover
 *   2. 半透明粉紫渐变 overlay（让叠加文字可读）
 *   3. 文字层（display_name / persona_tag / 厨力进度 / 当日执念 / 装备槽 /
 *      扫码召唤按钮）
 */

import { mockTown } from '@erciyuan/mock-town'

const DEFAULT_MASCOT = 'cat_lore' as const

export function AgentCard(): JSX.Element {
  const profile = mockTown.getMascotProfile(DEFAULT_MASCOT)

  return (
    <aside
      aria-label="我的 Agent 卡"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 111, 183, 0.35)',
        background: '#1a1027',
      }}
    >
      {/* 底层：用户提供的 ai-生成 chibi 立绘 + 进度条 整张大图 */}
      <img
        src="/assets/art/ui_agent_card.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          imageRendering: 'auto',
        }}
      />

      {/* 渐变 overlay：让顶部 / 底部叠加文字可读 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(20, 12, 32, 0.55) 0%, rgba(20, 12, 32, 0) 30%, rgba(20, 12, 32, 0) 65%, rgba(20, 12, 32, 0.85) 100%)',
        }}
      />

      {/* 顶部：标题 + 编辑按钮（图1 同位置） */}
      <header
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FF6FB7',
              boxShadow: '0 0 6px rgba(255, 111, 183, 0.8)',
            }}
          />
          我的Agent
        </span>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.65)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ✎
        </button>
      </header>

      {/* 底部：mascot 信息条 + 操作按钮 */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: '#FFFFFF',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.02em',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            {profile.display_name_zh}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.85)',
              fontFamily: '"JetBrains Mono", monospace',
              marginTop: 2,
            }}
          >
            {profile.display_name_romaji} · {profile.core_traits[0]}
          </div>
        </div>

        {/* 厨力进度条（粉色，复刻 art-06 视觉） */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              marginBottom: 3,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            <span>♥ 厨力值</span>
            <span style={{ fontFamily: 'monospace' }}>87 / 100</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '87%',
                height: '100%',
                background:
                  'linear-gradient(90deg, #FF6FB7 0%, #B388FF 100%)',
                boxShadow: '0 0 8px rgba(255, 111, 183, 0.5)',
              }}
            />
          </div>
        </div>

        {/* 执念 */}
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.85)',
            background: 'rgba(255, 111, 183, 0.18)',
            padding: '4px 8px',
            borderRadius: 6,
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
            border: '1px solid rgba(255, 111, 183, 0.35)',
          }}
        >
          ⭐ 今日执念：{profile.catchphrase.zh}
        </div>

        {/* 标签栏：记忆 / 计划 / 社交 / 二创 */}
        <div style={{ display: 'flex', gap: 4, fontSize: 10, fontFamily: 'monospace' }}>
          {['记忆', '计划', '社交', '二创'].map((t, i) => (
            <span
              key={t}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.20)',
                background: i === 3 ? 'rgba(122, 231, 255, 0.25)' : 'transparent',
                color: i === 3 ? '#7AE7FF' : 'rgba(255, 255, 255, 0.75)',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* 主 CTA */}
        <button
          type="button"
          style={{
            marginTop: 4,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255, 111, 183, 0.55)',
            background: 'linear-gradient(90deg, #FF6FB7 0%, #B388FF 100%)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 111, 183, 0.4)',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
          }}
        >
          📷 扫码转生 / 召唤我的Agent
        </button>
        <div
          style={{
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.55)',
            textAlign: 'center',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
          }}
        >
          扫描二维码，让你的角色入住小镇
        </div>
      </div>
    </aside>
  )
}

export default AgentCard
