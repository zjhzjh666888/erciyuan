/**
 * `timeline.ts` — 90 秒预录"小镇活着"事件流（task 9.8）。
 *
 * **契约（design.md §Mock-First Demo Pipeline + tasks.md 9.8）：**
 *   - 时长约 90 秒，事件按 `at_seconds` **严格非降序**排列
 *   - 每条事件的 `msg` 字段是合法 {@link ServerMsg}，与 Sync_Service 输出
 *     **逐字段一致**（type/char_id/x/y/frame/text/label/ts/trace/...）
 *   - 至少覆盖 4 种消息变体：`pos` / `speech` / `action_label` / `thought`
 *
 * **叙事结构（task 9.8 指定）：**
 *   - 0–5s   ：3 只萌宠在各自分区入口 spawn（pos + 首条 speech）
 *   - 5–20s  ：每只萌宠走向地标 + 一句 speech 气泡
 *   - 20–60s ：dog_social × fox_create 在 Cos_Studio 4 行 meet-up 对话
 *   - 60–85s ：hamster_hoard 在 Goods_Bazaar 数吧唧（action_label "is counting bookmarks"）
 *   - 85–90s ：dog_social 一条完整 thought_trace 推送到仪表盘
 *
 * **角色 ID** 与未来后端 Town_System 的预制角色 ID 保持一致；前端 Render_Engine
 * 的 spawnSprite 会按这些 ID 加载 `assets/mascots/{mascot_type}/...` 精灵集。
 *
 * **Tile 坐标系**（design.md §1.2 + §3 7 大主题分区，左上为原点）：
 *   - Convention_Plaza  约 (24,24)–(40,40)，dog_social 主场
 *   - Cos_Studio        约 (8, 8)–(24,24)，fox_create + dog_social 共享
 *   - Goods_Bazaar      约 (40, 8)–(56,24)，hamster_hoard 主场
 *   - Doujin_Atelier    约 (8, 40)–(24,56)，fox_create 主场
 *   坐标值仅用于 demo 视觉对应，不与未来真实 tilemap 强绑定，未来在 Slice 0
 *   的 .tmj 文件落地后可整体平移。
 */
import type { TimelineEvent } from '@erciyuan/types';
/**
 * 90 秒预录事件流。事件按 `at_seconds` 严格非降序排列；MockTownRuntime 直接
 * 迭代这个数组并通过 `setTimeout` 调度即可让画面"活起来"。
 */
export declare const timeline: TimelineEvent[];
//# sourceMappingURL=timeline.d.ts.map