'use client'

/**
 * JsonlExportButton — task 13.7（客户端兜底版）
 *
 * design.md §2.7 + R13.5 描述的"导出选中角色 Thought_Trace 为 JSONL"按钮。
 * Slice 1 阶段后端 `GET /api/dashboard/export?character_id=...` 还没落地
 * （要等 task 16.x Sync_Service / Observation_Dashboard server 接入），所以
 * 本任务先做"纯客户端导出兜底"：
 *
 *   1. 订阅 RenderEngine.subscribeThought —— 这是 task 13.3 已经在 RenderEngine
 *      上拉起的 thought fanout 通道，单实例同时分发给 ThoughtStream（保持
 *      50 条 FIFO 用于滚动展示）和本组件（**不限上限**累积持久化历史）。
 *   2. 内部用 `useRef<ThoughtTrace[]>([])` 维护"全程累积顺序"buffer。
 *      demo 期间 mock-town timeline 一轮 90s 也只发几十条 thought，无需做内
 *      存防爆护栏；Slice 5 接 live 流再考虑分页 / 服务端接管。
 *   3. 点击按钮：把 buffer 序列化为 JSONL（`JSON.stringify(trace) + '\n'`），
 *      `URL.createObjectURL(new Blob([jsonl], { type: 'application/x-ndjson' }))`
 *      触发 `<a download>` 隐式下载，文件名 `traces-{character_id||'all'}-{Date.now()}.jsonl`
 *      （R13.5 / design.md §2.7）。
 *   4. buffer 长度 0 时按钮 disabled，避免下载空文件。
 *
 * 设计取舍：
 *  - **buffer 用 ref 而非 state**：fanout hot-loop 上每条 trace 都 setState
 *    会触发整个按钮重渲染；ref 无 React 副作用，仅在条数变化时手动 forceTick
 *    更新右侧"(N 条)"label。条数变化频次低（mock 每 2-3s 一条），重渲染廉价。
 *  - **不深拷贝 trace**：与 RenderEngine.fanoutThought 的契约一致 —— ThoughtEvent
 *    payload 中的 trace 是只读引用。本组件把 trace 推进 buffer 后只做 JSON.stringify，
 *    不会反向修改对象。
 *  - **characterId 过滤前置**：accept `characterId?: string`，'all' 或缺省时
 *    把所有角色合并导出（与后端将来 `?character_id=all` 语义一致）；指定具体
 *    char_id 时只把匹配 ThoughtEvent.charId 的事件入 buffer，避免下载多余数据。
 *  - **download URL 释放**：blob URL 用完立刻 `URL.revokeObjectURL` 释放，
 *    防止 demo 30 分钟跑下来累积一堆未释放的 blob 引用。
 *  - **CSS 复用 13.2 token + 13.6 同槽视觉风格**：按钮用 `--brand-primary`
 *    粉色 + glassmorphism 透底，hover 抬升 box-shadow（与 GlassCard hover
 *    规则相同色系），disabled 状态降低 opacity + cursor=not-allowed。
 *
 * 后端切换路径（task 16.x）：
 *  - 当 `/api/dashboard/export` 上线后，本组件可改为 `fetch(url)` 流下载，
 *    或保留为离线兜底（断网时也能导出已观测过的 trace）。整体 props 契约
 *    不变，对调用方透明。
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import type { RenderEngine, ThoughtEvent, ThoughtTrace } from '@/render/RenderEngine'

/** 文件名中表示"所有角色"的占位符（与 R13.5 / design.md §2.7 约定一致）。 */
const ALL_CHARACTERS_TOKEN = 'all'

export interface JsonlExportButtonProps {
  engine: RenderEngine
  /**
   * 限制导出范围；未传 / 传 `'all'` 时合并导出所有角色（与未来后端
   * `GET /api/dashboard/export?character_id=all` 语义对齐）。
   */
  characterId?: string
}

/**
 * 把 trace 列表序列化为 JSONL 字符串。
 *
 *  - 每行一个 `JSON.stringify(trace)`，行尾 `\n`（design.md §2.7 / R13.5）
 *  - 末尾保留一个 `\n`：与 *nix POSIX 文本文件惯例一致，便于 `wc -l` /
 *    `cat` 拼接，且与 Property 2 round-trip 的 importTraces 逻辑兼容
 *    （空白尾行被 `.split('\n').filter(Boolean)` 自然滤掉）
 *  - **不做去重**：buffer 已按到达顺序累积，上层若重复订阅同一 trace
 *    （StrictMode）由订阅方自身保证幂等
 */
export function serializeTracesToJsonl(traces: readonly ThoughtTrace[]): string {
  if (traces.length === 0) return ''
  const lines: string[] = new Array(traces.length)
  for (let i = 0; i < traces.length; i++) {
    // `JSON.stringify` 自身保证 UTF-8 安全 + emoji surrogate pair 不被切坏
    lines[i] = JSON.stringify(traces[i])
  }
  // 末尾追加一个空字符串，让 `join('\n')` 自动补出尾部 `\n`
  return lines.join('\n') + '\n'
}

