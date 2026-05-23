/**
 * `npcs.ts` — 6 类 persona_tag × 5 = 30 个 NPC 元数据（task 5.4）。
 *
 * **契约（requirements.md R29.8 + R29.10）：**
 *   - 6 类 persona_tag（tsundere / yandere / tennen / chuuni / sanmu / hara_guro）
 *     各 5 个 NPC，合计恰好 30 个
 *   - 每个 NPC 提供 1 个名字（中文 + 罗马音风）+ 1 条口头禅文案
 *
 * **Sprite 路径规范**（design.md §Asset Pipeline + R29.48）：
 *
 *     assets/npc/{persona_tag}/{npc_index:02d}/idle.png
 *
 *   `npc_index` 为 1..5 的两位 0 填充字符串（"01" .. "05"）。
 *   与 {@link companions} 的 `npc_sprite_path` 字段命名规范保持一致。
 *
 * **下游消费者**：
 *   - task 9.4 companions.ts — 通过 npc_sprite_path 一一关联（R29.20）
 *   - task 16+ Sync_Service NPC 投放 — 读取 sprite_path 喂给 Render_Engine
 *   - task 13.x Bento Grid Dashboard — 在角色细节卡显示 catchphrase
 */
import type { PersonaTag } from '@erciyuan/types';
/**
 * NPC mock 条目。`npc_index` 与 sprite 目录 1:1 对应。
 */
export interface NpcRecord {
    /** 全局唯一 ID（建议格式 `npc_{persona_tag}_{NN}`） */
    npc_id: string;
    /** 6 类二次元角色性格标签 */
    persona_tag: PersonaTag;
    /** 该 persona 下的 1..5 序号 */
    npc_index: 1 | 2 | 3 | 4 | 5;
    /** 中文名 + 罗马音/日文小尾巴，例如 "小冰 こおり" */
    name: string;
    /** 口头禅，≤ 60 字符 */
    catchphrase: string;
    /** sprite 路径：assets/npc/{persona_tag}/{NN}/idle.png */
    sprite_path: string;
}
/**
 * 30 个 NPC 数据（6 类 × 5 个）。
 *
 * 命名风格按 persona_tag 区分气质：
 *   - tsundere（傲娇）   ：御坂 / 凉宫 / 朝比奈 系
 *   - yandere（病娇）    ：由乃 / 雪穗 / 暗夜系
 *   - tennen（天然呆）   ：天子 / 阿国 / 软糯系
 *   - chuuni（中二病）   ：六花 / 闇夜 / 漆黑之翼系
 *   - sanmu（三无）      ：绫波 / 长门 / 冷静淡漠系
 *   - hara_guro（腹黑）  ：神乐 / 麻奇玛 / 表柔实危
 */
export declare const npcs: NpcRecord[];
//# sourceMappingURL=npcs.d.ts.map