'use client'

/**
 * /demo/isekai — 异世界转生入场过场页（独立 demo 路由）
 *
 * **目的**：让评委在 5 秒内感受到"我真的从扫码进入了次元小镇"的仪式感。
 * 这是 design.md §1.4 与 R2.5 / R29.30 / R20.2 描述的关键体验之一，
 * Slice 0 没做、产品壳也没做 — 现在补上一个 stand-alone 路由。
 *
 * **演出脚本（约 6 秒）**：
 *   t=0.0s: 屏幕暗转，紫黑底色出现"扫码识别中…"
 *   t=0.5s: 中央粉色光柱炸开（径向放射 + 模糊）
 *   t=1.5s: 24 颗粒子从中心向四周飞散（CSS 关键帧，固定路径，不依赖 JS rAF）
 *   t=2.5s: 萌宠从光柱中现身（fade-in + scale + bounce）
 *   t=3.5s: 中文标题"你已转生为「考据猫」"+ 罗马音
 *   t=5.0s: 副标题"5 秒后进入小镇..." + 倒计时
 *   t=6.0s: 自动跳转 `/`（评委可点"立即进入"按钮提前跳）
 *
 * **互动**：URL 参数 `?mascot=cat_lore`（默认 cat_lore）选择转生哪类萌宠；
 * 7 类各支持。所有动画走 CSS keyframe，无外部依赖。
 *
 * 与 CC 在做的产品壳完全独立，路径 /demo/isekai 不冲突。
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'

const VALID_MASCOTS: MascotType[] = [
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
]

function isMascotType(v: string | null): v is MascotType {
  return !!v && (VALID_MASCOTS as string[]).includes(v)
}

/** 24 颗粒子飞散方向（角度 ∈ [0, 360)），种子固定让动画跨刷新一致。 */
const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2
  return {
    key: `p${i}`,
    dx: Math.cos(angle) * 100, // % of viewport
    dy: Math.sin(angle) * 100,
    delay: (i % 6) * 0.04,
    size: 6 + ((i * 13) % 8),
  }
})

