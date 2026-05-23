/**
 * `DataAdapter.ts` — 前端数据源抽象（task 12.2）。
 *
 * 严格落地 design.md §Mock-First Demo Pipeline 的 DataAdapter 契约。这一层
 * 是前端唯一的"数据源开关"：上层 Render_Engine / Observation_Dashboard 都
 * 不知道、也不应当关心数据来自 `@erciyuan/mock-town` 还是 Sync_Service。
 *
 * 现阶段（Slice 1）：
 *  - **MockDataAdapter** 已可用 —— 内部 `startRuntime({ onEvent })` 桥接
 *    `@erciyuan/mock-town`，把 `ServerMsg` 流派发给所有订阅者
 *  - **LiveDataAdapter** 仅占位 —— Slice 5（任务 16.5）真正接 WebSocket
 *    时再实现；当前 `subscribe()` 会 console.warn + 返回空 unsubscribe
 *  - **resolveDataAdapter()** 工厂根据 `feature.mock_mode` 翻转
 *
 * **设计取舍**：
 *  - design.md 原 sketch 把 getCharacters / getRecentTraces 等查询接口都
 *    放进 DataAdapter；这些查询在 Slice 1 还用不到（仪表盘任务 13 才落地），
 *    现阶段只把"事件订阅"接口前置，避免引入 LiveDataAdapter 必须返回 mock
 *    数据的尴尬反向依赖。后续 Slice 5 再扩 ServerMsg 之外的 RPC 接口。
 *  - DataAdapter 是事件总线（一对多），允许多个订阅者；MockDataAdapter
 *    内部只持有一份 mock-town runtime handle，用 fan-out 派发给订阅者。
 *  - 12.1 已经在 RenderEngine 之外直连 mock-town；本任务不动那条接入点，
 *    DataAdapter 仅作为下一轮（Slice 5）的"接口前置"。
 */

import type { ServerMsg } from '@erciyuan/mock-town'

import { getMockModeFlag } from '../feature-flags/mockMode'

// 对外 re-export `ServerMsg`，避免消费者再单独 import `@erciyuan/mock-town`。
export type { ServerMsg } from '@erciyuan/mock-town'

/**
 * 数据源抽象。现阶段只暴露事件订阅，Slice 5 再扩查询 RPC（getCharacters
 * 等）。所有 ServerMsg 都按 design.md §Sync_Service 协议逐字段一致。
 */
export interface DataAdapter {
  /**
   * 订阅 ServerMsg 事件流。
   *
   * @returns 取消订阅函数。重复调用 unsubscribe 应当幂等无副作用。
   */
  subscribe(handler: (msg: ServerMsg) => void): () => void

  /**
   * 释放底层资源（Mock runtime / WebSocket 连接 / 定时器等）。
   * 调用 dispose 后再调用 subscribe 应当返回 no-op unsubscribe，
   * 而不是抛错（让 React StrictMode 双挂载 / HMR 重渲染场景幂等）。
   */
  dispose(): void
}

// ────────────────────────────────────────────────────────────────────────────
// MockDataAdapter
// ────────────────────────────────────────────────────────────────────────────

/**
 * `MockDataAdapter` 包装 `@erciyuan/mock-town` 的 `startRuntime` —— 把每一条
 * 时间轴事件 fan-out 给所有订阅者。
 *
 * 懒启动：第一个订阅者 attach 时才 `startRuntime`，最后一个订阅者 detach
 * 后保留 runtime（避免 React StrictMode / Suspense 抖动时反复重启时间轴），
 * 仅在 `dispose()` 时彻底停止。
 *
 * **task 12.6 兜底链路**：如果 `startRuntime()` 异步加载或启动期间抛错，
 * MockDataAdapter 不会让订阅者从此收不到任何事件 —— 它会启动一个 1s 节拍
 * 的 `setInterval`，按顺序循环吐 `getStaticTimeline()` 返回的全量事件，
 * 让 RenderEngine / Dashboard 至少"画面继续动"（design.md §Mock-First
 * Cookbook 的最低保证）。
 */
