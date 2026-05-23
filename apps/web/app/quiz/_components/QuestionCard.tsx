'use client'

/**
 * QuestionCard — Page_Quiz 中部题干 + 7 选项卡片（task 14.3）。
 *
 * 视觉：紫粉渐变玻璃卡 + 像素描边（详见 quiz.module.css）。
 * 布局：选项 7 个 + 1 格 Skip = 2 × 4 grid（手机宽度退化为单列）。
 *
 * R18.3：每个选项映射 7 维 mascot_type 权重。本组件只负责把选项透传给
 * 父组件，权重逻辑在 quizLogic.ts 与 task 14.5 解析。
 */
import { useMemo } from 'react'

import type { QuizQuestion, QuizOption } from '@erciyuan/mock-town'

import styles from '../quiz.module.css'

export interface QuestionCardProps {
  question: QuizQuestion
  /** 当前题序（0-based） */
  index: number
  /** 总题数 */
  total: number
  /** 当前题已选 option（草稿恢复时回填）；未答为 null */
  picked: QuizOption | null
  /** 是否为本会话的"动态题"（R18.2）；用于 badge */
  isDynamic: boolean
  /** 用户点选某个选项 */
  onPick: (option: QuizOption) => void
  /** 用户点击 Skip 时调用；不传则不渲染 Skip 格 */
  onSkip?: () => void
}

export function QuestionCard({
  question,
  index,
  total,
  picked,
  isDynamic,
  onPick,
  onSkip,
}: QuestionCardProps): JSX.Element {
  const labelParts = useMemo(() => {
    const parts: string[] = [`Question ${index + 1} / ${total}`]
    if (question.must_run) parts.push('路演必跑')
    else if (isDynamic) parts.push('动态题')
    return parts
  }, [index, total, question.must_run, isDynamic])

  return (
    <section
      className={styles.questionCard}
      aria-labelledby={`quiz-q-${question.question_id}`}
    >
      <div className={styles.questionLabel}>{labelParts.join(' · ')}</div>
      <h1
        id={`quiz-q-${question.question_id}`}
        className={styles.questionPrompt}
      >
        {question.prompt}
      </h1>

      <ul className={styles.optionsGrid}>
        {question.options.map((opt) => {
          const isPicked = picked?.key === opt.key
          return (
            <li key={opt.key} style={{ listStyle: 'none' }}>
              <button
                type="button"
                onClick={() => onPick(opt)}
                aria-pressed={isPicked}
                className={`${styles.option} ${isPicked ? styles.optionPicked : ''}`}
              >
                <span className={styles.optionKey} aria-hidden>
                  {opt.key}
                </span>
                <span className={styles.optionText}>{opt.text}</span>
              </button>
            </li>
          )
        })}

        {/* 第 8 格：Skip 占位（R18.1 控制单题时长，提供"跳过"逃生口） */}
        {onSkip ? (
          <li style={{ listStyle: 'none' }}>
            <button
              type="button"
              onClick={onSkip}
              className={`${styles.option} ${styles.optionSkip}`}
              aria-label="跳过本题"
            >
              <span className={styles.optionKey} aria-hidden>
                ↷
              </span>
              <span className={styles.optionText}>跳过本题</span>
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
