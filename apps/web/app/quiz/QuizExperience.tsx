'use client'

/**
 * QuizExperience — 真正的 `/quiz` 客户端体验（task 14.3）。
 *
 * 职责：
 *   1. 解析 `?from_video=<video_id>`，反查 mock-town `videos` 拿到
 *      `contextual_intent`，喂给 quizLogic.selectQuizQuestions 当种子
 *   2. 维护当前题序 / 已选答案数组 / 单题倒计时
 *   3. 每次选完一题立即写 `localStorage.erciyuan:quiz_draft`
 *   4. 全部答完 → 把 answers 写入 `sessionStorage.erciyuan:quiz_result_pending`，
 *      然后 `router.push('/mascot/result?from_video=…')`
 *   5. 不做萌宠推断（由 task 14.5 Page_MascotResult 解析 sessionStorage 完成）
 *
 * 与 14.4 Mascot_System 的边界：
 *   - 这里只交付"用户答了哪些 QuizOption"。MascotSystem.resolveMascotFromAnswers
 *     在 14.4 上线后由 14.5 自行调用，本 page 不直接消费。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { quizzes, videos } from '@erciyuan/mock-town'
import type { QuizOption } from '@erciyuan/mock-town'

import {
  hashSeed,
  pickContextIntent,
  selectQuizQuestions,
} from '@/quiz/quizLogic'
import {
  clearDraft,
  readDraft,
  writeDraft,
  type QuizDraft,
} from '@/quiz/quizDraft'

import { ProgressBar } from './_components/ProgressBar'
import { QuestionCard } from './_components/QuestionCard'
import styles from './quiz.module.css'

/** 单题倒计时（秒），R18.1：单题平均 ≤ 8s。 */
const PER_QUESTION_SECONDS = 8

/** 任务 14.3 明文规定的 sessionStorage 键名。 */
const QUIZ_RESULT_PENDING_KEY = 'erciyuan:quiz_result_pending'

/** 完成后跳转的目标路由（task 14.5）。 */
const MASCOT_RESULT_ROUTE = '/mascot/result'

