/**
 * task 14.2 — Douyin_Stream_Hook 业务逻辑（A 链路抖音流测一测掉落弹框）
 *
 * 契约（requirements.md R17.1–R17.6 + design.md §Douyin_Stream_Hook）：
 *   R17.1 用户在二次元视频上观看时长达到阈值（默认 5s）→ 触发弹框
 *   R17.2 弹框文案池 ≥ 3 套随机（文案池在 HookPopup 组件里维护）
 *   R17.3 同一会话 10 分钟内最多 1 次（localStorage 频控）
 *   R17.4 已绑定萌宠 ≥ 1 → 切换为回访形态（mascot_type_existing 字段携带）
 *   R17.5 弹框事件携带 contextual_intent（视频 IP / Cos 角色名等）
 *   R17.6 关闭 / 跳过 / 30s 未点击行为以匿名事件写入 Memory_System hook_event 表
 *
 * **本任务的实现取舍（受 task 17.5 Memory_System 还未上线影响）**：
 *   Memory_System 完整版要等 task 17.5。本任务的 hook_event 先持久化到
 *   `localStorage.erciyuan:hook_events` 队列，schema 已对齐 R17.6（type / video_id /
 *   contextual_intent / fired_at / mascot_type_existing），等 17.5 上线后改写为
 *   `Memory_System.write({ table: 'hook_event', ... })` 即可，无侵入。
 *
 * **职责分工（与 task 14.1 协同）**：
 *   - 14.1 的 VideoCard 在卡片可见时调 `start()`，离屏调 `stop()`
 *   - 本 hook 内部用 useRef 累计 dwell time，达到 5s 阈值且不在频控内 → fire
 *   - fire 后由调用方（VideoCard 或 orchestrator）渲染 HookPopup
 *
 * **不在本任务范围**：
 *   - 真 Memory_System 写入（task 17.5）
 *   - 弹框 UI 与文案池本身（→ HookPopup.tsx）
 *   - Quiz_Service 题目生成（task 14.3）
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { MockVideoCard } from '@erciyuan/mock-town'

// ─── 常量 / 频控配置 ────────────────────────────────────────────────────────

/** R17.1：观看阈值，5 秒。 */
export const DEFAULT_THRESHOLD_MS = 5_000

/** R17.3：同会话 10 分钟内最多 1 次。 */
export const DEFAULT_COOLDOWN_MS = 10 * 60 * 1_000

/** localStorage key 命名（Slice 1 兜底，Slice 5 后由 Memory_System 接管 R17.6）。 */
export const STORAGE_KEYS = {
  /** localStorage：上次弹框 epoch ms，用于 R17.3 频控。 */
  lastFiredTs: 'erciyuan:douyin_hook:last_fired_ts',
  /** localStorage：hook_event 事件队列（Memory_System 兜底）。 */
  hookEvents: 'erciyuan:hook_events',
  /** localStorage：用户已绑定的萌宠类型（task 14.4 Mascot_System 写入）。 */
  currentMascot: 'erciyuan:current_mascot',
} as const

// ─── 工具函数 ──────────────────────────────────────────────────────────────

/** 读取已绑定萌宠类型（无 → null）。SSR 安全。 */
export function readCurrentMascot(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEYS.currentMascot)
    return v && v.length > 0 ? v : null
  } catch {
    // localStorage 在隐私模式 / 配额满时可能抛错，静默降级为"未绑定"
    return null
  }
}

/** R17.3：检查是否处于 cooldown 窗口内。SSR 安全。 */
function isWithinCooldown(now: number, cooldownMs: number): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.lastFiredTs)
    if (!raw) return false
    const last = Number.parseInt(raw, 10)
    if (!Number.isFinite(last)) return false
    return now - last < cooldownMs
  } catch {
    return false
  }
}

function markFiredNow(now: number): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEYS.lastFiredTs, String(now))
  } catch {
    // 静默：localStorage 满 / 隐私模式
  }
}

/**
 * R17.6：hook_event 事件 schema（Slice 5 之前先存 localStorage 队列）。
 *
 * 字段：
 *   - type:                    'hook_event' 固定值（与 Memory_System 表名对齐）
 *   - video_id:                R17.5 contextual_intent 来源视频
 *   - contextual_intent:       R17.5 透传的视频上下文意图
 *   - fired_at:                epoch ms
 *   - mascot_type_existing?:   R17.4 触发时已绑定的萌宠（无则省略）
 *   - action?:                 'shown' | 'clicked' | 'dismissed' | 'ignored'
 *                              （action 缺省视为 'shown'，向后兼容）
 */
export interface HookEvent {
  type: 'hook_event'
  video_id: string
  contextual_intent: MockVideoCard['contextual_intent']
  fired_at: number
  mascot_type_existing?: string
  action?: 'shown' | 'clicked' | 'dismissed' | 'ignored'
}

/**
 * 把一条 hook_event append 到 localStorage 队列。
 *
 * Slice 5 上线后直接换成 `Memory_System.write({ table: 'hook_event', ... })`
 * 即可，调用方契约（HookEvent schema）保持不变。
 */
export function appendHookEvent(event: HookEvent): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.hookEvents)
    const list: HookEvent[] = raw ? (JSON.parse(raw) as HookEvent[]) : []
    list.push(event)
    window.localStorage.setItem(STORAGE_KEYS.hookEvents, JSON.stringify(list))
  } catch (err) {
    // 静默降级：不让兜底持久化错误冒泡到 UI
    // eslint-disable-next-line no-console
    console.warn('[useDouyinStreamHook] failed to persist hook_event:', err)
  }
}

// ─── Hook 主体 ─────────────────────────────────────────────────────────────

