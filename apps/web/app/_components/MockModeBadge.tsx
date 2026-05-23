'use client'

/**
 * `MockModeBadge` — 当前数据源标签 + 一键切换（task 12.2）。
 *
 * 这是 task 12.2 范围内最小可用的"Dashboard 设置面板"占位 —— 真正的 Bento
 * Grid 设置面板留给 task 13。现阶段它只做三件事：
 *   1. 显示当前 `feature.mock_mode` 解析出来的标签：MOCK / LIVE
 *   2. 点击切换 localStorage 持久化的 flag，并 `location.reload()` 让
 *      DataAdapter 重新构造。注意 URL `?mock=...` 优先级高于 localStorage，
 *      因此切换前先把 `mock` 参数从 URL 中剔除，确保新值"真的生效"
 *   3. 在 LIVE 模式下 console.warn 提醒尚未接 live，避免评委茫然
 *
 * 设计取舍：
 *  - 不引入 React state 库 / context —— 单一组件本地状态足够
 *  - SSR 安全：组件用 `'use client'` + `useEffect` 在挂载后才读 flag，
 *    服务端初始 render 默认按"未知"渲染，避免 hydration mismatch
 *  - `useEffect` 同步 `MOCK_MODE_CHANGED_EVENT` —— 同窗口内任何代码改 flag
 *    时 badge 文案立刻更新（即便不刷新）
 */

import { useCallback, useEffect, useState } from 'react'

import {
  MOCK_MODE_CHANGED_EVENT,
  getMockModeFlag,
  setMockModeFlag,
} from '@/feature-flags/mockMode'

const URL_PARAM_KEY = 'mock'

/**
 * 在切换 flag 前剔除 URL 上的 `?mock=...`。URL 优先级最高，不剔除的话
 * 用户即便切到了 LIVE，刷新后又会被 URL 拽回 MOCK（反之同理）。
 */
function stripMockUrlParam(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has(URL_PARAM_KEY)) {
      url.searchParams.delete(URL_PARAM_KEY)
      window.history.replaceState(null, '', url.toString())
    }
  } catch {
    // 老浏览器或非标准协议 —— 静默放过，最差情况是切换需要刷新两次
  }
}

export function MockModeBadge(): JSX.Element {
  // 服务端 + 首次 client render 之前先按默认值（true）渲染，避免 hydration
  // mismatch；useEffect 在 mount 后立即纠正成真实解析值。
  const [mounted, setMounted] = useState(false)
  const [isMock, setIsMock] = useState<boolean>(true)

  useEffect(() => {
    setMounted(true)
    setIsMock(getMockModeFlag())

    const handler = () => setIsMock(getMockModeFlag())
    window.addEventListener(MOCK_MODE_CHANGED_EVENT, handler)
    // 跨标签页 localStorage 同步
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(MOCK_MODE_CHANGED_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const onToggle = useCallback(() => {
    const next = !isMock
    stripMockUrlParam()
    setMockModeFlag(next)
    setIsMock(next)
    if (!next) {
      // eslint-disable-next-line no-console
      console.warn(
        '[MockModeBadge] switching to LIVE — Sync_Service is not implemented ' +
          'yet (task 16.5). UI will not receive events until backend is up. ' +
          'Add ?mock=1 or click again to fall back.',
      )
    }
    // 让 DataAdapter / RenderEngine 重新解析 flag。当前 Slice 1 的 mock 流
    // 由 RenderEngine 直连 mock-town（task 12.1），切换 LIVE 需要刷新让
    // 那条接入路径退出。Slice 5 接 Sync_Service 后，这里会换成"调用
    // adapter.dispose() + 重新 subscribe"，无需刷新。
    if (typeof window !== 'undefined') {
      // 短延时让 console.warn / state update 先 flush
      window.setTimeout(() => {
        window.location.reload()
      }, 50)
    }
  }, [isMock])

  // 服务端 / hydration 前用 placeholder 渲染，避免文案抖动。
  const labelText = mounted ? (isMock ? 'MOCK' : 'LIVE') : '…'
  const tone = mounted && !isMock ? 'live' : 'mock'

  return (
    <button
      type="button"
      onClick={onToggle}
      title={
        mounted
          ? isMock
            ? '当前数据源：@erciyuan/mock-town（点击切换到 LIVE）'
            : '当前数据源：Sync_Service（占位，尚未接入；点击切回 MOCK）'
          : '解析数据源中…'
      }
      aria-label={
        mounted
          ? `数据源 ${labelText}（点击切换）`
          : '数据源解析中'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 9999,
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        userSelect: 'none',
        border:
          tone === 'live'
            ? '1px solid rgba(122, 231, 255, 0.6)'
            : '1px solid rgba(255, 111, 183, 0.6)',
        color:
          tone === 'live' ? 'var(--semantic-info, #7AE7FF)' : 'var(--brand-primary, #FF6FB7)',
        background:
          tone === 'live'
            ? 'rgba(122, 231, 255, 0.10)'
            : 'rgba(255, 111, 183, 0.12)',
        backdropFilter: 'blur(8px)',
        transition: 'all var(--motion-fast, 120ms) var(--easing-anime, ease)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background:
            tone === 'live'
              ? 'var(--semantic-info, #7AE7FF)'
              : 'var(--brand-primary, #FF6FB7)',
          boxShadow:
            tone === 'live'
              ? '0 0 6px rgba(122, 231, 255, 0.8)'
              : '0 0 6px rgba(255, 111, 183, 0.8)',
        }}
      />
      <span>data · {labelText}</span>
    </button>
  )
}

export default MockModeBadge
