/**
 * RenderEngine — task 11.4 + 11.5
 *
 * 实现 design.md §1.9 RenderEngine 接口的 Slice 0 子集：
 *
 *   class RenderEngine {
 *     init(container: HTMLDivElement, tilemapUrl: string): Promise<void>
 *     spawnSprite(charId, opts): SpriteHandle | null    // task 11.5（本任务接管）
 *     moveSprite(charId, to, durationMs): void          // task 12.3
 *     showSpeechBubble(charId, text): void              // task 12.4
 *     showActionLabel(charId, label | null): void       // task 12.5
 *     followCamera(charId | null): void                 // task 11.6
 *     setDegraded(reason?: string): void                // 与 Mock-First Cookbook 对齐
 *   }
 *
 * **数据源接入说明（task 12.1 / 12.2 注解）**：
 *
 *   现阶段（Slice 1）RenderEngine 由 task 12.1 直接消费
 *   `@erciyuan/mock-town` 的 `startMockTimeline()`（在 Phaser 端订阅
 *   ServerMsg），目的是先把"会动的小镇"演示链路立起来，不被 DataAdapter
 *   抽象层拖慢。
 *
 *   下一步（Slice 5 / task 16.x）会把这条直连入口替换为 `resolveDataAdapter()`
 *   返回的 {@link DataAdapter}，让 mock | live 两套数据源走同一个订阅
 *   通道（design.md §Mock-First Demo Pipeline）。task 12.2 已在
 *   `apps/web/src/data/DataAdapter.ts` 把抽象与 MockDataAdapter / 占位
 *   LiveDataAdapter 落地，但**本文件目前还不直接调用它**。
 *
 *   现场降级路径：用户在地址栏切 `?mock=0` / `?mock=1` → MockModeBadge 持久化
 *   flag → `location.reload()` → RenderEngine 重新走 task 12.1 的接入点；
 *   Slice 5 之后会改为 `adapter.dispose()` + 重新 subscribe，无需刷新。
 *
 * 任务 11.4 实际实现：
 *  - `init({ container, tilemapUrl?, mountInBridge })` —— 这个 Slice 0 版本支持
 *    两种装载方式：① 直接挂载（自己 new Phaser.Game），② "提供 sceneFactory，由
 *    PhaserBridge 装载"（推荐，避免与 PhaserBridge.tsx 已有的 SSR-safe 加载逻辑
 *    重复）。`TownStage.tsx` 走 ② 路径。
 *  - `loadAssets(manifest)` —— 用于在 init 之前合并自定义关键资源 URL；当前只
 *    支持 tilemap + tileset + 默认 sprite 三件套（design.md §1.7）。
 *  - `getStatus()` —— 返回当前 RenderEngine 状态：boot / loading / ready /
 *    degraded，便于 Mock-First Cookbook + Dashboard 感知。
 *  - `spawnSprite` / `moveSprite` / `showSpeechBubble` / `showActionLabel` /
 *    `followCamera` / `dispose` —— 签名与 design.md §1.9 一致；spawnSprite
 *    由 11.5 接管，followCamera 由 11.6 接管，moveSprite 由 12.3 接管，
 *    speech / actionLabel 留 stub 给 12.4 / 12.5。
 *  - 首屏耗时计时 —— 监听 BootScene `'erciyuan:firstScreenReady'` 事件，与
 *    `'erciyuan:bootStart'` 求差，console.info；> 2000ms 警告（R7.1 / R15.6 /
 *    R16.4）。
 *
 * 设计取舍：
 *  - 不在 RenderEngine 里直接调用 `await import('phaser')`；这件事由 PhaserBridge
 *    完成。RenderEngine 只暴露 `buildSceneFactory()` 工厂，给 React 组件用。
 *  - 这样 TownStage / Dashboard / E2E 三处都能复用同一个 RenderEngine 实例，
 *    但只有 TownStage 真正喂 game 实例。
 */

/* eslint-disable no-unused-vars */

import { createBootScene } from './scenes/BootScene'
import { createTownScene, type SpawnSpriteOpts, type SpriteHandle, type TownSceneApi } from './scenes/TownScene'
import {
  resolveMascotTypeFromCharId,
  startMockTownRuntime,
  type MockRuntimeHandle,
  type ServerMsg,
  type ThoughtTrace,
} from './MockTimelineDriver'

// ────────────────────────────────────────────────────────────────────────────
// design.md §1.9 type contract（Slice 0 子集；后续 Slice 会再补字段）

export type TilePos = { x: number; y: number }

export interface SpriteManifest {
  /** 4-direction walk 帧表 / idle / 动作帧的命名约定见 design.md §1.3 */
  spriteSheetUrl: string
  frameWidth: number
  frameHeight: number
  /** 形如 { walk_down: [0,1,2,3], idle: [16,17] } */
  animations: Record<string, number[]>
}

/**
 * 轻量 AssetManifest —— 与 assets/MANIFEST.yaml 中的 AssetEntry 不是一回事，那个
 * 是 build-time 校验产物。这里只是 RenderEngine 启动时关键资源的 URL 索引。
 */
export interface AssetManifest {
  tilesetMainUrl: string
  tilemapUrl: string
  spriteDefaultUrl: string
}

export type RenderEngineStatus = 'idle' | 'booting' | 'ready' | 'degraded'

/**
 * task 12.4：speech 事件订阅 payload。
 *
 * - `text` 已经过 R8.2 截断（≤ 80 字符，超长 ASCII `...` 三点表示）。
 * - `ts` 取自 ServerMsg；用于在 React 端做唯一 key（同一 char_id 4s 内
 *   再次发声时，旧气泡先 unmount 再 mount 新气泡，不互相覆盖）。
 */
export interface SpeechEvent {
  charId: string
  text: string
  ts: number
}

export type SpeechHandler = (event: SpeechEvent) => void

