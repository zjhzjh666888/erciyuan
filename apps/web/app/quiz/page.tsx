/**
 * Page_Quiz `/quiz` 路由（task 14.3）。
 *
 * 契约（任务 14.3 / R18.1–6）：
 *   1. 3–5 题；本实装恒定 5 题，单题平均 ≤ 8s（顶栏倒计时提醒）
 *   2. 7 选项 × 7 mascot_type 向量加权 — 选项数据原样从 mock-town 取
 *   3. ≥ 1 道动态题，基于 contextual_intent — 由 quizLogic.selectQuizQuestions 实现
 *   4. 草稿持久化 24h — `localStorage.erciyuan:quiz_draft`
 *   5. 完成 → sessionStorage `erciyuan:quiz_result_pending` 写 answers，再
 *      `router.push('/mascot/result?from_video=…')`，把萌宠推断让 task 14.5 做
 *
 * 路由层做的事：
 *   - 顶层 default export 是 Server Component 包 `<Suspense>` → 内部
 *     `'use client'` `<QuizExperience>` 用 `useSearchParams` 读 from_video。
 *     这是 Next.js 14 强约束（无 Suspense 会触发构建期 useSearchParams 错误）。
 *   - 路由本身、CSS Module、子组件全部只活在 `app/quiz/**` 下，
 *     不动 page.tsx / _components/* / globals.css / 主页 / 素材切。
 */
import { Suspense } from 'react'

import { QuizExperience } from './QuizExperience'
import styles from './quiz.module.css'

export default function PageQuiz(): JSX.Element {
  return (
    <Suspense fallback={<QuizFallback />}>
      <QuizExperience />
    </Suspense>
  )
}

function QuizFallback(): JSX.Element {
  return (
    <main className={styles.empty}>
      <p>正在准备题目…</p>
    </main>
  )
}
