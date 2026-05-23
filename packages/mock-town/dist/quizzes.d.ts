/**
 * `quizzes.ts` — 测一测题库 mock（task 9.5）。
 *
 * **契约（requirements.md R29.13–14 + R18.3）：**
 *   - ≥ 15 道题
 *   - 每题恰好 7 个选项（A..G），每个选项映射到 7 类 mascot_type 的向量权重
 *   - 单个权重 ∈ [0, 1]，单题 7 × 7 = 49 个权重值
 *   - 至少 3 道 must_run（R18 给出的 3 道示例题：
 *     `角色第一反应` / `漫展想做什么` / `想找哪种搭子`）
 *
 * **权重设计哲学**：
 *   - cat_lore       重「考据 / 时间线 / 细节」型答案
 *   - dog_social     重「扩列 / 同好 / 拍照」型答案
 *   - hamster_hoard  重「谷子 / 限量 / 收集」型答案（与 wolf_limited 区别在「囤」 vs「狙」）
 *   - fox_create     重「同人 / 二创 / 画」型答案
 *   - slime_newbie   重「我也不知道 / 求带 / 第一次」型答案
 *   - wolf_limited   重「抢限定 / 排队 / 黄牛」型答案
 *   - pigeon_buzz    重「八卦 / 热搜 / 现场播报」型答案
 *
 * 整体上：一个选项往往对 1–3 类 mascot_type 形成强信号（≥ 0.6），
 * 其余给少量噪声（0.0–0.3）以避免完全二元化。
 */
import type { QuizQuestion } from '@erciyuan/types';
/**
 * 题库集合（共 15 题；前 3 道为 R29.14 / R18 指定的「路演必跑」示例题）。
 */
export declare const quizzes: QuizQuestion[];
//# sourceMappingURL=quizzes.d.ts.map