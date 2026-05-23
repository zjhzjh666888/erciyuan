/**
 * R19.5 「向量近邻冲突」阈值。
 *
 * 当 top1 - top2 < 此值时，主标签视为不稳定 → 走 slime_newbie 兜底。
 * 阈值取 0.05 与 R29.13 中"权重值 ∈ [0, 1]、单题 7×7 = 49 个权重"的尺度相
 * 匹配：单题最大权重差通常 ≥ 0.1，多题求和后 0.05 是"几乎并列"的合理界线。
 */
export const NEIGHBOR_TIE_EPSILON = 0.05;
/** 兜底 mascot_type，与 mascots.ts core_functions 中"兜底人格"声明一致。 */
const FALLBACK_MASCOT = 'slime_newbie';
/** 7 类 mascot_type 的全集（与 `MascotType` 联合类型同构）。 */
const ALL_MASCOT_TYPES = [
    'cat_lore',
    'dog_social',
    'hamster_hoard',
    'fox_create',
    'slime_newbie',
    'wolf_limited',
    'pigeon_buzz',
];
/**
 * 将 7 类萌宠权重向量解析为单个主标签 mascot_type。
 *
 * 算法：
 *   1. 把 weights 按 (weight DESC, mascot_type ASC) 排序得到稳定序列。
 *   2. 若 top1 - top2 < {@link NEIGHBOR_TIE_EPSILON} → 返回
 *      {@link FALLBACK_MASCOT}（slime_newbie，R19.5）。
 *   3. 否则返回 top1 对应的 mascot_type。
 *
 * @param weights 7 类 mascot_type 的权重向量；缺失键按 0 处理。
 * @returns 推断出的主标签 mascot_type（永远合法，绝不抛异常）。
 */
export function resolveMascotFromVector(weights) {
    // 用稳定的 (weight DESC, key ASC) 排序，避免 JS 引擎排序差异引入不确定性。
    const sorted = ALL_MASCOT_TYPES.map((m) => ({
        mascot_type: m,
        weight: Number.isFinite(weights[m]) ? weights[m] : 0,
    })).sort((a, b) => {
        if (b.weight !== a.weight)
            return b.weight - a.weight;
        return a.mascot_type < b.mascot_type ? -1 : 1;
    });
    const [top1, top2] = sorted;
    // 防御式：sorted 永远长度 === 7，但保留对类型缩窄的明示
    if (!top1 || !top2)
        return FALLBACK_MASCOT;
    // R19.5：top1 与 top2 的差值低于阈值视为向量近邻冲突 → fallback
    if (top1.weight - top2.weight < NEIGHBOR_TIE_EPSILON) {
        return FALLBACK_MASCOT;
    }
    return top1.mascot_type;
}
//# sourceMappingURL=mascot-resolver.js.map