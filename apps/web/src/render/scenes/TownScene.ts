/**
 * TownScene — task 11.4 + 11.5 + 11.6 + 12.3
 *
 * 职责（Slice 0–1 子集）：
 *  - 用 BootScene 已 preload 的 cache 实例化 tilemap，添加 `tileset_main` image
 *    tileset，并尝试为每一层 tilelayer 调用 `createLayer`。
 *  - 对 image-collection 类 tileset（Slice 0 这一份地图里只有 `landmarks`），
 *    Slice 0 不展开；如果某一层的 tile 引用了 image-collection tileset 而无法
 *    用 `tileset_main` 单源解析，仍允许 createLayer 调用，Phaser 自身会跳过
 *    无 tileset 的 GID 而不抛出，画面仅缺少地标 prop（已在 task 11.4 brief
 *    中允许的降级）。
 *  - 在地图正中央放一只 `sprite_default` 图像作为视觉 sanity check，并把相机
 *    bounds 锁到 map 物理尺寸。
 *  - **task 11.5**：`spawnDefaultSprites()` 按 mock-town `timeline.ts` 中
 *    的 3 个核心角色（dog_social / fox_create / hamster_hoard）在三个 TMJ
 *    zone 中央落 3 个静态精灵；这些精灵由 `spawnSprite()` 创建并以稳定的
 *    `character_id` 索引在 `spriteHandles` 里，供 task 11.6 followCamera /
 *    task 12.3 moveSprite 后续接管。
 *  - **task 11.6**：`setupCameraControls(map)` 在 `spawnDefaultSprites` 之后、
 *    `'erciyuan:townSceneReady'` 之前装配相机交互——R7.3 软跟随、自由摄像
 *    （按住空格+拖拽）、3 档缩放（鼠标滚轮 / 1/2/3 数字键）、HUD 状态文本。
 *    边界约束沿用 task 11.4 已经设置的 `cameras.main.setBounds`，Phaser 自身
 *    钳制 scrollX/Y 不越界。
 *  - **task 12.3**：扩展 `SpriteHandle` 增加 `moveTo(tileX, tileY, durationMs)`，
 *    用 `this.tweens.add` 平移底层 GameObject、按 dx/dy 主轴自动切换 4 方向
 *    walk 帧动画（design.md §1.3，8 FPS），到达后回到 idle 静帧动画。
 *    底层渲染对象由 `Phaser.GameObjects.Image` 改为 `Phaser.GameObjects.Sprite`
 *    以支持 anims；`Sprite extends Image` 让 task 11.6 startFollow / 11.5
 *    setPosition 等已有调用链零改动兼容。
 *
 * 关键约束：
 *  - 与 BootScene 同样使用 factory pattern 避免 SSR 触发 `Phaser` 全局解引用。
 *  - Phaser 在 `Tilemap.addTilesetImage(name, key)` 失败时会返回 null（而不是
 *    抛错），这里捕获 null 并降级为只渲染 ground 层。
 *  - `map.createLayer` 在 image-collection 部分缺失时会 console.warn，我们
 *    主动收集这些 warn 写入 `console.info('[TownScene] skipped layers ...')`
 *    作为审计线索。
 *  - design.md §1.9 `spawnSprite` 接口：返回一个 `SpriteHandle`，调用方可以
 *    `setPosition` 跳点、`moveTo` 走路插值、`destroy` 销毁。
 */

import { BOOT_ASSET_KEYS } from './BootScene'

/**
 * 单个精灵的对外句柄（design.md §1.9）。
 *
 * 该接口故意保持极简，让 task 11.6 / 12.3 / 12.4 / 12.5 各自只用到自己关心的
 * 方法，避免 RenderEngine 与 Scene 之间形成大耦合 surface。
 */
export interface SpriteHandle {
  readonly characterId: string
  /**
   * 立即把精灵跳点到指定 tile 坐标（不插值，不切换动画）。
   * 用于 11.5 spawn 时的初始定位 / 12.1 mock pos 首次跳点 / 异常修复路径。
   * 与 12.3 的 `moveTo` 互斥使用。
   */
  setPosition(tileX: number, tileY: number): void
  /**
   * task 12.3：在 `durationMs` 毫秒内插值平移到目标 tile。期间按 dx/dy 主轴
   * 自动切换 4 方向 walk 动画（design.md §1.3 / §1.9，8 FPS），到达后回到
   * idle 静帧动画。
   *
   * 行为契约：
   *  - 同一精灵新 moveTo 调用先 stop 上一条 tween 再启动新 tween（不重叠）。
   *  - 目标 == 当前位置时直接 noop，不播任何动画（避免抖动）。
   *  - 若 mascot 没有 walk 动画（如 fallback 到 sprite_default 的精灵），
   *    依然 tween 位置但保持 idle 帧。
   */
  moveTo(tileX: number, tileY: number, durationMs: number): void
  /** 从场景中移除。幂等。 */
  destroy(): void
}

/** task 11.5 / design.md §1.9 spawnSprite 入参。 */
export interface SpawnSpriteOpts {
  /** Tile 坐标系（左上为原点；TMJ zone 字段同坐标系）。 */
  x: number
  y: number
  /**
   * 7 类萌宠 type；用于解析 idle 贴图 key。未传时回退到 BootScene 已加载的
   * `sprite_default`，保证就算 TownScene preload 失败也不会白屏。
   */
  mascotType?: string
}

