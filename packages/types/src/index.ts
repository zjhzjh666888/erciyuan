/**
 * @erciyuan/types
 *
 * Shared TypeScript type definitions for the anime-agent-town project
 * (codename "次元萌宠小镇" / "anime-agent-town").
 *
 * Consumers:
 *   - `@erciyuan/mock-town` (假小镇剧本 mock data package)
 *   - The Next.js + React + Phaser front-end (later)
 *   - The Sync_Service WebSocket backend (later)
 *
 * Design references:
 *   - design.md §Data Models (SQLite tables + TS shapes)
 *   - design.md §Sync_Service (ServerMsg / ClientMsg)
 *   - design.md §Mock-First Demo Pipeline (MockTownAPI)
 *   - design.md §Asset Pipeline (AssetManifest)
 *   - requirements.md R17–R29 (mascot system, quiz, conventions, companions, etc.)
 *
 * Stability:
 *   - 0.x versions allow breaking changes within a minor bump (R29.58).
 *   - Schema changes MUST coordinate with `@erciyuan/mock-town` and the
 *     front-end / Sync_Service consumers in the same PR (design.md §Asset
 *     Pipeline §7).
 */

// ─── 1. Core enumerations ──────────────────────────────────────────────────

/**
 * 7 萌宠人格枚举（R19.1）。
 * 用户作为玩家的"二次元身份"标签，与 PersonaTag 是 character 表上的两个独立维度。
 */
export type MascotType =
  | 'cat_lore'        // 考据猫 Neko-ko
  | 'dog_social'      // 扩列犬 Wan-kyun
  | 'hamster_hoard'   // 囤囤鼠 Ham-guu
  | 'fox_create'      // 太太狐 Fox-sensei
  | 'slime_newbie'    // 云仔 Slime-mo
  | 'wolf_limited'    // 限定狼 Lone-wolf
  | 'pigeon_buzz'     // 咕咕鸽 Pigeon-nya

/**
 * 6 类二次元角色性格标签（NPC 戏路）。
 * 与 MascotType 同行 character 表上独立存储。
 */
export type PersonaTag =
  | 'tsundere'    // 傲娇
  | 'yandere'     // 病娇
  | 'tennen'      // 天然呆
  | 'chuuni'      // 中二病
  | 'sanmu'       // 三无
  | 'hara_guro'   // 腹黑

/**
 * 7 大主题分区（R25.1）。
 * 每个分区与至少一类 MascotType 形成主场对应关系。
 */
export type ZoneId =
  | 'Convention_Plaza'      // 漫展广场      ↔ dog_social
  | 'Cos_Studio'            // Cos 摄影区   ↔ fox_create + dog_social
  | 'Goods_Bazaar'          // 谷子交换区    ↔ hamster_hoard
  | 'Doujin_Atelier'        // 创作阁        ↔ fox_create
  | 'Newbie_Lobby'          // 新人接引区    ↔ slime_newbie
  | 'Limited_Info_House'    // 限定情报屋    ↔ wolf_limited
  | 'Buzz_Square'           // 情报广场      ↔ pigeon_buzz / cat_lore

/** 11 类搭子类型（R24.2）。 */
export type CompanionType =
  | 'convention'    // 漫展搭子
  | 'cos'           // Cos 搭子
  | 'photo'         // 拍照搭子
  | 'booth'         // 逛摊搭子
  | 'goods'         // 买谷搭子
  | 'same_ip'       // 同作品搭子
  | 'same_city'     // 同城二次元搭子
  | 'duet'          // 视频合拍搭子
  | 'newbie'        // 新手求带搭子
  | 'limited'       // 抢限定搭子
  | 'doujin'        // 二创搭子

/** 9 类二次元视频标签（R29.12）。 */
export type VideoTag =
  | 'cosplay'
  | 'convention_vlog'
  | 'anime_review'
  | 'character_analysis'
  | 'goods_unboxing'
  | 'figure'
  | 'anime_outfit'
  | 'local_convention'
  | 'doujin_edit'

/** 关系类型（design.md §relation 表）。 */
export type RelationType = 'friend' | 'rival' | 'fan' | 'neutral'

// ─── 2. Asset manifest model (design.md §Asset Pipeline) ────────────────────