export class MockDataAdapter implements DataAdapter {
  private handlers = new Set<(msg: ServerMsg) => void>()
  /**
   * runtime handle；首次 subscribe 时惰性启动。
   * 类型走 `unknown`，避免在不需要时把 `MockRuntimeHandle` 类型也注入到调用方。
   */
  private runtimeHandle: { stop(): void; jumpTo(seconds: number): void } | null =
    null
  /**
   * task 12.6：当 `ensureRuntimeStarted` 失败（startRuntime 抛错或无法 import）
   * 时，启动这个 setInterval 作为静态轮播兜底。`dispose` / runtime 重启
   * 时清掉。
   */
  private fallbackIntervalId: ReturnType<typeof setInterval> | null = null
  /** 兜底轮播游标。 */
  private fallbackCursor = 0
  private disposed = false

  subscribe(handler: (msg: ServerMsg) => void): () => void {
    if (this.disposed) {
      // 已 dispose 的实例不应再被使用；返回 no-op 而不是抛错，
      // 让 HMR / StrictMode 双挂载场景静默幂等。
      return () => {}
    }
    this.handlers.add(handler)
    void this.ensureRuntimeStarted()
    return () => {
      this.handlers.delete(handler)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.handlers.clear()
    if (this.runtimeHandle) {
      try {
        this.runtimeHandle.stop()
      } catch {
        // 不阻塞 dispose
      }
      this.runtimeHandle = null
    }
    if (this.fallbackIntervalId !== null) {
      clearInterval(this.fallbackIntervalId)
      this.fallbackIntervalId = null
    }
  }

  /** 暴露给 demo runbook 的"跳到精彩片段"入口。 */
  jumpTo(seconds: number): void {
    this.runtimeHandle?.jumpTo(seconds)
  }

  /**
   * 惰性 import `@erciyuan/mock-town` —— 让 SSR 阶段（DataAdapter 工厂调用）
   * 不必同步加载 mock 数据 bundle，也避免 server bundler 把 mock 数据捆进
   * 路由 chunk。subscribe 必然在 client side 调用，import 在浏览器侧解析。
   *
   * task 12.6：startRuntime 启动失败时不再静默掉链路，改为启动 1s
   * `setInterval` 轮播 `getStaticTimeline()`，让订阅者持续收到事件，
   * 画面"继续动"。这是 design.md §Mock-First Cookbook 给的最低保证。
   */
  private async ensureRuntimeStarted(): Promise<void> {
    if (this.runtimeHandle || this.disposed) return
    try {
      const mod = await import('@erciyuan/mock-town')
      if (this.disposed) return
      this.runtimeHandle = mod.startRuntime({
        onEvent: (msg) => this.fanout(msg),
        loop: true,
        // task 12.6：runtime 内部 schedule 抛错 → 切到 setInterval 静态播。
        // runtime 自身已经把 _forceFallback 拉起来，这里仅做 console.warn
        // 提示开发者。MockDataAdapter 不重复装"第二份"setInterval —— 由
        // mock-town runtime 那一层接管即可，订阅者依然能收到事件。
        onError: (err) => {
          // eslint-disable-next-line no-console
          console.warn(
            '[MockDataAdapter] mock-town runtime error, runtime is now in static-tick fallback:',
            err,
          )
        },
      })
    } catch (err) {
      if (this.disposed) return
      // eslint-disable-next-line no-console
      console.warn(
        '[MockDataAdapter] failed to start mock runtime, switching to static interval fallback:',
        err,
      )
      // 兜底链路 ② —— `import('@erciyuan/mock-town')` 整个失败（罕见，
      // 通常是包构建问题）：自己拉一个 setInterval，循环静态轮播
      // timeline.ts 全量事件。getStaticTimeline 也走同一个动态 import；
      // 如果连那次 import 也失败，降级到内置 fallback 心跳（避免静默）。
      await this.startStaticFallback()
    }
  }

  /**
   * task 12.6：启动 1s 节拍的"静态轮播"兜底循环。
   *
   * - 优先尝试 `getStaticTimeline()` 拿全量事件按顺序循环
   * - 拉不到（连 import 都失败）→ 退化为 `system.degraded` heartbeat-like
   *   事件，让订阅者至少能看到 mock 流仍在心跳
   *
   * 注意此函数本身是 idempotent —— 同一个 adapter 实例第二次调用直接 no-op。
   */
  private async startStaticFallback(): Promise<void> {
    if (this.disposed) return
    if (this.fallbackIntervalId !== null) return

    let staticEvents: Array<{ msg: ServerMsg }> = []
    try {
      const mod = await import('@erciyuan/mock-town')
      if (this.disposed) return
      // mock-town 暴露 getStaticTimeline 把 timeline.ts 浅拷贝出来；
      // 失败时（旧版本无该 export）回落到 mod.timeline。
      const fn = (mod as { getStaticTimeline?: () => Array<{ msg: ServerMsg }> })
        .getStaticTimeline
      const list = fn ? fn() : (mod as { timeline?: Array<{ msg: ServerMsg }> }).timeline
      if (Array.isArray(list)) staticEvents = list
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[MockDataAdapter] static timeline import also failed, only system heartbeats will be emitted:',
        err,
      )
    }

    this.fallbackCursor = 0
    this.fallbackIntervalId = setInterval(() => {
      if (this.disposed) return
      if (staticEvents.length === 0) {
        // 退化心跳：发一条不破坏 schema 的 system 消息，让订阅者知道
        // mock 流仍在尝试推进。
        const heartbeat: ServerMsg = {
          type: 'system',
          kind: 'degraded',
          payload: { reason: 'mock-static-fallback' },
        }
        this.fanout(heartbeat)
        return
      }
      const evt = staticEvents[this.fallbackCursor % staticEvents.length]!
      this.fallbackCursor = (this.fallbackCursor + 1) % staticEvents.length
      this.fanout(evt.msg)
    }, 1000)
  }

