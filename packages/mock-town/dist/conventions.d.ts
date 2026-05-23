/**
 * `conventions.ts` — 漫展卡片 mock（task 9.3）。
 *
 * **契约（requirements.md R29.15–17 + R22.2）：**
 *   - ≥ 6 个漫展，覆盖 ≥ 3 个不同城市
 *   - 每张卡片含 R22.2 列出的 10 个字段（name / time_range / city / venue /
 *     suitable_personas / hot_characters / recommended_outfit /
 *     recommended_companion_types / enter_town_cta / related_cosvids_count）
 *   - 每张卡片关联 ≥ 3 个视频 ID，且 ID 必须存在于 {@link videos}
 *
 * **城市覆盖**：上海 / 北京 / 广州 / 成都 / 杭州（5 城，超过 R29.16 下限）。
 * 场馆名引用真实公开场馆（无 IP 风险）。
 */
import type { ConventionCard } from '@erciyuan/types';
/**
 * 漫展卡片集合。
 *
 * 6 个卡片 × 5 城市 × 平均 ≥ 3 关联视频 ID（指向 `videos.ts`）。
 * `related_cosvids_count` 与 `related_video_ids.length` 保持一致以避免漂移。
 */
export declare const conventions: ConventionCard[];
//# sourceMappingURL=conventions.d.ts.map