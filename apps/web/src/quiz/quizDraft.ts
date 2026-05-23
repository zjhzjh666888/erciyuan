/**
 * Quiz 草稿持久化 — task 14.3 / R18.6 实装。
 *
 * 契约（任务 14.3 描述原文）：
 *   - localStorage key：`erciyuan:quiz_draft`
 *   - draft shape：`{ answers: QuizOption[], started_at, video_id? }`
 *   - TTL 24 小时（保存时带 ts，加载时校验 < 24h）
 *
 * 设计：
 *   - 用户每选完 1 题立即覆写一次草稿；`started_at` 在首次进入页面时确定，
 *     用于 TTL 判断与跨刷新身份比对（同一会话）。
 *   - 草稿里直接存 QuizOption 完整对象（含 7 维 weights），这样 14.5
 *     Page_MascotResult 不需要回查题库即可推断主萌宠。
 *   - 题目顺序由 video_id 驱动的确定性挑选（参见 quizLogic.ts）保证；
 *     刷新后用同一 video_id 重新挑题，再用 answers.length === selected.length
 *     校验对齐性 — 不一致就丢草稿。
 *
 * 失败模式：
 *   - SSR / 隐私模式 / quota 满 → 全部 try/catch 兜底，永远不抛
 *   - JSON 解析失败 → 视同没有草稿
 *   - 字段类型不符 → 视同没有草稿
 */
import type { QuizOption } from '@erciyuan/mock-town'

/** localStorage key — 任务 14.3 明文规定。 */
export const QUIZ_DRAFT_STORAGE_KEY = 'erciyuan:quiz_draft'

/** 草稿 24 小时有效（R18.6）。 */
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000

/**
 * 草稿数据结构 — 写入 localStorage 的 JSON 形态。
 *
 * `answers` 与本次挑题列表一一对应；尚未作答的位置为 `null`，便于
 * "中途退出 → 恢复后从第一个未答题继续"。
 */
export interface QuizDraft {
  /** 各题已选 QuizOption，未答为 null */
  answers: Array<QuizOption | null>
  /** 首次进入 Page_Quiz 的时间戳（毫秒），同时充当 TTL 锚点 */
  started_at: number
  /** 触发本次测一测的 video_id（来自 ?from_video=...）；可空 */
  video_id?: string
}

/**
 * 读取草稿。返回 null 表示没有草稿、草稿已过期或 video_id 不匹配。
 *
 * @param expectedVideoId 当前页面的 from_video；不匹配则丢弃旧草稿
 * @param now             当前时间戳，注入便于单测；默认 `Date.now()`
 */
export function readDraft(
  expectedVideoId: string | undefined,
  now: number = Date.now(),
): QuizDraft | null {
  if (typeof window === 'undefined') return null
  let raw: string | null
  try {
    raw = window.localStorage.getItem(QUIZ_DRAFT_STORAGE_KEY)
  } catch {
    return null
  }
  if (raw == null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isQuizDraftShape(parsed)) return null

  // R18.6：24 小时内有效
  if (parsed.started_at + DRAFT_TTL_MS <= now) return null

  // video_id 不一致 → 视同新一轮，丢弃旧草稿
  const draftVideo = parsed.video_id ?? undefined
  if ((draftVideo ?? '') !== (expectedVideoId ?? '')) return null

  return parsed
}

/**
 * 写入草稿。SSR / quota 失败时静默吞掉，不抛错也不返回错误。
 */
export function writeDraft(draft: QuizDraft): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(QUIZ_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // 隐私模式 / quota 满 → 静默
  }
}

/**
 * 删除草稿（quiz 完成或用户主动重置时调用）。
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(QUIZ_DRAFT_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/* --------------------------------------------------------------------------
 * Type guards
 * -------------------------------------------------------------------------- */

function isQuizDraftShape(value: unknown): value is QuizDraft {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.started_at !== 'number' || !Number.isFinite(obj.started_at)) return false
  if (!Array.isArray(obj.answers)) return false
  for (const a of obj.answers) {
    if (a === null) continue
    if (!isQuizOption(a)) return false
  }
  if (obj.video_id !== undefined && typeof obj.video_id !== 'string') return false
  return true
}

function isQuizOption(value: unknown): value is QuizOption {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.key !== 'string') return false
  if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(obj.key)) return false
  if (typeof obj.text !== 'string') return false
  if (typeof obj.weights !== 'object' || obj.weights === null) return false
  return true
}