export type AssetCategory =
  | 'tilemap'
  | 'mascot'
  | 'npc'
  | 'ui'
  | 'audio'
  | 'font'
  | 'fallback'
  | 'mock'

export type LicenseType = 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'SELF'

export interface AssetEntry {
  /** 相对 assets/ 的路径，例如 mascots/cat_lore/idle.png */
  path: string
  category: AssetCategory
  /** sha256:<hex>；strict 模式校验 */
  hash: string
  /** 实际文件大小（KB） */
  size_kb: number
  license: LicenseType
  /** 第三方资产必填非空；SELF 资产可填 SD prompt 或留空 */
  source_url: string
  author: string
  required_for_demo: boolean

  // 类别专属字段
  mascot_type?: MascotType
  frame?: string
  persona_tag?: PersonaTag
  /** NPC 在某 persona 下的 1..5 序号 */
  npc_index?: number
  landmark_for_zone?: ZoneId
}

export interface AssetManifest {
  /** schema 版本，当前 1 */
  version: number
  /** ISO 8601 生成时间 */
  generated_at: string
  total_count: number
  total_size_kb: number
  assets: AssetEntry[]
}

// ─── 3. World primitives ────────────────────────────────────────────────────

/** Tile 坐标（整数，左上为原点）。 */
export interface TilePos {
  x: number
  y: number
}

/** 角色 sprite manifest（spawnSprite 用）。 */
export interface SpriteManifest {
  /** 32×32 idle 立绘 URL */
  idle: string
  /** 4 方向 walk 帧 URL 数组（每方向 4 帧） */
  walk: {
    up: string[]
    down: string[]
    left: string[]
    right: string[]
  }
  /** 可选动作帧（brewing / talking / posting / sleeping 等） */
  actions?: Record<string, string[]>
  /** 可选 64×64 大头照（用于结果页 + 搭子卡片） */
  portrait_64?: string
}

// ─── 4. Agent_Core types (design.md §7) ─────────────────────────────────────

/**
 * Action 判别联合：Agent_Core 决策循环输出的 next_action 字段。
 * Pathfinding_Engine、MCP_Tool_Gateway、Sync_Service 按 kind 分发。
 */
export type Action =
  | { kind: 'move'; target: TilePos }
  | { kind: 'tool'; name: string; args: Record<string, unknown> }
  | { kind: 'speak'; target_char: string; text: string }
  | { kind: 'idle'; duration_ms: number }

/**
 * 单步 Thought_Trace（design.md §7 + R4.1）。
 * Scripted 模式与 Live LLM 模式输出**结构上不可区分**。
 */
export interface ThoughtTrace {
  trace_id: string
  character_id: string
  /** UNIX epoch milliseconds */
  ts: number
  observation: string
  plan: string
  next_action: Action
  /** 本轮是否说话；与 next_action.kind === 'speak' 不必严格绑定 */
  speech: string | null
  /** 仅在降级时填充，例如 'memory_write_failed' / 'llm_timeout' */
  error?: string
}

// ─── 5. Goal / Character (R3 / R2) ──────────────────────────────────────────

export interface GoalSpec {
  intent: string
  success_criteria: string
  /** 1 = primary，2.. = sub-goal */
  priority: number
}

export interface PersonaProfile {
  /** 自然语言描述 */
  bio: string
  /** ≥ 3 条 core_traits */
  core_traits: string[]
  /** 中文 + 罗马音 catchphrase */
  catchphrase_zh?: string
  catchphrase_romaji?: string
}

/**
 * 小镇里的角色（NPC + 用户分身共用）。
 * mascot_type 表征"用户身份"，persona_tag 表征"NPC 戏路"，二者并存。
 */
export interface Character {
  character_id: string
  /** 用户分身有 owner_user_id；纯 NPC 为 null */
  owner_user_id: string | null
  name: string
  /** 用户萌宠人格（可选——纯 NPC 可不填） */
  mascot_type?: MascotType
  /** NPC 戏路标签 */
  persona_tag: PersonaTag
  persona_profile: PersonaProfile
  sprite_manifest: SpriteManifest
  /** 出生 Tile 坐标（用于 Mock 时间轴回放） */
  spawn_pos: TilePos
  /** 当 Character_Generator 走 fallback 池时为 true */
  is_fallback: boolean
  /** UNIX epoch milliseconds */
  created_at: number
}

