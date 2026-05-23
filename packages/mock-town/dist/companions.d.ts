/**
 * `companions.ts` — 搭子 NPC mock 卡片（task 9.4）。
 *
 * **契约（requirements.md R29.18–20 + R24.3）：**
 *   - ≥ 20 个搭子 NPC
 *   - 7 类 mascot_type 各 ≥ 2 个
 *   - 每张卡片含 R24.3 全部字段：mascot_avatar / mascot_type / display_name /
 *     common_interests / match_score / target_convention_id /
 *     wanted_companion_types / ice_breaker
 *   - 每张 mock 与类别 C 的 NPC sprite **一一关联**（npc_sprite_path）
 *
 * **NPC sprite 路径规范**（design.md §Asset Pipeline §1）：
 *     `assets/npc/{persona_tag}/{slot:02d}/idle.png`
 *
 * 这里 persona_tag 与卡片视觉风格挂钩（不直接显示给用户，只是 sprite 索引）：
 *   - cat_lore     → tennen / sanmu     （内向 / 文静）
 *   - dog_social   → tsundere / chuuni  （外向 / 闹腾）
 *   - hamster_hoard→ tennen / hara_guro （囤囤 / 心机）
 *   - fox_create   → chuuni / sanmu     （艺术 / 沉默）
 *   - slime_newbie → tennen              （懵懂）
 *   - wolf_limited → hara_guro / yandere（执念）
 *   - pigeon_buzz  → tsundere / chuuni  （八卦 / 中二）
 *
 * 卡片中的 `target_convention_id` 引用 {@link conventions} 集合的 ID。
 */
import type { CompanionCard } from '@erciyuan/types';
/**
 * 搭子 NPC mock 集合（22 个，超过 R29.18 下限）。
 *
 * 7 类 mascot_type 分布：
 *   - cat_lore       × 3
 *   - dog_social     × 4
 *   - hamster_hoard  × 3
 *   - fox_create     × 3
 *   - slime_newbie   × 3
 *   - wolf_limited   × 3
 *   - pigeon_buzz    × 3
 */
export declare const companions: CompanionCard[];
//# sourceMappingURL=companions.d.ts.map