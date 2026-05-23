'use client'

/**
 * /scan/[token] — 手机端扫码后落地页
 *
 * 演示流程：
 *   1. 进入 → 校验 token：GET /api/scan/session/<token>，404 / consumed → 报错
 *   2. 4 步小问卷（每步用大按钮）：
 *      Step 1: 选 7 类萌宠（图标网格）
 *      Step 2: 输入昵称（1-16 字）
 *      Step 3: 选 4 阵营（星羽/霜月/琉璃/夜斗）
 *      Step 4: 输入今日执念（1-40 字）
 *   3. POST /api/scan/session/<token>/submit → 显示「角色已绑定，回桌面端」
 *
 * 视觉为大字 + 大按钮 + 单页滚动，专为手机竖屏设计。
 */

import { useCallback, useEffect, useState } from 'react'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'

interface RouteCtx {
  params: { token: string }
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

const FACTIONS = [
  { id: 'star_feather', label: '星羽', color: '#FFC8DC', tag: '应援系 · 粉色光辉' },
  { id: 'frost_moon', label: '霜月', color: '#7AE7FF', tag: '冷峻系 · 月之追猎' },
  { id: 'lapis_glaze', label: '琉璃', color: '#A78BFA', tag: '考据系 · 玻璃工艺' },
  { id: 'night_strife', label: '夜斗', color: '#B388FF', tag: '党争系 · 暗夜挑战' },
] as const

type Step = 1 | 2 | 3 | 4 | 5 // 5 = done

interface Form {
  mascotType: MascotType | null
  displayName: string
  factionId: string | null
  obsession: string
}

const INITIAL_FORM: Form = {
  mascotType: null,
  displayName: '',
  factionId: null,
  obsession: '',
}

export default function MobileScanPage(ctx: RouteCtx): JSX.Element {
  const token = ctx.params.token
  const [validating, setValidating] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 校验 token
  useEffect(() => {
    let cancelled = false
    fetch(`/api/scan/session/${token}`, { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 404) {
          setTokenError('链接已过期或无效，请回到桌面端重新生成二维码。')
          return
        }
        if (!res.ok) {
          setTokenError(`网络错误（${res.status}），请刷新重试`)
          return
        }
        const data = (await res.json()) as { status: string }
        if (data.status === 'submitted' || data.status === 'consumed') {
          setTokenError('此二维码已被使用，请回到桌面端重新生成。')
        }
      })
      .catch(() => {
        if (!cancelled) setTokenError('网络异常，请检查 WiFi 连接')
      })
      .finally(() => {
        if (!cancelled) setValidating(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const submit = useCallback(async () => {
    if (
      !form.mascotType ||
      !form.factionId ||
      form.displayName.trim().length === 0 ||
      form.obsession.trim().length === 0
    ) {
      setSubmitError('请把 4 项都填完整')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/scan/session/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          mascotType: form.mascotType,
          obsession: form.obsession.trim(),
          factionId: form.factionId,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`提交失败：${res.status} ${txt}`)
      }
      setStep(5)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'unknown')
    } finally {
      setSubmitting(false)
    }
  }, [form, token])

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(255, 111, 183, 0.18) 0%, rgba(14, 16, 24, 1) 60%)',
        color: '#F5F5F7',
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <header style={{ textAlign: 'center', paddingTop: 8 }}>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(245, 245, 247, 0.55)',
            letterSpacing: '0.3em',
            fontFamily: '"JetBrains Mono", monospace',
            marginBottom: 6,
          }}
        >
          ANITOWN · MOBILE PORTAL
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            background:
              'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 30%, #B388FF 70%, #7AE7FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          召唤你的次元 Agent
        </h1>
      </header>

      {validating ? (
        <Centered>校验扫码链接...</Centered>
      ) : tokenError ? (
        <ErrorPanel msg={tokenError} />
      ) : step === 5 ? (
        <DonePanel form={form} />
      ) : (
        <>
          <ProgressBar step={step} />
          {step === 1 && (
            <MascotStep
              value={form.mascotType}
              onChange={(v) => setForm({ ...form, mascotType: v })}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <NameStep
              value={form.displayName}
              onChange={(v) => setForm({ ...form, displayName: v })}
              onPrev={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <FactionStep
              value={form.factionId}
              onChange={(v) => setForm({ ...form, factionId: v })}
              onPrev={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <ObsessionStep
              value={form.obsession}
              onChange={(v) => setForm({ ...form, obsession: v })}
              onPrev={() => setStep(3)}
              onSubmit={submit}
              submitting={submitting}
              error={submitError}
            />
          )}
        </>
      )}

      <footer
        style={{
          marginTop: 'auto',
          fontSize: 10,
          color: 'rgba(245, 245, 247, 0.45)',
          textAlign: 'center',
          fontFamily: '"JetBrains Mono", monospace',
          paddingTop: 16,
        }}
      >
        token · {token}
      </footer>
    </main>
  )
}

