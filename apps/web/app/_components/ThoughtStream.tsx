'use client'

/**
 * ThoughtStream — task 13.3
 *
 * 实时滚动 Thought_Trace 卡片堆（design.md §2.4 / R13.2）。
 *
 *  - 数据源：订阅 RenderEngine 的 thought 事件流（见 RenderEngine.subscribeThought）。
 *  - 容量：最近 50 条，超出 FIFO（新事件入头部，旧事件从尾部丢弃）。
 *  - 单条卡：固定 84px 高，字段 timestamp / char_id / observation / plan /
 *    next_action 标签 / speech（可选）。
 *  - 标签颜色：
 *      move  → cyan          (#7AE7FF)  → var(--semantic-info / --brand-secondary)
 *      tool  → brand-primary (#FF6FB7)  → var(--brand-primary)
 *      speak → lime / success(#B6FF6F)  → var(--semantic-success)
 *      idle  → mute (rgba(white, .45))
 *  - 平滑滚动：每条用 `<motion.div layout>`，新条目从顶部插入时旧条目自动
 *    平滑下移；动画时长 200ms easeOut（design.md §2.4）。
 *  - 失败标 ⚠：trace.error 非空时左侧 4px 橙色 (#FFB86F) 竖线 + ⚠ icon。
 *
 * 性能：
 *  - buffer 用 ref 维护，避免每个 fanout 都重新构造 React 状态对象。
 *  - 仅在 push（也就是收到新事件）时触发一次 setState；50 条 FIFO 上限让
 *    渲染节点数稳定，无需虚拟滚动。
 *
 * 容器：
 *  - 外层 GlassCard variant="primary"，高度撑满 BentoSlot。
 *  - 内部使用 `overflow-y: auto`：buffer 没满 50 条时一般撑不到滚动；满时
 *    用户可手动向下查看更早 trace（自动滚动 / 暂停在 R13.4 对话流处理；
 *    本任务只要求"新条目从顶部进入"，不强制锁滚动条位置）。
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { GlassCard, GlassCardHeader } from './GlassCard'

import type { RenderEngine, ThoughtEvent } from '@/render/RenderEngine'
import type { ThoughtTrace } from '@/render/RenderEngine'

const BUFFER_LIMIT = 50

/** 单条 thought 卡固定高度（含 8px 间距，design.md §2.4）。 */
const ITEM_HEIGHT_PX = 84

/** Framer Motion `layout` 过渡时长（design.md §2.4 平滑下移 200ms easeOut）。 */
const LAYOUT_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }

/** next_action.kind → 标签底色 / 文字色 token。 */
type ActionKind = 'move' | 'tool' | 'speak' | 'idle'

interface KindStyle {
  /** 圆点 + 文字主色，标签底色用 24% alpha */
  color: string
  /** 标签文字（mock-town 协议字面值；保留英文便于 dashboard 一眼识别） */
  label: string
}

const KIND_STYLES: Record<ActionKind, KindStyle> = {
  move: { color: '#7AE7FF', label: 'MOVE' },
  tool: { color: '#FF6FB7', label: 'TOOL' },
  speak: { color: '#B6FF6F', label: 'SPEAK' },
  idle: { color: 'rgba(245, 245, 247, 0.45)', label: 'IDLE' },
}

/**
 * 给标签底色加 24% alpha 的辅助函数：处理两类输入：
 *  - hex 形式 `#RRGGBB` → 转 `rgba(r, g, b, 0.24)`
 *  - 已是 rgba(...) 的 IDLE 灰直接套一层（保持现有 alpha）
 */
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // 非 hex 输入：直接返回（IDLE 的 mute color 保留原 alpha）
  return color
}

/** UNIX ms → `HH:mm:ss`（本地时区）。 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 简化 char_id 显示：去掉前缀 `mock_char_`，让卡头不被 ID 占据太多视觉宽度。
 *  - `mock_char_dog_social_alpha` → `dog_social_alpha`
 *  - `live_char_xxx_yyy`          → `live_char_xxx_yyy` (原样)
 */
function shortCharId(id: string): string {
  return id.startsWith('mock_char_') ? id.slice('mock_char_'.length) : id
}

/** ThoughtTrace.next_action.kind 提取（带类型安全防御）。 */
function getActionKind(trace: ThoughtTrace): ActionKind {
  const kind = trace.next_action.kind
  if (kind === 'move' || kind === 'tool' || kind === 'speak' || kind === 'idle') {
    return kind
  }
  return 'idle'
}

interface BufferEntry {
  /** 唯一 React key —— trace_id 已唯一；附 ts 兜底防止 mock 重启循环时复用。 */
  key: string
  charId: string
  trace: ThoughtTrace
  receivedAt: number
}

export interface ThoughtStreamProps {
  engine: RenderEngine
}