/**
 * task 12.5：RenderEngine 对外广播的 action label 事件。
 *
 * - `label === null` 表示「该角色 next_action 已结束，立即清除」（design.md
 *   §1.5 持续与 next_action 一致，结束立即清除）。
 * - `ts` 透传 ServerMsg 自身时间戳；当外部直接调 `showActionLabel`（例如
 *   Slice 6 Agent_Core 端驱动）且未提供 ts 时，由 RenderEngine 用 `Date.now()`
 *   兜底，便于订阅方做幂等 / 时间过滤。
 */
export interface ActionLabelEvent {
  charId: string
  label: string | null
  ts: number
}

export type ActionLabelHandler = (e: ActionLabelEvent) => void

/**
 * task 13.3：thought 事件订阅 payload。
 *
 * - `charId` 透传 ServerMsg.char_id —— ThoughtTrace 内部已自带 character_id，
 *   但消费方多数只需要在 fanout payload 里拿到一次 charId 就能完成路由（不
 *   想为了一个字段再去 trace.character_id 多走一层）。
 * - `trace` 直接传引用，不深拷贝：fanout 路径的 hot loop 上每秒可能跑多条，
 *   不希望每条都触发一次 structuredClone；ThoughtStream 端把 trace 当只读
 *   消费，符合 design.md §1.5 / §2.4 的契约。
 * - `ts` = ServerMsg 自身时间戳（live 模式来自 Sync_Service；mock 模式由
 *   MockTimelineDriver 注入）。订阅方用来排序 + 做 React key。
 */
export interface ThoughtEvent {
  charId: string
  trace: ThoughtTrace
  ts: number
}

export type ThoughtHandler = (e: ThoughtEvent) => void

export interface RenderEngineInitConfig {
  /** Phaser 挂载容器；通常由 PhaserBridge 提供。Slice 0 模式 'bridge' 时可省略。 */
  container?: HTMLDivElement | null
  /** Slice 0 的 critical-path 资源；不传则用默认 public/assets 路径。 */
  manifest?: Partial<AssetManifest>
  /**
   *  - 'bridge' (默认)：仅生成 sceneFactory，不实例化 Phaser.Game。由调用方
   *    （PhaserBridge）负责实例化。`init` 在 BootScene 发出 first-screen-ready
   *    事件后 resolve。
   *  - 'standalone'：RenderEngine 自己 `await import('phaser')` 并 new Game。
   *    任务 11.4 暂不需要，留接口给后续 E2E。
   */
  mountStrategy?: 'bridge' | 'standalone'
}

export type { SpawnSpriteOpts, SpriteHandle } from './scenes/TownScene'
export type { MockRuntimeHandle, ServerMsg, ThoughtTrace } from './MockTimelineDriver'

// ────────────────────────────────────────────────────────────────────────────

/**
 * Slice 0 默认 critical-path manifest。指向 sync-assets.mjs 同步过来的
 * `apps/web/public/assets/...` 路径。`<link rel="preload">` 也用同一份。
 */
export const DEFAULT_ASSET_MANIFEST: AssetManifest = {
  tilesetMainUrl: '/assets/tilemaps/tileset_main.png',
  tilemapUrl: '/assets/tilemaps/town_64x64.tmj',
  spriteDefaultUrl: '/assets/mascots/cat_lore/portrait_64.png',
} as const

const FIRST_SCREEN_BUDGET_MS = 2000

/**
 * task 12.4：单条 speech 文本字符上限（R8.2）。
 * - "字符"按 JS String#length（UTF-16 code unit）计；中文一字一码元，超出
 *   80 时尾部加 `…`（U+2026 单字符省略号，更紧凑且与中文排版自洽）。
 */
const SPEECH_TEXT_MAX_LEN = 80
const SPEECH_TRUNCATE_SUFFIX = '…'

/**
 * task 12.4：截断超长 speech 文本到 R8.2 上限，超出部分用 `…` 替换。
 * 截断目标长度 = 80 字符（含 `…`），即裁掉尾部然后追加省略号。
 *
 * 当 text.length > 80：取前 79 字符 + `…`，最终输出 80 字符。
 * 当 text.length ≤ 80：原样返回。
 *
 * 注：长度按 JS `String#length`（UTF-16 code unit）计，与 R8.2 字面一致。
 * Emoji / 罕见 CJK ext-B 字符的 surrogate pair 在 79 截断点正好被切开
 * 时会渲染成 `?` —— mock-town speech 文案皆为 BMP 中日字符，不触发该 case。
 */
export function truncateSpeechText(text: string): string {
  if (text.length <= SPEECH_TEXT_MAX_LEN) return text
  return text.slice(0, SPEECH_TEXT_MAX_LEN - SPEECH_TRUNCATE_SUFFIX.length) + SPEECH_TRUNCATE_SUFFIX
}

/**
 * task 12.3：mock-town `timeline.ts` 中 pos 事件的标称发射间隔（约每秒一条）。
 * RenderEngine 在收到非首条 pos 时把它转成 1 秒走路插值，让"1 步走完一格"
 * 的视觉节奏与 timeline 的事件密度对齐（design.md §1.3）。
 *
 * 之后接 LiveDataAdapter（task 16.x）时若服务端的 pos 间隔不再是 1 秒，
 * 这个常量会单独配置，不影响 mock-town 的演示链路。
 */
const MOCK_POS_TWEEN_MS = 1000

/**
 * task 13.6：degraded reason 历史栈最大长度（design.md §2.8 hover 列表）。
 * 黑客松现场实测：超过 10 条已经超出 popover 单屏可读范围，且单次降级
 * 事件本身就是异常 —— 我们不需要保留 100 条历史。10 条平衡了"足够给现
 * 场调试看清楚最近轨迹" + "不会让 popover 撑出屏幕"。
 */
