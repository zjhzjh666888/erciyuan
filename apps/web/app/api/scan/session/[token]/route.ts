/**
 * GET    /api/scan/session/<token>   桌面端轮询会话状态
 * DELETE /api/scan/session/<token>   桌面端确认消费（status → consumed）
 *
 * 状态值：
 *   pending   二维码已生成，未提交
 *   submitted 手机端已提交，character 字段就绪
 *   consumed  桌面端已消费（即将被 pruner 清掉）
 *
 * 找不到 token → 404
 */

import { NextResponse } from 'next/server'

import { consumeSession, getSession } from '@/sessions/sessionStore'

export const dynamic = 'force-dynamic'

interface RouteCtx {
  params: { token: string }
}

export async function GET(_req: Request, ctx: RouteCtx): Promise<NextResponse> {
  const sess = getSession(ctx.params.token)
  if (!sess) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json({
    token: sess.token,
    status: sess.status,
    character: sess.character,
    createdAt: sess.createdAt,
    updatedAt: sess.updatedAt,
  })
}

export async function DELETE(_req: Request, ctx: RouteCtx): Promise<NextResponse> {
  const sess = consumeSession(ctx.params.token)
  if (!sess) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  return NextResponse.json({
    token: sess.token,
    status: sess.status,
  })
}