/**
 * TownScene 暴露给 RenderEngine 的公共面（避免把整个 Phaser.Scene 类型
 * 漏给上层）。RenderEngine 通过 `'erciyuan:townSceneReady'` 事件拿到一个
 * 实现该接口的实例，然后转发外部调用。
 */
export interface TownSceneApi {
  spawnSprite(characterId: string, opts: SpawnSpriteOpts): SpriteHandle
  getSpriteHandle(characterId: string): SpriteHandle | null
  /** 测试 / 调试用：列出当前所有精灵 ID。 */
  listSpriteIds(): string[]
  /**
   * task 12.4：返回精灵当前世界坐标（Phaser 像素，与
   * `cameras.main.scrollX/Y` 同坐标系）。
   * 主要用于测试 / 调试。生产路径直接用 {@link getSpriteScreenPosition}。
   */
  getSpriteWorldPosition(characterId: string): { x: number; y: number } | null
  /**
   * task 12.4 / 12.5：把精灵当前世界坐标投影到 DOM CSS 像素，覆盖层
   * （SpeechBubbleLayer / ActionLabelLayer）`position: absolute` 直接消费。
   *
   * 投影流程：
   *   1. world → camera-view：`(world - cam.scrollX) * cam.zoom`（仍是 Phaser
   *      内部 game 像素）。
   *   2. game px → CSS px：`scale.displaySize / scale.gameSize` 之比（FIT 模式）。
   *   3. 加 canvas 在父容器内的居中偏移（FIT 会留 letterbox）。
   *
   * @returns 已包含 displayHeight，方便上层定位"精灵脚下"vs"精灵头顶"。
   *   未注册的 character_id / 画布未 layout / camera 未就绪 → null。
   */
  getSpriteScreenPosition(
    characterId: string,
  ): { x: number; y: number; displayHeight: number } | null
}

export interface TownSceneOptions {
  /** 是否记录 image-collection 缺失（task 11.4 验证用）。默认 true。 */
  verbose?: boolean
}

/** 与 design.md §1.1 一致：Tile 32×32 像素，固定不变。 */
const TILE_SIZE = 32

// ── task 11.6 相机控制常量 ─────────────────────────────────────────────
/**
 * 3 档缩放档位（design.md §1.6 / R7.3）。键盘 ONE / TWO / THREE 与
 * 鼠标滚轮均按 index 切换；初始值固定为 ZOOM_LEVELS[0] = 1。
 */
const ZOOM_LEVELS = [1, 1.5, 2] as const
/** 缩放档位之间的 tween 时长（ms）—— design.md §1.6 平滑过渡 200ms。 */
const ZOOM_TWEEN_DURATION_MS = 200
/** Phaser `startFollow` 软跟随系数 X（R7.3 / design.md §1.6）。 */
const FOLLOW_LERP_X = 0.08
/** Phaser `startFollow` 软跟随系数 Y（R7.3 / design.md §1.6）。 */
const FOLLOW_LERP_Y = 0.08

// ── task 12.3 walk 动画常量 ────────────────────────────────────────────
/** design.md §1.3：walk 8 FPS（每帧 125ms）。 */
const WALK_FRAME_RATE = 8
/** 4 方向 walk 帧序，每方向 4 帧，文件名 idx 1..4。 */
const WALK_DIRECTIONS = ['down', 'left', 'right', 'up'] as const
const WALK_FRAMES_PER_DIR = 4
type WalkDirection = (typeof WALK_DIRECTIONS)[number]

/**
 * Slice 0 静态精灵清单（task 11.5）。
 *
 * 三个 character_id 与 `packages/mock-town/src/timeline.ts` 中的 mock 角色
 * 完全一致；坐标取自 `assets/tilemaps/town_64x64.tmj` 的 zone 字段中央，
 * 三者两两不重叠，也都不落在地图正中 (32, 32) 的 sanity-check sprite 上。
 *
 *   - mock_char_dog_social_alpha   → Convention_Plaza  (24,0)–(40,8)   center (32, 4)
 *   - mock_char_fox_create_alpha   → Cos_Studio        (40,24)–(56,32) center (48, 28)
 *   - mock_char_hamster_hoard_alpha→ Goods_Bazaar      (8,40)–(24,56)  center (16, 48)
 */
const DEFAULT_SPRITES: ReadonlyArray<{
  characterId: string
  mascotType: 'dog_social' | 'fox_create' | 'hamster_hoard'
  zone: string
  tile: { x: number; y: number }
}> = [
  {
    characterId: 'mock_char_dog_social_alpha',
    mascotType: 'dog_social',
    zone: 'Convention_Plaza',
    tile: { x: 32, y: 4 },
  },
  {
    characterId: 'mock_char_fox_create_alpha',
    mascotType: 'fox_create',
    zone: 'Cos_Studio',
    tile: { x: 48, y: 28 },
  },
  {
    characterId: 'mock_char_hamster_hoard_alpha',
    mascotType: 'hamster_hoard',
    zone: 'Goods_Bazaar',
    tile: { x: 16, y: 48 },
  },
]

/**
 * Mascot idle texture key 命名约定（task 11.5 内部）。RenderEngine 不必感知
 * 这套命名 —— 它通过 `mascotType` 委托给 TownScene 解析。
 */
