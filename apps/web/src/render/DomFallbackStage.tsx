'use client'

/**
 * DomFallbackStage
 *
 * 任务 11.7 落地件。Phaser 完全跑不起来时（WebGL+Canvas 双双失败 / 模块动态
 * import 报错 / 浏览器极端老旧）兜底渲染：
 *   1. `<img>` 加载 `town_static_snapshot.png`（任务 8.4 / 11.8 产物）作为底图。
 *   2. 在底图上叠加几个绝对定位的 `<div>` 模拟精灵，让画面"看起来仍像小镇"，
 *      绝不白屏（design.md §1.8 降级矩阵 + R7.1 / R15.6 / R29.42）。
 *   3. 顶部红条提示「降级模式 · DOM 静态视图」，与 design.md §2.8 DEGRADED MODE
 *      视觉同款。
 *   4. 底部 `aria-live="polite"` 文案告知用户原因 + 推荐浏览器。
 *
 * 关键约束：
 *   - **绝不 `import` Phaser**：本组件就是 Phaser 加载失败时的最后一道防线，
 *     任何对 phaser bundle 的引用都会让自己也炸。检查办法：
 *     `grep -R "phaser" apps/web/src/render/DomFallbackStage.tsx` 应当为空。
 *   - **不依赖任何 motion 库**（Framer Motion 等）：该组件可能在浏览器只剩 100%
 *     CSS 兼容性的极端环境里跑（Phaser 跑不起来通常意味着 GPU/JS 引擎限制），
 *     所以纯 Tailwind / CSS 即可。
 *   - **类型自洽**：mascotType 走宽松字符串 + 安全 fallback，避免与
 *     `@erciyuan/types` 中 `MascotType` 的演进发生强耦合。
 */

import type { CSSProperties } from 'react'

/** 默认快照路径，与 task 8.4 产物 / `assets/fallback/town_static_snapshot.png` 对齐。 */
const DEFAULT_SNAPSHOT_SRC = '/assets/fallback/town_static_snapshot.png'

/** 默认降级原因文案 — 与 PhaserBridge 旧版 fallback 文案保持一致。 */
const DEFAULT_REASON =
  '渲染引擎暂不可用，已切换至 DOM 静态视图。请刷新或更换浏览器（建议 Chrome 90+ / Edge / Safari 14+）。'

/** mascot_type → CSS 变量名（与 globals.css 中的 `--mascot-*` 一一对应）。 */
const MASCOT_COLOR_VAR: Record<string, string> = {
  cat_lore:       'var(--mascot-cat-lore)',
  dog_social:     'var(--mascot-dog-social)',
  hamster_hoard:  'var(--mascot-hamster-hoard)',
  fox_create:     'var(--mascot-fox-create)',
  slime_newbie:   'var(--mascot-slime-newbie)',
  wolf_limited:   'var(--mascot-wolf-limited)',
  pigeon_buzz:    'var(--mascot-pigeon-buzz)',
}

/** 未识别 mascotType 时的兜底色（neutral mid-tone）。 */
const FALLBACK_MASCOT_COLOR = 'var(--mascot-slime-newbie)'

export interface DomFallbackSprite {
  /** 角色稳定 id；用作 React key。 */
  id: string
  /** 横向位置（百分比 0–100，相对 stage 宽度）。 */
  x: number
  /** 纵向位置（百分比 0–100，相对 stage 高度）。 */
  y: number
  /** 浮在精灵上方的小气泡文案，例如名字 / 当前动作。 */
  label: string
  /** 7 类 mascot_type 之一；未识别时回落为 slime_newbie 配色。 */
  mascotType: string
}

export interface DomFallbackStageProps {
  /** 静态快照路径，默认 `/assets/fallback/town_static_snapshot.png`。 */
  snapshotSrc?: string
  /** 要在快照上叠加的精灵列表；默认 3 只小镇代表性萌宠。 */
  sprites?: DomFallbackSprite[]
  /** 降级原因文案，会渲染到底部 `<div role="status">`。 */
  reason?: string
}

