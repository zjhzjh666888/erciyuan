'use client'

/**
 * /demo/scan — 桌面端扫码页
 *
 * 演示流程：
 *   1. 进入页面：POST /api/scan/session 拿 token + scanUrl
 *   2. qrcode 生成二维码 SVG，居中大字显示，下面有"扫码用手机进入小镇"
 *   3. 每 1 秒 GET /api/scan/session/<token> 轮询，等待手机端提交
 *   4. 状态变 'submitted' → 立刻显示角色卡 + 异世界转生 CTA
 *   5. 点 CTA → DELETE /api/scan/session/<token>（consume）→ 跳
 *      `/demo/isekai?mascot=<type>&name=<displayName>` 触发转生过场
 *
 * 整页用 inline style 实现，不依赖 globals.css，避免和 CC 在改的样式冲突。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'

const POLL_MS = 1000
const POLL_TIMEOUT_MS = 5 * 60 * 1000 // 5 分钟没人扫 → 自动重新生成

interface SessionInfo {
  token: string
  scanUrl: string
}

interface CharacterDto {
  characterId: string
  displayName: string
  mascotType: MascotType
  obsession: string
  factionId: string
  personaColor: string
}

interface SessionStatusResp {
  token: string
  status: 'pending' | 'submitted' | 'consumed'
  character: CharacterDto | null
}

export default function ScanPage(): JSX.Element {
  const router = useRouter()
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [status, setStatus] = useState<'pending' | 'submitted' | 'consumed'>('pending')
  const [character, setCharacter] = useState<CharacterDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedAtRef = useRef<number>(0)

  // 创建会话
  const createSession = useCallback(async () => {
    setError(null)
    setCharacter(null)
    setStatus('pending')
    setQrSvg(null)
    try {
      const res = await fetch('/api/scan/session', { method: 'POST' })
      if (!res.ok) throw new Error(`session-create-${res.status}`)
      const data = (await res.json()) as { token: string; scanUrl: string }
      setInfo({ token: data.token, scanUrl: data.scanUrl })
      const svg = await QRCode.toString(data.scanUrl, {
        type: 'svg',
        margin: 1,
        color: { dark: '#1A1027', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
        width: 320,
      })
      setQrSvg(svg)
      startedAtRef.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'session-create-failed')
    }
  }, [])

  useEffect(() => {
    void createSession()
  }, [createSession])

  // 轮询状态
  useEffect(() => {
    if (!info) return
    if (status !== 'pending') return
    let cancelled = false
    const tick = async (): Promise<void> => {
      if (cancelled) return
      try {
        const res = await fetch(`/api/scan/session/${info.token}`, { cache: 'no-store' })
        if (!res.ok) {
          if (res.status === 404) {
            // session 过期被 pruner 清掉 → 重新生成
            void createSession()
            return
          }
          throw new Error(`poll-${res.status}`)
        }
        const data = (await res.json()) as SessionStatusResp
        if (cancelled) return
        if (data.status === 'submitted' && data.character) {
          setStatus('submitted')
          setCharacter(data.character)
          return
        }
        // 5 分钟没动静 → 换一个新 token
        if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
          void createSession()
          return
        }
      } catch {
        /* 静默重试 */
      }
    }
    const id = setInterval(tick, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [info, status, createSession])

  const onEnter = useCallback(async () => {
    if (!info || !character) return
    try {
      await fetch(`/api/scan/session/${info.token}`, { method: 'DELETE' })
    } catch {
      /* 忽略 — 客户端继续跳转，server 端会因 TTL 自然清理 */
    }
    setStatus('consumed')
    const params = new URLSearchParams({
      mascot: character.mascotType,
      name: character.displayName,
    })
    router.push(`/demo/isekai?${params.toString()}`)
  }, [info, character, router])

  const profile = character ? mockTown.getMascotProfile(character.mascotType) : null

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, rgba(123, 58, 200, 0.20) 0%, rgba(14, 16, 24, 1) 65%)',
        color: '#F5F5F7',
        fontFamily: 'var(--font-pixel-zh, "霞鹜文楷", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 24,
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(245, 245, 247, 0.55)',
            letterSpacing: '0.3em',
            fontFamily: '"JetBrains Mono", monospace',
            marginBottom: 8,
          }}
        >
          ANITOWN · ISEKAI PORTAL
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            margin: 0,
            background:
              'linear-gradient(135deg, #FFC8DC 0%, #FF6FB7 30%, #B388FF 70%, #7AE7FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          扫码召唤你的 Agent
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(245, 245, 247, 0.75)',
            marginTop: 8,
          }}
        >
          {character
            ? '✦ 角色已绑定，准备开启转生'
            : '请用手机扫描二维码，定制一只专属于你的萌宠'}
        </p>
      </header>

      {/* 主区：二维码 + 状态 */}
      {!character ? (
        <QrZone qrSvg={qrSvg} info={info} error={error} onRetry={createSession} />
      ) : (
        <CharacterPreviewZone character={character} profile={profile!} onEnter={onEnter} />
      )}

      <footer
        style={{
          fontSize: 11,
          color: 'rgba(245, 245, 247, 0.45)',
          fontFamily: '"JetBrains Mono", monospace',
          textAlign: 'center',
          maxWidth: 520,
          lineHeight: 1.6,
        }}
      >
        {info && (
          <>
            扫码地址 ·{' '}
            <span style={{ color: 'rgba(245, 245, 247, 0.75)' }}>{info.scanUrl}</span>
            <br />
            （手机和电脑需在同一 WiFi；环境变量 ANITOWN_LAN_HOST 可手动指定 IP）
          </>
        )}
      </footer>
    </main>
  )
}