/**
 * 构造下载文件名：`traces-{character_id||'all'}-{ts}.jsonl`。
 * 抽出来便于单测 + 与未来后端 Content-Disposition header 文件名规则对齐。
 */
export function buildExportFileName(characterId: string | undefined, nowMs: number): string {
  const tag = characterId && characterId !== ALL_CHARACTERS_TOKEN ? characterId : ALL_CHARACTERS_TOKEN
  return `traces-${tag}-${nowMs}.jsonl`
}

export function JsonlExportButton({
  engine,
  characterId,
}: JsonlExportButtonProps): JSX.Element {
  /**
   * 全程累积 buffer。**不限上限**：design.md / 任务说明明确指出"demo 期间
   * 90s timeline 一轮也才几十条"，Slice 1 不需要分页或环形缓冲；Slice 5
   * 接 live 流后再决定是否替换为 IndexedDB / 服务端拉取。
   */
  const bufferRef = useRef<ThoughtTrace[]>([])
  /** 与 buffer 长度同步的展示用 state；fanout 时手动 sync 触发一次重渲染。 */
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handler = (event: ThoughtEvent): void => {
      // characterId 过滤：若用户指定了具体角色，只接受匹配的 trace。
      if (
        characterId &&
        characterId !== ALL_CHARACTERS_TOKEN &&
        event.charId !== characterId
      ) {
        return
      }
      // 直接 push 引用 —— 与 RenderEngine.fanoutThought 的"trace 只读"契约一致。
      bufferRef.current.push(event.trace)
      setCount(bufferRef.current.length)
    }
    return engine.subscribeThought(handler)
  }, [engine, characterId])

  /**
   * 触发 JSONL 文件下载。
   *
   * 流程：
   *   1. 把 ref 当前快照序列化（点击瞬间的内容；点击后到下载完成期间到达
   *      的新 trace 不算入本次导出，避免文件长度与"显示条数"漂移）
   *   2. Blob + objectURL + 隐藏 `<a download>` + 程序化 click() —— 标准
   *      纯前端下载范式，无第三方依赖
   *   3. download 触发后立刻 revoke URL（Chromium / Firefox 均会先把请求送到
   *      下载管线再回收），不留 blob 引用泄漏
   */
  const handleExport = useCallback(() => {
    if (typeof window === 'undefined') return
    const traces = bufferRef.current
    if (traces.length === 0) return

    const jsonl = serializeTracesToJsonl(traces)
    const fileName = buildExportFileName(characterId, Date.now())
    const blob = new Blob([jsonl], { type: 'application/x-ndjson' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    // 不挂 DOM 也能点击 —— 但 Firefox 历史上某些版本要求 anchor 在 document
    // 内才会真正触发下载，所以保险 append+remove，开销可忽略。
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    // 让浏览器把下载请求 enqueue 到下载管线后再 revoke；setTimeout 0 即可。
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 0)
  }, [characterId])

  const disabled = count === 0
  const tagLabel = characterId && characterId !== ALL_CHARACTERS_TOKEN ? characterId : ALL_CHARACTERS_TOKEN

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        title={
          disabled
            ? '尚未收到 Thought_Trace —— 等首条 thought 推送后再试'
            : `导出 ${count} 条 thought trace 为 JSONL（${tagLabel}）`
        }
        aria-label={`导出 JSONL（已累积 ${count} 条，范围：${tagLabel}）`}
        data-testid="jsonl-export-button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          border: '1px solid rgba(255, 111, 183, 0.45)',
          color: disabled ? 'rgba(245, 245, 247, 0.45)' : 'var(--brand-primary, #FF6FB7)',
          background: disabled ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 111, 183, 0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: disabled ? 'none' : 'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.15))',
          transition:
            'box-shadow var(--motion-fast, 120ms) var(--easing-anime, ease), ' +
            'background var(--motion-fast, 120ms) var(--easing-anime, ease), ' +
            'border-color var(--motion-fast, 120ms) var(--easing-anime, ease)',
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (disabled) return
          e.currentTarget.style.boxShadow =
            'var(--shadow-card-hover, 0 8px 24px rgba(0,0,0,0.25))'
          e.currentTarget.style.borderColor = 'rgba(255, 111, 183, 0.85)'
          e.currentTarget.style.background = 'rgba(255, 111, 183, 0.20)'
        }}
        onMouseLeave={(e) => {
          if (disabled) return
          e.currentTarget.style.boxShadow =
            'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.15))'
          e.currentTarget.style.borderColor = 'rgba(255, 111, 183, 0.45)'
          e.currentTarget.style.background = 'rgba(255, 111, 183, 0.12)'
        }}
      >
        <span aria-hidden="true">📥</span>
        <span>导出 JSONL</span>
      </button>
      <span
        data-testid="jsonl-export-count"
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          color: 'rgba(245, 245, 247, 0.55)',
        }}
        aria-live="polite"
      >
        ({count} 条)
      </span>
    </div>
  )
}

export default JsonlExportButton
