/**
 * @erciyuan/mock-town
 *
 * 假小镇剧本（Mock-Town）npm 包。
 *
 * ────────────────────────────────────────────────────────────────────────────
 * **关键设计约束（design.md §Mock-First Demo Pipeline + tasks.md 9.1）：**
 *
 *   1. **零运行时依赖**：本包**不依赖** Phaser、不依赖 React、不依赖 Node `fs`。
 *      仅依赖 `@erciyuan/types` 的类型导出。这样前端、后端测试、E2E 都能复用
 *      同一份夹具，且任何"是否运行在 Node 还是 Browser"的二义性都不存在。
 *
 *   2. **协议同源**：本包发射的事件流（{@link ServerMsg}）与 Sync_Service
 *      WebSocket Hub 输出**逐字段一致**，使得 `feature.mock_mode` 翻转
 *      （true → false）时 Render_Engine 与 Observation_Dashboard 零改动。
 *
 *   3. **Tier 0 兜底**：黑客松现场后端整体宕机时，浏览器只需 `?mock=1`
 *      刷新即可继续 demo。本包的静态导出（characters / videos / 时间轴）
 *      就是兜底数据源。
 *
 * ────────────────────────────────────────────────────────────────────────────
 * **模块布局：**
 *
 *     videos.ts            → ≥ 12 视频 mock           (task 9.2 ✅)
 *     conventions.ts       → ≥ 6 漫展 mock            (task 9.3 ✅)
 *     companions.ts        → ≥ 20 搭子 mock           (task 9.4 ✅)
 *     quizzes.ts           → ≥ 15 题题库              (task 9.5 ✅)
 *     publish_templates.ts → 视频脚本/文案/标签/合拍   (task 9.6 ✅)
 *     doujins.ts           → ≥ 5 同人 mock            (task 9.7 ✅)
 *     timeline.ts          → 90s 时间轴事件流          (task 9.8 ✅)
 *     runtime.ts           → MockTownRuntime          (task 9.9 ✅)
 *     mascots.ts           → 7 类萌宠元数据           (task 4.5 ✅)
 *     npcs.ts              → 30 NPC 名字 + 口头禅     (task 5.4 ✅)
 *     index.ts             → 统一导出 + 类型透传       (task 9.10 ✅)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * **Schema 演进**：任何字段变更需同步升 minor version（R29.58），并在同一
 * PR 中更新 `@erciyuan/types`、front-end consumer、Sync_Service。
 */
export type { Action, AssetCategory, AssetEntry, AssetManifest, CaptionTemplate, Character, ClientMsg, CompanionCard, CompanionType, ConventionCard, Dialogue, DialogueLine, Doujin, DoujinPanel, DoujinPayload, DuetTemplate, FeatureFlags, GoalSpec, HotTrend, ItashaLayout, ItashaTile, LicenseType, MascotProfile, MascotType, MascotWeightVector, MockRuntimeHandle, MockVideoCard, PersonaProfile, PersonaTag, PublishTemplates, QuizOption, QuizQuestion, RelationType, ScriptTemplate, ServerMsg, SpriteManifest, StartRuntimeOptions, ThoughtTrace, TilePos, TimelineEvent, VideoTag, ZoneId, } from '@erciyuan/types';
export type { NpcRecord } from './npcs.js';
export { videos } from './videos.js';
export { conventions } from './conventions.js';
export { companions } from './companions.js';
export { quizzes } from './quizzes.js';
export { publishTemplates } from './publish_templates.js';
export { doujins } from './doujins.js';
export { timeline } from './timeline.js';
export { startRuntime, getStaticTimeline } from './runtime.js';
export { mascotProfiles, getMascotProfile } from './mascots.js';
export { resolveMascotFromVector, NEIGHBOR_TIE_EPSILON, } from './mascot-resolver.js';
export { npcs } from './npcs.js';
import type { MascotProfile, MascotType, MascotWeightVector, MockRuntimeHandle, StartRuntimeOptions } from '@erciyuan/types';
import { companions } from './companions.js';
import { conventions } from './conventions.js';
import { doujins } from './doujins.js';
import { npcs } from './npcs.js';
import { publishTemplates } from './publish_templates.js';
import { quizzes } from './quizzes.js';
import { timeline } from './timeline.js';
import { videos } from './videos.js';
/**
 * 汇总 API 接口 — `MockDataAdapter` 直接依赖的形态。
 *
 * 与 design.md §Mock-First Demo Pipeline 的 `MockTownAPI` 接口在字段上保持
 * 兼容，只是拆分到独立 named export 上以方便 tree-shaking。
 */
export interface MockTownAPI {
    videos: typeof videos;
    conventions: typeof conventions;
    companions: typeof companions;
    quizzes: typeof quizzes;
    publishTemplates: typeof publishTemplates;
    doujins: typeof doujins;
    timeline: typeof timeline;
    /** 7 类萌宠元数据（task 4.5）。 */
    mascotProfiles: Record<MascotType, MascotProfile>;
    /** task 14.4 Mascot_System.getMascotProfile 直接转发的 helper。 */
    getMascotProfile: (mascot_type: MascotType) => MascotProfile;
    /** task 14.4 R19.5 主标签向量近邻冲突 → fallback slime_newbie。 */
    resolveMascotFromVector: (weights: MascotWeightVector) => MascotType;
    /** 30 个 NPC 元数据（task 5.4）。 */
    npcs: typeof npcs;
    startRuntime: (opts: StartRuntimeOptions) => MockRuntimeHandle;
}
/**
 * 一站式聚合导出，便于消费者写：
 *
 *     import { mockTown } from '@erciyuan/mock-town'
 *     mockTown.videos.forEach(...)
 *     const profile = mockTown.getMascotProfile('cat_lore')
 *     const handle = mockTown.startRuntime({ onEvent: console.log })
 */
export declare const mockTown: MockTownAPI;
//# sourceMappingURL=index.d.ts.map