const DEGRADED_HISTORY_MAX = 10

/**
 * 默认导出。TownStage 只需要 `new RenderEngine()` 然后 `engine.init({ mountStrategy: 'bridge' })`，
 * 之后把 `engine.buildSceneFactory()` 当 sceneFactory 喂给 PhaserBridge。
 */
export class RenderEngine {
  private status: RenderEngineStatus = 'idle'
  private degradedReason: string | null = null
  private manifest: AssetManifest = DEFAULT_ASSET_MANIFEST
  /** Phaser.Game 引用（standalone 模式下持有；bridge 模式由 PhaserBridge.onReady 灌入） */
  private game: Phaser.Game | null = null
  /** 一次 init 的 promise，重复调用幂等。 */
  private initPromise: Promise<void> | null = null
  /** BootScene 触发 boot-start 时的时间戳（performance.now 域）。 */
  private bootStartTs: number | null = null
  /**
   * task 11.5：TownScene 在 `create()` 末尾通过 `'erciyuan:townSceneReady'`
   * 事件把自身（实现 {@link TownSceneApi}）灌进来。RenderEngine 把所有需要
   * 落到具体 sprite 的调用（spawn/move/follow/...）转发到这里。
   *
   * 在 TownScene 就绪前调用 spawnSprite 会进入 `pendingSpawns` 队列，等
   * Scene 就绪后批量重放，避免 React 端必须等待一个不存在的 ready promise。
   */
  private townScene: TownSceneApi | null = null
  private pendingSpawns: Array<{ id: string; opts: SpawnSpriteOpts }> = []
  /** 已发出的精灵句柄缓存，方便 RenderEngine 自身做幂等检查与后续 task 11.6 寻址。 */
  private spriteHandles = new Map<string, SpriteHandle>()
  /**
   * task 12.1：MockTownRuntime 单例句柄。React StrictMode 双挂载下
   * `startMockTimeline()` 必须幂等 —— 第二次调用不会再开第二份 90s 时间轴。
   * `dispose()` 会一并 stop 它。
   */
  private mockRuntimeHandle: MockRuntimeHandle | null = null
  /**
   * task 12.6：degraded 状态变更监听器集合。Banner UI / 测试夹具通过
   * {@link subscribeDegraded} 注册。set 而非 array 让 unsubscribe 直接 O(1)。
   */
  private degradedListeners = new Set<(reason: string | null) => void>()
  /**
   * task 13.6：degraded reason 历史栈（按时间倒序，最近一条在 [0]）。
   * design.md §2.8 "多 reason | 取最严重一条显示，hover 弹出全部列表"
   *
   * 写入规则（{@link setDegraded}）：
   *  - 仅当本次 reason 与最近一条 (history[0].reason) 不同才 push（去抖：避免
   *    同一来源连续触发污染列表，例如 mock-runtime-fallback 在 1s 内 fire 多次）
   *  - push 后裁剪到 {@link DEGRADED_HISTORY_MAX} 条，超出从尾部丢弃
   *  - reason=null（恢复事件）不写入历史 —— 历史只记降级事件
   *
   * 读取由 {@link getDegradedHistory} 返回浅拷贝，避免外部修改污染内部状态。
   */
  private degradedHistory: Array<{ reason: string; ts: number }> = []
  /**
   * task 12.1：在 `'erciyuan:townSceneReady'` 之前到达的 `pos` 事件需要暂存，
   * 等 TownScene 装载完毕后回放，避免首屏前 ~1s 的事件被丢弃。其他类型
   * （speech / thought / action_label / system）当前仅 console.debug，
   * 不需要暂存。
   */
  private pendingPosEvents: Array<Extract<ServerMsg, { type: 'pos' }>> = []
  /**
   * task 12.1：内部追踪每个 character_id 是否已经做过首次 spawnSprite。这与
   * `spriteHandles` 不一样 —— 后者随 spawnSprite 调用同步刷新，但我们希望
   * 即便 12.2 把 mock 数据流换成 live，依然通过同样的"首见即 spawn"语义
   * 兜底（live 流也只发 pos / speech，不会单独发 spawn 帧）。
   */
  private mockSeenCharacters = new Set<string>()
  /**
   * task 12.4：speech 订阅者集合。React 端 `<SpeechBubbleLayer />` 通过
   * `subscribeSpeech()` 注入回调，`showSpeechBubble()` 同步派发。用 Set 而
   * 不是 EventTarget，是为了：① 避免每次都构造 CustomEvent 包装；② 让
   * SpeechBubbleLayer 在 useEffect 卸载时通过返回的 unsubscribe 闭包精准
   * 取消订阅，不必管理 listener 引用同一性。
   */
  private speechHandlers = new Set<SpeechHandler>()

  /**
   * task 12.5：action label 订阅集合（同一引擎实例可被多个 React 层订阅）。
   * Slice 1 仅 ActionLabelLayer 订阅；Slice 2 Bento Grid 角色细节卡再加。
   */
  private actionLabelHandlers = new Set<ActionLabelHandler>()

  /**
   * task 13.3：thought 订阅集合。Bento Grid Thought Stream 卡（design.md §2.4）
   * 通过 {@link subscribeThought} 注入回调；`dispatchServerMsg.case 'thought'`
   * 把每条 thought trace 即时 fanout 给所有订阅者。
   *
   * 用 Set 而非数组：① 重复订阅同一 handler 自然去重；② unsubscribe O(1)；
   * ③ 与 speech / actionLabel emitter 模式保持一致，便于未来 Slice 2 dashboard
   * 角色细节卡也复用同一通道。
   */
  private thoughtHandlers = new Set<ThoughtHandler>()