export function QuizExperience(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromVideoId = searchParams?.get('from_video') ?? null

  // ── 1. 选题（确定性 / 同 from_video 永远同一题序）────────────────────
  const intent = useMemo(
    () => pickContextIntent(videos, fromVideoId),
    [fromVideoId],
  )
  const seed = useMemo(
    () => hashSeed([fromVideoId ?? '', intent?.ip ?? '', intent?.cos_character ?? '']),
    [fromVideoId, intent],
  )
  const selection = useMemo(
    () => selectQuizQuestions(quizzes, intent ?? null, seed),
    [intent, seed],
  )
  const selected = selection.questions
  const dynamicQuestionId = selection.dynamic_question_id

  // ── 2. 答案 / 题序状态 ────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Array<QuizOption | null>>(() =>
    new Array<QuizOption | null>(selected.length).fill(null),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const startedAtRef = useRef<number>(Date.now())
  const advanceTimerRef = useRef<number | null>(null)

  // ── 3. 草稿恢复 ──────────────────────────────────────────────────────
  // 仅在挂载时尝试恢复一次；selected.length 由 from_video 唯一决定，
  // 同一 from_video 重新进入页面时长度必然一致。
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const draft = readDraft(fromVideoId ?? undefined)
    if (draft && draft.answers.length === selected.length) {
      setAnswers(draft.answers.slice())
      startedAtRef.current = draft.started_at
      const firstUnanswered = draft.answers.findIndex((a) => a === null)
      setCurrentIndex(firstUnanswered === -1 ? selected.length - 1 : firstUnanswered)
    } else {
      // 题数不一致 / 过期 / video_id 不匹配 → 重新开始
      if (draft) clearDraft()
      startedAtRef.current = Date.now()
    }
  }, [fromVideoId, selected.length])

  // ── 4. 单题倒计时（仅视觉提醒，不强制截断）──────────────────────────
  const [secondsRemaining, setSecondsRemaining] = useState(PER_QUESTION_SECONDS)
  useEffect(() => {
    setSecondsRemaining(PER_QUESTION_SECONDS)
    const t = window.setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [currentIndex])

  // 卸载时清掉自动推进定时器
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current != null) {
        window.clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
    }
  }, [])

  // ── 5. 选项点击 ──────────────────────────────────────────────────────
  const finalizeAndRoute = useCallback(
    (finalAnswers: Array<QuizOption | null>) => {
      // 清掉草稿（已收答）
      clearDraft()

      // 把答案 array（含 null）写到 sessionStorage 让 14.5 读
      try {
        window.sessionStorage.setItem(
          QUIZ_RESULT_PENDING_KEY,
          JSON.stringify({
            answers: finalAnswers,
            video_id: fromVideoId,
            completed_at: Date.now(),
          }),
        )
      } catch {
        // 隐私模式 / quota 满 → 静默；14.5 自身也会有兜底
      }

      const target = fromVideoId
        ? `${MASCOT_RESULT_ROUTE}?from_video=${encodeURIComponent(fromVideoId)}`
        : MASCOT_RESULT_ROUTE
      router.push(target)
    },
    [fromVideoId, router],
  )

  const persistDraft = useCallback(
    (next: Array<QuizOption | null>) => {
      const draft: QuizDraft = {
        answers: next,
        started_at: startedAtRef.current,
        ...(fromVideoId ? { video_id: fromVideoId } : {}),
      }
      writeDraft(draft)
    },
    [fromVideoId],
  )

  const handlePick = useCallback(
    (opt: QuizOption) => {
      const next = answers.slice()
      next[currentIndex] = opt
      setAnswers(next)
      persistDraft(next)

      const isLast = currentIndex >= selected.length - 1
      if (isLast) {
        // 末题选完 → 完成
        finalizeAndRoute(next)
      } else {
        // 微延迟 220ms 让用户看到选中态再翻页
        if (advanceTimerRef.current != null) {
          window.clearTimeout(advanceTimerRef.current)
        }
        advanceTimerRef.current = window.setTimeout(() => {
          setCurrentIndex((i) => Math.min(i + 1, selected.length - 1))
          advanceTimerRef.current = null
        }, 220)
      }
    },
    [answers, currentIndex, selected.length, persistDraft, finalizeAndRoute],
  )

  const handleSkip = useCallback(() => {
    const next = answers.slice()
    // 跳过 = 答案为 null；保留 null 以便 14.5 知道用户跳过了
    next[currentIndex] = null
    setAnswers(next)
    persistDraft(next)

    const isLast = currentIndex >= selected.length - 1
    if (isLast) {
      finalizeAndRoute(next)
    } else {
      setCurrentIndex((i) => Math.min(i + 1, selected.length - 1))
    }
  }, [answers, currentIndex, selected.length, persistDraft, finalizeAndRoute])

  const handleBack = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  // ── 6. 渲染 ──────────────────────────────────────────────────────────
  if (selected.length === 0) {
    return (
      <main className={styles.empty}>
        <p>题库未就绪…</p>
      </main>
    )
  }

  const current = selected[currentIndex]
  if (!current) {
    return (
      <main className={styles.empty}>
        <p>题目加载中…</p>
      </main>
    )
  }

  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <ProgressBar
          index={currentIndex}
          total={selected.length}
          secondsRemaining={secondsRemaining}
          intentLabel={summarizeIntent(intent)}
        />

        <QuestionCard
          question={current}
          index={currentIndex}
          total={selected.length}
          picked={answers[currentIndex] ?? null}
          isDynamic={current.question_id === dynamicQuestionId}
          onPick={handlePick}
          onSkip={handleSkip}
        />

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.footerButton}
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            ← 上一题
          </button>
          <span aria-live="polite">
            {answers.every((a) => a !== null)
              ? '已答完，正在生成萌宠…'
              : '选完一题即自动保存草稿（24 小时内可恢复）'}
          </span>
        </footer>
      </div>
    </main>
  )
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

function summarizeIntent(
  intent: { ip?: string; cos_character?: string; note?: string } | null,
): string | null {
  if (!intent) return null
  const bits: string[] = []
  if (intent.ip) bits.push(intent.ip)
  if (intent.cos_character) bits.push(`Cos·${intent.cos_character}`)
  if (intent.note) bits.push(intent.note)
  if (bits.length === 0) return null
  return bits.join(' · ')
}