// ─── 6. Mascot system (R19.2) ───────────────────────────────────────────────

/**
 * 7 类萌宠人格档案（R19.2 全 9 个字段）。
 * 由 `Mascot_System.getMascotProfile(mascot_type)` 返回。
 */
export interface MascotProfile {
  mascot_type: MascotType
  display_name_zh: string
  display_name_romaji: string
  /** ≥ 3 条 core_traits（R29.6） */
  core_traits: string[]
  /** 主场分区 */
  recommended_zone: ZoneId
  /** 适合的搭子类型 */
  companion_types: CompanionType[]
  /** 中文口头禅 + 罗马音 */
  catchphrase: {
    zh: string
    romaji: string
  }
  core_functions: string[]
  /** persona 主色十六进制，例如 "#A86FFF" */
  persona_color: string
}

// ─── 7. Dialogue & Memory ───────────────────────────────────────────────────

/** 单轮对话（R8 多智能体对话）。 */
export interface DialogueLine {
  /** 说话人 character_id */
  speaker: string
  /** 单轮文本 ≤ 80 字符（R8.2） */
  text: string
  ts: number
}

/** 一段完整对话片段（≤ 6 轮，R8.2）。 */
export interface Dialogue {
  dialogue_id: string
  /** 参与者 character_id */
  participants: [string, string]
  /** 1..6 轮 */
  lines: DialogueLine[]
  started_at: number
  ended_at: number
}

// ─── 8. Doujin (R11) ────────────────────────────────────────────────────────

/** 单格 4 格漫画 panel。 */
export interface DoujinPanel {
  /** 拼接像素图 URL（或 base64 data URI） */
  image_url: string
  /** 单格对白 ≤ 30 字符（R11.2） */
  caption: string
}

/** 同人作品 payload，按 kind 区分。 */
export type DoujinPayload =
  | { kind: 'comic_4koma'; panels: DoujinPanel[] }    // length === 4
  | { kind: 'novel_short'; text: string }             // text.length ≤ 400

/**
 * 同人作品（R11 + design.md §12.3）。
 * Round-trip serialize/deserialize 是 Property 1 的对象 — 见 design.md §Correctness Properties P1.
 */
export interface Doujin {
  doujin_id: string
  /** 参与角色 character_id 列表，允许重复（联动同人） */
  characters: string[]
  /** 与 payload.kind 必须严格一致 */
  kind: DoujinPayload['kind']
  payload: DoujinPayload
  watermark: string
  /** UNIX epoch milliseconds */
  created_at: number
}

// ─── 9. Ranking (R9) ────────────────────────────────────────────────────────

/** 单条小镇热搜 / 排行榜条目（R9.3）。 */
export interface HotTrend {
  /** 角色 ID */
  character_id: string
  /** 显示名 */
  display_name: string
  popularity_score: number
  /** 排名变化 */
  trend: 'up' | 'down' | 'flat'
  /** 排名（从 1 起） */
  rank: number
}

// ─── 10. Sync protocol (design.md §3 Sync_Service) ──────────────────────────

/**
 * Server → Client 消息（WebSocket JSON）。
 * Mock-Town Runtime 输出与该 schema **逐字段一致**。
 */
export type ServerMsg =
  | {
      type: 'pos'
      char_id: string
      x: number
      y: number
      /** 当前播放帧名，例如 'walk_down_02' / 'idle' */
      frame: string
      ts: number
    }
  | {
      type: 'speech'
      char_id: string
      /** ≤ 80 字符（R8.2） */
      text: string
      ts: number
    }
  | {
      type: 'action_label'
      char_id: string
      /** 'is brewing coffee' 之类；null 表示清除 */
      label: string | null
      ts: number
    }
  | {
      type: 'thought'
      char_id: string
      trace: ThoughtTrace
    }
  | {
      type: 'system'
      kind: 'degraded' | 'recovered' | 'memory_unstable'
      payload: {
        reason?: string
        [key: string]: unknown
      }
    }
  | {
      type: 'heartbeat'
      server_ts: number
    }