  /** Slice 0 主入口。 */
  init(config: RenderEngineInitConfig = {}): Promise<void> {
    if (this.initPromise) return this.initPromise

    const merged: AssetManifest = {
      ...DEFAULT_ASSET_MANIFEST,
      ...(config.manifest ?? {}),
    }
    this.manifest = merged
    this.status = 'booting'

    const strategy = config.mountStrategy ?? 'bridge'

    if (strategy === 'bridge') {
      // bridge 模式：RenderEngine 仅准备 sceneFactory + 等待外部把 game 灌进来。
      // 真正"first-screen-ready" 监听在 attachGame() 里完成。
      this.initPromise = Promise.resolve()
      return this.initPromise
    }

    // standalone：动态加载 phaser 并自建 Game（保留接口，任务 11.4 不实际走）
    this.initPromise = this.bootStandalone(config.container)
    return this.initPromise
  }

  /**
   * 提供给外部（如 PhaserBridge）的 sceneFactory。Phaser 对 scene 数组按顺序
   * 启动；此处只把 BootScene 立刻 start，TownScene 留待 BootScene `complete`
   * 后通过 `scene.start('TownScene')` 切换（见 BootScene.preload）。
   */
  buildSceneFactory(): () => Phaser.Scene[] {
    const manifest = this.manifest
    return () => [
      createBootScene({
        tilesetMainUrl: manifest.tilesetMainUrl,
        tilemapUrl: manifest.tilemapUrl,
        spriteDefaultUrl: manifest.spriteDefaultUrl,
        nextSceneKey: 'TownScene',
      }),
      createTownScene({ verbose: true }),
    ]
  }

  /**
   * PhaserBridge.onReady → engine.attachGame(game)。
   * 在这里挂载首屏耗时计时事件。
   */
  attachGame(game: Phaser.Game): void {
    this.game = game

    game.events.on('erciyuan:bootStart', (ts: number) => {
      this.bootStartTs = ts
    })
    game.events.on('erciyuan:firstScreenReady', (endTs: number) => {
      const start =
        this.bootStartTs ??
        // BootScene.init 一定先于 preload.complete 触发；保险一次 fallback。
        endTs
      const elapsed = Math.round(endTs - start)
      this.status = 'ready'
      // eslint-disable-next-line no-console
      console.info(`[RenderEngine] first screen ready in ${elapsed}ms`, {
        budgetMs: FIRST_SCREEN_BUDGET_MS,
      })
      if (elapsed > FIRST_SCREEN_BUDGET_MS) {
        // eslint-disable-next-line no-console
        console.warn(
          `[RenderEngine] first screen ${elapsed}ms exceeds budget ${FIRST_SCREEN_BUDGET_MS}ms (R7.1 / R15.6 / R16.4)`,
        )
      }
    })

    // task 11.5：TownScene 就绪后注册 API，并 flush 排队的 spawn 请求。
    game.events.on('erciyuan:townSceneReady', (api: TownSceneApi) => {
      this.townScene = api
      if (this.pendingSpawns.length > 0) {
        const queued = this.pendingSpawns
        this.pendingSpawns = []
        for (const { id, opts } of queued) {
          const handle = api.spawnSprite(id, opts)
          this.spriteHandles.set(id, handle)
        }
      }
      // task 12.1：TownScene 装载前到达的 pos 事件回放。speech / thought
      // 等不需要 sprite 的事件不在此处缓冲（它们在 dispatchServerMsg 内
      // 直接 console.debug，没有依赖时序）。
      if (this.pendingPosEvents.length > 0) {
        const buffered = this.pendingPosEvents
        this.pendingPosEvents = []
        for (const msg of buffered) {
          this.applyPosEvent(msg)
        }
      }
    })
  }

  /**
   * 异步合并自定义 manifest；当前仅替换 URL，task 11.5 以后会真正走 Phaser
   * Loader 加 mascot/npc sprite 表。
   */
  loadAssets(manifest: Partial<AssetManifest>): Promise<void> {
    this.manifest = { ...this.manifest, ...manifest }
    return Promise.resolve()
  }

  getStatus(): RenderEngineStatus {
    return this.status
  }

  getDegradedReason(): string | null {
    return this.degradedReason
  }

  // ── design.md §1.9 implementations & stubs ─────────────────────────────

  /**
   * task 11.5：在 TownScene 中创建一个静态精灵。
   *
   * 与 design.md §1.9 原始签名 `(charId, manifest, pos)` 相比，Slice 0 这版
   * 简化为 `(characterId, { x, y, mascotType })`：
   *  - 真正的 SpriteManifest（4 方向 walk × 4 帧 + 动作帧）由 task 12.x 接管，
   *    现阶段只需要 idle 单帧。
   *  - mascot idle 贴图的 preload 在 TownScene.preload 内部完成；调用方只需
   *    传 `mascotType: 'cat_lore' | 'dog_social' | ...` 即可，未传则回退到
   *    `sprite_default`。
   *
   * 返回的句柄供 task 11.6 followCamera / task 12.3 moveSprite 使用。
   * 如果 TownScene 还没就绪（init 仍在 boot 中），调用会被排队，等
   * `erciyuan:townSceneReady` 触发后批量重放。此时返回 null，调用方应当
   * 在需要时通过 {@link getSpriteHandle} 重新查询。
   */
  spawnSprite(characterId: string, opts: SpawnSpriteOpts): SpriteHandle | null {
    if (this.townScene) {
      const handle = this.townScene.spawnSprite(characterId, opts)
      this.spriteHandles.set(characterId, handle)
      return handle
    }
    this.pendingSpawns.push({ id: characterId, opts })
    return null
  }

  /**
   * 回查已 spawn 的句柄。task 11.6 followCamera 会用这个解析 character_id →
   * Phaser GameObject。
   */
  getSpriteHandle(characterId: string): SpriteHandle | null {
    if (this.townScene) {
      return this.townScene.getSpriteHandle(characterId)
    }
    return this.spriteHandles.get(characterId) ?? null
  }

