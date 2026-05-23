/**
 * sessionStore — 桌面端扫码会话内存 store（黑客松级实现）
 *
 * **目标**：让 `/demo/scan` 桌面端生成二维码 → 手机端扫码进 `/scan/<token>`
 * 提交角色资料 → 桌面端轮询拿到 character → 跳转转生过场 这条链路用最简
 * 内存数据结构跑起来，不引入 Redis / 数据库。
 *
 * **Session 生命周期**：
 *   pending  ─ 二维码已生成、手机端尚未提交
 *   submitted─ 手机端已提交（character 字段就绪），桌面端轮询能看到
 *   consumed ─ 桌面端确认（DELETE / 跳转）后置位，下一秒会被 pruner 清掉
 *
 * **存活规则**：
 *   - 每条 session 生命周期 10 分钟（TTL_MS）。pruner 每 30 秒清一次过期。
 *   - consumed 后 5 秒就清掉，避免轮询的延迟 race 条件让"已转生角色"被错读
 *   - process 重启全部丢失（黑客松能接受）
 *
 * **同进程并发**：Next.js dev / prod 单 node 进程下，本 module 是 singleton；
 * 多 node worker 时会拆店 — 演示场景下不会出现。
 */

import { randomBytes } from 'node:crypto'
import { networkInterfaces } from 'node:os'

import type { MascotType } from '@erciyuan/mock-town'

/** 会话状态枚举。 */
export type SessionStatus = 'pending' | 'submitted' | 'consumed'

/** 手机端提交的角色资料（已通过 route 校验）。 */
export interface SubmittedCharacter {
  characterId: string
  displayName: string
  mascotType: MascotType
  obsession: string
  factionId: string
  personaColor: string
}

/** 内存 session 记录。 */
export interface ScanSession {
  token: string
  status: SessionStatus
  /** 创建时刻（ms） */
  createdAt: number
  /** 最近一次状态变更（ms） */
  updatedAt: number
  /** 提交后填充；pending 时为 null */
  character: SubmittedCharacter | null
}

const STORE: Map<string, ScanSession> = (() => {
  const g = globalThis as typeof globalThis & {
    __anitownScanSessionStore?: Map<string, ScanSession>
  }
  if (!g.__anitownScanSessionStore) {
    g.__anitownScanSessionStore = new Map()
  }
  return g.__anitownScanSessionStore
})()
const TTL_MS = 10 * 60 * 1000 // 10 分钟
const CONSUMED_KEEP_MS = 5 * 1000 // consumed 之后再保留 5s 防 race
const PRUNE_INTERVAL_MS = 30 * 1000

let prunerStarted = false
function ensurePruner(): void {
  const g = globalThis as typeof globalThis & { __anitownScanPrunerStarted?: boolean }
  if (g.__anitownScanPrunerStarted) {
    prunerStarted = true
    return
  }
  if (prunerStarted) return
  prunerStarted = true
  g.__anitownScanPrunerStarted = true
  if (typeof setInterval !== 'function') return
  setInterval(() => {
    const now = Date.now()
    for (const [token, sess] of STORE) {
      const age = now - sess.updatedAt
      if (sess.status === 'consumed' && age > CONSUMED_KEEP_MS) {
        STORE.delete(token)
        continue
      }
      if (age > TTL_MS) STORE.delete(token)
    }
  }, PRUNE_INTERVAL_MS).unref?.()
}

/** 生成 8 字符 base32 token（短，扫码 / 手输都易接受）。 */
function newToken(): string {
  const bytes = randomBytes(5)
  // base32 字典（移除易混字符）
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i % 5]! % alphabet.length]
  }
  return out
}

/**
 * 创建新会话。token 全局唯一（碰撞极少；理论上 31^8 ≈ 8.5e11）。
 */
export function createSession(): ScanSession {
  ensurePruner()
  let token: string
  do {
    token = newToken()
  } while (STORE.has(token))
  const now = Date.now()
  const sess: ScanSession = {
    token,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    character: null,
  }
  STORE.set(token, sess)
  return sess
}

export function getSession(token: string): ScanSession | null {
  ensurePruner()
  const sess = STORE.get(token)
  if (!sess) return null
  if (Date.now() - sess.updatedAt > TTL_MS) {
    STORE.delete(token)
    return null
  }
  return sess
}

/**
 * 手机端提交。token 不存在 → 抛 'SESSION_NOT_FOUND'；
 * 已经 submitted / consumed → 抛 'SESSION_ALREADY_USED'。
 */
export function submitCharacter(token: string, character: SubmittedCharacter): ScanSession {
  const sess = getSession(token)
  if (!sess) throw new Error('SESSION_NOT_FOUND')
  if (sess.status !== 'pending') throw new Error('SESSION_ALREADY_USED')
  sess.status = 'submitted'
  sess.character = character
  sess.updatedAt = Date.now()
  return sess
}

/** 桌面端确认消费 — 标 consumed，pruner 5s 后清掉。 */
export function consumeSession(token: string): ScanSession | null {
  const sess = getSession(token)
  if (!sess) return null
  sess.status = 'consumed'
  sess.updatedAt = Date.now()
  return sess
}

/* -------------------------------------------------------------------------- */
/* LAN host helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * 解析"局域网外网可达"的本机 host：
 *   1. 优先走环境变量 ANITOWN_LAN_HOST（手动指定）
 *   2. 扫描 networkInterfaces，挑第一个 IPv4 internal=false 的地址
 *   3. fallback localhost（演示同机扫码无效但不报错）
 *
 * 返回值供 `/api/scan/session` 拼出 scanUrl，使手机扫码能直接命中桌面 dev。
 */
export function resolveLanHost(): string {
  const env = process.env.ANITOWN_LAN_HOST
  if (env && env.trim().length > 0) return env.trim()
  try {
    const ifs = networkInterfaces()
    for (const name of Object.keys(ifs)) {
      const list = ifs[name]
      if (!list) continue
      for (const ni of list) {
        if (ni.family === 'IPv4' && !ni.internal) {
          return ni.address
        }
      }
    }
  } catch {
    /* fall through */
  }
  return 'localhost'
}

/**
 * 给定 dev 端口（默认 3000）拼出手机扫码地址。
 * 路径硬编码 `/scan/<token>`，与 `app/scan/[token]/page.tsx` 路由一致。
 */
export function buildScanUrl(token: string, opts: { port?: number } = {}): string {
  const host = resolveLanHost()
  const port = opts.port ?? Number(process.env.PORT ?? 3000)
  const proto = process.env.ANITOWN_LAN_PROTO ?? 'http'
  const portPart = port === 80 || port === 443 ? '' : `:${port}`
  return `${proto}://${host}${portPart}/scan/${token}`
}