interface QrZoneProps {
  qrSvg: string | null
  info: SessionInfo | null
  error: string | null
  onRetry: () => void
}

function QrZone({ qrSvg, info, error, onRetry }: QrZoneProps): JSX.Element {
  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: '1px solid rgba(255, 111, 183, 0.30)',
        borderRadius: 24,
        padding: 28,
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.55), 0 0 32px rgba(255, 111, 183, 0.20)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 320,
          height: 320,
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 12,
          boxShadow: '0 8px 24px rgba(255, 111, 183, 0.25)',
          position: 'relative',
        }}
      >
        {qrSvg ? (
          <div
            style={{ width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 14,
            }}
          >
            {error ? `创建失败：${error}` : '二维码加载中…'}
          </div>
        )}
        {qrSvg && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 12,
              pointerEvents: 'none',
              border: '2px dashed rgba(255, 111, 183, 0.0)',
              animation: 'scanFrameSweep 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#7AE7FF',
            boxShadow: '0 0 8px #7AE7FF',
            animation: 'scanLivePulse 1.5s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: 14, color: 'rgba(245, 245, 247, 0.85)' }}>
          {info ? `等待扫码 · token = ${info.token}` : '正在生成会话...'}
        </span>
      </div>

      {error && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255, 111, 111, 0.55)',
            background: 'rgba(255, 111, 111, 0.18)',
            color: '#FF8B6F',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          重新生成
        </button>
      )}

      <style>{`
        @keyframes scanLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.85); }
        }
        @keyframes scanFrameSweep {
          0%, 100% { border-color: rgba(255, 111, 183, 0.0); }
          50%      { border-color: rgba(255, 111, 183, 0.45); }
        }
      `}</style>
    </section>
  )
}

interface CharacterPreviewZoneProps {
  character: CharacterDto
  profile: ReturnType<typeof mockTown.getMascotProfile>
  onEnter: () => void
}

function CharacterPreviewZone({
  character,
  profile,
  onEnter,
}: CharacterPreviewZoneProps): JSX.Element {
  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(20, 12, 32, 0.92) 0%, rgba(35, 18, 60, 0.88) 100%)',
        border: `1px solid ${character.personaColor}88`,
        borderRadius: 24,
        padding: 32,
        boxShadow: `0 12px 48px rgba(0, 0, 0, 0.55), 0 0 36px ${character.personaColor}33`,
        maxWidth: 480,
        animation: 'scanResultPop 480ms cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/assets/mascots/${character.mascotType}/portrait_64.png`}
          alt={character.displayName}
          width={120}
          height={120}
          style={{
            width: 120,
            height: 120,
            imageRendering: 'pixelated',
            border: `3px solid ${character.personaColor}`,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: 10,
            boxShadow: `0 0 20px ${character.personaColor}55`,
            animation: 'scanMascotBreath 2.4s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245, 245, 247, 0.55)',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.2em',
              marginBottom: 4,
            }}
          >
            CHARACTER · BOUND
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.1,
              wordBreak: 'break-word',
            }}
          >
            {character.displayName}
          </div>
          <div
            style={{
              fontSize: 14,
              color: character.personaColor,
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            {profile.display_name_zh} · {profile.display_name_romaji}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 14px',
          background: `${character.personaColor}1A`,
          border: `1px solid ${character.personaColor}55`,
          borderRadius: 10,
          fontSize: 14,
          fontStyle: 'italic',
          color: 'rgba(245, 245, 247, 0.92)',
          lineHeight: 1.5,
        }}
      >
        ⭐ 今日执念：「{character.obsession}」
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 12,
          color: 'rgba(245, 245, 247, 0.85)',
        }}
      >
        <Field label="本命阵营" value={factionLabel(character.factionId)} />
        <Field label="主场分区" value={profile.recommended_zone} />
      </div>

      <button
        type="button"
        onClick={onEnter}
        style={{
          padding: '14px 20px',
          borderRadius: 10,
          border: `1px solid ${character.personaColor}88`,
          background: `linear-gradient(135deg, ${character.personaColor} 0%, #FF6FB7 100%)`,
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          boxShadow: `0 6px 20px ${character.personaColor}66`,
          fontFamily: 'inherit',
        }}
      >
        🌸 异世界转生 · 进入次元小镇
      </button>

      <style>{`
        @keyframes scanResultPop {
          0%   { opacity: 0; transform: translateY(16px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scanMascotBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-3px) scale(1.04); }
        }
      `}</style>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }): JSX.Element {
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
          fontSize: 10,
          color: 'rgba(245, 245, 247, 0.55)',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.08em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function factionLabel(id: string): string {
  switch (id) {
    case 'star_feather':
      return '星羽'
    case 'frost_moon':
      return '霜月'
    case 'lapis_glaze':
      return '琉璃'
    case 'night_strife':
      return '夜斗'
    default:
      return id
  }
}
