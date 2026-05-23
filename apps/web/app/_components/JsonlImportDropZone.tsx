'use client'

/**
 * JsonlImportDropZone — task 13.8
 *
 * 客户端 JSONL / JSON 导入拖拽区，把文件解析后回放给 RenderEngine 的
 * thought 事件总线（design.md §2.7 / R13.6）。
 *
 *  - 接受 `.jsonl` / `.json` 后缀，文件 ≤ 10 MB（超过直接报错不解析）。
 *  - 解析按行 split（兼容 `\r\n` / `\n`），逐行 JSON.parse + 最小 schema
 *    校验（trace_id / character_id / ts / observation / plan / next_action /
 *    speech 必须存在）。
 *  - 解析失败：弹出错误行号列表 + "跳过坏行继续导入"按钮。用户点确认后
 *    用已成功的 traces 调 `engine.replayThoughts(traces)`。
 *  - 成功：toast `导入 N 条 trace`（4 秒后自动消失）。
 *
 * 真正的服务端 `POST /api/dashboard/import` 留到 task 16+；本任务只做客户端
 * 回放路径，与 task 13.7 JsonlExportButton 形成 demo 闭环（导出 → 导入 →
 * ThoughtStream 看到回放）。
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react'

import type { RenderEngine, ThoughtTrace } from '@/render/RenderEngine'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB（design.md §2.7）
const ACCEPT_EXT = ['.jsonl', '.json']
const TOAST_DURATION_MS = 4000

interface ParseError {
  line: number
  reason: string
}

interface ParseResult {
  traces: ThoughtTrace[]
  errors: ParseError[]
}

/**
 * 最小 schema 校验：要求 design.md / @erciyuan/types ThoughtTrace 的
 * 7 个核心字段都存在；不做深度类型校验（next_action.kind 等留给消费方）。
 */
function validateTraceShape(value: unknown): value is ThoughtTrace {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.trace_id === 'string' &&
    typeof v.character_id === 'string' &&
    typeof v.ts === 'number' &&
    typeof v.observation === 'string' &&
    typeof v.plan === 'string' &&
    typeof v.next_action === 'object' &&
    v.next_action !== null &&
    // speech 允许为 null 或 string（ThoughtTrace.speech: string | null）
    (typeof v.speech === 'string' || v.speech === null) &&
    // 字段必须"存在"——通过 in 检查 speech key（null 也算存在）
    'speech' in v
  )
}

/**
 * 把 JSONL / JSON 文本解析为 ThoughtTrace 列表 + 错误行号列表。
 *
 *  - JSONL 标准：每行一个 JSON 对象。空行（trim 后为 ""）跳过不计入错误。
 *  - 兼容 `.json`：若整段是一个 JSON 数组（首字符为 `[`），先 JSON.parse，
 *    再逐项校验；非数组同样按行尝试。
 */
function parseJsonl(text: string): ParseResult {
  const traces: ThoughtTrace[] = []
  const errors: ParseError[] = []

  // 兼容 `.json` 单数组形式：整段 JSON.parse → 是数组就当 traces 列表用。
  const trimmed = text.trim()
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed) as unknown
      if (Array.isArray(arr)) {
        arr.forEach((item, idx) => {
          if (validateTraceShape(item)) {
            traces.push(item)
          } else {
            errors.push({
              line: idx + 1,
              reason: '缺少必填字段或类型错误',
            })
          }
        })
        return { traces, errors }
      }
    } catch {
      // 整段 parse 失败：回退到逐行 JSONL 解析
    }
  }

  const lines = text.split(/\r?\n/)
  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (line === '') return // 空行不算错误
    const lineNum = idx + 1
    let parsed: unknown
    try {
      parsed = JSON.parse(line)
    } catch (err) {
      errors.push({
        line: lineNum,
        reason: err instanceof Error ? err.message : 'JSON 解析失败',
      })
      return
    }
    if (!validateTraceShape(parsed)) {
      errors.push({
        line: lineNum,
        reason: '缺少必填字段或类型错误',
      })
      return
    }
    traces.push(parsed)
  })

  return { traces, errors }
}

export interface JsonlImportDropZoneProps {
  engine: RenderEngine
}