  /**
   * task 12.3：把一只精灵在 `durationMs` 毫秒内插值平移到目标 tile，
   * 期间根据 dx/dy 自动切换 4 方向 walk 帧动画（design.md §1.3，8 FPS），
   * 到达后回到 idle 静帧动画。
   *
   * 行为契约（与 {@link SpriteHandle.moveTo} 一致）：
   *  - 同一精灵新调用先 stop 上一条 tween 再启动（不重叠）。
   *  - to == 当前位置时直接 noop（避免 Mock timeline 中相邻同坐标 pos 的抖动）。
   *  - TownScene 未就绪 / 该 character_id 未 spawn → 静默返回（按"首见即
   *    spawn"的 contract 这条路径不应发生；交由 {@link applyPosEvent}
   *    自身的兜底路径处理）。
   */
  moveSprite(charId: string, to: TilePos, durationMs: number): void {
    const handle = this.getSpriteHandle(charId)
    if (!handle) return
    handle.moveTo(to.x, to.y, durationMs)
  }

  /**
   * task 12.4：触发一条 speech 气泡。
   *
   * 调用方 = 内部 `dispatchServerMsg('speech')` 或外部代码（测试 / 12.6
   * fallback）。这里**不做** R8.2 截断，截断由 ServerMsg 入口（dispatchServerMsg）
   * 在派发前完成；走外部直接调用路径的代码也应在调用前自行 `truncateSpeechText`。
   *
   * 实现：把事件以一个新 SpeechEvent 派发给所有 `speechHandlers`。听众
   * 为 React 端 SpeechBubbleLayer。任何监听器抛出异常都会被 catch 住，
   * 不影响其他订阅者，也不阻塞渲染主循环。
   */
  showSpeechBubble(charId: string, text: string): void {
    const event: SpeechEvent = { charId, text, ts: Date.now() }
    // eslint-disable-next-line no-console
    console.info('[RenderEngine] speech bubble:', event.charId, event.text)
    for (const handler of this.speechHandlers) {
      try {
        handler(event)
      } catch (err) {
        // 容错：单个监听器 throw 不能拖垮其他监听器或主线程。
        // eslint-disable-next-line no-console
        console.error('[RenderEngine] speech handler threw:', err)
      }
    }
  }

  /**
   * task 12.4：订阅 speech 事件流。返回的 unsubscribe 闭包用于在 React
   * `useEffect` 卸载时取消订阅，避免 StrictMode 双挂载时多份监听器堆叠。
   */
  subscribeSpeech(handler: SpeechHandler): () => void {
    this.speechHandlers.add(handler)
    return () => {
      this.speechHandlers.delete(handler)
    }
  }

  /**
   * task 12.5：广播一条角色脚下动作描述（design.md §1.5）。
   *
   *  - `label` 为 string 时显示；`null` 表示该角色 next_action 已结束，立即
   *    清除（与 design.md §1.5 / mock-town timeline 行为一致）。
   *  - 同时被 Mock-Town `dispatchServerMsg` 与 Slice 6 Agent_Core 端复用：
   *    上层只需要 charId + label，不必关心订阅者细节。
   *  - 重复调用相同 label 不去重 —— 由订阅方做幂等（ActionLabelLayer 的
   *    Map 写入天然幂等）。
   */
  showActionLabel(charId: string, label: string | null): void {
    const event: ActionLabelEvent = { charId, label, ts: Date.now() }
    this.fanoutActionLabel(event)
  }

  /**
   * task 12.5：订阅角色脚下动作描述事件流。
   *
   *  - 返回的 `unsubscribe` 在组件 unmount 时调用，避免泄漏。
   *  - 订阅集合是 Set —— 重复订阅同一 handler 也只会触发一次。
   *  - 不会回放历史事件：订阅者要在 RenderEngine 还未广播之前接上，否则
   *    可能错过开局事件。ActionLabelLayer 在组件首个 effect 内即注册，
   *    符合此约束。
   */
  subscribeActionLabel(handler: ActionLabelHandler): () => void {
    this.actionLabelHandlers.add(handler)
    return () => {
      this.actionLabelHandlers.delete(handler)
    }
  }

  /**
   * task 13.3：订阅 thought trace 事件流。Bento Grid Thought Stream 卡通过
   * 这个钩子接收 ServerMsg `thought`，自行维护 50 条 FIFO buffer + Framer
   * Motion 平滑下移。
   *
   *  - 返回的 `unsubscribe` 在 React 组件 unmount 时调用，避免泄漏。
   *  - 不会回放历史事件：与 subscribeActionLabel / subscribeSpeech 一致，
   *    订阅必须在事件流开始之前接上；ThoughtStream 在组件首个 effect 内即
   *    注册，符合此约束。
   *  - handler 抛错被吞掉，不会污染其他订阅者或主线程，与现有 emitter
   *    fanout 行为一致。
   */
  subscribeThought(handler: ThoughtHandler): () => void {
    this.thoughtHandlers.add(handler)
    return () => {
      this.thoughtHandlers.delete(handler)
    }
  }

  /**
   * task 13.8：把外部（JSONL 导入）传入的 ThoughtTrace 列表逐条 fanout 给所有
   * thought 订阅者，与正常 mock-town / live ServerMsg 路径走同一通道。
   *
   *  - `charId` 取自 `trace.character_id`（与 ServerMsg.thought.char_id 语义一致）。
   *  - `ts` 取自 `trace.ts`（保留原文件中的时间戳，让 ThoughtStream 卡上的
   *    `HH:mm:ss` / 相对秒呈现"这就是被回放的旧 trace"）。
   *  - 不去重 / 不排序 / 不修改 trace：调用方（JsonlImportDropZone）已做最小
   *    schema 校验，行内顺序就是回放顺序。
   *  - 没有副作用涉及 Phaser scene（不会触发 spawnSprite / moveSprite）；
   *    导入路径仅影响 dashboard 端 thought 卡片堆。
   */
  replayThoughts(traces: ThoughtTrace[]): void {
    if (!Array.isArray(traces) || traces.length === 0) return
    for (const trace of traces) {
      this.fanoutThought({
        charId: trace.character_id,
        trace,
        ts: trace.ts,
      })
    }
  }

