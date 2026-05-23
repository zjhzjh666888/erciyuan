'use client'

/**
 * TownStage — task 11.4 + 11.7
 *
 * 客户端 shim：通过 `next/dynamic({ ssr: false })` 把 PhaserBridge 与 Phaser
 * 整个排除出服务端 bundle，并以 RenderEngine 为单一编排点构造 sceneFactory。
 *
 * 任务 11.4 落地件：
 *  - 替换 PlaceholderScene 为 BootScene → TownScene（由 RenderEngine 编排）。
 *  - PhaserBridge.onReady 时把 game 挂回 RenderEngine，让首屏耗时计时事件
 *    被监听到。
 *
 * 任务 11.7 落地件（叠加，不破坏 11.4 的 RenderEngine 编排）：
 *  - `?domfallback=1` URL flag 强制跳过 Phaser，直接渲染 DomFallbackStage。
 *    给 demo runbook 的"硬手动降级"路径用：现场 Phaser 真出事时，路演员粘贴
 *    一行 URL 就能切到 DOM 静态视图。
 *  - `useSearchParams` 是 client-only hook，按 Next.js 14 规范必须包在
 *    `<Suspense>` 里，否则 prerender 阶段会触发 build error。
 *
 * 任务 12.1 落地件（叠加）：
 *  - 在 useEffect 里调用 `engine.startMockTimeline()`，让 `@erciyuan/mock-town`
 *    的 90 秒时间轴事件流喂给 RenderEngine。事件具体的可见效果由后续任务
 *    （12.3 走路插值 / 12.4 气泡 / 12.5 action label）接管；本任务只负责
 *    打通"订阅 → 转交 RenderEngine 调度"这条管线本身，pos 事件先以
 *    setPosition 跳点形式呈现。
 *
 * 任务 12.6 落地件（叠加）：
 *  - 顶层叠加渲染 {@link DegradedBanner}：仅当 RenderEngine 报告 degraded
 *    时出现，绑定 `engine.subscribeDegraded` 实时切换；当 mock-town runtime
 *    抛错或 startMockTimeline 整体失败时，红条立刻可见，画面继续动
 *    （runtime 内部 `_forceFallback` 用 setInterval 静态轮播 timeline）。
 *
 * 任务 12.4 落地件（叠加）：
 *  - 顶层叠加渲染 {@link SpeechBubbleLayer}：订阅 RenderEngine 的 speech
 *    事件流，把每条 speech 渲染成 Smallville 风白底气泡，4s 后立即移除
 *    （R7.6 不淡出）。坐标由 RenderEngine.getSpriteScreenPosition 解析，
 *    与 Phaser canvas 同 parent 同坐标系。
 *
 * 后续：task 11.5 spawnSprite / 11.6 followCamera 都通过对同一 RenderEngine
 * 实例发号施令进行（不必再改动本文件的工厂逻辑）。
 */

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo } from 'react'

import { DomFallbackStage } from '@/render/DomFallbackStage'
import { RenderEngine } from '@/render/RenderEngine'

import { SpeechBubbleLayer } from './SpeechBubbleLayer'

import { DegradedBanner } from './DegradedBanner'

import { ActionLabelLayer } from './ActionLabelLayer'

const PhaserBridge = dynamic(
  () => import('@/render/PhaserBridge').then((mod) => mod.PhaserBridge),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f5f5f7',
          backgroundColor: '#1a1a2e',
        }}
      >
        加载渲染引擎中…
      </div>
    ),
  },
)

/**
 * 真正的 stage 装载逻辑（含 RenderEngine 编排）。被 `<Suspense>` 包裹，因为
 * 内部读取 `useSearchParams`，Next.js 14 prerender 强制要求 Suspense 边界。
 */
export interface TownStageProps {
  /**
   * task 13.3：可选 RenderEngine 实例。当 page.tsx 提升为 client component
   * 后，外部需要把同一个引擎同时分发给 TownStage 与 ThoughtStream / 其他
   * 仪表盘组件。未传时 TownStage 自建一份（保持向后兼容 / 单元测试场景）。
   */
  engine?: RenderEngine
}