/* ── 进度条 ────────────────────────────────────────────────────────── */
function ProgressBar({ step }: { step: Step }): JSX.Element {
  const progress = ((step - 1) / 4) * 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          fontSize: 12,
          color: 'rgba(245, 245, 247, 0.65)',
          textAlign: 'center',
        }}
      >
        第 {step} 步 / 共 4 步
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background:
              'linear-gradient(90deg, #FF6FB7 0%, #B388FF 50%, #7AE7FF 100%)',
            transition: 'width 360ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  )
}

/* ── 1: 选萌宠 ─────────────────────────────────────────────────────── */
interface MascotStepProps {
  value: MascotType | null
  onChange: (v: MascotType) => void
  onNext: () => void
}
function MascotStep({ value, onChange, onNext }: MascotStepProps): JSX.Element {
  return (
    <Card title="① 选择萌宠人格">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {MASCOT_ORDER.map((type) => {
          const profile = mockTown.getMascotProfile(type)
          const active = value === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                background: active
                  ? `${profile.persona_color}33`
                  : 'rgba(255, 255, 255, 0.04)',
                border: active
                  ? `2px solid ${profile.persona_color}`
                  : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: 12,
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: 13,
                transition: 'all 160ms',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/mascots/${type}/portrait_64.png`}
                alt={profile.display_name_zh}
                width={48}
                height={48}
                style={{
                  width: 48,
                  height: 48,
                  imageRendering: 'pixelated',
                  border: `1px solid ${profile.persona_color}88`,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: profile.persona_color }}>
                  {profile.display_name_zh}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(245, 245, 247, 0.65)',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {profile.core_traits[0]}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <NextBtn disabled={!value} onClick={onNext}>
        下一步：起名
      </NextBtn>
    </Card>
  )
}

/* ── 2: 起名 ───────────────────────────────────────────────────────── */
interface NameStepProps {
  value: string
  onChange: (v: string) => void
  onPrev: () => void
  onNext: () => void
}
function NameStep({ value, onChange, onPrev, onNext }: NameStepProps): JSX.Element {
  const ok = value.trim().length >= 1 && value.trim().length <= 16
  return (
    <Card title="② 起一个昵称">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20}
        placeholder="例如 铃音 / Rinne / 阿汪"
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: 18,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 111, 183, 0.45)',
          borderRadius: 10,
          color: '#FFFFFF',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      <p style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)', margin: 0 }}>
        1-16 字符，会显示在你头顶气泡上
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <PrevBtn onClick={onPrev}>上一步</PrevBtn>
        <NextBtn disabled={!ok} onClick={onNext}>
          下一步：选阵营
        </NextBtn>
      </div>
    </Card>
  )
}

/* ── 3: 选阵营 ─────────────────────────────────────────────────────── */
interface FactionStepProps {
  value: string | null
  onChange: (v: string) => void
  onPrev: () => void
  onNext: () => void
}
function FactionStep({ value, onChange, onPrev, onNext }: FactionStepProps): JSX.Element {
  return (
    <Card title="③ 选择本命阵营">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FACTIONS.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: active ? `${f.color}33` : 'rgba(255, 255, 255, 0.04)',
                border: active ? `2px solid ${f.color}` : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: 12,
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: f.color,
                  boxShadow: `0 0 10px ${f.color}88`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: f.color }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.65)', marginTop: 2 }}>
                  {f.tag}
                </div>
              </div>
              {active && <span style={{ fontSize: 18 }}>✓</span>}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <PrevBtn onClick={onPrev}>上一步</PrevBtn>
        <NextBtn disabled={!value} onClick={onNext}>
          下一步：执念
        </NextBtn>
      </div>
    </Card>
  )
}

/* ── 4: 执念 ───────────────────────────────────────────────────────── */
interface ObsessionStepProps {
  value: string
  onChange: (v: string) => void
  onPrev: () => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}
function ObsessionStep({
  value,
  onChange,
  onPrev,
  onSubmit,
  submitting,
  error,
}: ObsessionStepProps): JSX.Element {
  const trimmed = value.trim()
  const ok = trimmed.length >= 1 && trimmed.length <= 40
  return (
    <Card title="④ 你今日的执念">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={50}
        placeholder="例如：抢到限定款立牌！ / 给本命刷满应援榜 / 收一套玛奇玛吧唧"
        rows={3}
        style={{
          width: '100%',
          padding: '12px 14px',
          fontSize: 15,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 184, 111, 0.45)',
          borderRadius: 10,
          color: '#FFFFFF',
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'none',
          lineHeight: 1.5,
        }}
      />
      <p style={{ fontSize: 11, color: 'rgba(245, 245, 247, 0.55)', margin: 0 }}>
        1-40 字符，将作为你的 Agent 当日核心目标
      </p>
      {error && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 111, 111, 0.18)',
            border: '1px solid rgba(255, 111, 111, 0.55)',
            borderRadius: 8,
            color: '#FF8B6F',
            fontSize: 12,
          }}
        >
          ⚠ {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <PrevBtn onClick={onPrev} disabled={submitting}>
          上一步
        </PrevBtn>
        <NextBtn disabled={!ok || submitting} onClick={onSubmit}>
          {submitting ? '召唤中...' : '🌸 召唤我的 Agent'}
        </NextBtn>
      </div>
    </Card>
  )
}

/* ── 5: 完成 ───────────────────────────────────────────────────────── */
function DonePanel({ form }: { form: Form }): JSX.Element {
  const profile = form.mascotType ? mockTown.getMascotProfile(form.mascotType) : null
  return (
    <Card title="✅ 角色已绑定" tone="success">
      {profile && form.mascotType && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/assets/mascots/${form.mascotType}/portrait_64.png`}
            alt={profile.display_name_zh}
            width={84}
            height={84}
            style={{
              width: 84,
              height: 84,
              imageRendering: 'pixelated',
              border: `2px solid ${profile.persona_color}`,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              padding: 8,
              animation: 'mobBreath 2.4s ease-in-out infinite',
            }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{form.displayName}</div>
            <div style={{ fontSize: 13, color: profile.persona_color, marginTop: 4 }}>
              {profile.display_name_zh}
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(122, 231, 255, 0.10)',
          border: '1px solid rgba(122, 231, 255, 0.45)',
          borderRadius: 10,
          fontSize: 14,
          textAlign: 'center',
          color: '#7AE7FF',
        }}
      >
        请回到桌面端，点击"异世界转生"按钮即可进入小镇
      </div>
      <p style={{ fontSize: 12, color: 'rgba(245, 245, 247, 0.65)', textAlign: 'center', margin: 0 }}>
        手机这边的工作完成啦，可以收起来 ✨
      </p>
      <style>{`@keyframes mobBreath { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }`}</style>
    </Card>
  )
}

/* ── 通用控件 ──────────────────────────────────────────────────────── */
function Card({
  title,
  children,
  tone = 'default',
}: {
  title: string
  children: React.ReactNode
  tone?: 'default' | 'success'
}): JSX.Element {
  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border:
          tone === 'success'
            ? '1px solid rgba(122, 231, 255, 0.45)'
            : '1px solid rgba(255, 111, 183, 0.30)',
        borderRadius: 16,
        padding: 18,
        boxShadow:
          tone === 'success'
            ? '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 32px rgba(122, 231, 255, 0.20)'
            : '0 8px 32px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
      {children}
    </section>
  )
}

function NextBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        padding: '14px 16px',
        borderRadius: 10,
        border: 'none',
        background: disabled
          ? 'rgba(255, 255, 255, 0.10)'
          : 'linear-gradient(135deg, #FF6FB7 0%, #B388FF 100%)',
        color: disabled ? 'rgba(245, 245, 247, 0.45)' : '#FFFFFF',
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : '0 6px 18px rgba(255, 111, 183, 0.45)',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </button>
  )
}

function PrevBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.18)',
        background: 'rgba(255, 255, 255, 0.04)',
        color: 'rgba(245, 245, 247, 0.85)',
        fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(245, 245, 247, 0.65)',
        fontSize: 14,
        padding: 32,
      }}
    >
      {children}
    </div>
  )
}

function ErrorPanel({ msg }: { msg: string }): JSX.Element {
  return (
    <section
      style={{
        background: 'rgba(255, 111, 111, 0.10)',
        border: '1px solid rgba(255, 111, 111, 0.55)',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠</div>
      <h2 style={{ fontSize: 18, color: '#FF8B6F', margin: '0 0 8px 0' }}>无法加载</h2>
      <p style={{ fontSize: 14, color: 'rgba(245, 245, 247, 0.85)', margin: 0 }}>{msg}</p>
    </section>
  )
}
