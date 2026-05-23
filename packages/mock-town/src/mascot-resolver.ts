/**
 * `mascot-resolver.ts` — Mascot_System 的向量推断子模块（task 14.4）。
 *
 * **契约（requirements.md R19.1 / R19.5 + tasks.md 14.4）：**
 *   - 输入：一份 7 维权重向量 {@link MascotWeightVector}，对应 R19.1 的 7 类
 *     mascot_type 各一份 [0, 1] 区间内的权重值（来源：Quiz_Service 把用户的
 *     题答按选项 → mascot_type 映射累加得到的向量，见 R18.3）。
 *   - 输出：单个 `MascotType`，即被认定为该用户主标签的萌宠人格。
 *
 * **R19.5 兜底规则（"主标签向量近邻冲突 → fallback slime_newbie"）：**
 *   - 若最高权重与第二高权重的差值 `< NEIGHBOR_TIE_EPSILON`（0.05），则
 *     视为"向量近邻冲突"，无法稳定推断主标签 → 直接返回 `slime_newbie`。
 *   - slime_newbie 在 `mascots.ts` 的 core_functions 中显式登记为
 *     "兜底人格（向量冲突默认）"，与本规则保持口径一致。
 *
 * **下游消费者：**
 *   - task 14.3 Page_Quiz 完成答题后调用本函数得到 `mascot_type`，再交给
 *     task 14.4 Mascot_System 注入到 character.mascot_type 字段。
 *   - task 14.5 Page_MascotResult 直接使用本函数返回的 mascot_type 渲染。
 *
 * **设计取舍：**
 *   - 不抛异常，永远返回一个合法的 MascotType（默认 slime_newbie），让上游
 *     UI 不需要 try/catch；非法/缺值输入也走兜底。
 *   - 比较使用稳定排序（Object.entries → sort by [-weight, mascot_type]），
 *     在权重完全相等时按 mascot_type 字典序选择，方便属性测试可复现。
 */
import type { MascotType, MascotWeightVector } from '@erciyuan/types'

/**
 * R19.5 「向量近邻冲突」阈值。
 *
 * 当 top1 - top2 < 此值时，主标签视为不稳定 → 走 slime_newbie 兜底。
 * 阈值取 0.05 与 R29.13 中"权重值 ∈ [0, 1]、单题 7×7 = 49 个权重"的尺度相
 * 匹配：单题最大权重差通常 ≥ 0.1，多题求和后 0.05 是"几乎并列"的合理界线。
 */
export const NEIGHBOR_TIE_EPSILON = 0.05

/** 兜底 mascot_type，与 mascots.ts core_functions 中"兜底人格"声明一致。 */
const FALLBACK_MASCOT: MascotType = 'slime_newbie'

/** 7 类 mascot_type 的全集（与 `MascotType` 联合类型同构）。 */
const ALL_MASCOT_TYPES: readonly MascotType[] = [
  'cat_lore',
  'dog_social',
  'hamster_hoard',
  'fox_create',
  'slime_newbie',
  'wolf_limited',
  'pigeon_buzz',
] as const

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
export function resolveMascotFromVector(
  weights: MascotWeightVector,
): MascotType {
  // 用稳定的 (weight DESC, key ASC) 排序，避免 JS 引擎排序差异引入不确定性。
  const sorted = ALL_MASCOT_TYPES.map((m) => ({
    mascot_type: m,
    weight: Number.isFinite(weights[m]) ? weights[m] : 0,
  })).sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight
    return a.mascot_type < b.mascot_type ? -1 : 1
  })

  const [top1, top2] = sorted
  // 防御式：sorted 永远长度 === 7，但保留对类型缩窄的明示
  if (!top1 || !top2) return FALLBACK_MASCOT

  // R19.5：top1 与 top2 的差值低于阈值视为向量近邻冲突 → fallback
  if (top1.weight - top2.weight < NEIGHBOR_TIE_EPSILON) {
    return FALLBACK_MASCOT
  }

  return top1.mascot_type
}