function TownStageInner({ engine: externalEngine }: TownStageProps): JSX.Element {
  const searchParams = useSearchParams()
  // `?domfallback=1`、`?domfallback=true`、`?domfallback`（无值）都视为开启。
  // `?domfallback=0` 显式关闭 —— 留作排查路径，避免无意中卡住测试。
  const rawFlag = searchParams?.get('domfallback')
  const forceDomFallback =
    rawFlag !== null && rawFlag !== undefined && rawFlag !== '0'

  // 单例 RenderEngine：useMemo 保证组件 re-render 不会重建。
  // 注：StrictMode 双挂载时 React 会重新执行 useMemo —— 但 RenderEngine.init
  // 是幂等（initPromise 缓存），第二次没有副作用。
  // task 13.3：若外部传入 engine（page.tsx 提升后的共享实例）则复用，避免
  // 与仪表盘其他卡片走两份数据流。
  const fallbackEngine = useMemo(() => new RenderEngine(), [])
  const engine = externalEngine ?? fallbackEngine

  // 启动 init（bridge 模式）。Promise 立即 resolve，不阻塞渲染。
  // sceneFactory 在 PhaserBridge boot 内部被首次调用时，BootScene 才真正实例化。
  // ⚠ 强制 DOM fallback 时跳过 init —— 避免无意义的网络拉取。
  if (!forceDomFallback) {
    void engine.init({ mountStrategy: 'bridge' })
  }

  // task 12.1：在 RenderEngine 上启动 mock-town 90s 时间轴回放器。
  // - StrictMode 双挂载安全：`engine.startMockTimeline()` 内部自带幂等
  //   （已存在 handle 时复用，不会再开第二份 timeline）
  // - 卸载时**不**调用 `runtime.stop()`：StrictMode 第一遍卸载会触发清理，
  //   第二遍重新挂载时如果上一遍 stop 了，timeline 就会被空转重启；让
  //   `engine.dispose()`（外部生命周期）统一管 stop 反而更稳。
  // - DOM fallback 强制模式跳过 —— 此模式下 RenderEngine 根本没 init。
  useEffect(() => {
    if (forceDomFallback) return
    engine.startMockTimeline()
  }, [engine, forceDomFallback])

  const sceneFactory = useCallback(() => engine.buildSceneFactory()(), [engine])

  const handleReady = useCallback(
    (game: Phaser.Game) => {
      engine.attachGame(game)
    },
    [engine],
  )

  if (forceDomFallback) {
    return (
      <>
        <DegradedBanner engine={engine} />
        <DomFallbackStage reason="已通过 ?domfallback=1 手动开启 DOM 静态视图（demo runbook 硬降级路径）。" />
      </>
    )
  }

  // task 12.5：把 PhaserBridge 与 ActionLabelLayer 一同包在相对定位容器里，
  // 让 ActionLabelLayer 的 `position: absolute; inset: 0` 能精确覆盖到 canvas
  // 同尺寸区域。容器自身不引入额外间距 / 边距，由外层 `#town-stage` 决定。
  // task 12.6：DegradedBanner 顶层叠加，仅在 RenderEngine 报告 degraded 时
  // 出现；不可手动关闭，只随系统恢复事件淡出。
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <DegradedBanner engine={engine} />
      <PhaserBridge
        width={1280}
        height={720}
        backgroundColor="#1a1a2e"
        sceneFactory={sceneFactory}
        onReady={handleReady}
      />
      <ActionLabelLayer engine={engine} />
      <SpeechBubbleLayer engine={engine} />
    </div>
  )
}

export function TownStage(props: TownStageProps = {}): JSX.Element {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f5f5f7',
            backgroundColor: '#1a1a2e',
          }}
        >
          加载小镇舞台中…
        </div>
      }
    >
      <TownStageInner {...props} />
    </Suspense>
  )
}

export default TownStage