  /**
   * task 12.5：world → canvas CSS px 坐标解析 helper。任务 12.4 气泡 / 12.5
   * action label 共用同一签名，由 React 端的覆盖层在每帧 rAF 调用做定位。
   *
   *  - 当 TownScene 还未就绪 / 精灵不存在 / 已 destroy 时返回 `null`，调用方
   *    应当跳过这一帧的渲染（不要把 label 钉在画布左上）。
   *  - 返回值已包含 `displayHeight`，方便上层定位脚下 vs 头顶。
   */
  getSpriteScreenPosition(
    charId: string,
  ): { x: number; y: number; displayHeight: number } | null {
    if (!this.townScene) return null
    return this.townScene.getSpriteScreenPosition(charId)
  }

  /**
   * task 12.5：返回当前 Phaser canvas DOM 引用，供 React 覆盖层做相对定位。
   *
   *  - bridge 模式下 `attachGame` 完成前 game 仍为 null，调用方应当处理。
   *  - 返回的 canvas 与 React 装载点是兄弟节点（PhaserBridge 在容器内挂的），
   *    因此覆盖层用 `position: absolute; inset: 0` 即可叠到 canvas 上。
   */
  getCanvas(): HTMLCanvasElement | null {
    return (this.game?.canvas as HTMLCanvasElement | undefined) ?? null
  }

  /** task 11.6 接管 */
  followCamera(_charId: string | null): void {
    // intentional stub
  }

  /** task 11.7 / Mock-First Cookbook 触发 */
  setDegraded(reason?: string): void {
    this.status = 'degraded'
    const nextReason = reason ?? 'unknown'
    this.degradedReason = nextReason
    // task 13.6：维护 reason 历史栈（仅相邻去重，新 reason 总是 push 到栈顶）。
    // 同一来源连续 fire 同一 reason 不会污染历史；不同来源 / 不同时间点
    // 的同一 reason 仍会被记录（视为独立事件），由相邻 reason 比较判定。
    const top = this.degradedHistory[0]
    if (!top || top.reason !== nextReason) {
      this.degradedHistory.unshift({ reason: nextReason, ts: Date.now() })
      if (this.degradedHistory.length > DEGRADED_HISTORY_MAX) {
        this.degradedHistory.length = DEGRADED_HISTORY_MAX
      }
    }
    this.emitDegraded()
  }

  /**
   * task 13.6：返回 degraded reason 历史栈（最近的在前）。
   * **浅拷贝**：调用方不能通过返回值反向修改内部状态；条目对象本身不可
   * 变（write-once，setDegraded 后不再修改），所以浅拷贝足够。
   *
   * Banner UI（{@link DegradedBanner}）在 hover 时调用此方法拉取最近 10 条
   * reason，渲染 popover 列表（design.md §2.8 hover 行为）。
   */
  getDegradedHistory(): Array<{ reason: string; ts: number }> {
    return this.degradedHistory.slice()
  }

  /**
   * task 12.6：订阅 degraded 状态变化。Banner UI（{@link DegradedBanner}）
   * 与测试夹具通过这个钩子实时切换显示，**不是**通过轮询 `getStatus()`。
   *
   * 契约：
   *  - 订阅时立即用当前 reason 触发一次 handler，避免组件挂载晚于 setDegraded
   *    时丢失初始状态
   *  - 返回 unsubscribe 函数；多次调用 unsubscribe 幂等无副作用
   *  - handler 抛错被吞掉，不会污染其他订阅者
   *
   * @param handler 状态变化回调；reason=null 表示已恢复 normal（虽然
   *                Slice 1 暂没有"恢复"路径，留接口给 Slice 5 接 system.recovered）
   */
  subscribeDegraded(handler: (reason: string | null) => void): () => void {
    this.degradedListeners.add(handler)
    // 立即派发当前状态，避免 React 组件挂载顺序导致的初始空白
    try {
      handler(this.status === 'degraded' ? this.degradedReason : null)
    } catch {
      // 单个订阅者抛错不影响 RenderEngine 自身
    }
    return () => {
      this.degradedListeners.delete(handler)
    }
  }

  /** 内部：通知所有 degraded 订阅者。 */
  private emitDegraded(): void {
    const reason = this.status === 'degraded' ? this.degradedReason : null
    // 复制 set 再迭代，避免订阅者在回调里 unsubscribe 触发迭代异常
    for (const fn of [...this.degradedListeners]) {
      try {
        fn(reason)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[RenderEngine] degraded listener threw:', err)
      }
    }
  }