export function ThoughtStream({ engine }: ThoughtStreamProps): JSX.Element {
  // buffer 用 ref 持久；setState 只在 push 时触发一次重渲染。
  const bufferRef = useRef<BufferEntry[]>([])
  const [, forceTick] = useState(0)
  const tick = useCallback(() => forceTick((n) => (n + 1) | 0), [])

  // mount 时间作为相对时间戳的基准（design.md §2.4：HH:mm:ss + 相对秒）。
  const mountedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    const handler = (event: ThoughtEvent): void => {
      const entry: BufferEntry = {
        key: `${event.trace.trace_id}@${event.ts}`,
        charId: event.charId,
        trace: event.trace,
        receivedAt: event.ts,
      }
      // FIFO 50：新事件入头部，超出从尾部丢弃。
      const next = [entry, ...bufferRef.current]
      if (next.length > BUFFER_LIMIT) next.length = BUFFER_LIMIT
      bufferRef.current = next
      tick()
    }
    return engine.subscribeThought(handler)
  }, [engine, tick])

  const items = bufferRef.current

  return (
    <GlassCard
      as="section"
      variant="primary"
      density="normal"
      hoverable={false}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      aria-label="Thought Stream 实时思维链滚动卡"
    >
      <GlassCardHeader>
        <span>🧠 Thought Stream</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(245, 245, 247, 0.45)',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          }}
        >
          {items.length} / {BUFFER_LIMIT}
        </span>
      </GlassCardHeader>

      <div
        data-testid="thought-stream-list"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          // 卡片间垂直 8px 间隔（design.md §2.4）；padding 留出滚动条空间。
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false}>
            {items.map((entry) => (
              <ThoughtCard
                key={entry.key}
                entry={entry}
                mountedAt={mountedAtRef.current}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  )
}

function EmptyState(): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 16,
        fontSize: 12,
        lineHeight: 1.5,
        color: 'rgba(245, 245, 247, 0.45)',
      }}
    >
      等待 thought trace 推送…
      <br />
      （mock 模式下约 85s 后第一条出现）
    </div>
  )
}

interface ThoughtCardProps {
  entry: BufferEntry
  mountedAt: number
}

function ThoughtCard({ entry, mountedAt }: ThoughtCardProps): JSX.Element {
  const { trace } = entry
  const kind = getActionKind(trace)
  const kindStyle = KIND_STYLES[kind]
  const hasError = !!trace.error
  const tagBg = withAlpha(kindStyle.color, 0.18)

  // 相对秒：从 ThoughtStream 挂载时刻起算（demo 期间方便观众感知节奏）。
  const relSec = Math.max(0, Math.round((entry.receivedAt - mountedAt) / 1000))
  const tsLabel = `${formatTime(entry.receivedAt)} · +${relSec}s`

  // next_action 第二行细节：move 的目标 / tool 的名字 / speak 的目标 char。
  const actionDetail = useMemo(() => describeAction(trace), [trace])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={LAYOUT_TRANSITION}
      style={{
        position: 'relative',
        flex: '0 0 auto',
        height: ITEM_HEIGHT_PX,
        boxSizing: 'border-box',
        // 内边距 12px（design.md §2.4）；左侧有 error 时补足竖线宽度让正文不被遮。
        padding: hasError ? '8px 10px 8px 14px' : '8px 10px',
        background: 'var(--surface-glass-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontSize: 13,
        lineHeight: 1.35,
        color: 'rgba(245, 245, 247, 0.92)',
      }}
    >
      {hasError && (
        <span
          aria-hidden
          data-testid="thought-error-bar"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: '#FFB86F',
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        />
      )}

      {/* 行 1：时间戳 + char_id + next_action 标签 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          color: 'rgba(245, 245, 247, 0.55)',
          minHeight: 16,
        }}
      >
        <span>{tsLabel}</span>
        <span style={{ color: 'rgba(245, 245, 247, 0.75)' }}>
          {shortCharId(entry.charId)}
        </span>
        <span style={{ flex: 1 }} />
        <span
          data-testid="thought-action-tag"
          data-action-kind={kind}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '1px 6px',
            borderRadius: 4,
            background: tagBg,
            color: kindStyle.color,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: kindStyle.color,
              flex: '0 0 auto',
            }}
          />
          {kindStyle.label}
        </span>
        {hasError && (
          <span
            aria-label="thought error"
            title={trace.error ?? ''}
            style={{ color: '#FFB86F', fontSize: 12 }}
          >
            ⚠
          </span>
        )}
      </div>

      {/* 行 2：observation —— 一行省略 */}
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.35,
          color: 'rgba(245, 245, 247, 0.92)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={trace.observation}
      >
        {trace.observation || <span style={{ opacity: 0.5 }}>(no observation)</span>}
      </div>

      {/* 行 3：plan —— 颜色稍暗一档 */}
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.35,
          color: 'rgba(245, 245, 247, 0.65)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={trace.plan}
      >
        {trace.plan || <span style={{ opacity: 0.5 }}>(no plan)</span>}
      </div>

      {/* 行 4：next_action detail + speech */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: 'rgba(245, 245, 247, 0.55)',
          minHeight: 14,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {actionDetail && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              color: 'rgba(245, 245, 247, 0.55)',
              flex: '0 0 auto',
            }}
            title={actionDetail}
          >
            {actionDetail}
          </span>
        )}
        {trace.speech && (
          <span
            style={{
              fontStyle: 'italic',
              color: 'rgba(245, 245, 247, 0.85)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={trace.speech}
          >
            “{trace.speech}”
          </span>
        )}
      </div>
    </motion.div>
  )
}

/** next_action 摘要：让标签之外能再看一眼"具体要去哪 / 用哪个工具"。 */
function describeAction(trace: ThoughtTrace): string {
  const a = trace.next_action
  switch (a.kind) {
    case 'move':
      return `→ (${a.target.x}, ${a.target.y})`
    case 'tool':
      return `tool: ${a.name}`
    case 'speak':
      return `→ ${shortCharId(a.target_char)}`
    case 'idle':
      return `idle ${a.duration_ms}ms`
    default: {
      // 类型穷尽守卫
      const _exhaustive: never = a
      return String(_exhaustive)
    }
  }
}

export default ThoughtStream