export function JsonlImportDropZone({ engine }: JsonlImportDropZoneProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [pending, setPending] = useState<ParseResult | null>(null)
  const [topError, setTopError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 卸载时清理 toast 定时器，避免 setState on unmounted。
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimerRef.current !== null) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  const commitImport = useCallback(
    (traces: ThoughtTrace[]) => {
      if (traces.length === 0) {
        setTopError('没有可导入的 trace')
        return
      }
      engine.replayThoughts(traces)
      showToast(`导入 ${traces.length} 条 trace`)
      setPending(null)
      setTopError(null)
    },
    [engine, showToast],
  )

  const processFile = useCallback(
    async (file: File) => {
      setTopError(null)
      setPending(null)

      // 后缀校验
      const lowerName = file.name.toLowerCase()
      const okExt = ACCEPT_EXT.some((ext) => lowerName.endsWith(ext))
      if (!okExt) {
        setTopError(`只接受 ${ACCEPT_EXT.join(' / ')} 后缀，当前文件：${file.name}`)
        return
      }

      // 大小校验
      if (file.size > MAX_FILE_BYTES) {
        const mb = (file.size / 1024 / 1024).toFixed(2)
        setTopError(`文件 ${mb} MB 超过 10 MB 上限，已拒绝解析`)
        return
      }

      setIsParsing(true)
      try {
        const text = await file.text()
        const result = parseJsonl(text)
        if (result.errors.length === 0) {
          commitImport(result.traces)
        } else {
          // 有错：把结果暂存，让用户决定是否跳过坏行继续。
          setPending(result)
        }
      } catch (err) {
        setTopError(err instanceof Error ? err.message : '读取文件失败')
      } finally {
        setIsParsing(false)
      }
    },
    [commitImport],
  )

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      void processFile(file)
    },
    [processFile],
  )

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      // 重置 input 值，方便用户连续选择同一文件。
      e.target.value = ''
      if (!file) return
      void processFile(file)
    },
    [processFile],
  )

  const onClickPick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="JSONL 导入拖拽区"
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClickPick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClickPick()
          }
        }}
        style={{
          border: `1.5px dashed ${
            isDragging ? 'var(--brand-primary, #FF6FB7)' : 'rgba(245, 245, 247, 0.30)'
          }`,
          borderRadius: 10,
          padding: '14px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging
            ? 'rgba(255, 111, 183, 0.08)'
            : 'rgba(255, 255, 255, 0.03)',
          transition: 'background 160ms ease, border-color 160ms ease',
          fontSize: 12,
          lineHeight: 1.5,
          color: 'rgba(245, 245, 247, 0.75)',
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 4 }} aria-hidden>
          ⬇
        </div>
        <div>
          {isParsing ? (
            '正在解析…'
          ) : (
            <>
              拖入 .jsonl/.json 或{' '}
              <span
                style={{
                  color: 'var(--brand-primary, #FF6FB7)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                点击选择
              </span>
            </>
          )}
        </div>
        <div
          style={{
            fontSize: 10,
            marginTop: 2,
            color: 'rgba(245, 245, 247, 0.45)',
          }}
        >
          单文件 ≤ 10 MB · 每行一条 ThoughtTrace
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json,application/json"
          style={{ display: 'none' }}
          onChange={onFileInputChange}
        />
      </div>

      {topError && (
        <ErrorBox>
          <strong style={{ color: '#FF8B6F' }}>导入失败：</strong>
          <span>{topError}</span>
        </ErrorBox>
      )}

      {pending && pending.errors.length > 0 && (
        <ErrorBox>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: '#FF8B6F' }}>解析出错</strong>{' '}
            <span style={{ color: 'rgba(245, 245, 247, 0.65)' }}>
              成功 {pending.traces.length} 条 / 失败 {pending.errors.length} 条
            </span>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 16,
              maxHeight: 96,
              overflowY: 'auto',
              fontSize: 11,
              color: 'rgba(245, 245, 247, 0.75)',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              lineHeight: 1.5,
            }}
          >
            {pending.errors.slice(0, 10).map((err) => (
              <li key={err.line}>
                行 {err.line}：{err.reason}
              </li>
            ))}
            {pending.errors.length > 10 && (
              <li style={{ opacity: 0.6, listStyle: 'none' }}>
                ... 还有 {pending.errors.length - 10} 条错误未显示
              </li>
            )}
          </ul>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => commitImport(pending.traces)}
              disabled={pending.traces.length === 0}
              style={primaryButtonStyle}
            >
              跳过坏行继续导入（{pending.traces.length}）
            </button>
            <button
              type="button"
              onClick={() => {
                setPending(null)
                setTopError(null)
              }}
              style={ghostButtonStyle}
            >
              取消
            </button>
          </div>
        </ErrorBox>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(46, 213, 115, 0.92)',
            color: '#0b1018',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 999,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

function ErrorBox({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div
      style={{
        background: 'rgba(255, 111, 111, 0.08)',
        border: '1px solid rgba(255, 139, 111, 0.35)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 12,
        color: 'rgba(245, 245, 247, 0.85)',
      }}
    >
      {children}
    </div>
  )
}

const primaryButtonStyle = {
  flex: 1,
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(255, 111, 183, 0.55)',
  background: 'rgba(255, 111, 183, 0.18)',
  color: '#FFD7EB',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
} as const

const ghostButtonStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(255, 255, 255, 0.18)',
  background: 'transparent',
  color: 'rgba(245, 245, 247, 0.75)',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
} as const

export default JsonlImportDropZone