/** Client → Server 消息。 */
export type ClientMsg =
  | {
      type: 'subscribe'
      channels: Array<'town' | 'dashboard' | `char:${string}`>
    }
  | { type: 'snapshot_request' }
  | { type: 'pong' }

// ─── 11. Page_VideoFeed mock (R28.1 + R29.11–12) ────────────────────────────

/**
 * A 链路 Page_VideoFeed 视频流 mock 卡片（task 9.2 用）。
 * 每条 mock 卡片满足 R29.11 字段契约。
 */
export interface MockVideoCard {
  video_id: string
  /** 缩略图 URL，≥ 540×960（R29.11） */
  thumbnail: string
  author_name: string
  /** 头像 URL */
  avatar: string
  title: string
  /** 视频标签数组（≥ 1 个二次元类目，R29.11） */
  video_tags: VideoTag[]
  /** 触发弹框时携带的上下文意图（R17.5） */
  contextual_intent: {
    /** 视频涉及的作品 IP，例如 "原神" */
    ip?: string
    /** Cos 角色名 */
    cos_character?: string
    /** 自由文本备注 */
    note?: string
  }
  /** 时长（秒） */
  duration: number
  play_count: number
}

// ─── 12. Convention mock (R22.2 + R29.15–17) ────────────────────────────────

/**
 * 漫展卡片（R22.2 全 10 字段）。
 * `related_video_ids` 必须指向 MockVideoCard.video_id 集合（R29.17）。
 */
export interface ConventionCard {
  convention_id: string
  name: string
  /** 例如 "2026-08-15 ~ 2026-08-17" */
  time_range: string
  city: string
  venue: string
  /** 适配的 mascot_type 列表 */
  suitable_personas: MascotType[]
  /** 当届热门 Cos 角色 */
  hot_characters: string[]
  /** 推荐穿搭描述 */
  recommended_outfit: string
  recommended_companion_types: CompanionType[]
  /** "进入小镇该漫展专属广场"CTA 文案 */
  enter_town_cta: string
  /** 关联的 Cos 视频 ID 数（R22.2 字段） */
  related_cosvids_count: number
  /** 关联到 MockVideoCard 的 video_id（≥ 3 条，R29.17） */
  related_video_ids: string[]
}

// ─── 13. Companion mock (R24.3 + R29.18–20) ─────────────────────────────────

/** 搭子卡片（R24.3）。 */
export interface CompanionCard {
  companion_id: string
  /** 对方萌宠形象（sprite URL 或 mascot_type 默认立绘） */
  mascot_avatar: string
  mascot_type: MascotType
  display_name: string
  /** 至少 1 个共同兴趣点（R24.3） */
  common_interests: string[]
  /** 匹配度百分比 0..100 */
  match_score: number
  /** 想去的漫展 ID（可选） */
  target_convention_id?: string
  /** 想找的搭子类型 */
  wanted_companion_types: CompanionType[]
  /** 推荐破冰方式 */
  ice_breaker: string
  /** R24.5：候选池 < 5 真实用户时由 NPC 填充 */
  is_npc: boolean
  /** 关联的 NPC sprite 路径（R29.20，is_npc=true 时必填） */
  npc_sprite_path?: string
}

// ─── 14. Quiz (R18 + R29.13–14) ─────────────────────────────────────────────

/**
 * 单题选项 → 7 类 mascot_type 向量权重（R18.3）。
 * 7 个权重值 ∈ [0, 1]（R29.13）。
 */
export type MascotWeightVector = Record<MascotType, number>

/**
 * 单个测一测选项（A..G 共 7 个，R18.3）。
 */
export interface QuizOption {
  /** 'A' | 'B' | ... | 'G' */
  key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  text: string
  /** 选中该选项时为 7 类 mascot_type 各加多少权重 */
  weights: MascotWeightVector
}

/** 测一测题目（R29.13–14）。 */
export interface QuizQuestion {
  question_id: string
  prompt: string
  /** 恰好 7 个选项（R18.3） */
  options: [QuizOption, QuizOption, QuizOption, QuizOption, QuizOption, QuizOption, QuizOption]
  /** R29.14：标记为路演必跑（R18 给出的 3 道示例题） */
  must_run: boolean
  /** 该题是否动态生成（基于 contextual_intent，R18.2） */
  is_dynamic: boolean
}