function mascotIdleKey(mascotType: string): string {
  return `mascot_${mascotType}_idle`
}

function mascotIdleUrl(mascotType: string): string {
  return `/assets/mascots/${mascotType}/idle.png`
}

/**
 * task 12.3：4 方向 walk 帧 texture key / 文件名生成器。
 *
 * - texture key 形如 `mascot_dog_social_walk_left_1`（idx 从 1 开始，不补零）。
 * - 文件路径走资产库的 `walk_{dir}_0{idx}.png` 命名（task 4.4，idx 二位补零）。
 *
 * 二者刻意不一致 —— texture key 是运行时索引，方便在 anim frames 中拼字符串；
 * 文件路径必须严格匹配磁盘命名。
 */
function mascotWalkFrameKey(mascotType: string, dir: WalkDirection, idx: number): string {
  return `mascot_${mascotType}_walk_${dir}_${idx}`
}

function mascotWalkFrameUrl(mascotType: string, dir: WalkDirection, idx: number): string {
  const padded = idx.toString().padStart(2, '0')
  return `/assets/mascots/${mascotType}/walk_${dir}_${padded}.png`
}

/**
 * task 12.3：动画 key 命名。与 texture key 命名空间隔离（前缀 `mascot_anim_`），
 * 避免 Phaser 在同一 cache 里同时按 texture / animation 两份索引时撞 key。
 *
 *   - idle 静帧伪动画：`mascot_anim_{type}_idle`（单帧 + repeat -1）
 *   - walk 4 方向：`mascot_anim_{type}_walk_{dir}`（4 帧 8 FPS + repeat -1）
 *
 * 总共每 mascot type × 5 个 anim key。
 */
function mascotIdleAnimKey(mascotType: string): string {
  return `mascot_anim_${mascotType}_idle`
}

function mascotWalkAnimKey(mascotType: string, dir: WalkDirection): string {
  return `mascot_anim_${mascotType}_walk_${dir}`
}

/**
 * task 12.3：mascot type 列表 = `DEFAULT_SPRITES` 涉及的全部 mascot 类型，
 * 去重。只对这 3 类做 walk preload + anim 注册，避免一次性拉爆 ~100 张图
 * （7 类 × 16 帧 + idle = 119 个 texture）。Slice 5 后接入 live live 数据
 * 流时再按 character → mascot_type 动态扩展。
 */
const ANIMATED_MASCOT_TYPES: ReadonlyArray<'dog_social' | 'fox_create' | 'hamster_hoard'> =
  Array.from(new Set(DEFAULT_SPRITES.map((entry) => entry.mascotType))) as ReadonlyArray<
    'dog_social' | 'fox_create' | 'hamster_hoard'
  >

