/**
 * Quiz_Service 选题核心 — task 14.3 / R18.1–3 实装。
 *
 * 这里只放无副作用、可单测的逻辑：
 *
 *   1. {@link selectQuizQuestions} — 从 mock-town 题库里挑 5 题（R18.1）：
 *      · 全部 `must_run=true` 题（R29.14：R18 给出的 3 道示例题）
 *      · 1 道动态题（R18.2）：根据 from_video 的 contextual_intent.ip
 *        在剩余题中按关键词命中度选 1；找不到则确定性"伪随机"挑 1
 *      · 再补 1 道 filler，凑到 5 道（题目顺序：must_run → 动态 → filler）
 *
 *   2. {@link pickContextIntent} — 从 mock-town `videos` 里查 from_video，
 *      抽出 contextual_intent。用于让动态题挑选与结果页都拿到相同 intent。
 *
 * 与 Page_Quiz 的边界：
 *   - 这里不读 localStorage、不读 window、不读 URL；所有输入都靠参数
 *     传进来。Page_Quiz 那一层负责 IO。
 *   - 这里不做萌宠推断（task 14.4 / 14.5 的职责）。
 */
import type { MockVideoCard, QuizQuestion } from '@erciyuan/mock-town'

/** 默认每次测试挑 5 题（R18.1：3–5 题）。 */
export const TARGET_QUESTION_COUNT = 5

/* -------------------------------------------------------------------------- */
/* Contextual intent                                                          */
/* -------------------------------------------------------------------------- */

/**
 * 从 from_video 反查 contextual_intent。找不到视频 / 没有 from_video → null。
 */
export function pickContextIntent(
  videos: readonly MockVideoCard[],
  fromVideoId: string | null | undefined,
): MockVideoCard['contextual_intent'] | null {
  if (!fromVideoId) return null
  const v = videos.find((x) => x.video_id === fromVideoId)
  return v ? v.contextual_intent : null
}

/* -------------------------------------------------------------------------- */
/* Question selection                                                         */
/* -------------------------------------------------------------------------- */

export interface QuizSelectionResult {
  /** 实际呈现给用户的题目（默认 5 题），顺序：must_run → 动态题 → filler */
  questions: QuizQuestion[]
  /** 因 contextual_intent 命中被选为动态题的 question_id；任务承诺 ≥ 1 道，
   *  无任何 intent 时仍会随机选一道作为「动态位」并在此返回其 id */
  dynamic_question_id: string
}

/**
 * 从 mock-town 题库挑题：
 *
 *   - 必出全部 `must_run=true` 题（R29.14 / R18 示例 3 题）
 *   - 1 道动态题（R18.2）：基于 contextual_intent.ip 关键词与题目 prompt /
 *     选项 text 的不区分大小写子串命中数挑选；命中数 0 时按 seed 兜底挑 1
 *   - 再用 seed 补足到 {@link TARGET_QUESTION_COUNT}
 *
 * @param questions   mock-town 题库（必须满足 7 选项契约）
 * @param intent      从 from_video 抽出的 contextual_intent；可空
 * @param seed        非负整数；同一 seed 同一输入永远返回同一题序，便于
 *                    草稿恢复与单测
 */
export function selectQuizQuestions(
  questions: readonly QuizQuestion[],
  intent: { ip?: string; cos_character?: string; note?: string } | null,
  seed: number,
): QuizSelectionResult {
  const mustRun = questions.filter((q) => q.must_run)
  const others = questions.filter((q) => !q.must_run)

  // ── 动态题（R18.2，至少 1 道）──────────────────────────────────────────
  const keywords = collectIntentKeywords(intent)
  let dynamic: QuizQuestion | null = null
  if (keywords.length > 0 && others.length > 0) {
    const ranked = others
      .map((q) => ({ q, score: scoreQuestionAgainstKeywords(q, keywords) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.q.question_id.localeCompare(b.q.question_id)
      })
    if (ranked[0] && ranked[0].score > 0) {
      dynamic = ranked[0].q
    }
  }
  // 没有 intent 命中也要保证「至少 1 道动态位」 → 用 seed 在 others 里挑 1
  if (dynamic === null && others.length > 0) {
    const ordered = orderByDeterministicHash(others, seed ^ 0x9e3779b1)
    dynamic = ordered[0] ?? null
  }

  // ── 拼装最终题序 ──────────────────────────────────────────────────────
  const selected: QuizQuestion[] = []
  for (const q of mustRun) selected.push(q)
  if (dynamic) selected.push(dynamic)

  const remaining = others.filter((q) => q !== dynamic)
  if (selected.length < TARGET_QUESTION_COUNT && remaining.length > 0) {
    const ordered = orderByDeterministicHash(remaining, seed)
    for (const q of ordered) {
      if (selected.length >= TARGET_QUESTION_COUNT) break
      selected.push(q)
    }
  }

  // 极端情况下题库太小，按现有 selected 返回（≥ 3 题仍满足 R18.1 下限）
  return {
    questions: selected.slice(0, TARGET_QUESTION_COUNT),
    dynamic_question_id: dynamic ? dynamic.question_id : selected[0]!.question_id,
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function collectIntentKeywords(
  intent: { ip?: string; cos_character?: string; note?: string } | null,
): string[] {
  if (!intent) return []
  const out: string[] = []
  const push = (s: string | undefined): void => {
    if (typeof s === 'string') {
      const trimmed = s.trim().toLowerCase()
      if (trimmed.length > 0) out.push(trimmed)
    }
  }
  push(intent.ip)
  push(intent.cos_character)
  push(intent.note)
  return out
}

function scoreQuestionAgainstKeywords(question: QuizQuestion, keywords: string[]): number {
  let score = 0
  const haystack = (
    question.prompt +
    ' ' +
    question.options.map((o) => o.text).join(' ')
  ).toLowerCase()
  for (const kw of keywords) {
    if (kw.length === 0) continue
    if (haystack.includes(kw)) score++
  }
  return score
}

function orderByDeterministicHash<T extends { question_id: string }>(
  items: readonly T[],
  seed: number,
): T[] {
  const arr = items.slice()
  arr.sort((a, b) => djb2(`${seed}|${a.question_id}`) - djb2(`${seed}|${b.question_id}`))
  return arr
}

function djb2(input: string): number {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0
  }
  return h >>> 0
}

/**
 * 把任意字符串列表哈希为 32 位非负整数 seed。Page_Quiz 用 from_video 作为
 * seed 输入，保证同一视频 → 同一题序；刷新后草稿对齐。
 */
export function hashSeed(parts: readonly string[]): number {
  return djb2(parts.join('|'))
}
