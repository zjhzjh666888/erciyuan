/**
 * `doujins.ts` — 同人 mock 作品（task 9.7）。
 *
 * **契约（requirements.md R29.37–38 + R11）：**
 *   - ≥ 5 篇同人作品
 *   - 4 篇 4-koma（恰好 4 个 panel，每格 caption ≤ 30 字符）
 *   - 1 篇短小说（text 长度 ≤ 400 字符）
 *   - 全部通过 R11 round-trip property（serialize/deserialize 后语义等价）
 *
 * **图片 URL 来源**：本地素材图片，存放在 public/assets/doujin/ 目录下。
 *
 * **CP / 联动主题**（task 上下文指定）：
 *   1. 钟离 × 黄泉（原神 × 崩铁联动梗）
 *   2. 葛饰北斋 × 阿尔托利亚（FGO 内部 CP）
 *   3. 五条悟 × 伊地知（咒术回战师徒梗）
 *   4. 玛奇玛 × 阿丽塔（女王之间相遇）
 *   5. 短小说：芙莉莲与海尔的酒馆夜谈（葬送的芙莉莲 + 路人原创联动）
 */
import type { Doujin } from '@erciyuan/types';
/**
 * 同人作品 mock 集合。
 *
 * 5 篇全部带 `created_at`，时间戳来自一段固定的 demo 录制窗口
 * （2026-08-15 上海 CCG 漫展期间）以保证 round-trip 测试的可重现。
 */
export declare const doujins: Doujin[];
//# sourceMappingURL=doujins.d.ts.map