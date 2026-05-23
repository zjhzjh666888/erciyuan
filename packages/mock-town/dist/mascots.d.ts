/**
 * `mascots.ts` — 7 类萌宠人格元数据（task 4.5）。
 *
 * **契约（requirements.md R19.1–R19.5 + R29.6 + design.md §Mascot_System）：**
 *   - 恰好 7 类 mascot_type 全覆盖
 *   - 每类 9 个字段（{@link MascotProfile}）：mascot_type / display_name_zh /
 *     display_name_romaji / core_traits ≥ 3 条 / recommended_zone /
 *     companion_types / catchphrase.zh + .romaji / core_functions ≥ 3 条 /
 *     persona_color（hex）
 *   - persona_color 与 `scripts/_generate-real-assets.mjs` 中
 *     `MASCOT_COLORS[mascot_type].body` 严格一致（避免素材色调与卡片色调撕裂）
 *   - recommended_zone 严格遵循 R25.1 主场对应关系：
 *       cat_lore       → Buzz_Square      （"资料馆"是情报广场子区域）
 *       dog_social     → Convention_Plaza
 *       hamster_hoard  → Goods_Bazaar
 *       fox_create     → Doujin_Atelier
 *       slime_newbie   → Newbie_Lobby
 *       wolf_limited   → Limited_Info_House
 *       pigeon_buzz    → Buzz_Square
 *
 * **下游消费者**：
 *   - task 14.4 Mascot_System.getMascotProfile() — 直接返回本表条目
 *   - task 18.1 小镇分区入口投放 — 读取 recommended_zone
 *   - task 14.5 Page_MascotResult — 渲染 catchphrase + core_traits + persona_color
 */
import type { MascotProfile, MascotType } from '@erciyuan/types';
/**
 * 7 类萌宠 → MascotProfile 的完整映射。
 *
 * 颜色对应 `_generate-real-assets.mjs` `MASCOT_COLORS[*].body` 的 RGB 值：
 *   - cat_lore       = rgb(167,139,250) = #A78BFA（紫，原作党气场）
 *   - dog_social     = rgb(255,168,100) = #FFA864（橙，社交热情）
 *   - hamster_hoard  = rgb(216,197,168) = #D8C5A8（米色，囤积温感）
 *   - fox_create     = rgb(240,220,200) = #F0DCC8（奶白，创作冷静）
 *   - slime_newbie   = rgb(168,216,255) = #A8D8FF（浅蓝，懵懂果冻）
 *   - wolf_limited   = rgb( 50, 80,130) = #325082（深蓝，狙击专注）
 *   - pigeon_buzz    = rgb(255,200,220) = #FFC8DC（粉，情报雀跃）
 */
export declare const mascotProfiles: Record<MascotType, MascotProfile>;
/**
 * 查询单个 mascot 的完整 9 字段档案（task 14.4 Mascot_System 直接转发）。
 *
 * @param mascot_type 7 类 mascot_type 之一
 * @returns 该 mascot 的完整档案
 */
export declare function getMascotProfile(mascot_type: MascotType): MascotProfile;
//# sourceMappingURL=mascots.d.ts.map