  /** 内部：把一条 ServerMsg 派发给所有订阅者，单个抛错被吞掉。 */
  private fanout(msg: ServerMsg): void {
    if (this.disposed) return
    // 复制 set 再迭代，避免订阅者在回调里 unsubscribe 触发迭代异常。
    for (const h of [...this.handlers]) {
      try {
        h(msg)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[MockDataAdapter] subscriber threw:', err)
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// LiveDataAdapter（占位，Slice 5 实装）
// ────────────────────────────────────────────────────────────────────────────

/**
 * `LiveDataAdapter` —— 真实 Sync_Service WebSocket 客户端。
 *
 * **当前阶段（Slice 1）只占位**：未实装 WebSocket，调用 subscribe 仅记录
 * 一条 console.warn 提示尚未接 live，并返回 no-op unsubscribe；这样即便
 * 用户手贱在 mock=0 模式下加载页面，也不会白屏，只是没有事件流。
 *
 * TODO(task 16.5): 在 Slice 5 接入 Sync_Service 时按 design.md §3 协议落地：
 *   - WebSocket 客户端 + 心跳 + 指数退避重连 (1,2,4,8,16s, 上限 5 次)
 *   - 仅在握手成功后 `snapshot_request` —— 避免握手未稳就拉快照
 *   - 5 次重连仍失败 → 自动 `setMockModeFlag(true)` + 顶部红条
 *   - 与 mock 一致的 `ServerMsg` 派发口径
 */
export class LiveDataAdapter implements DataAdapter {
  private warned = false
  private disposed = false

  subscribe(_handler: (msg: ServerMsg) => void): () => void {
    if (!this.warned) {
      this.warned = true
      // eslint-disable-next-line no-console
      console.warn(
        '[LiveDataAdapter] live data source is not implemented yet ' +
          '(see TODO task 16.5). UI will receive no events. ' +
          'Set ?mock=1 to fall back to MockDataAdapter.',
      )
    }
    return () => {}
  }

  dispose(): void {
    this.disposed = true
  }

  /** 给将来 Slice 5 调度器读，当前总是 false 表示"尚未连接"。 */
  isConnected(): boolean {
    return !this.disposed && false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────────────────────────────────────

/**
 * 根据 `feature.mock_mode` 选择具体 adapter 实现。
 *
 * 调用方应当在组件挂载时调用一次，获取实例并复用。如果切换 flag，需要
 * 调用 `dispose()` 旧实例，再重新调用 `resolveDataAdapter()`。
 *
 * 现阶段（Slice 1）：
 *   mock=true  → MockDataAdapter（默认）
 *   mock=false → LiveDataAdapter（占位，console.warn）
 */
export function resolveDataAdapter(): DataAdapter {
  const useMock = getMockModeFlag()
  if (useMock) {
    return new MockDataAdapter()
  }
  return new LiveDataAdapter()
}

/**
 * 仅供测试或调试用：直接构造给定模式的 adapter，不走 flag 解析。
 */
export function createDataAdapter(mode: 'mock' | 'live'): DataAdapter {
  return mode === 'mock' ? new MockDataAdapter() : new LiveDataAdapter()
}
