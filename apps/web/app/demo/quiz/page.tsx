'use client'

/**
 * /demo/quiz — 测一测互动页（独立 demo 路由）
 *
 * **目的**：5 分钟内让评委亲手做一遍测一测、看到 7 类萌宠权重向量真实
 * 跳动、最终被判定为某一类萌宠并跳转到 `/demo/isekai?mascot=<type>`
 * 转生过场。这是 task 14.3 / 14.4 / R18 / R19 的"路演必跑"主链路核心。
 *
 * **演出脚本**：
 *   1. 进度条顶部（"第 1 / 3 题"）
 *   2. 题目 prompt（取 mock-town `quizzes` 前 3 道 must_run）
 *   3. 7 个选项 A..G 立体卡片，hover 高亮，点击后即时累加权重并下一题
 *   4. 第 3 题答完 → 计算 `resolveMascotFromVector(weights)` →
 *      显示"你是 XXX"卡片 + 关键字段（display_name / catchphrase /
 *      core_traits / recommended_zone）
 *   5. CTA「进入小镇」按钮 → push `/demo/isekai?mascot=<resolved>` 触发
 *      转生过场，演示一气呵成
 *
 * 数据全部来自 `@erciyuan/mock-town`：quizzes / mascotProfiles /
 * resolveMascotFromVector — 真实业务接口，非伪数据。
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType, MascotWeightVector, QuizQuestion } from '@erciyuan/mock-town'

const ZERO_VECTOR: MascotWeightVector = {
  cat_lore: 0,
  dog_social: 0,
  hamster_hoard: 0,
  fox_create: 0,
  slime_newbie: 0,
  wolf_limited: 0,
  pigeon_buzz: 0,
}

function addVectors(a: MascotWeightVector, b: MascotWeightVector): MascotWeightVector {
  return {
    cat_lore: a.cat_lore + b.cat_lore,
    dog_social: a.dog_social + b.dog_social,
    hamster_hoard: a.hamster_hoard + b.hamster_hoard,
    fox_create: a.fox_create + b.fox_create,
    slime_newbie: a.slime_newbie + b.slime_newbie,
    wolf_limited: a.wolf_limited + b.wolf_limited,
    pigeon_buzz: a.pigeon_buzz + b.pigeon_buzz,
  }
}

const MASCOT_LABELS: Record<MascotType, { zh: string; color: string }> = {
  cat_lore: { zh: '考据猫', color: '#A78BFA' },
  dog_social: { zh: '扩列犬', color: '#FFA864' },
  hamster_hoard: { zh: '囤囤鼠', color: '#D8C5A8' },
  fox_create: { zh: '太太狐', color: '#F0DCC8' },
  slime_newbie: { zh: '云仔', color: '#A8D8FF' },
  wolf_limited: { zh: '限定狼', color: '#325082' },
  pigeon_buzz: { zh: '咕咕鸽', color: '#FFC8DC' },
}

const MASCOT_ORDER: MascotType[] = [
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
]

export default function QuizPage(): JSX.Element {
  const router = useRouter()

  // 取前 3 道 must_run 题（R29.14）
  const questions: QuizQuestion[] = useMemo(
    () => mockTown.quizzes.filter((q) => q.must_run).slice(0, 3),
    [],
  )

  const [step, setStep] = useState(0) // 0..N-1 题目 / N 结果
  const [vector, setVector] = useState<MascotWeightVector>(ZERO_VECTOR)
  const [animating, setAnimating] = useState(false)

  const total = questions.length
  const isResult = step >= total

  const resolved: MascotType = useMemo(() => {
    if (!isResult) return 'slime_newbie'
    return mockTown.resolveMascotFromVector(vector)
  }, [vector, isResult])

  function pick(weights: MascotWeightVector): void {
    if (animating) return
    setAnimating(true)
    const next = addVectors(vector, weights)
    setVector(next)
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 280)
  }

  function reset(): void {
    setStep(0)
    setVector(ZERO_VECTOR)
  }

  // 当前题目
  const currentQ = questions[step]

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(123, 58, 200, 0.20) 0%, rgba(14, 16, 24, 1) 65%)',
        color: '#F5F5F7',
        fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* 顶部 logo + 标题 */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background:
                'radial-gradient(circle, #FF6FB7 0%, #7AE7FF 60%, #B6FF6F 100%)',
              boxShadow: '0 0 12px rgba(255, 111, 183, 0.65)',
            }}
          />
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              letterSpacing: '0.04em',
            }}
          >
            次元小镇 · 测一测
          </h1>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.55)',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {isResult ? '结果' : `第 ${step + 1} / ${total} 题`}
          </span>
        </header>

        {/* 进度条 */}
        <div
          aria-hidden
          style={{
            height: 6,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: isResult ? '100%' : `${((step + 1) / total) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #FF6FB7 0%, #B388FF 50%, #7AE7FF 100%)',
              boxShadow: '0 0 8px rgba(255, 111, 183, 0.45)',
              transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>

        {/* 题目 / 结果区 */}
        {!isResult && currentQ ? (
          <QuizCard q={currentQ} onPick={pick} animating={animating} />
        ) : (
          <ResultCard
            mascotType={resolved}
            vector={vector}
            onRetry={reset}
            onEnter={() => router.push(`/demo/isekai?mascot=${resolved}`)}
          />
        )}

        {/* 底部小结：当前 7 类向量实时显示 */}
        {!isResult && (
          <VectorPanel vector={vector} />
        )}

        <footer
          style={{
            marginTop: 12,
            textAlign: 'center',
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.45)',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          ✦ 7 类萌宠 · 49 权重 / 题 · 测一测真实评估
        </footer>
      </div>
    </main>
  )
}

interface QuizCardProps {
  q: QuizQuestion
  onPick: (weights: MascotWeightVector) => void
  animating: boolean
}

function QuizCard({ q, onPick, animating }: QuizCardProps): JSX.Element {
  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: '1px solid rgba(255, 111, 183, 0.30)',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        opacity: animating ? 0.4 : 1,
        transition: 'opacity 240ms ease',
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          margin: 0,
          color: '#FFFFFF',
          letterSpacing: '0.02em',
          lineHeight: 1.5,
        }}
      >
        Q. {q.prompt}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        {q.options.map((opt, idx) => {
          // 找出该选项最强的 1-2 类萌宠（做 hint badge）
          const strong = (Object.entries(opt.weights) as Array<[MascotType, number]>)
            .filter(([, w]) => w >= 0.6)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
          return (
            <button
              key={opt.key}
              type="button"
              disabled={animating}
              onClick={() => onPick(opt.weights)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: 10,
                cursor: animating ? 'wait' : 'pointer',
                color: '#FFFFFF',
                fontSize: 14,
                lineHeight: 1.45,
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 160ms ease',
                opacity: animating ? 0.6 : 1,
                gridColumn: idx === 6 ? 'span 2' : 'span 1',
              }}
              onMouseEnter={(e) => {
                if (animating) return
                e.currentTarget.style.background = 'rgba(255, 111, 183, 0.18)'
                e.currentTarget.style.borderColor = 'rgba(255, 111, 183, 0.55)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 111, 183, 0.30)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.10)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: '0 0 auto',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  boxShadow: '0 2px 6px rgba(255, 111, 183, 0.45)',
                }}
              >
                {opt.key}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block' }}>{opt.text}</span>
                {strong.length > 0 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      gap: 4,
                      marginTop: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    {strong.map(([type, w]) => (
                      <span
                        key={type}
                        style={{
                          fontSize: 10,
                          fontFamily: '"JetBrains Mono", monospace',
                          color: MASCOT_LABELS[type].color,
                          background: `${MASCOT_LABELS[type].color}22`,
                          border: `1px solid ${MASCOT_LABELS[type].color}55`,
                          padding: '1px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {MASCOT_LABELS[type].zh} +{w.toFixed(2)}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

interface VectorPanelProps {
  vector: MascotWeightVector
}

function VectorPanel({ vector }: VectorPanelProps): JSX.Element {
  // 找出当前最大值用于做相对长度
  const maxVal = Math.max(0.01, ...Object.values(vector))

  return (
    <section
      aria-label="当前 7 类萌宠权重"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'rgba(245, 245, 247, 0.55)',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        实时权重向量
      </div>
      {MASCOT_ORDER.map((type) => {
        const v = vector[type]
        const ratio = (v / maxVal) * 100
        const label = MASCOT_LABELS[type]
        return (
          <div
            key={type}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
          >
            <span
              style={{
                width: 56,
                color: 'rgba(245, 245, 247, 0.85)',
                flexShrink: 0,
                fontFamily: 'var(--font-pixel-zh, sans-serif)',
              }}
            >
              {label.zh}
            </span>
            <div
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${ratio}%`,
                  height: '100%',
                  background: label.color,
                  boxShadow: `0 0 6px ${label.color}66`,
                  transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
            <span
              style={{
                width: 40,
                textAlign: 'right',
                fontFamily: '"JetBrains Mono", monospace',
                color: 'rgba(245, 245, 247, 0.65)',
                flexShrink: 0,
              }}
            >
              {v.toFixed(2)}
            </span>
          </div>
        )
      })}
    </section>
  )
}