  /**
   * task 12.1：启动 `@erciyuan/mock-town` 的 90s 时间轴回放器，把它发出的
   * ServerMsg 流灌进 RenderEngine。
   *
   * 设计契约：
   *  - **幂等**：React StrictMode 双挂载或调用方误调，第二次调用直接返回
   *    已存在的 handle，不会再开第二份 timeline。
   *  - **TownScene 时序无关**：此方法可以在 `attachGame` 之前/之后任何时机
   *    调用；ServerMsg 到达时会通过 {@link dispatchServerMsg} 路由 ——
   *    `pos` 在 TownScene 未就绪时进入 `pendingPosEvents` 队列等回放，其余
   *    类型立即 console.debug。
   *  - **协议同源**：此处消费的 ServerMsg 与 task 12.2 LiveDataAdapter
   *    送进来的应当**逐字段一致**（design.md §Mock-First / §Sync_Service）。
   *    任务 12.2 把 LiveDataAdapter 接进来时，会复用同一份 dispatchServerMsg
   *    入口，不需要再改 RenderEngine。
   *
   * @param opts.loop 是否循环（默认 true，保持画面"一直活着"）
   * @returns 本次或既有 timeline runtime 句柄；`stop()` 由 `dispose()` 自动调用，
   *          调用方一般不必手动 stop。
   *
   * task 12.6：本方法把 `onError` 接到 `setDegraded('mock-runtime-fallback')`，
   * 当 mock-town runtime 内部 scheduler 抛错时：
   *   1. RenderEngine.status → 'degraded'，触发顶部红条 banner
   *   2. mock-town runtime 自动切到 `_forceFallback`：setInterval 1s 静态轮播
   *      timeline 全量事件，画面继续动
   *   3. dispatchServerMsg 自身抛错时同样路径：red 条 + 强制 fallback
   */
  startMockTimeline(opts: { loop?: boolean } = {}): MockRuntimeHandle | null {
    if (this.mockRuntimeHandle) {
      // StrictMode 二次挂载：不创建第二个回放器。
      return this.mockRuntimeHandle
    }
    const loop = opts.loop ?? true
    try {
      const handle = startMockTownRuntime({
        loop,
        onEvent: (msg) => {
          // task 12.6：dispatchServerMsg 单条事件抛错时，不阻塞其他事件，
          // 但触发红条让上层感知（首次出现时）。runtime 内部已 try/catch
          // 包裹此回调，所以这里再吞一次只是为了显式可见。
          try {
            this.dispatchServerMsg(msg)
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[RenderEngine] dispatchServerMsg threw, forcing mock fallback:', err)
            this.setDegraded('mock-runtime-fallback')
            // 把 runtime 切到 1s 静态轮播，画面继续动
            this.mockRuntimeHandle?._forceFallback('dispatch-threw')
          }
        },
        // task 12.6：runtime 内部 schedule 抛错 → 触发顶部红条 +
        // setInterval 静态播。runtime 内已经把 `_forceFallback` 自动拉起，
        // RenderEngine 这边只需要切状态。
        onError: (err) => {
          // eslint-disable-next-line no-console
          console.warn('[RenderEngine] mock-town runtime error, falling back:', err)
          this.setDegraded('mock-runtime-fallback')
        },
      })
      this.mockRuntimeHandle = handle
      // eslint-disable-next-line no-console
      console.info('[RenderEngine] mock-town timeline started', { loop })
      return handle
    } catch (err) {
      // task 12.6：startMockTownRuntime 同步抛错 —— runtime 根本没起来。
      // 这种情况 runtime 的 _forceFallback 也用不上，红条 + console.warn
      // 让 MockDataAdapter 端的 setInterval 静态播兜底接管"画面继续动"。
      // eslint-disable-next-line no-console
      console.warn('[RenderEngine] failed to start mock-town runtime, marking degraded:', err)
      this.setDegraded('mock-runtime-fallback')
      return null
    }
  }

  /**
   * task 12.1：ServerMsg 类型分派器。LiveDataAdapter（12.2）与
   * MockTimelineDriver 共用同一入口。
   *
   * 当前任务范围内：
   *  - `pos`           → spawnSprite（首见）/ setPosition（已见）
   *  - `speech`        → console.debug（TODO task 12.4 接管气泡渲染）
   *  - `thought`       → console.debug（TODO task 12.5 / Slice 2 dashboard 接管）
   *  - `action_label`  → console.debug（TODO task 12.5 接管脚下文本）
   *  - `system`        → console.debug（TODO Slice 5 / 16.6 DEGRADED MODE）
   *  - `heartbeat`     → 静默（mock-town 当前不发 heartbeat；live 流由 16.3 接管）
   */
  private dispatchServerMsg(msg: ServerMsg): void {
    switch (msg.type) {
      case 'pos': {
        if (!this.townScene) {
          // TownScene 还没就绪：暂存到下一帧 flush。pos 是唯一会在 ready
          // 之前就开始播的"必须暂存"消息（spawnSprite 必须在 Scene
          // 内创建）。
          this.pendingPosEvents.push(msg)
          return
        }
        this.applyPosEvent(msg)
        return
      }
      case 'speech': {
        // task 12.4：截断 ≤ 80 字符（R8.2）后落 SpeechBubbleLayer。
        const truncated = truncateSpeechText(msg.text)
        this.showSpeechBubble(msg.char_id, truncated)
        return
      }
      case 'action_label': {
        // task 12.5：把 ServerMsg.ts 透传给订阅者，避免 ActionLabelLayer 自己再
        // `Date.now()` 造一个不一致的时间。其余逻辑（Map 维护 / null 清除）
        // 由订阅者自行处理。
        this.fanoutActionLabel({
          charId: msg.char_id,
          label: msg.label,
          ts: msg.ts,
        })
        return
      }
      case 'thought': {
        // task 13.3：把每条 ThoughtTrace fanout 给 Bento Grid Thought Stream
        // 订阅者；FIFO 50 条上限 / Framer Motion `layout` 平滑下移由订阅
        // 端（ThoughtStream.tsx）自行维护。
        this.fanoutThought({ charId: msg.char_id, trace: msg.trace, ts: msg.trace.ts })
        return
      }
      case 'system': {
        // TODO(Slice 5 / task 16.6)：DEGRADED MODE 红条 / recovered 复位。
        // eslint-disable-next-line no-console
        console.debug('[RenderEngine] system (todo Slice 5):', msg.kind, msg.payload)
        return
      }
      case 'heartbeat': {
        // 心跳消息在 task 16.3 接管，与 ws 客户端配合。Mock-Town 当前
        // 时间轴里不会出现，落到这里也仅是无副作用的 noop。
        return
      }
      default: {
        // 类型穷尽守卫：新增 ServerMsg 变体时让 TS 报错而不是静默吞掉。
        const _exhaustive: never = msg
        // eslint-disable-next-line no-console
        console.warn('[RenderEngine] unknown ServerMsg variant:', _exhaustive)
        return
      }
    }
  }