export interface UseDouyinStreamHookOptions {
  /** R17.1：观看阈值，默认 5000ms。 */
  thresholdMs?: number
  /** R17.3：同会话频控窗口，默认 600000ms（10 分钟）。 */
  cooldownMs?: number
}

export interface UseDouyinStreamHookReturn {
  /** 卡片进入视口时调用，开始累计 dwell time。 */
  start: () => void
  /** 卡片离开视口时调用，暂停累计 dwell time。 */
  stop: () => void
  /** 当前是否已经达到阈值并 fire 了 hook_event（=> 应弹出 HookPopup）。 */
  hookFired: boolean
  /** 弹框确认显示（R17.6：'shown' 事件由 fire 自动写，此处保留给调用方手动 reopen 等场景）。 */
  openHookPopup: () => void
  /** 关闭弹框（写 'dismissed' 事件，仍消耗 cooldown）。 */
  dismissHookPopup: (reason?: 'dismissed' | 'clicked' | 'ignored') => void
}

/**
 * Douyin_Stream_Hook 业务逻辑 hook。
 *
 * 用法（在 14.1 的 VideoCard 里）：
 * ```tsx
 * const { start, stop, hookFired, dismissHookPopup } = useDouyinStreamHook(video)
 * useEffect(() => { isVisible ? start() : stop() }, [isVisible])
 * return <>{hookFired ? <HookPopup video={video} onDismiss={dismissHookPopup} /> : null}</>
 * ```
 */
export function useDouyinStreamHook(
  video: MockVideoCard,
  opts: UseDouyinStreamHookOptions = {},
): UseDouyinStreamHookReturn {
  const thresholdMs = opts.thresholdMs ?? DEFAULT_THRESHOLD_MS
  const cooldownMs = opts.cooldownMs ?? DEFAULT_COOLDOWN_MS

  /** 累计观看时长（ms）。视频切换时重置。 */
  const dwellMsRef = useRef<number>(0)
  /** 当前一次 dwell 计时片段的开始 ts（处于停止状态时为 null）。 */
  const segmentStartRef = useRef<number | null>(null)
  /** 是否已经为本视频 fire 过 hook_event（避免单条视频内重复触发）。 */
  const firedForThisVideoRef = useRef<boolean>(false)
  /** 阈值检测定时器（每次 start 时新建，stop / 卸载时清理）。 */
  const thresholdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [hookFired, setHookFired] = useState(false)

  // 视频切换 → 重置所有状态
  useEffect(() => {
    dwellMsRef.current = 0
    segmentStartRef.current = null
    firedForThisVideoRef.current = false
    setHookFired(false)
    if (thresholdTimerRef.current) {
      clearTimeout(thresholdTimerRef.current)
      thresholdTimerRef.current = null
    }
  }, [video.video_id])

  /** 触发 fire：写 hook_event 'shown'、记录 cooldown ts、置 hookFired=true。 */
  const fire = useCallback(() => {
    if (firedForThisVideoRef.current) return
    const now = Date.now()
    if (isWithinCooldown(now, cooldownMs)) return

    firedForThisVideoRef.current = true
    markFiredNow(now)

    const mascot = readCurrentMascot()
    const event: HookEvent = {
      type: 'hook_event',
      video_id: video.video_id,
      contextual_intent: video.contextual_intent,
      fired_at: now,
      action: 'shown',
      ...(mascot ? { mascot_type_existing: mascot } : {}),
    }
    appendHookEvent(event)

    setHookFired(true)
  }, [video, cooldownMs])

  const start = useCallback(() => {
    if (firedForThisVideoRef.current) return
    if (segmentStartRef.current !== null) return // 已在计时

    // R17.3：开始计时前先确认不在频控内；如果在，直接放弃本轮
    if (isWithinCooldown(Date.now(), cooldownMs)) return

    segmentStartRef.current = Date.now()
    const remaining = Math.max(0, thresholdMs - dwellMsRef.current)
    thresholdTimerRef.current = setTimeout(() => {
      // 计时到点 → 把这一段 dwell 累加进去并 fire
      const segStart = segmentStartRef.current
      if (segStart !== null) {
        dwellMsRef.current += Date.now() - segStart
        segmentStartRef.current = null
      }
      thresholdTimerRef.current = null
      fire()
    }, remaining)
  }, [cooldownMs, thresholdMs, fire])

  const stop = useCallback(() => {
    // 把本段 dwell 累加进去
    const segStart = segmentStartRef.current
    if (segStart !== null) {
      dwellMsRef.current += Date.now() - segStart
      segmentStartRef.current = null
    }
    if (thresholdTimerRef.current) {
      clearTimeout(thresholdTimerRef.current)
      thresholdTimerRef.current = null
    }
  }, [])

  const openHookPopup = useCallback(() => {
    setHookFired(true)
  }, [])

  const dismissHookPopup = useCallback(
    (reason: 'dismissed' | 'clicked' | 'ignored' = 'dismissed') => {
      // R17.6：补一条行为事件（shown 由 fire 自动写）
      const mascot = readCurrentMascot()
      appendHookEvent({
        type: 'hook_event',
        video_id: video.video_id,
        contextual_intent: video.contextual_intent,
        fired_at: Date.now(),
        action: reason,
        ...(mascot ? { mascot_type_existing: mascot } : {}),
      })
      setHookFired(false)
    },
    [video],
  )

  // 卸载清理
  useEffect(() => {
    return () => {
      if (thresholdTimerRef.current) clearTimeout(thresholdTimerRef.current)
      thresholdTimerRef.current = null
      segmentStartRef.current = null
    }
  }, [])

  return { start, stop, hookFired, openHookPopup, dismissHookPopup }
}

export default useDouyinStreamHook
