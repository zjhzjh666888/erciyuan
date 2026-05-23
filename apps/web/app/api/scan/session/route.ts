/**
 * POST /api/scan/session
 *
 * 桌面端调用：创建一个新的扫码会话。返回 token + 手机扫码 URL。
 *
 * 请求 body：可空（保留扩展字段）
 * 响应：{ token: string, scanUrl: string, expiresInMs: number }
 */

import { NextResponse } from 'next/server'

import { buildScanUrl, createSession } from '@/sessions/sessionStore'

export const dynamic = 'force-dynamic'

const TTL_MS = 10 * 60 * 1000

export async function POST(): Promise<NextResponse> {
  const sess = createSession()
  const scanUrl = buildScanUrl(sess.token)
  return NextResponse.json({
    token: sess.token,
    scanUrl,
    expiresInMs: TTL_MS,
    createdAt: sess.createdAt,
  })
}