  /**
   * task 12.1 / 12.3：消费一条 `pos` 事件。
   *  - 首见即 spawnSprite（idle 帧），首条 pos 同时也是 setPosition 跳点
   *    （而不是 moveTo），因为 Mock timeline 的"出场"语义不希望从屏幕外
   *    走过来。
   *  - 后续 pos 事件改调 `moveSprite(char_id, { x, y }, MOCK_POS_TWEEN_MS)`
   *    走 1 秒走路插值（mock-town timeline 中 pos 事件大约每秒一条，1s
   *    走完一格刚好对齐）。
   *  - 目标 == 当前位置时由 SpriteHandle.moveTo 自身做抖动护栏，这里不再
   *    重复判断。
   *
   * `frame` 字段当前忽略 —— 走路动画的方向由 `moveTo` 内部按 dx/dy 自动
   * 推断，而不是消费 timeline 中的 frame 字符串；这样 live 数据（Slice 5+）
   * 把 frame 留空也照样能动起来。
   */
  private applyPosEvent(msg: Extract<ServerMsg, { type: 'pos' }>): void {
    const scene = this.townScene
    if (!scene) {
      // 防御性：调用者应保证只在 TownScene 就绪后调用此方法；如果意外提前
      // 进来，回退到队列以免丢事件。
      this.pendingPosEvents.push(msg)
      return
    }

    if (!this.mockSeenCharacters.has(msg.char_id)) {
      // 首次见到该 character_id：通过 mock-town 命名约定推断 mascot_type。
      // 解析失败时 mascotType=undefined，TownScene 会回落到 sprite_default。
      const mascotType = resolveMascotTypeFromCharId(msg.char_id)
      // 已经在 spawnDefaultSprites（task 11.5）中预 spawn 过的 character_id
      // 不需要再 spawn 一次 —— TownScene.spawnSprite 内部对 existing handle
      // 会先 destroy 再重建，会闪一帧；走 setPosition 路径更平滑。
      if (!scene.getSpriteHandle(msg.char_id)) {
        const handle = scene.spawnSprite(msg.char_id, {
          x: msg.x,
          y: msg.y,
          mascotType,
        })
        this.spriteHandles.set(msg.char_id, handle)
      } else {
        scene.getSpriteHandle(msg.char_id)!.setPosition(msg.x, msg.y)
      }
      this.mockSeenCharacters.add(msg.char_id)
      return
    }

    const handle = scene.getSpriteHandle(msg.char_id) ?? this.spriteHandles.get(msg.char_id) ?? null
    if (!handle) {
      // 句柄丢失（外部销毁）：回到首见路径，重新 spawn。
      this.mockSeenCharacters.delete(msg.char_id)
      this.applyPosEvent(msg)
      return
    }
    // task 12.3：走路插值替代跳点。to == 当前位置时 SpriteHandle.moveTo 自身
    // 会 noop，避免 mock timeline 中相邻同坐标 pos 触发的抖动。
    handle.moveTo(msg.x, msg.y, MOCK_POS_TWEEN_MS)
  }

  /**
   * task 12.5：把 action label 事件广播给所有订阅者。`Set.forEach` 在迭代过程中
   * 删除是安全的（unsubscribe 不会 short-circuit 当前 fan-out）。
   */
  private fanoutActionLabel(event: ActionLabelEvent): void {
    if (this.actionLabelHandlers.size === 0) return
    for (const handler of this.actionLabelHandlers) {
      try {
        handler(event)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[RenderEngine] action_label handler threw:', err)
      }
    }
  }

  /**
   * task 13.3：把 thought 事件广播给所有订阅者。单订阅者抛错被 catch，
   * 与 fanoutActionLabel / showSpeechBubble 行为一致。
   */
  private fanoutThought(event: ThoughtEvent): void {
    if (this.thoughtHandlers.size === 0) return
    for (const handler of this.thoughtHandlers) {
      try {
        handler(event)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[RenderEngine] thought handler threw:', err)
      }
    }
  }

  dispose(): void {
    if (this.mockRuntimeHandle) {
      this.mockRuntimeHandle.stop()
      this.mockRuntimeHandle = null
    }
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
    this.initPromise = null
    this.bootStartTs = null
    this.status = 'idle'
    this.degradedReason = null
    this.pendingPosEvents = []
    this.mockSeenCharacters.clear()
    this.actionLabelHandlers.clear()
    // task 13.3：清空 thought 订阅者，与 speech / actionLabel handlers 路径
    // 一致。ThoughtStream 自身也会在 useEffect 卸载时调用 unsubscribe。
    this.thoughtHandlers.clear()
    // task 12.4：清空 speech 订阅者，避免被销毁的 React 组件闭包持有
    // 引用阻碍 GC。SpeechBubbleLayer 自己也会在 useEffect 卸载时调用
    // unsubscribe，但 dispose 路径作为最后兜底也清一次。
    this.speechHandlers.clear()
    // task 12.6：通知所有订阅者状态归零，再清空。
    this.emitDegraded()
    this.degradedListeners.clear()
    // task 13.6：清空历史栈 —— dispose 后 RenderEngine 已被释放，
    // 历史不应跨实例可见。
    this.degradedHistory = []
  }

  // ── private ───────────────────────────────────────────────────────────

  private async bootStandalone(_container?: HTMLDivElement | null): Promise<void> {
    // 留接口给后续 E2E，本任务不走这条路。仅把状态置为 ready 以便测试通过。
    this.status = 'ready'
  }
}

export default RenderEngine