interface ResultCardProps {
  mascotType: MascotType
  vector: MascotWeightVector
  onRetry: () => void
  onEnter: () => void
}

function ResultCard({ mascotType, vector, onRetry, onEnter }: ResultCardProps): JSX.Element {
  const profile = mockTown.getMascotProfile(mascotType)
  const label = MASCOT_LABELS[mascotType]

  // 排序 top 3 显示在结果页
  const top3 = (Object.entries(vector) as Array<[MascotType, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: `1px solid ${label.color}88`,
        borderRadius: 16,
        padding: 24,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.55), 0 0 32px ${label.color}33`,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'quizResultPop 600ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/assets/mascots/${mascotType}/portrait_64.png`}
          alt={profile.display_name_zh}
          width={96}
          height={96}
          style={{
            width: 96,
            height: 96,
            imageRendering: 'pixelated',
            border: `2px solid ${label.color}`,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 8,
            boxShadow: `0 0 16px ${label.color}66`,
            animation: 'quizMascotBreath 2.4s ease-in-out infinite',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(245, 245, 247, 0.65)',
              letterSpacing: '0.12em',
              fontFamily: '"JetBrains Mono", monospace',
              marginBottom: 4,
            }}
          >
            你的萌宠人格是
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: label.color,
              letterSpacing: '0.02em',
              textShadow: `0 0 12px ${label.color}55`,
            }}
          >
            {profile.display_name_zh}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(245, 245, 247, 0.65)',
              fontFamily: '"JetBrains Mono", monospace',
              marginTop: 4,
              letterSpacing: '0.06em',
            }}
          >
            {profile.display_name_romaji}
          </div>
        </div>
      </div>

      {/* catchphrase */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 10,
          fontSize: 14,
          fontStyle: 'italic',
          color: 'rgba(245, 245, 247, 0.92)',
          fontFamily: 'var(--font-pixel-zh, sans-serif)',
          lineHeight: 1.5,
        }}
      >
        「{profile.catchphrase.zh}」
      </div>

      {/* core_traits */}
      <div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.55)',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          核心特质
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profile.core_traits.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 999,
                background: `${label.color}1A`,
                border: `1px solid ${label.color}55`,
                color: label.color,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* recommended_zone */}
      <div
        style={{
          fontSize: 13,
          color: 'rgba(245, 245, 247, 0.85)',
          padding: '8px 12px',
          background: 'rgba(122, 231, 255, 0.10)',
          border: '1px solid rgba(122, 231, 255, 0.35)',
          borderRadius: 8,
        }}
      >
        ✦ 你的主场分区是 <strong style={{ color: '#7AE7FF' }}>{profile.recommended_zone}</strong>
      </div>

      {/* TOP 3 权重 */}
      <div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.55)',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          权重 TOP 3
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top3.map(([type, w], idx) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: 'rgba(245, 245, 247, 0.85)',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background:
                    idx === 0
                      ? 'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 100%)'
                      : idx === 1
                      ? 'linear-gradient(135deg, #B6FF6F 0%, #7AE7FF 100%)'
                      : 'rgba(255, 255, 255, 0.10)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <span style={{ width: 64, fontFamily: 'var(--font-pixel-zh, sans-serif)' }}>
                {MASCOT_LABELS[type].zh}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 4,
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    width: `${(w / Math.max(0.01, top3[0]![1])) * 100}%`,
                    height: '100%',
                    background: MASCOT_LABELS[type].color,
                  }}
                />
              </span>
              <span
                style={{
                  width: 40,
                  textAlign: 'right',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: MASCOT_LABELS[type].color,
                }}
              >
                {w.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: 'rgba(245, 245, 247, 0.85)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
          }}
        >
          再测一遍
        </button>
        <button
          type="button"
          onClick={onEnter}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${label.color}88`,
            background: `linear-gradient(135deg, ${label.color} 0%, #FF6FB7 100%)`,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-pixel-zh, sans-serif)',
            boxShadow: `0 6px 18px ${label.color}55`,
            letterSpacing: '0.04em',
          }}
        >
          🌸 转生为 {profile.display_name_zh} · 进入小镇
        </button>
      </div>

      <style>{`
        @keyframes quizResultPop {
          0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes quizMascotBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-3px) scale(1.03); }
        }
      `}</style>
    </section>
  )
}