// ─── 15. Publish templates (R27 + R29.21–24) ────────────────────────────────

/** 视频脚本模板（开/中/结三段式，R29.21）。 */
export interface ScriptTemplate {
  template_id: string
  /** 模板名 */
  name: string
  intro: string
  middle: string
  outro: string
  /** 适配的搭子类型 */
  suitable_companion_types: CompanionType[]
}

/** 发布文案模板（R29.22）。 */
export interface CaptionTemplate {
  template_id: string
  name: string
  /** 含 `{mascot_name}` `{convention_name}` 等占位符 */
  body: string
}

/** 合拍模板（R29.24）。 */
export interface DuetTemplate {
  template_id: string
  name: string
  /** 双人合拍机位 / 节奏说明 */
  description: string
}

/**
 * 内容发布模板集合（task 9.6 用）。
 * 任务 9.6 只导出该集合（不分散在多个模块）。
 */
export interface PublishTemplates {
  /** 视频脚本 ≥ 5 套 */
  scripts: ScriptTemplate[]
  /** 发布文案 ≥ 5 套 */
  captions: CaptionTemplate[]
  /** 话题标签 ≥ 10 个，必含 #次元小镇 #二次元搭子 #漫展搭子 #Cos搭子 */
  hashtags: string[]
  /** 合拍模板 ≥ 3 套 */
  duets: DuetTemplate[]
}

// ─── 16. Mock-Town runtime (design.md §Mock-First) ──────────────────────────

/**
 * 时间轴事件（task 9.8 用）。
 * 由 `MockTownRuntime` 按 `at_seconds` 排序后逐条发射，发射时转化为 `ServerMsg`。
 */
export interface TimelineEvent {
  /** 自时间轴起点偏移（秒） */
  at_seconds: number
  /** 待广播的消息（Sync_Service 一致字段集） */
  msg: ServerMsg
}

/**
 * MockTownRuntime 句柄（design.md §Mock-First Demo Pipeline）。
 * `startRuntime()` 返回该句柄给调用方控制回放。
 */
export interface MockRuntimeHandle {
  /** 停止时间轴回放并清理 setTimeout/setInterval */
  stop(): void
  /** 跳到指定时间戳（秒），demo 现场手动跳到精彩片段 */
  jumpTo(seconds: number): void
  /**
   * task 12.6：强制切到"静态轮播"兜底链路 —— 按 1s 节奏循环播
   * `timeline.ts` 全量事件，确保画面继续动。
   *
   * 调用场景（design.md §Mock-First Cookbook）：
   *   - RenderEngine 检测到自身异常（如 dispatchServerMsg 抛错）时主动调用，
   *     防止 Phaser 被一条坏消息带崩
   *   - 单元测试 / E2E 演练降级路径
   *
   * 命名带下划线表示"内部 / 调试通道"，调用方不应在常规渲染循环里使用。
   */
  _forceFallback(reason?: string): void
}

/** `startRuntime()` 入参。 */
export interface StartRuntimeOptions {
  /** 每发射一条 ServerMsg 调用一次 */
  onEvent: (msg: ServerMsg) => void
  /** 回放结束后是否循环（默认 true） */
  loop?: boolean
  /**
   * task 12.6：runtime 内部捕获到致命错误（schedule 抛错、loop 入口崩溃等）
   * 时调用，把异常透到上层（例如 RenderEngine.setDegraded）。回调本身的
   * 异常会被吞掉，不会再次冒泡。
   */
  onError?: (err: unknown) => void
}

// ─── 17. Feature flags (design.md §4) ───────────────────────────────────────

export interface FeatureFlags {
  live_llm: boolean
  ranking: boolean
  goods: boolean
  doujin: boolean
  intervention: boolean
  cloud_sync: boolean
  /** UI-First 兜底开关 — true 时整套数据走 @erciyuan/mock-town */
  mock_mode: boolean
}

// ─── 18. Goods / Itasha (R10) ───────────────────────────────────────────────

/** 痛房单格（design.md §Data Models）。 */
export interface ItashaTile {
  /** 该格放置的谷子 SKU；null 表示空格 */
  sku_id: string | null
  rotation: 0 | 90 | 180 | 270
}

/** 8×8 痛房布局。 */
export type ItashaLayout = ItashaTile[][]
