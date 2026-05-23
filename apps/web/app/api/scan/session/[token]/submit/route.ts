/**
 * POST /api/scan/session/<token>/submit
 *
 * 手机端调用：提交角色资料。
 *
 * 请求 body（JSON）：
 *   {
 *     displayName: string  (1..16 字符)
 *     mascotType: MascotType (7 类之一)
 *     obsession: string  (1..40 字符)
 *     factionId: 'star_feather' | 'frost_moon' | 'lapis_glaze' | 'night_strife'
 *   }
 *
 * 副作用：
 *   - 在 sessionStore 中把状态由 pending 改为 submitted
 *   - 给桌面端轮询拿到的 character_id 注入；character_id = `usr_<token>`
 *
 * 失败：
 *   - 404 NOT_FOUND     token 无效
 *   - 409 ALREADY_USED  session 已 submitted 或 consumed
 *   - 422 INVALID_BODY  字段不合规
 */

import { NextResponse } from 'next/server'

import { mockTown } from '@erciyuan/mock-town'
import type { MascotType } from '@erciyuan/mock-town'

import { submitCharacter } from '@/sessions/sessionStore'

export const dynamic = 'force-dynamic'

const VALID_MASCOTS: ReadonlySet<MascotType> = new Set([
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
])

const VALID_FACTIONS = new Set([
  'star_feather',
  'frost_moon',
  'lapis_glaze',
  'night_strife',
])

interface SubmitBody {
  displayName?: unknown
  mascotType?: unknown
  obsession?: unknown
  factionId?: unknown
}

interface RouteCtx {
  params: { token: string }
}

export async function POST(req: Request, ctx: RouteCtx): Promise<NextResponse> {
  let body: SubmitBody = {}
  try {
    body = (await req.json()) as SubmitBody
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 422 })
  }

  // ── 校验字段 ───────────────────────────────────────────────────────
  const displayNameRaw = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  if (displayNameRaw.length < 1 || displayNameRaw.length > 16) {
    return NextResponse.json(
      { error: 'INVALID_DISPLAY_NAME', message: '昵称需在 1-16 字符之间' },
      { status: 422 },
    )
  }
  const obsessionRaw = typeof body.obsession === 'string' ? body.obsession.trim() : ''
  if (obsessionRaw.length < 1 || obsessionRaw.length > 40) {
    return NextResponse.json(
      { error: 'INVALID_OBSESSION', message: '执念需在 1-40 字符之间' },
      { status: 422 },
    )
  }
  if (typeof body.mascotType !== 'string' || !VALID_MASCOTS.has(body.mascotType as MascotType)) {
    return NextResponse.json(
      { error: 'INVALID_MASCOT_TYPE', message: '萌宠类型必须是 7 类之一' },
      { status: 422 },
    )
  }
  if (typeof body.factionId !== 'string' || !VALID_FACTIONS.has(body.factionId)) {
    return NextResponse.json(
      { error: 'INVALID_FACTION_ID', message: '阵营必须是 4 种之一' },
      { status: 422 },
    )
  }

  const mascotType = body.mascotType as MascotType
  const profile = mockTown.getMascotProfile(mascotType)

  try {
    const sess = submitCharacter(ctx.params.token, {
      characterId: `usr_${ctx.params.token.toLowerCase()}`,
      displayName: displayNameRaw,
      mascotType,
      obsession: obsessionRaw,
      factionId: body.factionId,
      personaColor: profile.persona_color,
    })
    return NextResponse.json({
      token: sess.token,
      status: sess.status,
      character: sess.character,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
    if (msg === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (msg === 'SESSION_ALREADY_USED') {
      return NextResponse.json({ error: 'ALREADY_USED' }, { status: 409 })
    }
    return NextResponse.json({ error: 'INTERNAL', message: msg }, { status: 500 })
  }
}
