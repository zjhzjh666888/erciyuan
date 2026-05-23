'use client'

/**
 * PhaserBridge
 *
 * 把一个 Phaser 3 Scene 挂载到 React DOM。任务 11.2 落地件。
 *
 * 关键约束（来自 design.md §1.4 / §1.8 / Error Handling 矩阵）：
 *  - 必须 `'use client'`：Phaser 直接依赖 `window`，SSR 时不可加载。
 *  - 通过 *动态 import* 加载 Phaser，避免 Next.js server bundler 触碰 phaser 源码。
 *  - 渲染器优先 WebGL，失败自动回落 Canvas（`type: Phaser.AUTO`）；两者都失败时
 *    渲染 fallback 提示，绝不白屏。
 *  - 卸载时 `game.destroy(true)` 清理 canvas 与 GPU 资源，防 React StrictMode 双
 *    挂载导致的内存泄漏。
 */

import { useEffect, useRef, useState } from 'react'

import { DomFallbackStage } from './DomFallbackStage'

export interface PhaserBridgeProps {
  /** 画布逻辑宽度（CSS px）。Phaser 会按 Scale.FIT 自适应外层容器。默认 1280。 */
  width?: number
  /** 画布逻辑高度（CSS px）。默认 720。 */
  height?: number
  /**
   * Scene 工厂函数。延迟实例化避免模块顶层引用 `Phaser` 全局；
   * 由 PhaserBridge 在 `await import('phaser')` 完成后调用。
   */
  sceneFactory: () => Phaser.Scene[]
  /** 画布底色，建议使用 design token。默认 `#1a1a2e`。 */
  backgroundColor?: string
  /** Phaser.Game 实例化成功后回调，常用于持有引用、注册事件总线。 */
  onReady?: (game: Phaser.Game) => void
  /** 实例化彻底失败（WebGL+Canvas 全失败）时回调。 */
  onError?: (err: Error) => void
  /**
   * 渲染失败时透传给 DomFallbackStage 的原因文案；不传则使用 DomFallbackStage
   * 内置默认文案（design.md §1.8 降级矩阵 + R7.1）。
   */
  fallbackReason?: string
}

const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720
const DEFAULT_BACKGROUND = '#1a1a2e'

export function PhaserBridge(props: PhaserBridgeProps): JSX.Element {
  const {
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    sceneFactory,
    backgroundColor = DEFAULT_BACKGROUND,
    onReady,
    onError,
    fallbackReason,
  } = props

  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let resizeHandler: (() => void) | null = null

    async function boot(): Promise<void> {
      const container = containerRef.current
      if (!container) return

      let PhaserModule: typeof import('phaser')
      try {
        PhaserModule = await import('phaser')
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        // eslint-disable-next-line no-console
        console.error('[PhaserBridge] dynamic import failed:', error)
        if (cancelled) return
        setFailed(true)
        onError?.(error)
        return
      }

      // 兼容 ESM default export 包裹与裸命名空间两种打包形态。
      const PhaserNs = (
        (PhaserModule as unknown as { default?: typeof Phaser }).default ?? PhaserModule
      ) as typeof Phaser

      // Phaser 3 的 ESM 构建只导出命名导出，不会再像 UMD 那样把 `Phaser` 挂到
      // window 上。但下游 Scene 类靠 `class extends Phaser.Scene` 引用全局命名
      // 空间，因此这里手动暴露一次，保证后续 sceneFactory 调用时全局可用。
      const globalScope = globalThis as unknown as { Phaser?: typeof Phaser }
      if (!globalScope.Phaser) {
        globalScope.Phaser = PhaserNs
      }

      if (cancelled) return

      const config: Phaser.Types.Core.GameConfig = {
        type: PhaserNs.AUTO,
        parent: container,
        width,
        height,
        backgroundColor,
        pixelArt: true,
        scale: {
          mode: PhaserNs.Scale.FIT,
          autoCenter: PhaserNs.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: sceneFactory(),
      }

      try {
        const game = new PhaserNs.Game(config)
        gameRef.current = game

        // Phaser 在内部挑选完渲染器后通过 `ready` 事件广播（API:
        // game.events.once('ready')）。在该事件之前 game.renderer 已经实例化，
        // 直接读 type 即可。
        const rendererName =
          game.renderer?.type === PhaserNs.WEBGL ? 'WebGL' : 'Canvas'
        // eslint-disable-next-line no-console
        console.info(`[PhaserBridge] renderer=${rendererName} (Phaser ${PhaserNs.VERSION})`)

        resizeHandler = () => {
          game.scale.refresh()
        }
        window.addEventListener('resize', resizeHandler)

        onReady?.(game)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        // eslint-disable-next-line no-console
        console.error('[PhaserBridge] Phaser.Game construction failed:', error)
        if (cancelled) return
        setFailed(true)
        onError?.(error)
      }
    }

    void boot()

    return () => {
      cancelled = true
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
        resizeHandler = null
      }
      const game = gameRef.current
      if (game) {
        // `removeCanvas=true`：连同挂在 parent 上的 <canvas> 一起销毁，防止
        // React 复用容器时残留多张画布。
        game.destroy(true)
        gameRef.current = null
      }
    }
    // sceneFactory / 回调引用变化不应当重新挂载游戏实例；尺寸与背景色改动同理，
    // 走 game.scale / game.renderer 内部 API 更新更稳妥。这里故意只挂载一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    // design.md §1.8 降级矩阵：Phaser 完全跑不起来时切到 DOM 静态视图，
    // 而非纯文字提示。DomFallbackStage 不依赖 Phaser，可在 phaser bundle
    // 加载失败的极端环境继续渲染。
    return <DomFallbackStage reason={fallbackReason} />
  }

  return (
    <div
      ref={containerRef}
      data-testid="phaser-bridge-container"
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  )
}

export default PhaserBridge