/**
 * 默认精灵：3 只覆盖广场 / 漫展 / 谷子三大主场，让兜底画面也能"讲点小镇故事"。
 * 坐标按 design.md §1.2 中 64×64 Tile 主图的功能区比例换算到百分比。
 */
const DEFAULT_SPRITES: DomFallbackSprite[] = [
  { id: 'cat_lore_demo',     x: 30, y: 40, label: '考据猫', mascotType: 'cat_lore' },
  { id: 'dog_social_demo',   x: 50, y: 60, label: '扩列犬', mascotType: 'dog_social' },
  { id: 'pigeon_buzz_demo',  x: 70, y: 45, label: '咕咕鸽', mascotType: 'pigeon_buzz' },
]

export function DomFallbackStage(props: DomFallbackStageProps): JSX.Element {
  const {
    snapshotSrc = DEFAULT_SNAPSHOT_SRC,
    sprites = DEFAULT_SPRITES,
    reason = DEFAULT_REASON,
  } = props

  return (
    <div
      data-testid="dom-fallback-stage"
      role="region"
      aria-label="次元小镇降级模式静态视图"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        backgroundColor: 'var(--neutral-deep-navy)',
        borderRadius: 'inherit',
      }}
    >
      {/* 底图：town_static_snapshot.png，pointer-events:none 防止挡住未来叠加的 UI。
          有意使用原生 `<img>` 而非 `next/image`：本组件就是 Phaser bundle 加载失败
          时的兜底，必须保持对 Next.js 客户端运行时（包括 next/image 的图片优化
          路由）零依赖，否则 next/image 自身的 hydration 故障会再次连累兜底渲染。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={snapshotSrc}
        alt="次元小镇静态截图（降级模式）"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* DEGRADED MODE 红条 — design.md §2.8 视觉同款 */}
      <div
        role="alert"
        aria-live="assertive"
        className="bg-danger text-highlight"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          backgroundImage:
            'linear-gradient(90deg, var(--semantic-danger) 0%, #FF8B6F 100%)',
          boxShadow: '0 2px 8px rgba(255, 111, 111, 0.35)',
          zIndex: 10,
        }}
      >
        <span aria-hidden="true">⚠</span>
        <span>降级模式 · DOM 静态视图</span>
      </div>

      {/* 模拟精灵叠加层 */}
      {sprites.map((sprite) => {
        const color = MASCOT_COLOR_VAR[sprite.mascotType] ?? FALLBACK_MASCOT_COLOR
        const wrapperStyle: CSSProperties = {
          position: 'absolute',
          left: `${sprite.x}%`,
          top: `${sprite.y}%`,
          // 64×64 精灵：translate -50% -50% 让锚点落在中心
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          zIndex: 5,
        }
        const spriteStyle: CSSProperties = {
          width: '64px',
          height: '64px',
          borderRadius: '12px',
          backgroundColor: color,
          opacity: 0.85,
          boxShadow:
            '0 6px 16px rgba(0, 0, 0, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.18)',
        }
        const labelStyle: CSSProperties = {
          padding: '2px 8px',
          borderRadius: '9999px',
          backgroundColor: 'var(--neutral-highlight)',
          color: 'var(--neutral-deep-navy)',
          fontSize: '11px',
          fontFamily: '"Ark Pixel", monospace',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 0 rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(26, 26, 26, 0.35)',
        }

        return (
          <div
            key={sprite.id}
            data-testid={`dom-fallback-sprite-${sprite.id}`}
            style={wrapperStyle}
          >
            <span style={labelStyle}>{sprite.label}</span>
            <div
              style={spriteStyle}
              aria-label={`${sprite.label} (${sprite.mascotType})`}
              role="img"
            />
          </div>
        )
      })}

      {/* 底部状态条：告诉用户为什么走到这里、推荐操作 */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '10px 16px',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'var(--neutral-glass-white)',
          backgroundColor: 'rgba(14, 16, 24, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        {reason}
      </div>
    </div>
  )
}

export default DomFallbackStage
