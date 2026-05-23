/**
 * BootScene — task 11.4
 *
 * 首屏关键路径加载器：preload 三件套（tileset_main.png + town_64x64.tmj +
 * sprite_default.png）并显示像素风加载条。preload complete 后跳转 TownScene。
 *
 * 关键约束：
 *  - 与 PlaceholderScene 一样，class 在工厂函数内部声明，避免模块顶层引用
 *    `Phaser` 全局而炸 SSR。
 *  - tilemap 用 `tilemapTiledJSON` API 加载（Phaser 会自动按 tmj 中的相对
 *    `image` 字段去拉 image-collection 子图，因此 sync-assets.mjs 必须把
 *    landmarks/ 一并拷过去）。
 *  - 进度回调：`load.progress` 事件 0..1，driver loading bar 宽度。
 *  - 启动计时由 RenderEngine 持有，BootScene 只负责发射 `'erciyuan:firstScreenReady'`
 *    游戏级事件，让 RenderEngine 抓时间差。
 *
 * 所有 asset key 在常量里集中声明，与 RenderEngine.AssetManifest 保持一致。
 */

export const BOOT_ASSET_KEYS = {
  tilesetMain: 'tileset_main',
  tilemap: 'town',
  spriteDefault: 'sprite_default',
} as const

export interface BootSceneOptions {
  /** 关键 image：主 tileset PNG，建议 ≤ 512 KB（design.md §1.1） */
  tilesetMainUrl: string
  /** 关键 JSON：64×64 主地图（design.md §1.2） */
  tilemapUrl: string
  /** 关键 image：fallback 默认精灵；任务 11.4 用 cat_lore/portrait_64.png（design.md §1.7） */
  spriteDefaultUrl: string
  /** 切换的下一个 scene key，默认 'TownScene'。 */
  nextSceneKey?: string
}

const DEFAULT_NEXT_SCENE = 'TownScene'

/**
 * 像素风加载条样式（design.md §1.7 + R15.5 24 主色板）：
 *   - 外框：deep-navy 实心 + glass-white 2px stroke
 *   - 进度填充：brandPrimary（#FF6FB7）
 *   - 顶部说明文本 + 底部百分比
 */
const STYLE = {
  bgFill: 0x0e1018, // neutralDeepNavy
  bgStroke: 0xf5f5f7, // neutralGlassWhite
  fill: 0xff6fb7, // brandPrimary
  textColor: '#F5F5F7',
  hintFont: '"VT323", "Pixel Operator", monospace',
} as const

const BAR_WIDTH = 480
const BAR_HEIGHT = 32
const BAR_INNER_PAD = 4

/**
 * 创建 BootScene 实例。仅在客户端、且 Phaser 全局已加载之后调用。
 *
 * `'erciyuan:bootStart'` / `'erciyuan:firstScreenReady'` 游戏级事件由
 * RenderEngine 监听以测算首屏耗时（R7.1 / R15.6 / R16.4）。
 */
export function createBootScene(options: BootSceneOptions): Phaser.Scene {
  const {
    tilesetMainUrl,
    tilemapUrl,
    spriteDefaultUrl,
    nextSceneKey = DEFAULT_NEXT_SCENE,
  } = options

  class BootScene extends Phaser.Scene {
    private barFill!: Phaser.GameObjects.Rectangle
    private percentText!: Phaser.GameObjects.Text

    constructor() {
      super({ key: 'BootScene' })
    }

    init(): void {
      // 在最早可触达的钩子里发射事件，便于 RenderEngine 把 t0 锁死在 Phaser
      // 内部时钟而非 React 挂载时刻。
      this.game.events.emit('erciyuan:bootStart', performance.now())
    }

    preload(): void {
      this.drawLoadingBar()

      // 三件套：image + tilemapTiledJSON + image。
      this.load.image(BOOT_ASSET_KEYS.tilesetMain, tilesetMainUrl)
      this.load.tilemapTiledJSON(BOOT_ASSET_KEYS.tilemap, tilemapUrl)
      this.load.image(BOOT_ASSET_KEYS.spriteDefault, spriteDefaultUrl)

      this.load.on('progress', (value: number) => {
        const inner = BAR_WIDTH - BAR_INNER_PAD * 2
        this.barFill.width = Math.max(0, Math.min(inner, inner * value))
        this.percentText.setText(`${Math.round(value * 100)}%`)
      })

      this.load.on('loaderror', (file: Phaser.Loader.File) => {
        // eslint-disable-next-line no-console
        console.error('[BootScene] asset load failed:', file.key, file.src)
      })

      this.load.once('complete', () => {
        this.game.events.emit('erciyuan:firstScreenReady', performance.now())
        this.scene.start(nextSceneKey)
      })
    }

    private drawLoadingBar(): void {
      const { width, height } = this.scale
      const cx = width / 2
      const cy = height / 2

      // 标题
      this.add
        .text(cx, cy - 48, '加载小镇中…', {
          fontFamily: STYLE.hintFont,
          fontSize: '24px',
          color: STYLE.textColor,
        })
        .setOrigin(0.5, 0.5)
        .setResolution(2)

      // 外框（white outline + dark fill）
      this.add
        .rectangle(cx, cy, BAR_WIDTH, BAR_HEIGHT, STYLE.bgFill, 1)
        .setStrokeStyle(2, STYLE.bgStroke)

      // 填充条：左对齐，origin (0, 0.5)；初始宽度 0
      const innerLeft = cx - BAR_WIDTH / 2 + BAR_INNER_PAD
      this.barFill = this.add
        .rectangle(innerLeft, cy, 0, BAR_HEIGHT - BAR_INNER_PAD * 2, STYLE.fill)
        .setOrigin(0, 0.5)

      // 百分比
      this.percentText = this.add
        .text(cx, cy + 36, '0%', {
          fontFamily: STYLE.hintFont,
          fontSize: '18px',
          color: STYLE.textColor,
        })
        .setOrigin(0.5, 0.5)
        .setResolution(2)
    }
  }

  return new BootScene()
}

export default createBootScene