export function createTownScene(options: TownSceneOptions = {}): Phaser.Scene & TownSceneApi {
  const { verbose = true } = options

  class TownScene extends Phaser.Scene implements TownSceneApi {
    /** task 11.5：以 character_id 为键的精灵句柄表，支持 11.6 followCamera 寻址。 */
    private spriteHandles = new Map<string, SpriteHandle>()

    // ── task 11.6 相机控制状态 ─────────────────────────────────────────
    /**
     * 与 `spriteHandles` 平行的 GameObject 索引。`SpriteHandle` 的公共面
     * 故意不暴露底层 Phaser 对象（design.md §1.9），但 `cameras.main.startFollow`
     * 需要 `Phaser.GameObjects.Image` —— Sprite extends Image，所以 task
     * 12.3 把底层从 Image 升级为 Sprite 后这条索引继续兼容。
     * 在 handle.destroy 时跟着删除，避免悬挂引用。
     */
    private spriteImages = new Map<string, Phaser.GameObjects.Sprite>()
    /**
     * task 12.3：每个 character_id 当前在跑的 moveTo tween，便于"新 moveTo
     * 取消上一条 tween"。tween 完成或被 stop 时同步清除。
     */
    private activeMoveTweens = new Map<string, Phaser.Tweens.Tween>()
    /** 当前的跟随目标（由 `pickFollowTarget` 决定，自由摄像下不会被清空）。 */
    private followTarget: Phaser.GameObjects.Image | null = null
    /** 当前缩放档位 index（指向 `ZOOM_LEVELS`）。 */
    private zoomIndex = 0
    /** 是否处于自由摄像模式（按住空格期间 = true）。 */
    private freeLook = false
    /** 自由摄像拖拽中的开始锚点；`null` 表示当前没有 active drag。 */
    private dragAnchor: { pointerX: number; pointerY: number; scrollX: number; scrollY: number } | null = null
    /** 顶左角 HUD 文本，每次 zoom / freeLook 变化时刷新。 */
    private cameraHud: Phaser.GameObjects.Text | null = null
    /** 在飞的 zoom tween，setZoomIndex 切换时先 stop 防止叠加。 */
    private activeZoomTween: Phaser.Tweens.Tween | null = null

    constructor() {
      super({ key: 'TownScene' })
    }

    /**
     * task 11.5：在 BootScene 三件套之外，再补一份 3 类 mascot idle 帧。
     * task 12.3：再加 3 类 × 4 方向 × 4 帧 walk 帧 —— 一共 +48 张 PNG，
     *           单张 << 64 KB（mascot sprite 实际几 KB），整体增量远小于
     *           关键路径预算。如果某一帧加载失败，spawnSprite 会回退到
     *           `sprite_default`，moveTo 会回退到"只 tween 位置不切动画"。
     */
    preload(): void {
      for (const mascotType of ANIMATED_MASCOT_TYPES) {
        // idle
        const idleKey = mascotIdleKey(mascotType)
        if (!this.textures.exists(idleKey)) {
          this.load.image(idleKey, mascotIdleUrl(mascotType))
        }
        // walk frames（4 方向 × 4 帧 = 16 张）
        for (const dir of WALK_DIRECTIONS) {
          for (let idx = 1; idx <= WALK_FRAMES_PER_DIR; idx++) {
            const frameKey = mascotWalkFrameKey(mascotType, dir, idx)
            if (this.textures.exists(frameKey)) continue
            this.load.image(frameKey, mascotWalkFrameUrl(mascotType, dir, idx))
          }
        }
      }

      this.load.on('loaderror', (file: Phaser.Loader.File) => {
        // eslint-disable-next-line no-console
        console.warn('[TownScene] mascot frame load failed:', file.key, file.src)
      })
    }

    create(): void {
      const map = this.make.tilemap({ key: BOOT_ASSET_KEYS.tilemap })
      const tilesetMain = map.addTilesetImage(
        BOOT_ASSET_KEYS.tilesetMain,
        BOOT_ASSET_KEYS.tilesetMain,
      )

      if (!tilesetMain) {
        // eslint-disable-next-line no-console
        console.error(
          '[TownScene] addTilesetImage("tileset_main") returned null; falling back to bg-only render',
        )
        this.renderFallback(map)
        return
      }

      const skipped: string[] = []
      const created: string[] = []
      // 收集 image-collection（landmarks）所需的 tileset 名，后续 task 18.2 再
      // 真正逐张 addTilesetImage；Slice 0 仅汇报。
      const imageCollectionTilesets = (map.tilesets ?? [])
        .filter((ts) => !ts.image)
        .map((ts) => ts.name)

      for (const layer of map.layers) {
        // 跳过 collision 层（properties.collide=true 留给 Pathfinding，画面无视觉）
        if (layer.name === 'Collision') {
          skipped.push(`${layer.name}(collision-mask)`)
          continue
        }
        // map.createLayer(name, tilesets, x, y) 第二参数支持单个或数组；这里传
        // 单个 image tileset；image-collection 的 GID 会被 Phaser 渲染成空格。
        const created_layer = map.createLayer(layer.name, tilesetMain, 0, 0)
        if (!created_layer) {
          skipped.push(`${layer.name}(createLayer-null)`)
          continue
        }
        created.push(layer.name)
      }

      if (verbose) {
        // eslint-disable-next-line no-console
        console.info('[TownScene] tilemap loaded', {
          width: map.widthInPixels,
          height: map.heightInPixels,
          layers: map.layers.length,
          createdLayers: created,
          skippedLayers: skipped,
          imageCollectionTilesets,
        })
      }

      // 视觉 sanity check：地图中央放一只默认 sprite。仍用 image — 不需要动画。
      const cx = map.widthInPixels / 2
      const cy = map.heightInPixels / 2
      const sprite = this.add.image(cx, cy, BOOT_ASSET_KEYS.spriteDefault)
      sprite.setOrigin(0.5, 0.5)

      // 相机约束 + 居中（具体的 startFollow / zoom / 自由摄像由 task 11.6 接管）。
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
      this.cameras.main.centerOn(cx, cy)

      // task 12.3：在任何 spawnSprite 之前先注册全部 walk / idle 动画。
      // spawnDefaultSprites → spawnSprite → sprite.play(idle) 依赖这一步。
      this.registerMascotAnimations()

      // task 11.5：按 mock-town 角色站位 spawn 3 个静态精灵。
      this.spawnDefaultSprites()

      // task 11.6：在 spawnDefaultSprites 之后立即装配相机交互。这样
      // pickFollowTarget 能优先选到 mock_char_dog_social_alpha；同时必须
      // 在下面的 `'erciyuan:townSceneReady'` 之前完成，让 RenderEngine 在
      // 监听到事件时拿到的是「相机已经在跟随」的稳定场景。
      this.setupCameraControls(map, sprite)

      // 通知 RenderEngine：TownScene 已就绪，可以开始接受 spawnSprite /
      // followCamera 等外部调用。事件名与 design.md §1.9 配合 task 11.6 使用。
      this.game.events.emit('erciyuan:townSceneReady', this)
    }

    /**
     * task 12.3：为 `ANIMATED_MASCOT_TYPES` 注册 idle + 4 方向 walk = 5 个
     * 动画 key per mascot type。已存在的 anim key 跳过（`anims.exists` 守卫
     * 让 React StrictMode 双挂载 / 热重载场景幂等）。
     *
     * 帧来源直接用 preload 进来的独立 texture key（4 个 single-image texture
     * 拼成一组 frames），而不是单张 sprite sheet —— 与 `assets/mascots/...`
     * 现有目录结构对齐（task 4.4 产物为离散 PNG）。Phaser 的 anims 系统支持
     * 跨 texture key 拼帧，每 frame 单独传 `{ key }` 即可。
     */
    private registerMascotAnimations(): void {
      for (const mascotType of ANIMATED_MASCOT_TYPES) {
        // idle 静帧伪动画
        const idleAnimKey = mascotIdleAnimKey(mascotType)
        if (!this.anims.exists(idleAnimKey) && this.textures.exists(mascotIdleKey(mascotType))) {
          this.anims.create({
            key: idleAnimKey,
            // Phaser 的 single-frame anim 需要 frameRate ≥ 1；repeat: -1 让它
            // 不会自动停掉（停掉后下次切回 idle 仍能 .play 重启）。
            frames: [{ key: mascotIdleKey(mascotType) }],
            frameRate: 1,
            repeat: -1,
          })
        }

        // 4 方向 walk
        for (const dir of WALK_DIRECTIONS) {
          const walkKey = mascotWalkAnimKey(mascotType, dir)
          if (this.anims.exists(walkKey)) continue

          const frames = []
          for (let idx = 1; idx <= WALK_FRAMES_PER_DIR; idx++) {
            const frameKey = mascotWalkFrameKey(mascotType, dir, idx)
            if (!this.textures.exists(frameKey)) {
              // 单帧缺失就跳过这一帧；Phaser anim 至少 1 帧才能 create。
              continue
            }
            frames.push({ key: frameKey })
          }
          if (frames.length === 0) {
            // eslint-disable-next-line no-console
            console.warn(
              `[TownScene] no walk frames available for ${mascotType}/${dir}; anim skipped`,
            )
            continue
          }
          this.anims.create({
            key: walkKey,
            frames,
            frameRate: WALK_FRAME_RATE,
            repeat: -1,
          })
        }
      }

      if (verbose) {
        // eslint-disable-next-line no-console
        console.info('[TownScene] mascot animations registered (task 12.3)', {
          mascotTypes: ANIMATED_MASCOT_TYPES,
          frameRate: WALK_FRAME_RATE,
        })
      }
    }

    /**
     * task 11.5：按 {@link DEFAULT_SPRITES} 在三个 TMJ zone 中央落 3 个
     * 静态精灵。坐标取自 `assets/tilemaps/town_64x64.tmj` 的 zone 字段，
     * 与中心 sanity sprite (32, 32) 不冲突，三者两两不重叠。
     */
    private spawnDefaultSprites(): void {
      for (const entry of DEFAULT_SPRITES) {
        this.spawnSprite(entry.characterId, {
          x: entry.tile.x,
          y: entry.tile.y,
          mascotType: entry.mascotType,
        })
      }
      if (verbose) {
        // eslint-disable-next-line no-console
        console.info('[TownScene] spawned default sprites (task 11.5)', {
          ids: this.listSpriteIds(),
        })
      }
    }

    // ── TownSceneApi 实现（design.md §1.9）─────────────────────────────

    /**
     * 创建一个静态精灵并登记到 `spriteHandles`。
     * 同一 character_id 重复调用会先销毁旧的句柄，避免泄漏与 z-order 错乱。
     *
     * task 12.3：底层对象由 `add.image` 改为 `add.sprite` 以支持 anim 系统；
     * spawn 完成后立刻 `play(idle)`，让静态摆放也是"呼吸"状态（idle 单帧
     * pseudo-anim）。无 mascotType 或没注册 anim 的 fallback 路径仍只摆
     * 一张 sprite_default 静图，不会白屏。
     */
    spawnSprite(characterId: string, opts: SpawnSpriteOpts): SpriteHandle {
      const existing = this.spriteHandles.get(characterId)
      if (existing) {
        existing.destroy()
      }

      const textureKey = this.resolveTextureKey(opts.mascotType)
      const px = opts.x * TILE_SIZE + TILE_SIZE / 2
      const py = opts.y * TILE_SIZE + TILE_SIZE / 2
      const sprite = this.add.sprite(px, py, textureKey).setOrigin(0.5, 0.5)
      // 数据：character_id 写到 GameObject.data，方便 Phaser DevTools / 后续
      // pointerdown 事件反查。
      sprite.setData('character_id', characterId)

      // task 12.3：开播 idle 动画（如可用）。无 mascotType 或贴图缺失时
      // 退化为静帧贴图，moveTo 会照样能跑（仅不切走路动画）。
      const idleAnim = opts.mascotType ? mascotIdleAnimKey(opts.mascotType) : null
      if (idleAnim && this.anims.exists(idleAnim)) {
        sprite.play(idleAnim)
      }

      // task 11.6：登记到 `spriteImages` 平行表，给 `pickFollowTarget` /
      // `cameras.main.startFollow` 使用。Sprite extends Image，原 startFollow
      // 调用零改动。
      this.spriteImages.set(characterId, sprite)

      let destroyed = false
      const sceneRef = this
      const mascotType = opts.mascotType
      const handle: SpriteHandle = {
        characterId,
        setPosition: (tileX: number, tileY: number): void => {
          if (destroyed) return
          // 跳点同时取消任何在飞的 moveTo tween，保持语义干净。
          const prev = sceneRef.activeMoveTweens.get(characterId)
          if (prev) {
            prev.stop()
            sceneRef.activeMoveTweens.delete(characterId)
          }
          sprite.setPosition(
            tileX * TILE_SIZE + TILE_SIZE / 2,
            tileY * TILE_SIZE + TILE_SIZE / 2,
          )
        },
        moveTo: (tileX: number, tileY: number, durationMs: number): void => {
          if (destroyed) return
          sceneRef.tweenSpriteTo(characterId, sprite, mascotType, tileX, tileY, durationMs)
        },
        destroy: (): void => {
          if (destroyed) return
          destroyed = true
          // 清掉在飞的 tween，避免 onComplete 在已 destroy 的 sprite 上回调。
          const prev = sceneRef.activeMoveTweens.get(characterId)
          if (prev) {
            prev.stop()
            sceneRef.activeMoveTweens.delete(characterId)
          }
          sprite.destroy()
          sceneRef.spriteHandles.delete(characterId)
          // task 11.6：同步清理平行索引。如果当前跟随目标恰好是被销毁的
          // 这只精灵，则相机回退到 sanity-check 中央 sprite，避免悬挂。
          sceneRef.spriteImages.delete(characterId)
          if (sceneRef.followTarget === sprite) {
            sceneRef.followTarget = null
          }
        },
      }
      this.spriteHandles.set(characterId, handle)
      return handle
    }

    getSpriteHandle(characterId: string): SpriteHandle | null {
      return this.spriteHandles.get(characterId) ?? null
    }

    listSpriteIds(): string[] {
      return Array.from(this.spriteHandles.keys())
    }

    /**
     * task 12.4：返回精灵当前世界坐标（Phaser 像素，与
     * `cameras.main.scrollX/Y` 同坐标系）。SpeechBubbleLayer 取到后再让
     * RenderEngine 用相机做世界 → 屏幕投影。
     */
    getSpriteWorldPosition(characterId: string): { x: number; y: number } | null {
      const image = this.spriteImages.get(characterId)
      if (!image) return null
      return { x: image.x, y: image.y }
    }

    /**
     * task 12.4 / 12.5：把精灵当前世界坐标投影到 DOM CSS 像素。
     * SpeechBubbleLayer / ActionLabelLayer 的 overlay div 用 `position:
     * absolute` 直接消费返回值（覆盖层与 Phaser canvas 的父容器同 parent）。
     *
     * 投影涉及三段坐标系：
     *   ① 世界坐标（this.spriteImages[*].x/y）
     *   ② game 内部像素（受 cameras.main.scrollX/Y + zoom 影响）
     *   ③ DOM CSS 像素（受 Scale.FIT 的 displaySize / gameSize 之比 + letterbox 偏移影响）
     *
     * Phaser FIT 模式会把 canvas 缩放到 parent 内、居中、留黑边；canvas 自身
     * 的 `getBoundingClientRect()` 也能给出准确的居中偏移，但拿 parent 来
     * 算偏移更稳——RenderEngine.getSpriteScreenPosition 的调用方
     * （SpeechBubbleLayer）的 absolute 容器与 canvas 同 parent，于是这套
     * 偏移正好对齐。
     */
    getSpriteScreenPosition(
      characterId: string,
    ): { x: number; y: number; displayHeight: number } | null {
      const image = this.spriteImages.get(characterId)
      if (!image) return null

      const camera = this.cameras?.main
      if (!camera) return null

      // ① world → ② game-internal px
      const viewX = (image.x - camera.scrollX) * camera.zoom
      const viewY = (image.y - camera.scrollY) * camera.zoom

      // ② game-internal px → ③ CSS px
      const scaleMgr = this.scale
      const gameW = scaleMgr.gameSize.width
      const gameH = scaleMgr.gameSize.height
      const displayW = scaleMgr.displaySize.width
      const displayH = scaleMgr.displaySize.height
      if (gameW <= 0 || gameH <= 0 || displayW <= 0 || displayH <= 0) return null
      const scaleX = displayW / gameW
      const scaleY = displayH / gameH

      // canvas 在 parent 内的居中偏移（FIT 留 letterbox）
      const parent = scaleMgr.parent as HTMLElement | null
      if (!parent) return null
      const parentW = parent.clientWidth
      const parentH = parent.clientHeight
      const offsetX = (parentW - displayW) / 2
      const offsetY = (parentH - displayH) / 2

      // 精灵高度也按相同比例换算，给上层在"头顶 / 脚下"之间二选一。
      const spriteDisplayH = image.displayHeight * camera.zoom * scaleY

      return {
        x: offsetX + viewX * scaleX,
        y: offsetY + viewY * scaleY,
        displayHeight: spriteDisplayH,
      }
    }

    /**
     * 解析 mascot idle 贴图 key。优先用 TownScene preload 进来的
     * `mascot_{type}_idle`；如果不存在（asset 加载失败 / 未知 mascot type），
     * 回退到 BootScene 已加载的 `sprite_default`，保证不白屏。
     */
    private resolveTextureKey(mascotType?: string): string {
      if (mascotType) {
        const key = mascotIdleKey(mascotType)
        if (this.textures.exists(key)) return key
        // eslint-disable-next-line no-console
        console.warn(
          `[TownScene] mascot idle "${key}" not loaded; falling back to sprite_default`,
        )
      }
      return BOOT_ASSET_KEYS.spriteDefault
    }

    // ── task 12.3 走路插值实现 ──────────────────────────────────────────

    /**
     * 内部：执行一次 moveTo（tween 平移 + 走路动画 + 完成后回 idle）。
     *
     * - **抖动护栏**：dx == 0 && dy == 0 → 直接 noop，不停 idle 也不重启
     *   anim。timeline 中两条相邻同坐标 pos 事件不会触发动画切换。
     * - **不重叠**：先 stop 上一条 tween，再启新 tween。Phaser 的 stop
     *   不会触发 onComplete，所以不需要担心两条 onComplete 互相覆盖。
     * - **方向判定**：`Math.abs(dx) >= Math.abs(dy)` 取水平主轴
     *   （等值时偏向水平，符合 design.md §1.9 设定）。
     */
    private tweenSpriteTo(
      characterId: string,
      sprite: Phaser.GameObjects.Sprite,
      mascotType: string | undefined,
      tileX: number,
      tileY: number,
      durationMs: number,
    ): void {
      const targetPx = tileX * TILE_SIZE + TILE_SIZE / 2
      const targetPy = tileY * TILE_SIZE + TILE_SIZE / 2
      const dx = targetPx - sprite.x
      const dy = targetPy - sprite.y

      if (dx === 0 && dy === 0) {
        // 目标 == 当前：noop，避免抖动。
        return
      }

      // 取消上一条 tween（如有）以避免叠加。
      const prev = this.activeMoveTweens.get(characterId)
      if (prev) {
        prev.stop()
        this.activeMoveTweens.delete(characterId)
      }

      // 方向：dx/dy 主轴决定 4 方向；abs(dx) == abs(dy) 时偏向水平方向。
      let dir: WalkDirection
      if (Math.abs(dx) >= Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left'
      } else {
        dir = dy > 0 ? 'down' : 'up'
      }

      // 切到对应 walk 动画。`ignoreIfPlaying` 避免在已是该方向时把动画
      // 重置回第一帧 —— 让连续同方向的多步移动看起来是一个连续的步态。
      if (mascotType) {
        const walkKey = mascotWalkAnimKey(mascotType, dir)
        if (this.anims.exists(walkKey)) {
          sprite.play({ key: walkKey }, true)
        }
      }

      const safeDuration = Math.max(1, durationMs)
      const tween = this.tweens.add({
        targets: sprite,
        x: targetPx,
        y: targetPy,
        duration: safeDuration,
        ease: 'Linear',
        onComplete: () => {
          // 自检：到达后若该 tween 仍是活跃 tween，则清掉并切回 idle。
          // 若期间被新 moveTo 取代，则新 tween 已经接管并 .play(walk)，
          // 这里必须不触碰 sprite 的 anim 状态，避免覆盖新动画。
          if (this.activeMoveTweens.get(characterId) !== tween) return
          this.activeMoveTweens.delete(characterId)
          if (!sprite.scene) return // sprite 已 destroy
          if (mascotType) {
            const idleAnim = mascotIdleAnimKey(mascotType)
            if (this.anims.exists(idleAnim)) {
              sprite.play(idleAnim)
              return
            }
          }
          // fallback：没 anim 也得停掉走路动画，回到静帧。
          sprite.anims.stop()
          if (mascotType && this.textures.exists(mascotIdleKey(mascotType))) {
            sprite.setTexture(mascotIdleKey(mascotType))
          }
        },
      })
      this.activeMoveTweens.set(characterId, tween)
    }

    // ── task 11.6 相机控制 ───────────────────────────────────────────

    /**
     * 选择默认跟随目标：优先 `spriteHandles` 里登记的第一个精灵
     * （DEFAULT_SPRITES 顺序 = mock_char_dog_social_alpha 优先），不存在时
     * 回退到中央 sanity-check sprite。任何时刻都至少返回一个非 null 对象。
     */
    private pickFollowTarget(centerSprite: Phaser.GameObjects.Image): Phaser.GameObjects.Image {
      const firstId = Array.from(this.spriteHandles.keys())[0]
      if (firstId !== undefined) {
        const image = this.spriteImages.get(firstId)
        if (image) return image
      }
      return centerSprite
    }

    /**
     * task 11.6：装配相机交互。R7.3 软跟随 + 自由摄像 + 3 档缩放 + HUD。
     */
    private setupCameraControls(
      map: Phaser.Tilemaps.Tilemap,
      centerSprite: Phaser.GameObjects.Image,
    ): void {
      // —— follow target ——————————————————————————————————————————
      const target = this.pickFollowTarget(centerSprite)
      this.followTarget = target
      this.cameras.main.startFollow(target, true, FOLLOW_LERP_X, FOLLOW_LERP_Y)

      // —— 初始 zoom ————————————————————————————————————————————————
      this.zoomIndex = 0
      this.cameras.main.setZoom(ZOOM_LEVELS[this.zoomIndex])

      // —— bounds 已在 create() 内设过，此处再保险一次，避免 setZoom
      //    之后 Phaser 内部 dirty 标记没刷新到 viewport。
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

      // —— HUD ——————————————————————————————————————————————————
      this.cameraHud = this.add
        .text(12, 12, '', {
          fontFamily: '"VT323", "Pixel Operator", monospace',
          fontSize: '16px',
          color: '#FFFFFF',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          padding: { x: 8, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(10000)
        .setResolution(2)
      this.refreshCameraHud()

      // —— 键盘 ——————————————————————————————————————————————————
      const keyboard = this.input.keyboard
      if (keyboard) {
        keyboard.on('keydown-ONE', () => this.setZoomIndex(0))
        keyboard.on('keydown-TWO', () => this.setZoomIndex(1))
        keyboard.on('keydown-THREE', () => this.setZoomIndex(2))
        keyboard.on('keydown-SPACE', (event: KeyboardEvent) => {
          // 阻止页面级空格滚动行为；scene 内输入安全。
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault()
          }
          this.enterFreeLook()
        })
        keyboard.on('keyup-SPACE', () => this.exitFreeLook())
      } else if (verbose) {
        // eslint-disable-next-line no-console
        console.warn('[TownScene] keyboard plugin unavailable; zoom hotkeys disabled')
      }

      // —— 鼠标滚轮 → 缩放档位循环 ———————————————————————————————
      // Phaser `wheel` 事件签名 (pointer, gameObjects, dx, dy, dz, event)。
      this.input.on(
        'wheel',
        (
          _pointer: Phaser.Input.Pointer,
          _objects: Phaser.GameObjects.GameObject[],
          _dx: number,
          dy: number,
        ) => {
          if (dy === 0) return
          this.cycleZoom(dy < 0 ? +1 : -1)
        },
      )

      // —— 鼠标拖拽 → 自由摄像平移 ———————————————————————————————
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (!this.freeLook) return
        this.dragAnchor = {
          pointerX: pointer.x,
          pointerY: pointer.y,
          scrollX: this.cameras.main.scrollX,
          scrollY: this.cameras.main.scrollY,
        }
      })
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!this.freeLook || !this.dragAnchor) return
        // 拖拽距离要除以 zoom，因为屏幕像素与世界像素之间隔了一道缩放。
        const zoom = this.cameras.main.zoom || 1
        const dx = (pointer.x - this.dragAnchor.pointerX) / zoom
        const dy = (pointer.y - this.dragAnchor.pointerY) / zoom
        this.cameras.main.scrollX = this.dragAnchor.scrollX - dx
        this.cameras.main.scrollY = this.dragAnchor.scrollY - dy
        // bounds 会被 Phaser 自动钳制（见 setBounds）。
      })
      const releaseDrag = (): void => {
        this.dragAnchor = null
      }
      this.input.on('pointerup', releaseDrag)
      this.input.on('pointerupoutside', releaseDrag)
    }

    /**
     * task 11.6：切换到指定缩放档位 index，使用 200ms Sine.easeInOut 过渡。
     * 同一时刻只允许一个 zoom tween 在飞，再次调用会先 stop 旧的避免叠加。
     */
    private setZoomIndex(index: number): void {
      const clamped = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index))
      if (clamped === this.zoomIndex && this.activeZoomTween === null) {
        // 已经在该档位且没有正在飞的 tween，省一次 noop。
        return
      }
      this.zoomIndex = clamped
      if (this.activeZoomTween) {
        this.activeZoomTween.stop()
        this.activeZoomTween = null
      }
      this.activeZoomTween = this.tweens.add({
        targets: this.cameras.main,
        zoom: ZOOM_LEVELS[clamped],
        duration: ZOOM_TWEEN_DURATION_MS,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.activeZoomTween = null
        },
      })
      this.refreshCameraHud()
    }

    /** task 11.6：滚轮 +1 / -1 步进缩放档位（在 [0, length-1] 内 clamp）。 */
    private cycleZoom(delta: number): void {
      this.setZoomIndex(this.zoomIndex + delta)
    }

    /** task 11.6：进入自由摄像。停止跟随，HUD 切到「自由摄像（按住空格）」。 */
    private enterFreeLook(): void {
      if (this.freeLook) return
      this.freeLook = true
      this.cameras.main.stopFollow()
      this.refreshCameraHud()
    }

    /**
     * task 11.6：退出自由摄像。重新发起 startFollow，软跟随系数 0.08
     * 让相机慢速回到角色（design.md §1.6）。
     */
    private exitFreeLook(): void {
      if (!this.freeLook) return
      this.freeLook = false
      this.dragAnchor = null
      if (this.followTarget) {
        this.cameras.main.startFollow(
          this.followTarget,
          true,
          FOLLOW_LERP_X,
          FOLLOW_LERP_Y,
        )
      }
      this.refreshCameraHud()
    }

    /** task 11.6：刷新顶左角 HUD 文本，缩放档 + 相机模式一行展示。 */
    private refreshCameraHud(): void {
      if (!this.cameraHud) return
      const zoom = ZOOM_LEVELS[this.zoomIndex]
      const mode = this.freeLook ? '自由摄像（按住空格）' : '跟随'
      this.cameraHud.setText(`缩放 ×${zoom} · ${mode}`)
    }

    /**
     * tileset_main 解析失败时的最末路降级：仅展示一句提示文本，不白屏。
     */
    private renderFallback(map: Phaser.Tilemaps.Tilemap): void {
      const { width, height } = this.scale
      this.add
        .text(width / 2, height / 2, '小镇贴图加载失败（DEGRADED MODE）', {
          fontFamily: '"VT323", "Pixel Operator", monospace',
          fontSize: '20px',
          color: '#FF6F6F',
        })
        .setOrigin(0.5, 0.5)
        .setResolution(2)
      this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    }
  }

  return new TownScene()
}

export default createTownScene