function IsekaiInner(): JSX.Element {
  const router = useRouter()
  const params = useSearchParams()
  const requested = params?.get('mascot') ?? null
  const mascotType: MascotType = isMascotType(requested) ? requested : 'cat_lore'
  const userName = (params?.get('name') ?? '').trim()

  const profile = useMemo(() => mockTown.getMascotProfile(mascotType), [mascotType])

  /** 演出阶段：0=开场暗 / 1=光柱 / 2=粒子 / 3=萌宠现身 / 4=标题 / 5=倒计时 */
  const [phase, setPhase] = useState(0)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500)
    const t2 = setTimeout(() => setPhase(2), 1500)
    const t3 = setTimeout(() => setPhase(3), 2500)
    const t4 = setTimeout(() => setPhase(4), 3500)
    const t5 = setTimeout(() => setPhase(5), 5000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [])

  // 倒计时 5..0，到 0 自动 push /
  useEffect(() => {
    if (phase < 5) return
    if (countdown <= 0) {
      router.push('/')
      return
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown, router])

  // 尝试播放音效（用户可能因浏览器策略没声音；不报错）
  useEffect(() => {
    if (phase !== 1) return
    const a = new Audio('/assets/audio/isekai_jingle.mp3')
    a.volume = 0.55
    a.play().catch(() => {
      /* autoplay blocked, silent ok */
    })
    return () => {
      a.pause()
      a.currentTime = 0
    }
  }, [phase])

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, #2a103a 0%, #0e0a1f 60%, #050308 100%)',
        color: '#FFFFFF',
        fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 阶段 0/1: 中央粉色光柱（径向 + scale 进场） */}
      {phase >= 1 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 600,
            height: 600,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(255, 200, 220, 0.95) 0%, rgba(255, 111, 183, 0.65) 25%, rgba(179, 136, 255, 0.35) 55%, transparent 75%)',
            filter: 'blur(2px)',
            animation: 'isekaiPillarBurst 1.6s var(--easing-anime, cubic-bezier(0.22, 1, 0.36, 1)) forwards',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 阶段 2: 24 颗粒子从中心飞散 */}
      {phase >= 2 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
          }}
        >
          {PARTICLES.map((p) => (
            <span
              key={p.key}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 200, 220, 0.85) 45%, rgba(122, 231, 255, 0.6) 75%, transparent 100%)',
                boxShadow: '0 0 12px rgba(255, 200, 220, 0.85)',
                animation: `isekaiParticleFly_${p.key} 2.2s ease-out ${p.delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* 阶段 3: 萌宠现身 */}
      {phase >= 3 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            animation: 'isekaiMascotAppear 1.2s var(--easing-anime, cubic-bezier(0.22, 1, 0.36, 1)) forwards',
            opacity: 0,
            filter: `drop-shadow(0 0 20px ${profile.persona_color}) drop-shadow(0 0 50px ${profile.persona_color})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/mascots/${mascotType}/portrait_64.png`}
            alt={profile.display_name_zh}
            style={{
              width: 192,
              height: 192,
              imageRendering: 'pixelated',
              animation: 'isekaiMascotBreath 2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* 阶段 4: 标题 */}
      {phase >= 4 && (
        <div
          style={{
            position: 'absolute',
            top: '70%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            textAlign: 'center',
            zIndex: 6,
            animation: 'isekaiTitleSlide 0.8s var(--easing-anime, cubic-bezier(0.22, 1, 0.36, 1)) forwards',
            opacity: 0,
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.4em',
              color: 'rgba(255, 200, 220, 0.85)',
              marginBottom: 8,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            ISEKAI · 转生成功
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '0.04em',
              background:
                'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 30%, #B388FF 70%, #7AE7FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: `0 0 20px ${profile.persona_color}88`,
              fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
            }}
          >
            {userName
              ? `${userName} · 转生为「${profile.display_name_zh}」`
              : `你已转生为「${profile.display_name_zh}」`}
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(245, 245, 247, 0.65)',
              marginTop: 6,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.08em',
            }}
          >
            {profile.display_name_romaji}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(245, 245, 247, 0.85)',
              marginTop: 16,
              fontStyle: 'italic',
            }}
          >
            「{profile.catchphrase.zh}」
          </div>
        </div>
      )}

      {/* 阶段 5: 倒计时 + 主 CTA */}
      {phase >= 5 && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            zIndex: 7,
            animation: 'isekaiCtaFade 0.6s ease-out forwards',
            opacity: 0,
          }}
        >
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              padding: '12px 32px',
              borderRadius: 999,
              border: '1px solid rgba(255, 111, 183, 0.65)',
              background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              boxShadow:
                '0 0 24px rgba(255, 111, 183, 0.55), 0 8px 24px rgba(0, 0, 0, 0.4)',
              fontFamily: 'var(--font-pixel-zh, sans-serif)',
            }}
          >
            🌸 立即进入次元小镇
          </button>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.55)',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {countdown > 0 ? `${countdown} 秒后自动进入...` : '正在进入...'}
          </div>
        </div>
      )}

      {/* 顶部小标 */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          fontSize: 12,
          color: 'rgba(245, 245, 247, 0.45)',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.12em',
        }}
      >
        ✦ AniTown · 异世界转生协议 v1.0
      </div>
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          fontSize: 11,
          color: 'rgba(245, 245, 247, 0.45)',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        ?mascot=cat_lore | dog_social | fox_create | hamster_hoard | slime_newbie | wolf_limited | pigeon_buzz
      </div>

      {/* 关键帧 */}
      <style>{`
        @keyframes isekaiPillarBurst {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          30%  { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
          60%  { transform: translate(-50%, -50%) scale(1.15); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; }
        }
        @keyframes isekaiMascotAppear {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes isekaiMascotBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-6px) scale(1.04); }
        }
        @keyframes isekaiTitleSlide {
          0%   { opacity: 0; transform: translate(-50%, 16px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes isekaiCtaFade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(8px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        ${PARTICLES.map(
          (p) => `@keyframes isekaiParticleFly_${p.key} {
            0%   { opacity: 0; transform: translate(-50%, -50%); }
            8%   { opacity: 1; transform: translate(-50%, -50%); }
            100% { opacity: 0; transform: translate(calc(-50% + ${p.dx}vw), calc(-50% + ${p.dy}vh)) scale(0.3); }
          }`,
        ).join('\n')}
      `}</style>
    </main>
  )
}

export default function IsekaiPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0e0a1f',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          扫码识别中…
        </div>
      }
    >
      <IsekaiInner />
    </Suspense>
  )
}
